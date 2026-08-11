import webpush from 'web-push';
import { getDb } from '../db';
import { config, isProd } from '../config';
import { logger } from '../utils/logger';

let vapidKeys: { publicKey: string; privateKey: string } | null = null;

export function getVapidKeys(): { publicKey: string; privateKey: string } {
  if (!vapidKeys) {
    if (!config.push.vapidPublicKey || !config.push.vapidPrivateKey) {
      if (isProd) {
        throw new Error('VAPID keys are required in production. Set VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY in your .env file.');
      }
      const keys = webpush.generateVAPIDKeys();
      vapidKeys = { publicKey: keys.publicKey, privateKey: keys.privateKey };
      logger.warn('VAPID keys not configured in env, generated ephemeral keys. Push subscriptions will be invalid after restart.');
    } else {
      vapidKeys = { publicKey: config.push.vapidPublicKey, privateKey: config.push.vapidPrivateKey };
    }
    webpush.setVapidDetails(
      config.push.vapidSubject || 'mailto:admin@workspace.local',
      vapidKeys.publicKey,
      vapidKeys.privateKey
    );
  }
  return vapidKeys;
}

export function getVapidPublicKey(): string {
  return getVapidKeys().publicKey;
}

export interface PushSubscriptionRecord {
  id: number;
  studentId: number;
  endpoint: string;
  p256dh: string;
  auth: string;
  userAgent: string | null;
  createdAt: string;
  lastSeen: string;
  active: number;
}

function rowToSubscription(row: Record<string, unknown>): PushSubscriptionRecord {
  return {
    id: row.id as number,
    studentId: row.student_id as number,
    endpoint: row.endpoint as string,
    p256dh: row.p256dh as string,
    auth: row.auth as string,
    userAgent: row.user_agent as string | null,
    createdAt: row.created_at as string,
    lastSeen: row.last_seen as string,
    active: row.active as number,
  };
}

export async function createPushSubscription(
  studentId: number,
  endpoint: string,
  p256dh: string,
  auth: string,
  userAgent?: string
): Promise<PushSubscriptionRecord> {
  const db = getDb();
  const now = new Date().toISOString();

  await db.query(
    'INSERT INTO push_subscriptions (student_id, endpoint, p256dh, auth, user_agent, created_at, last_seen) VALUES ($1, $2, $3, $4, $5, $6, $7) ON CONFLICT(endpoint) DO UPDATE SET p256dh=excluded.p256dh, auth=excluded.auth, user_agent=excluded.user_agent, last_seen=excluded.last_seen, active=1',
    [studentId, endpoint, p256dh, auth, userAgent || null, now, now]
  );

  const selectResult = await db.query('SELECT * FROM push_subscriptions WHERE endpoint = $1', [endpoint]);
  const row = selectResult.rows[0] as Record<string, unknown>;

  return rowToSubscription(row);
}

export async function getPushSubscriptions(studentId: number): Promise<PushSubscriptionRecord[]> {
  const db = getDb();
  const result = await db.query('SELECT * FROM push_subscriptions WHERE student_id = $1 AND active = 1', [studentId]);
  return (result.rows as Record<string, unknown>[]).map(rowToSubscription);
}

export async function getAllActivePushSubscriptions(): Promise<PushSubscriptionRecord[]> {
  const db = getDb();
  const result = await db.query('SELECT * FROM push_subscriptions WHERE active = 1');
  return (result.rows as Record<string, unknown>[]).map(rowToSubscription);
}

export async function deactivatePushSubscription(studentId: number, endpoint: string): Promise<void> {
  const db = getDb();
  await db.query('UPDATE push_subscriptions SET active = 0 WHERE endpoint = $1 AND student_id = $2', [endpoint, studentId]);
}

export async function updatePushSubscriptionLastSeen(endpoint: string): Promise<void> {
  const db = getDb();
  await db.query('UPDATE push_subscriptions SET last_seen = $1 WHERE endpoint = $2', [new Date().toISOString(), endpoint]);
}

export async function removeExpiredPushSubscriptions(): Promise<number> {
  const db = getDb();
  const cutoff = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();
  const result = await db.query('SELECT endpoint FROM push_subscriptions WHERE active = 1 AND last_seen < $1', [cutoff]);
  const endpoints: string[] = (result.rows as Array<{ endpoint: string }>).map(r => r.endpoint);

  if (endpoints.length > 0) {
    const placeholders = endpoints.map((_, i) => `$${i + 1}`).join(',');
    await db.query(`UPDATE push_subscriptions SET active = 0 WHERE endpoint IN (${placeholders})`, endpoints);
  }
  return endpoints.length;
}

export interface PushPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
  data: Record<string, unknown>;
  requireInteraction?: boolean;
  actions?: Array<{ action: string; title: string }>;
}

export async function sendPushNotification(
  subscription: PushSubscriptionRecord,
  payload: PushPayload
): Promise<{ success: boolean; error?: string }> {
  const vapidKeys = getVapidKeys();

  const pushSubscription = {
    endpoint: subscription.endpoint,
    keys: {
      p256dh: subscription.p256dh,
      auth: subscription.auth,
    },
  };

  const options: webpush.RequestOptions = {
    vapidDetails: {
      subject: config.push.vapidSubject || 'mailto:admin@workspace.local',
      publicKey: vapidKeys.publicKey,
      privateKey: vapidKeys.privateKey,
    },
    TTL: 86400,
    headers: {
      'Content-Type': 'application/json',
    },
  };

  const payloadString = JSON.stringify(payload);

  return webpush.sendNotification(pushSubscription, payloadString, options)
    .then(() => {
      updatePushSubscriptionLastSeen(subscription.endpoint);
      logger.debug('Push notification sent', { studentId: subscription.studentId, endpoint: subscription.endpoint.substring(0, 50) + '...' });
      return { success: true };
    })
    .catch((err: Error & { statusCode?: number }) => {
      logger.error('Push notification failed', {
        studentId: subscription.studentId,
        endpoint: subscription.endpoint.substring(0, 50) + '...',
        error: err.message,
        statusCode: err.statusCode,
      });

      if (err.statusCode === 404 || err.statusCode === 410) {
        deactivatePushSubscription(subscription.studentId, subscription.endpoint);
        logger.info('Deactivated expired/invalid push subscription', { endpoint: subscription.endpoint });
      }

      return { success: false, error: err.message };
    });
}

export async function sendPushToStudent(studentId: number, payload: PushPayload): Promise<Array<{ success: boolean; error?: string }>> {
  const subscriptions = await getPushSubscriptions(studentId);
  return Promise.all(subscriptions.map(sub => sendPushNotification(sub, payload)));
}

export async function sendPushToAll(payload: PushPayload): Promise<Array<{ success: boolean; error?: string }>> {
  const subscriptions = await getAllActivePushSubscriptions();
  return Promise.all(subscriptions.map(sub => sendPushNotification(sub, payload)));
}

export function buildNotificationPayload(type: string, message: string, sessionId?: number, actionUrl?: string): PushPayload {
  const basePayload: PushPayload = {
    title: 'Hive',
    body: message,
    icon: '/favicon.svg',
    badge: '/favicon.svg',
    tag: type,
    data: {
      type,
      sessionId,
      url: actionUrl || '/',
      timestamp: Date.now(),
    },
    requireInteraction: type === 'reminder' || type === 'summary_required',
    actions: [],
  };

  switch (type) {
    case 'entry':
      basePayload.title = 'Entry Recorded';
      basePayload.data.url = actionUrl || '/dashboard';
      break;
    case 'exit':
      basePayload.title = 'Exit Recorded';
      basePayload.data.url = actionUrl || `/sessions/${sessionId}`;
      break;
    case 'reminder':
      basePayload.title = 'Reminder';
      basePayload.requireInteraction = true;
      basePayload.data.url = actionUrl || '/dashboard';
      break;
    case 'completed':
    case 'auto_completed':
      basePayload.title = 'Session Completed';
      basePayload.data.url = actionUrl || '/dashboard';
      break;
    case 'status_change':
      basePayload.title = 'Session Status Update';
      basePayload.data.url = actionUrl || '/dashboard';
      break;
    case 'broadcast':
      basePayload.title = 'Announcement';
      basePayload.data.url = actionUrl || '/notifications';
      break;
    case 'summary_required':
      basePayload.title = 'Summary Required';
      basePayload.requireInteraction = true;
      basePayload.data.url = actionUrl || `/sessions/${sessionId}`;
      break;
    default:
      basePayload.data.url = actionUrl || '/dashboard';
  }

  return basePayload;
}

export async function dispatchPushNotifications(
  studentId: number,
  type: string,
  message: string,
  sessionId?: number,
  actionUrl?: string
): Promise<Array<{ success: boolean; error?: string }>> {
  const payload = buildNotificationPayload(type, message, sessionId, actionUrl);
  return sendPushToStudent(studentId, payload);
}

export async function dispatchPushToStudent(
  studentId: number,
  type: string,
  message: string,
  sessionId?: number,
  actionUrl?: string
): Promise<Array<{ success: boolean; error?: string }>> {
  const payload = buildNotificationPayload(type, message, sessionId, actionUrl);
  return sendPushToStudent(studentId, payload);
}

export async function dispatchBroadcastPushNotification(
  type: string,
  message: string,
  actionUrl?: string
): Promise<Array<{ success: boolean; error?: string }>> {
  const payload = buildNotificationPayload(type, message, undefined, actionUrl);
  return sendPushToAll(payload);
}

export async function cleanupPushSubscriptions(): Promise<number> {
  return removeExpiredPushSubscriptions();
}

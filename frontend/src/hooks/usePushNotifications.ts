import { useState, useEffect, useCallback } from 'react';
import { getVapidPublicKey, subscribeToPush, unsubscribeFromPush, getPushSubscriptions } from '../services/api';

export interface PushSubscriptionInfo {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
  userAgent?: string;
}

export interface PushNotificationState {
  isSupported: boolean;
  permission: NotificationPermission;
  subscription: PushSubscriptionInfo | null;
  isSubscribing: boolean;
  error: string | null;
}

export function usePushNotifications() {
  const [state, setState] = useState<PushNotificationState>({
    isSupported: false,
    permission: 'default',
    subscription: null,
    isSubscribing: false,
    error: null,
  });

  useEffect(() => {
    const isSupported = 'serviceWorker' in navigator && 'PushManager' in window;
    setState(s => ({ ...s, isSupported }));

    if (isSupported) {
      navigator.permissions.query({ name: 'notifications' as PermissionName })
        .then(permission => {
          setState(s => ({ ...s, permission: permission.state as NotificationPermission }));
          permission.addEventListener('change', () => {
            setState(s => ({ ...s, permission: permission.state as NotificationPermission }));
          });
        })
        .catch(() => {});

      navigator.serviceWorker.ready.then(registration => {
        registration.pushManager.getSubscription().then(subscription => {
          if (subscription) {
            const keys = subscription.toJSON() as { endpoint: string; keys?: { p256dh: string; auth: string } };
            setState(s => ({
              ...s,
              subscription: {
                endpoint: subscription.endpoint,
                keys: {
                  p256dh: keys.keys?.p256dh || '',
                  auth: keys.keys?.auth || '',
                },
                userAgent: navigator.userAgent,
              },
            }));
          }
        });
      });
    }
  }, []);

  const subscribe = useCallback(async () => {
    if (!state.isSupported) {
      setState(s => ({ ...s, error: 'Push notifications not supported' }));
      return;
    }

    setState(s => ({ ...s, isSubscribing: true, error: null }));

    try {
      const permission = await Notification.requestPermission();
      setState(s => ({ ...s, permission }));

      if (permission !== 'granted') {
        setState(s => ({ ...s, isSubscribing: false, error: 'Permission denied' }));
        return;
      }

      const vapidPublicKey = await getVapidPublicKey();
      const registration = await navigator.serviceWorker.ready;

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: vapidPublicKey,
      });

      const keys = subscription.toJSON() as { endpoint: string; keys?: { p256dh: string; auth: string } };
      const subscriptionInfo: PushSubscriptionInfo = {
        endpoint: subscription.endpoint,
        keys: {
          p256dh: keys.keys?.p256dh || '',
          auth: keys.keys?.auth || '',
        },
        userAgent: navigator.userAgent,
      };

      await subscribeToPush(subscriptionInfo);

      setState(s => ({
        ...s,
        isSubscribing: false,
        subscription: subscriptionInfo,
        error: null,
      }));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to subscribe';
      setState(s => ({ ...s, isSubscribing: false, error: errorMessage }));
    }
  }, [state.isSupported]);

  const unsubscribe = useCallback(async () => {
    if (!state.subscription) return;

    setState(s => ({ ...s, isSubscribing: true, error: null }));

    try {
      await unsubscribeFromPush(state.subscription.endpoint);
      const registration = await navigator.serviceWorker.ready;
      const pushSubscription = await registration.pushManager.getSubscription();
      if (pushSubscription) {
        await pushSubscription.unsubscribe();
      }

      setState(s => ({
        ...s,
        isSubscribing: false,
        subscription: null,
        error: null,
      }));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to unsubscribe';
      setState(s => ({ ...s, isSubscribing: false, error: errorMessage }));
    }
  }, [state.subscription]);

  const refreshSubscription = useCallback(async () => {
    if (!state.isSupported) return;

    try {
      const subscriptions = await getPushSubscriptions();
      if (subscriptions.length > 0) {
        const sub = subscriptions[0];
        setState(s => ({
          ...s,
          subscription: {
            endpoint: sub.endpoint,
            keys: {
              p256dh: sub.keys.p256dh,
              auth: sub.keys.auth,
            },
            userAgent: sub.userAgent,
          },
        }));
      }
    } catch (err) {
      console.error('Failed to refresh subscription:', err);
    }
  }, [state.isSupported]);

  return {
    ...state,
    subscribe,
    unsubscribe,
    refreshSubscription,
    clearError: () => setState(s => ({ ...s, error: null })),
  };
}
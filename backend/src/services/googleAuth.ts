import jwt, { JwtHeader, SigningKeyCallback } from 'jsonwebtoken';
import JwksRsa from 'jwks-rsa';
import { getDb } from '../db';
import { config } from '../config';
import { UnauthorizedError, ForbiddenError } from '../utils/errors';
import { logAudit } from './audit';
import { buildLoginResponse } from './auth';

export interface GoogleIdTokenClaims {
  sub: string;
  email?: string;
  email_verified?: boolean;
  name?: string;
  picture?: string;
  hd?: string;
  iss?: string;
  aud?: string;
  exp: number;
  iat: number;
}

export interface GoogleVerifyOptions {
  jwksUri?: string;
  audience?: string;
  issuer?: string;
}

function resolveJwksUri(override?: string): string {
  return override ?? process.env.GOOGLE_JWKS_URI ?? config.googleAuth.jwksUri;
}

export async function verifyGoogleIdToken(idToken: string, options?: GoogleVerifyOptions): Promise<GoogleIdTokenClaims> {
  const audience = options?.audience ?? config.googleAuth.clientId;
  const client = JwksRsa({
    jwksUri: resolveJwksUri(options?.jwksUri),
    cache: true,
    cacheMaxAge: 3600000,
    rateLimit: true,
  });

  const getSigningKey = (header: JwtHeader, callback: SigningKeyCallback): void => {
    client.getSigningKey(header.kid, (err, key) => {
      if (err || !key) {
        callback(err ?? new Error('No signing key found for token'));
        return;
      }
      callback(null, key.getPublicKey());
    });
  };

  const payload = await new Promise<GoogleIdTokenClaims>((resolve, reject) => {
    jwt.verify(
      idToken,
      getSigningKey,
      {
        algorithms: ['RS256'],
        issuer: ['https://accounts.google.com', 'accounts.google.com'],
        audience,
        clockTolerance: 30,
      },
      (err, decoded) => {
        if (err || !decoded || typeof decoded === 'string') {
          reject(err ?? new Error('Invalid token payload'));
          return;
        }
        resolve(decoded as unknown as GoogleIdTokenClaims);
      }
    );
  });

  const now = Math.floor(Date.now() / 1000);
  if (typeof payload.iat === 'number' && payload.iat > now + 60) {
    throw new Error('Token not yet valid');
  }

  return payload;
}

export async function loginWithGoogleToken(idToken: string, ip?: string): Promise<{
  token: string;
  user: { id: number; name: string; role: string; email: string; studentId?: number };
}> {
  let claims: GoogleIdTokenClaims;
  try {
    claims = await verifyGoogleIdToken(idToken);
  } catch {
    await logAudit({
      actorType: 'system',
      actorId: null,
      action: 'GOOGLE_LOGIN_FAILED',
      entityType: 'USER',
      entityId: null,
      details: { reason: 'invalid_token' },
      ipAddress: ip,
    });
    throw new UnauthorizedError('INVALID_TOKEN', 'Google sign-in verification failed. Please try again.');
  }

  const email = typeof claims.email === 'string' ? claims.email.toLowerCase() : '';

  if (claims.email_verified !== true) {
    await logAudit({
      actorType: 'system',
      actorId: null,
      action: 'GOOGLE_LOGIN_FAILED',
      entityType: 'USER',
      entityId: null,
      details: { reason: 'email_not_verified', email },
      ipAddress: ip,
    });
    throw new UnauthorizedError('EMAIL_NOT_VERIFIED', 'Your Google account email is not verified.');
  }

  const domainAllowed = config.googleAuth.allowedDomains.some((domain) => email.endsWith(domain.toLowerCase()));
  const hd = typeof claims.hd === 'string' ? claims.hd.toLowerCase() : null;
  const hdAllowed = hd === null || config.googleAuth.allowedDomains.some((domain) => hd === domain.replace(/^@/, '').toLowerCase());

  if (!domainAllowed || !hdAllowed) {
    await logAudit({
      actorType: 'system',
      actorId: null,
      action: 'GOOGLE_LOGIN_REJECTED_DOMAIN',
      entityType: 'USER',
      entityId: null,
      details: { email, hd },
      ipAddress: ip,
    });
    throw new UnauthorizedError('DOMAIN_NOT_ALLOWED', 'Only @vnrvjiet.in accounts can sign in.');
  }

  const db = getDb();
  const result = await db.query('SELECT id, email, name, role_id, status, password_changed_at FROM users WHERE email = $1', [email]);
  if (result.rows.length === 0) {
    await logAudit({
      actorType: 'system',
      actorId: null,
      action: 'GOOGLE_LOGIN_FAILED',
      entityType: 'USER',
      entityId: null,
      details: { reason: 'account_not_found', email },
      ipAddress: ip,
    });
    throw new UnauthorizedError('ACCOUNT_NOT_FOUND', 'No account found for this email. Please contact your administrator.');
  }

  const user = result.rows[0] as {
    id: number;
    email: string;
    name: string;
    role_id: string;
    status: string;
    password_changed_at: string | null;
  };

  if (user.status !== 'active') {
    await logAudit({
      actorType: user.role_id as 'faculty' | 'admin' | 'student',
      actorId: user.id,
      action: 'GOOGLE_LOGIN_FAILED',
      entityType: 'USER',
      entityId: user.id,
      details: { reason: 'account_inactive', status: user.status },
      ipAddress: ip,
    });
    throw new ForbiddenError('Your account is not active');
  }

  await logAudit({
    actorType: user.role_id as 'faculty' | 'admin' | 'student',
    actorId: user.id,
    action: 'GOOGLE_LOGIN',
    entityType: 'USER',
    entityId: user.id,
    ipAddress: ip,
  });

  return buildLoginResponse(user);
}

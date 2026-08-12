import jwt, { JwtHeader, SigningKeyCallback } from 'jsonwebtoken';
import JwksRsa from 'jwks-rsa';
import { getDb } from '../db';
import { config } from '../config';
import { UnauthorizedError, ForbiddenError, ValidationError } from '../utils/errors';
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
  needsOnboarding?: boolean;
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
  const emailLocalPart = email.split('@')[0];
  const roll = emailLocalPart.toUpperCase();

  const result = await db.query(
    'SELECT id, email, name, role_id, status, password_changed_at, google_sub, profile_picture FROM users WHERE email = $1',
    [email]
  );

  if (result.rows.length > 0) {
    const user = result.rows[0] as {
      id: number;
      email: string;
      name: string;
      role_id: string;
      status: string;
      password_changed_at: string | null;
      google_sub: string | null;
      profile_picture: string | null;
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

    const updates: string[] = [];
    const params: Array<string | null> = [];
    let paramIdx = 1;

    if (!user.google_sub) {
      updates.push(`google_sub = $${paramIdx}`);
      params.push(claims.sub);
      paramIdx++;
    }

    if (!user.profile_picture && claims.picture) {
      updates.push(`profile_picture = $${paramIdx}`);
      params.push(claims.picture);
      paramIdx++;
    }

    if (updates.length > 0) {
      params.push(String(user.id));
      await db.query(`UPDATE users SET ${updates.join(', ')} WHERE id = $${paramIdx}`, params);
    }

    let needsOnboarding = false;
    if (user.role_id === 'student') {
      const stuResult = await db.query('SELECT id, branch FROM students WHERE email = $1', [user.email]);
      if (stuResult.rows.length > 0) {
        needsOnboarding = !(stuResult.rows[0] as { branch: string | null }).branch;
      }
    }

    await logAudit({
      actorType: user.role_id as 'faculty' | 'admin' | 'student',
      actorId: user.id,
      action: 'GOOGLE_LOGIN',
      entityType: 'USER',
      entityId: user.id,
      ipAddress: ip,
    });

    const loginResp = await buildLoginResponse(user);
    return { ...loginResp, needsOnboarding: needsOnboarding || undefined };
  }

  const stuResult = await db.query(
    'SELECT id, roll, name, email, branch FROM students WHERE roll = $1 OR email = $2',
    [roll, email]
  );

  if (stuResult.rows.length > 0) {
    const student = stuResult.rows[0] as {
      id: number;
      roll: string;
      name: string;
      email: string | null;
      branch: string | null;
    };

    await db.query('BEGIN');
    try {
      const userResult = await db.query(
        `INSERT INTO users (email, name, role_id, status, google_sub, profile_picture)
         VALUES ($1, $2, 'student', 'active', $3, $4)
         ON CONFLICT (email) DO UPDATE SET
           google_sub = COALESCE(users.google_sub, EXCLUDED.google_sub),
           profile_picture = COALESCE(EXCLUDED.profile_picture, users.profile_picture)
         RETURNING id, email, name, role_id, status, password_changed_at`,
        [email, claims.name || student.name, claims.sub, claims.picture || null]
      );

      if (!student.email) {
        await db.query('UPDATE students SET email = $1 WHERE id = $2', [email, student.id]);
      }

      await db.query('COMMIT');

      const user = userResult.rows[0] as {
        id: number;
        email: string;
        name: string;
        role_id: string;
        status: string;
        password_changed_at: string | null;
      };

      await logAudit({
        actorType: 'student',
        actorId: user.id,
        action: 'GOOGLE_LOGIN',
        entityType: 'USER',
        entityId: user.id,
        ipAddress: ip,
      });

      const loginResp = await buildLoginResponse(user);
      const needsOnboarding = !student.branch;
      return { ...loginResp, needsOnboarding: needsOnboarding || undefined };
    } catch (err) {
      await db.query('ROLLBACK');
      throw err;
    }
  }

  await db.query('BEGIN');
  try {
    const studentInsert = await db.query(
      `INSERT INTO students (roll, name, email, status)
       VALUES ($1, $2, $3, 'enrolled')
       ON CONFLICT (roll) DO UPDATE SET
         name = COALESCE(EXCLUDED.name, students.name),
         email = COALESCE(EXCLUDED.email, students.email)
       RETURNING id, roll, name, email, branch`,
      [roll, claims.name || roll, email]
    );

    const userInsert = await db.query(
      `INSERT INTO users (email, name, role_id, status, google_sub, profile_picture)
       VALUES ($1, $2, 'student', 'active', $3, $4)
       ON CONFLICT (email) DO UPDATE SET
         google_sub = COALESCE(users.google_sub, EXCLUDED.google_sub),
         profile_picture = COALESCE(EXCLUDED.profile_picture, users.profile_picture)
       RETURNING id, email, name, role_id, status, password_changed_at`,
      [email, claims.name || roll, claims.sub, claims.picture || null]
    );

    await db.query('COMMIT');

    const user = userInsert.rows[0] as {
      id: number;
      email: string;
      name: string;
      role_id: string;
      status: string;
      password_changed_at: string | null;
    };
    const student = studentInsert.rows[0] as {
      id: number;
      roll: string;
      name: string;
      email: string;
      branch: string | null;
    };

    await logAudit({
      actorType: 'student',
      actorId: user.id,
      action: 'GOOGLE_LOGIN',
      entityType: 'USER',
      entityId: user.id,
      details: { autoProvisioned: true, roll: student.roll },
      ipAddress: ip,
    });

    const loginResp = await buildLoginResponse(user);
    const needsOnboarding = !student.branch;
    return { ...loginResp, needsOnboarding: needsOnboarding || undefined };
  } catch (err) {
    await db.query('ROLLBACK');
    throw err;
  }
}

export async function completeOnboarding(
  userId: number,
  branch: string,
  section: string,
  hostel?: string,
  ip?: string
): Promise<void> {
  const db = getDb();

  const userResult = await db.query(
    'SELECT id, role_id, status FROM users WHERE id = $1',
    [userId]
  );
  if (userResult.rows.length === 0) throw new ForbiddenError('User not found');

  const user = userResult.rows[0] as { id: number; role_id: string; status: string };
  if (user.role_id !== 'student') throw new ForbiddenError('Only students can complete onboarding');
  if (user.status !== 'active') throw new ForbiddenError('Account is not active');

  const stuResult = await db.query(
    'SELECT s.id, s.branch FROM students s JOIN users u ON s.email = u.email WHERE u.id = $1',
    [userId]
  );
  if (stuResult.rows.length === 0) throw new ForbiddenError('Student record not found');

  const student = stuResult.rows[0] as { id: number; branch: string | null };
  if (student.branch) throw new ValidationError('ALREADY_COMPLETED', 'Onboarding has already been completed');

  const trimmedBranch = branch.trim();
  const trimmedSection = section.trim();
  const trimmedHostel = hostel?.trim() || null;

  if (trimmedBranch.length < 1 || trimmedBranch.length > 50) {
    throw new ValidationError('VALIDATION_ERROR', 'Branch must be between 1 and 50 characters');
  }
  if (trimmedSection.length < 1 || trimmedSection.length > 10) {
    throw new ValidationError('VALIDATION_ERROR', 'Section must be between 1 and 10 characters');
  }
  if (trimmedHostel && trimmedHostel.length > 100) {
    throw new ValidationError('VALIDATION_ERROR', 'Hostel must be at most 100 characters');
  }

  await db.query(
    'UPDATE students SET branch = $1, section = $2, hostel = $3 WHERE id = $4',
    [trimmedBranch, trimmedSection, trimmedHostel, student.id]
  );

  await logAudit({
    actorType: 'student',
    actorId: userId,
    action: 'ONBOARDING_COMPLETED',
    entityType: 'STUDENT',
    entityId: student.id,
    details: { branch: trimmedBranch, section: trimmedSection, hostel: trimmedHostel },
    ipAddress: ip,
  });
}

import { getDb } from '../db';
import { NotFoundError, ValidationError } from '../utils/errors';
import { logAudit } from './audit';


import { resolveStudentId } from './student';

interface UserRow {
  id: number;
  email: string;
  name: string;
  role_id: string;
  status: string;
  profile_picture: string | null;
  created_at: string;
}

interface StudentRow {
  id: number;
  roll: string;
  name: string;
  email: string | null;
  branch: string | null;
  section: string | null;
  hostel: string | null;
  status: string;
}

export async function getProfile(userId: number) {
  const db = getDb();
  const userResult = await db.query(
    'SELECT id, email, name, role_id, status, profile_picture, created_at FROM users WHERE id = $1',
    [userId]
  );
  if (userResult.rows.length === 0) throw new NotFoundError('User');
  const user = userResult.rows[0] as UserRow;

  const profile: import('../../../shared').ProfileData = {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role_id as import('../../../shared').RoleName,
    status: user.status,
    profilePicture: user.profile_picture,
    createdAt: user.created_at,
  };

  if (user.role_id === 'student') {
    const studentId = await resolveStudentId(userId);
    if (studentId) {
      profile.studentId = studentId;
      const stuResult = await db.query(
        'SELECT id, roll, name, email, branch, section, hostel, status FROM students WHERE id = $1',
        [studentId]
      );
      if (stuResult.rows.length > 0) {
        const stu = stuResult.rows[0] as StudentRow;
        profile.roll = stu.roll;
        profile.branch = stu.branch;
        profile.section = stu.section;
        profile.hostel = stu.hostel;
      }
    }
  }

  return profile;
}

export async function updateProfile(
  userId: number,
  updates: { name?: string; hostel?: string | null; branch?: string | null; section?: string | null },
  actorId: number,
  ip?: string
) {
  const db = getDb();
  const userResult = await db.query('SELECT id, email, name, role_id FROM users WHERE id = $1', [userId]);
  if (userResult.rows.length === 0) throw new NotFoundError('User');
  const user = userResult.rows[0] as UserRow;

  const changedFields: Array<{ field: string; oldValue: string | null; newValue: string | null }> = [];

  let newName: string | undefined;
  if (updates.name !== undefined) {
    const trimmed = updates.name.trim();
    if (trimmed.length < 1 || trimmed.length > 200) {
      throw new ValidationError('VALIDATION_ERROR', 'Name must be between 1 and 200 characters');
    }
    if (trimmed !== user.name) {
      newName = trimmed;
    }
  }

  let studentId: number | null = null;
  const studentUpdates: Array<{ field: string; value: string | null }> = [];

  if (user.role_id === 'student') {
    studentId = await resolveStudentId(userId);

    if (updates.hostel !== undefined) {
      const val = updates.hostel === null ? null : updates.hostel.trim().slice(0, 100);
      studentUpdates.push({ field: 'hostel', value: val });
    }

    if (updates.branch !== undefined || updates.section !== undefined) {
      throw new ValidationError('VALIDATION_ERROR', 'Branch and section cannot be changed by students');
    }

    if (studentUpdates.length > 0 && !studentId) {
      throw new NotFoundError('Student');
    }
  }

  if (!newName && studentUpdates.length === 0) {
    return await getProfile(userId);
  }

  await db.query('BEGIN');
  try {
    if (newName !== undefined) {
      await db.query('UPDATE users SET name = $1 WHERE id = $2', [newName, userId]);
      changedFields.push({ field: 'name', oldValue: user.name, newValue: newName });

      if (studentId) {
        const stuResult = await db.query('SELECT name FROM students WHERE id = $1', [studentId]);
        if (stuResult.rows.length > 0 && (stuResult.rows[0] as { name: string }).name !== newName) {
          await db.query('UPDATE students SET name = $1 WHERE id = $2', [newName, studentId]);
        }
      }
    }

    if (studentUpdates.length > 0 && studentId) {
      for (const su of studentUpdates) {
        const oldResult = await db.query(
          `SELECT ${su.field} FROM students WHERE id = $1`,
          [studentId]
        );
        const oldVal = oldResult.rows.length > 0
          ? (oldResult.rows[0] as Record<string, string | null>)[su.field]
          : null;
        if (su.value !== oldVal) {
          await db.query(
            `UPDATE students SET ${su.field} = $1 WHERE id = $2`,
            [su.value, studentId]
          );
          changedFields.push({ field: su.field, oldValue: oldVal, newValue: su.value });
        }
      }
    }

    await db.query('COMMIT');
  } catch (err) {
    await db.query('ROLLBACK');
    throw err;
  }

  for (const change of changedFields) {
    await logAudit({
      actorType: user.role_id as 'student' | 'faculty' | 'admin',
      actorId,
      action: 'PROFILE_UPDATED',
      entityType: 'PROFILE',
      entityId: userId,
      details: { field: change.field, oldValue: change.oldValue, newValue: change.newValue },
      ipAddress: ip,
    });
  }

  return await getProfile(userId);
}

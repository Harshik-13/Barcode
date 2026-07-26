import path from 'path';
import fs from 'fs/promises';
import crypto from 'crypto';
import sharp from 'sharp';
import { getDb } from '../db';
import { config } from '../config';
import { NotFoundError, ValidationError } from '../utils/errors';
import { logAudit } from './audit';
import { PROFILE_PICTURE } from '../../../shared';

const ALLOWED_MIME = PROFILE_PICTURE.ALLOWED_MIME_TYPES as readonly string[];
const MAX_SIZE = PROFILE_PICTURE.MAX_SIZE_BYTES;

function userDir(userId: number): string {
  return path.join(config.upload.profileDir, 'users', String(userId));
}

function newFilePath(userId: number): string {
  return path.join(userDir(userId), 'current.webp');
}

function oldFlatPath(filename: string): string {
  return path.join(config.upload.profileDir, filename);
}

function isOldFormat(filename: string): boolean {
  return filename.startsWith('pp_');
}

export async function uploadProfilePicture(
  userId: number,
  file: Express.Multer.File,
  actorType: 'student' | 'faculty' | 'admin'
): Promise<string> {
  if (!ALLOWED_MIME.includes(file.mimetype)) {
    throw new ValidationError(
      'INVALID_FILE_TYPE',
      `File type ${file.mimetype} is not allowed. Accepted: ${ALLOWED_MIME.join(', ')}`
    );
  }

  if (file.size > MAX_SIZE) {
    throw new ValidationError(
      'FILE_TOO_LARGE',
      `File size exceeds the maximum of ${(MAX_SIZE / 1024 / 1024).toFixed(1)}MB`
    );
  }

  const ext = path.extname(file.originalname).toLowerCase();
  const allowedExts = PROFILE_PICTURE.ALLOWED_EXTENSIONS as readonly string[];
  if (!allowedExts.includes(ext)) {
    throw new ValidationError(
      'INVALID_EXTENSION',
      `Extension ${ext} is not allowed. Accepted: ${allowedExts.join(', ')}`
    );
  }

  let optimized: Buffer;
  try {
    optimized = await sharp(file.buffer)
      .webp({ quality: 80, effort: 4 })
      .toBuffer();
  } catch {
    throw new ValidationError('INVALID_IMAGE', 'Uploaded file is not a valid image or is corrupted');
  }

  const db = getDb();
  const userResult = await db.query('SELECT profile_picture FROM users WHERE id = $1', [userId]);
  if (userResult.rows.length === 0) throw new NotFoundError('User');
  const oldPicture = (userResult.rows[0] as { profile_picture: string | null }).profile_picture;

  const dir = userDir(userId);
  await fs.mkdir(dir, { recursive: true });

  const tmpName = `.tmp_${crypto.randomBytes(8).toString('hex')}.webp`;
  const tmpPath = path.join(dir, tmpName);
  const finalPath = newFilePath(userId);

  try {
    await fs.writeFile(tmpPath, optimized);
    await fs.rename(tmpPath, finalPath);
  } catch (err) {
    try { await fs.unlink(tmpPath); } catch { /* ignore */ }
    throw err;
  }

  await db.query("UPDATE users SET profile_picture = 'current.webp' WHERE id = $1", [userId]);

  if (oldPicture) {
    try {
      if (isOldFormat(oldPicture)) {
        await fs.unlink(oldFlatPath(oldPicture));
      } else {
        await fs.unlink(finalPath).catch(() => {});
      }
    } catch {
      // ignore - old file may not exist
    }
  }

  await logAudit({
    actorType,
    actorId: userId,
    action: 'PROFILE_PICTURE_UPLOADED',
    entityType: 'PROFILE',
    entityId: userId,
    details: { format: 'webp', quality: 80 },
  });

  return 'current.webp';
}

export async function removeProfilePicture(
  userId: number,
  actorType: 'student' | 'faculty' | 'admin'
): Promise<void> {
  const db = getDb();
  const userResult = await db.query('SELECT profile_picture FROM users WHERE id = $1', [userId]);
  if (userResult.rows.length === 0) throw new NotFoundError('User');
  const oldPicture = (userResult.rows[0] as { profile_picture: string | null }).profile_picture;

  if (!oldPicture) return;

  await db.query('UPDATE users SET profile_picture = NULL WHERE id = $1', [userId]);

  let removed = false;
  try {
    if (isOldFormat(oldPicture)) {
      await fs.unlink(oldFlatPath(oldPicture));
    } else {
      await fs.unlink(newFilePath(userId));
    }
    removed = true;
  } catch {
    // file may not exist
  }

  try {
    await fs.rmdir(userDir(userId)).catch(() => {});
  } catch {
    // directory may not be empty or may not exist
  }

  await logAudit({
    actorType,
    actorId: userId,
    action: 'PROFILE_PICTURE_REMOVED',
    entityType: 'PROFILE',
    entityId: userId,
    details: removed ? {} : { note: 'file_was_already_missing' },
  });
}

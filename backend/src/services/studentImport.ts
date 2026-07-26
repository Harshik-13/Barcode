import path from 'path';
import * as XLSX from 'xlsx';
import { getDb } from '../db';
import { config } from '../config';
import { ValidationError } from '../utils/errors';
import { logAudit } from './audit';
import { SECTIONS, IMPORT, STUDENT_SOURCE } from '../../../shared';

interface ParsedStudent {
  roll: string;
  name: string;
  branch: string | null;
  section: string | null;
}

export interface ImportResult {
  imported: number;
  updated: number;
  skipped: number;
  failed: number;
  errors: string[];
}

const SHEET_BRANCH_MAP: Record<string, string> = {
  CIV: 'CIVIL',
  EEE: 'EEE',
  MEC: 'MECH',
  ECE: 'ECE',
  CSE: 'CSE',
  EIE: 'EIE',
  INF: 'IT',
  AUT: 'AUT',
  CSB: 'CSBS',
  RAI: 'RAI',
  CSC: 'CSC',
  CSM: 'CSM',
  CSD: 'CSD',
  CSO: 'CSO',
  AID: 'AID',
  EVL: 'EVL',
};

function parseBranchSectionFromSheetName(sheetName: string): { branch: string | null; section: string | null } {
  const sections = SECTIONS as readonly string[];

  const tokens = sheetName.split(/[-_\s.]+/).map(t => t.trim()).filter(Boolean);

  let branch: string | null = null;
  let section: string | null = null;

  const sectionList = sections as readonly string[];
  for (const token of tokens) {
    const upper = token.toUpperCase();
    if (!branch && SHEET_BRANCH_MAP[upper]) {
      branch = SHEET_BRANCH_MAP[upper];
    } else if (!section && sectionList.includes(upper)) {
      section = upper;
    }
  }

  if (!branch) {
    branch = sheetName.trim();
  }

  return { branch, section };
}

interface ColumnMap {
  rollIdx: number;
  nameIdx: number;
}

const HEADER_KEYWORDS: Record<string, RegExp[]> = {
  sno: [/^s\.?\s*no/i, /^sl\s*no/i, /^serial/i, /^#$/],
  roll: [/hall.?ticket/i, /roll.?no/i, /rollnumber/i, /^roll$/i],
  name: [/student.?name/i, /^name$/i, /student/i, /name of/i],
};

function detectColumnMap(headerRow: unknown[]): ColumnMap | null {
  for (let col = 0; col < headerRow.length; col++) {
    const cell = String(headerRow[col] ?? '').trim();
    if (!cell) continue;
    if (HEADER_KEYWORDS.roll.some(r => r.test(cell))) {
      for (let nc = 0; nc < headerRow.length; nc++) {
        const ncell = String(headerRow[nc] ?? '').trim();
        if (nc !== col && HEADER_KEYWORDS.name.some(r => r.test(ncell))) {
          return { rollIdx: col, nameIdx: nc };
        }
      }
    }
  }
  return null;
}

function findHeaderRow(rows: unknown[][]): number | null {
  for (let r = 0; r < rows.length; r++) {
    const row = rows[r];
    if (!Array.isArray(row)) continue;
    for (let c = 0; c < Math.min(row.length, 5); c++) {
      const cell = String(row[c] ?? '').trim();
      if (HEADER_KEYWORDS.roll.some(re => re.test(cell))) return r;
    }
  }
  return null;
}

function parseWorkbook(buffer: Buffer): ParsedStudent[] {
  const workbook = XLSX.read(buffer, { type: 'buffer', cellDates: false, cellNF: false, cellText: false });
  const students: ParsedStudent[] = [];
  const seenRolls = new Map<string, number>();

  for (const sheetName of workbook.SheetNames) {
    const { branch, section } = parseBranchSectionFromSheetName(sheetName);
    const sheet = workbook.Sheets[sheetName];
    const rows: unknown[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });

    const headerRowIdx = findHeaderRow(rows);
    if (headerRowIdx === null) continue;

    const headerRow = rows[headerRowIdx];
    const colMap = detectColumnMap(headerRow as unknown[]) ?? { rollIdx: 1, nameIdx: 2 };

    for (let r = headerRowIdx + 1; r < rows.length; r++) {
      const row = rows[r];
      if (!Array.isArray(row)) continue;

      const rawRoll = String(row[colMap.rollIdx] ?? '').trim();
      const rawName = String(row[colMap.nameIdx] ?? '').trim();

      if (!rawRoll || !rawName) continue;

      const existing = seenRolls.get(rawRoll);
      if (existing !== undefined) {
        students[existing] = { roll: rawRoll, name: rawName, branch, section };
      } else {
        seenRolls.set(rawRoll, students.length);
        students.push({ roll: rawRoll, name: rawName, branch, section });
      }
    }
  }

  return students;
}

interface ImportOptions {
  parsed: ParsedStudent[];
  actorId: number;
  ip?: string;
}

async function executeImport({ parsed, actorId, ip }: ImportOptions): Promise<ImportResult> {
  const db = getDb();
  const emailDomain = config.activation.studentEmailDomain;
  let imported = 0;
  let updated = 0;

  await db.query('BEGIN');
  try {
    for (let i = 0; i < parsed.length; i += IMPORT.MAX_BATCH_SIZE) {
      const batch = parsed.slice(i, i + IMPORT.MAX_BATCH_SIZE);
      const placeholders: string[] = [];
      const values: unknown[] = [];

      for (const student of batch) {
        const email = `${student.roll.toLowerCase()}${emailDomain}`;
        const idx = placeholders.length * 7 + 1;
        placeholders.push(`($${idx}, $${idx + 1}, $${idx + 2}, $${idx + 3}, $${idx + 4}, $${idx + 5}, $${idx + 6})`);
        values.push(
          student.roll,
          student.name,
          student.branch ?? null,
          student.section ?? null,
          email,
          'invited',
          STUDENT_SOURCE.EXCEL_IMPORT
        );
      }

      const query = `
        INSERT INTO students (roll, name, branch, section, email, status, source)
        VALUES ${placeholders.join(', ')}
        ON CONFLICT (roll) DO UPDATE SET
          name = EXCLUDED.name,
          branch = EXCLUDED.branch,
          section = EXCLUDED.section
        RETURNING id, CASE WHEN xmax = 0 THEN 'inserted' ELSE 'updated' END AS action
      `;

      const result = await db.query(query, values);
      for (const row of result.rows as Array<{ id: number; action: string }>) {
        if (row.action === 'inserted') {
          imported++;
        } else {
          updated++;
        }
      }
    }

    await db.query('COMMIT');
  } catch (err) {
    await db.query('ROLLBACK');
    throw err;
  }

  logAudit({
    actorType: 'admin',
    actorId,
    action: 'STUDENT_IMPORT_COMPLETED',
    entityType: 'IMPORT',
    entityId: null,
    details: { imported, updated, total: parsed.length },
    ipAddress: ip,
  });

  return { imported, updated, skipped: 0, failed: 0, errors: [] };
}

export async function importStudentsFromFile(
  filePath: string,
  actorId: number,
  ip?: string
): Promise<ImportResult> {
  const ext = path.extname(filePath).toLowerCase();
  if (!IMPORT.ALLOWED_EXTENSIONS.includes(ext as typeof IMPORT.ALLOWED_EXTENSIONS[number])) {
    throw new ValidationError('INVALID_EXTENSION', `Extension ${ext} is not allowed. Only .xlsx files are accepted.`);
  }

  const fs = await import('fs');
  if (!fs.existsSync(filePath)) {
    throw new ValidationError('FILE_NOT_FOUND', `File not found: ${filePath}`);
  }

  const buffer = fs.readFileSync(filePath);
  if (buffer.length === 0) {
    throw new ValidationError('EMPTY_FILE', 'File is empty');
  }

  if (buffer.length > IMPORT.MAX_SIZE_BYTES) {
    throw new ValidationError('FILE_TOO_LARGE', `File size exceeds the maximum of ${(IMPORT.MAX_SIZE_BYTES / 1024 / 1024).toFixed(1)}MB`);
  }

  let parsed: ParsedStudent[];
  try {
    parsed = parseWorkbook(buffer);
  } catch {
    throw new ValidationError('INVALID_WORKBOOK', 'Failed to parse workbook. Ensure it is a valid .xlsx file.');
  }

  if (parsed.length === 0) {
    throw new ValidationError('NO_VALID_ROWS', 'No valid student rows found in the workbook');
  }

  if (parsed.length > IMPORT.MAX_ROWS) {
    throw new ValidationError('TOO_MANY_ROWS', `Workbook contains ${parsed.length} students. Maximum allowed is ${IMPORT.MAX_ROWS}.`);
  }

  return executeImport({ parsed, actorId, ip });
}

export async function importStudents(
  file: Express.Multer.File,
  actorId: number,
  ip?: string
): Promise<ImportResult> {
  const allowedMime = IMPORT.ALLOWED_MIME_TYPES as readonly string[];
  if (!allowedMime.includes(file.mimetype)) {
    throw new ValidationError('INVALID_FILE_TYPE', `File type ${file.mimetype} is not allowed. Only .xlsx files are accepted.`);
  }

  const ext = path.extname(file.originalname).toLowerCase();
  const allowedExt = IMPORT.ALLOWED_EXTENSIONS as readonly string[];
  if (!allowedExt.includes(ext)) {
    throw new ValidationError('INVALID_EXTENSION', `Extension ${ext} is not allowed. Only .xlsx files are accepted.`);
  }

  if (file.size > IMPORT.MAX_SIZE_BYTES) {
    throw new ValidationError('FILE_TOO_LARGE', `File size exceeds the maximum of ${(IMPORT.MAX_SIZE_BYTES / 1024 / 1024).toFixed(1)}MB`);
  }

  if (file.size === 0) {
    throw new ValidationError('EMPTY_FILE', 'Uploaded file is empty');
  }

  let parsed: ParsedStudent[];
  try {
    parsed = parseWorkbook(file.buffer);
  } catch {
    throw new ValidationError('INVALID_WORKBOOK', 'Failed to parse workbook. Ensure it is a valid .xlsx file.');
  }

  if (parsed.length === 0) {
    throw new ValidationError('NO_VALID_ROWS', 'No valid student rows found in the workbook');
  }

  if (parsed.length > IMPORT.MAX_ROWS) {
    throw new ValidationError('TOO_MANY_ROWS', `Workbook contains ${parsed.length} students. Maximum allowed is ${IMPORT.MAX_ROWS}.`);
  }

  return executeImport({ parsed, actorId, ip });
}

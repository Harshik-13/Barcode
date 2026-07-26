import path from 'path';
import { fileURLToPath } from 'url';
import { getDb } from '../dist/backend/src/db/index.js';
import { importStudentsFromFile } from '../dist/backend/src/services/studentImport.js';

const dir = path.resolve(fileURLToPath(import.meta.url), '../../data/imports');
const files = (await import('fs')).readdirSync(dir).filter(f => f.endsWith('.xlsx'));
const filePath = path.join(dir, files[0]);

console.log('File:', filePath);

const db = getDb();
try {
  const adminResult = await db.query("SELECT id FROM users WHERE role = 'admin' LIMIT 1");
  if (adminResult.rows.length === 0) {
    console.error('No admin user found');
    process.exit(1);
  }
  const adminId = adminResult.rows[0].id;
  console.log('Admin ID:', adminId);

  const result = await importStudentsFromFile(filePath, adminId, '127.0.0.1');
  console.log('Import result:', JSON.stringify(result, null, 2));
} catch (err) {
  console.error('Import failed:', err);
} finally {
  await db.end();
}

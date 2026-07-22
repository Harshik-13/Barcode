require('dotenv').config();
const express = require('express');
const cors = require('cors');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const db = require('./db');
const { OAuth2Client } = require('google-auth-library');
const fs = require('fs');
const path = require('path');
const app = express();

// CORS: Allow browser apps to call this API from specific origins (e.g., passport.vjstartup.com)
// You can override via ALLOWED_ORIGINS env (comma-separated list)
const envAllowed = (process.env.ALLOWED_ORIGINS || '')
  .split(',')
  .map(s => s.trim())
  .filter(Boolean);

const defaultAllowedOrigins = [
  'http://localhost:3000',
  'http://localhost:4000',
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:6000',
  'https://passport.vjstartup.com',
  'https://dev-passport.vjstartup.com',
  'https://scanner.vjstartup.com',
  'https://dev-scanner.vjstartup.com',
  // Allow any subdomain of vjstartup.com (e.g., api.vjstartup.com)
  /^https?:\/\/([a-zA-Z0-9-]+\.)?vjstartup\.com$/
];

const allowedOrigins = envAllowed.length ? envAllowed : defaultAllowedOrigins;

app.use(cors({
  origin: function (origin, callback) {
    // Allow non-browser or same-origin requests (no Origin header)
    if (!origin) return callback(null, true);

    const isAllowed = allowedOrigins.some((o) => {
      if (o instanceof RegExp) return o.test(origin);
      return o === origin;
    });

    if (isAllowed) return callback(null, true);
    return callback(new Error('Not allowed by CORS: ' + origin), false);
  },
  methods: ['GET', 'HEAD', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: false, // We use Bearer tokens, not cookies, for this API
}));
app.options('*', cors());
app.use(express.json());

// Minimal request logging to aid debugging of auth/CORS issues
app.use((req, _res, next) => {
  const origin = req.headers.origin || '';
  const hasAuth = Boolean(req.headers.authorization);
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl} origin=${origin} auth=${hasAuth}`);
  next();
});

const JWT_SECRET = process.env.JWT_SECRET || 'devjwtsecret';
const OAUTH_CLIENT_ID = process.env.OAUTH_CLIENT_ID || '';
const ALLOWED_EMAIL_DOMAIN = process.env.ALLOWED_EMAIL_DOMAIN || 'vnrvjiet.in';
const googleClient = OAUTH_CLIENT_ID ? new OAuth2Client(OAUTH_CLIENT_ID) : null;

// Load hostel data from files
let hostelData = null;
function loadHostelData() {
  if (hostelData) return hostelData;
  
  try {
    const BH1Path = path.join(__dirname, '../hostel-data/BH1-boys-main-hostel.txt');
    const GH1Path = path.join(__dirname, '../hostel-data/GH1-girls-main-hostel.txt');
    
    const BH1Rolls = fs.existsSync(BH1Path) 
      ? new Set(fs.readFileSync(BH1Path, 'utf8').split('\n').map(r => r.trim().toUpperCase()).filter(r => r.length > 0))
      : new Set();
    
    const GH1Rolls = fs.existsSync(GH1Path)
      ? new Set(fs.readFileSync(GH1Path, 'utf8').split('\n').map(r => r.trim().toUpperCase()).filter(r => r.length > 0))
      : new Set();
    
    hostelData = { BH1: BH1Rolls, GH1: GH1Rolls };
    console.log('✅ Loaded hostel data:', { BH1: BH1Rolls.size, GH1: GH1Rolls.size });
    return hostelData;
  } catch (err) {
    console.error('❌ Failed to load hostel data:', err);
    return { BH1: new Set(), GH1: new Set() };
  }
}

// Determine hostel ID for a roll number
function getHostelForRoll(roll) {
  const data = loadHostelData();
  const normalizedRoll = String(roll).toUpperCase(); // Normalize for case-insensitive lookup
  if (data.BH1.has(normalizedRoll)) {
    console.log(`[hostel] roll=${roll} normalized=${normalizedRoll} mapped=BH1`);
    return 'BH1';
  }
  if (data.GH1.has(normalizedRoll)) {
    console.log(`[hostel] roll=${roll} normalized=${normalizedRoll} mapped=GH1`);
    return 'GH1';
  }
  console.log(`[hostel] roll=${roll} normalized=${normalizedRoll} not found in hostel lists, defaulting=NONE`);
  return 'NONE'; // default fallback for non-hostel users (faculty, day scholars)
}

// Ensure FK target exists to avoid FOREIGN KEY errors
function ensureHostelExists(hostelId) {
  const name =
    hostelId === 'BH1' ? 'Boys Main Hostel' :
    hostelId === 'GH1' ? 'Girls Main Hostel' :
    hostelId === 'NONE' ? 'No Hostel' :
    hostelId;
  try {
    const res = db.prepare('INSERT OR IGNORE INTO hostels (id, name) VALUES (?, ?)').run(hostelId, name);
    if (res.changes > 0) console.log('[hostel] inserted missing hostel row', hostelId, name);
  } catch (e) {
    console.warn('[hostel] ensureHostelExists failed:', e.message);
  }
}

// Load hostel data on startup
loadHostelData();

// OAuth stub: student logs in by email, we return a JWT and create a per-student secret
app.post('/api/auth/login', (req, res) => {
  try {
    const { email, name } = req.body || {};
    if (!email) return res.status(400).json({ error: 'email required' });
    // extract roll from email (assume roll@vnrvjiet.in)
    const roll = String(email).split('@')[0];
    const hostelId = getHostelForRoll(roll); // dynamically determine hostel

    // Ensure FK target exists
    const hostelRow = db.prepare('SELECT id,name FROM hostels WHERE id = ?').get(hostelId);
    if (!hostelRow) ensureHostelExists(hostelId);
    console.log(`[login] email=${email} roll=${roll} hostelId=${hostelId} hostelExists=${!!hostelRow}`);

    // generate per-student secret and encrypt server-side with random key (here we store raw for demo)
    const secret = crypto.randomBytes(32).toString('hex');

    // Normalize roll number to uppercase for consistent storage
    const normalizedRoll = roll.trim().toUpperCase();
    const displayName = name || normalizedRoll;
    const insert = db.prepare('INSERT OR IGNORE INTO students(roll,name,email,hostel_id,secret_encrypted) VALUES(?,?,?,?,?)');
    const result = insert.run(normalizedRoll, displayName, email, hostelId, Buffer.from(secret, 'utf8'));
    console.log(`[login] students insert changes=${result.changes} lastRowId=${result.lastInsertRowid}`);

    const token = jwt.sign({ roll: normalizedRoll, hostelId }, JWT_SECRET, { expiresIn: '1h' });
    console.log(`[login] issued token for roll=${normalizedRoll}`);
    return res.json({ token, roll: normalizedRoll, hostelId, name: displayName });
  } catch (err) {
    console.error('[login] error', err);
    return res.status(500).json({ error: 'internal error', detail: String(err.message || err) });
  }
});

// Google OAuth: client passes an ID token (from Google Identity Services). We verify and issue our JWT.
app.post('/api/auth/google', async (req, res) => {
  try {
    const { idToken } = req.body;
    if (!idToken) return res.status(400).json({ error: 'idToken required' });
    if (!googleClient) return res.status(500).json({ error: 'OAUTH_CLIENT_ID not configured' });

    const ticket = await googleClient.verifyIdToken({ idToken, audience: OAUTH_CLIENT_ID });
    const payload = ticket.getPayload();
    if (!payload) return res.status(401).json({ error: 'invalid token' });

    const email = payload.email;
    if (!email || !email.endsWith('@' + ALLOWED_EMAIL_DOMAIN)) {
      return res.status(403).json({ error: 'email domain not allowed' });
    }

  const roll = email.split('@')[0];
  const normalizedRoll = roll.trim().toUpperCase(); // Normalize to uppercase
  const hostelId = getHostelForRoll(normalizedRoll); // dynamically determine hostel
  const hostelRow = db.prepare('SELECT id,name FROM hostels WHERE id = ?').get(hostelId);
  if (!hostelRow) ensureHostelExists(hostelId);
  console.log(`[google] email=${email} roll=${normalizedRoll} hostelId=${hostelId} hostelExists=${!!hostelRow}`);

    // ensure student exists and has a secret
    let row = db.prepare('SELECT roll, secret_encrypted FROM students WHERE UPPER(roll) = ?').get(normalizedRoll);
    if (!row) {
      const secret = crypto.randomBytes(32).toString('hex');
      db.prepare('INSERT INTO students(roll,name,email,hostel_id,secret_encrypted) VALUES(?,?,?,?,?)')
        .run(normalizedRoll, payload.name || normalizedRoll, email, hostelId, Buffer.from(secret, 'utf8'));
      console.log('[google] created new student row for', normalizedRoll);
    }

    const token = jwt.sign({ roll: normalizedRoll, hostelId }, JWT_SECRET, { expiresIn: '12h' });
    console.log(`[google] issued token for roll=${normalizedRoll}`);
    return res.json({ token, roll: normalizedRoll, hostelId, name: payload.name || normalizedRoll });
  } catch (e) {
    console.error('[google] error', e);
    return res.status(401).json({ error: 'invalid google token' });
  }
});

// Returns encrypted secret for a logged in student (requires Bearer token)
app.get('/api/student/secret', (req, res) => {
  const auth = req.headers.authorization;
  if (!auth) return res.status(401).json({ error: 'missing auth' });
  const token = auth.split(' ')[1];
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    console.log('[secret] token payload', payload);
    // Normalize roll number to uppercase for case-insensitive matching
    const roll = payload.roll ? payload.roll.trim().toUpperCase() : '';
    const row = db.prepare('SELECT secret_encrypted, roll, hostel_id FROM students WHERE UPPER(roll) = ?').get(roll);
    if (!row) {
      console.warn('[secret] student not found for roll', payload.roll);
      return res.status(404).json({ error: 'student not found' });
    }
    // For demo, return base64 secret; in prod wrap with AES-GCM encryption with server key
    return res.json({ roll: row.roll, hostel_id: row.hostel_id, secret_b64: Buffer.from(row.secret_encrypted).toString('base64') });
  } catch (e) {
    console.error('[secret] invalid token', e.message);
    return res.status(401).json({ error: 'invalid token' });
  }
});

// Fast online verify endpoint: expects { qr }
app.post('/api/verify/online', (req, res) => {
  const { qr } = req.body;
  if (!qr) return res.status(400).json({ error: 'qr required' });
  // v1: roll|timeStep|hash
  // v2: roll|name|timeStep|hash
  const parts = String(qr).split('|');
  if (parts.length !== 3 && parts.length !== 4) return res.status(400).json({ error: 'bad qr format', status: 'invalid', code: 'INVALID' });

  let roll, name, timeStep, hash;
  if (parts.length === 3) {
    [roll, timeStep, hash] = parts;
    name = '';
  } else {
    [roll, name, timeStep, hash] = parts;
  }
  // Keep original roll for HMAC verification, use normalized version for DB lookup
  const originalRoll = roll;
  const normalizedRoll = roll.trim().toUpperCase();
  console.log(`[verify] roll="${originalRoll}" normalized="${normalizedRoll}" timeStep=${timeStep} v=${parts.length === 4 ? '2' : '1'}`);
  
  const row = db.prepare('SELECT secret_encrypted, hostel_id, roll FROM students WHERE UPPER(roll) = ?').get(normalizedRoll);
  if (!row) {
    console.log(`[verify] ❌ Student not found in database for roll: ${normalizedRoll}`);
    return res.json({ status: 'invalid', code: 'INVALID', reason: 'student_not_found', roll: normalizedRoll });
  }
  
  console.log(`[verify] Found student in DB: ${row.roll}`);
  const secret = Buffer.from(row.secret_encrypted).toString('utf8');
  
  // Use ORIGINAL roll from QR for HMAC calculation (must match what was used to generate)
  const msg = parts.length === 4 ? (originalRoll + name + timeStep) : (originalRoll + timeStep);
  const computed = crypto.createHmac('sha256', secret).update(msg).digest('hex');
  
  console.log(`[verify] HMAC check: computed="${computed.substring(0,16)}..." expected="${hash.substring(0,16)}..." match=${computed === hash}`);
  
  if (computed === hash) {
    // check time window
    const nowStep = Math.floor(Date.now() / 15000).toString();
    const diff = Math.abs(Number(nowStep) - Number(timeStep));
    console.log(`[verify] ✅ HMAC valid. Time check: nowStep=${nowStep} qrStep=${timeStep} diff=${diff}`);
    if (diff <= 1) return res.json({ status: 'valid', code: 'VALID', hostel_id: row.hostel_id });
    return res.json({ status: 'expired', code: 'EXPIRED', reason: 'time_window_exceeded', diff });
  }
  console.log(`[verify] ❌ HMAC mismatch`);
  return res.json({ status: 'invalid', code: 'INVALID', reason: 'hmac_mismatch', roll: normalizedRoll });
});

// Assign a membership to a roll
app.post('/api/memberships/assign', (req, res) => {
  const { roll, kind, value } = req.body || {};
  if (!roll || !kind || !value) return res.status(400).json({ error: 'roll, kind, value required' });
  try {
    // Normalize roll number to uppercase for consistent storage
    const normalizedRoll = roll.trim().toUpperCase();
    const stmt = db.prepare('INSERT INTO memberships(roll, kind, value) VALUES(?,?,?)');
    const r = stmt.run(normalizedRoll, kind, value);
    return res.json({ ok: true, id: r.lastInsertRowid });
  } catch (e) {
    return res.status(500).json({ error: 'failed to assign membership', detail: e.message });
  }
});

// Sync: return rolls for a given membership kind/value (e.g., hostel BH1, event Event1, gatepass GatePass)
app.get('/api/sync/memberships', (req, res) => {
  const kind = req.query.kind;
  const value = req.query.value;
  if (!kind || !value) return res.status(400).json({ error: 'kind and value query required' });
  try {
    const rows = db.prepare('SELECT roll FROM memberships WHERE kind = ? AND value = ?').all(kind, value);
    return res.json({ kind, value, rolls: rows.map(r => r.roll) });
  } catch (e) {
    return res.status(500).json({ error: 'failed to fetch memberships', detail: e.message });
  }
});

// Receive scan logs
app.post('/api/sync/logs', (req, res) => {
  const { logs } = req.body;
  if (!Array.isArray(logs)) return res.status(400).json({ error: 'logs array required' });
  const insert = db.prepare('INSERT INTO scans(roll, mode, hostel_id, device_id, timestamp, status, metadata) VALUES(?,?,?,?,?,?,?)');
  const insertMany = db.transaction((items) => {
    for (const it of items) {
      insert.run(it.roll, it.mode, it.hostel_id, it.device_id || null, it.timestamp || null, it.status || null, JSON.stringify(it.metadata || {}));
    }
  });
  insertMany(logs);
  return res.json({ ok: true, count: logs.length });
});

// New: Upload scanned IDs in batches (client can send all pending in one go)
// Accepts: { logs: [ { roll, mode, hostel_id, device_id?, timestamp, status, metadata:{ foodType?, ... } } ] }
// Stores logs identically to /api/sync/logs
app.post('/api/scans/upload', (req, res) => {
  const { logs } = req.body || {};
  if (!Array.isArray(logs)) return res.status(400).json({ error: 'logs array required' });
  const insert = db.prepare('INSERT INTO scans(roll, mode, hostel_id, device_id, timestamp, status, metadata) VALUES(?,?,?,?,?,?,?)');
  const insertMany = db.transaction((items) => {
    for (const it of items) {
      insert.run(it.roll, it.mode, it.hostel_id, it.device_id || null, it.timestamp || null, it.status || null, JSON.stringify(it.metadata || {}));
    }
  });
  insertMany(logs);
  return res.json({ ok: true, count: logs.length });
});

// New: Fetch scans by filters
// Query params:
// - day: date string (YYYY-MM-DD or DD/Mon/YYYY) to filter by day (local time)
// - studentBatch: e.g., "2023" or "2023,2024" (derived from roll prefix like 23 -> 2023)
// - foodType: Breakfast|Lunch|Snacks|Dinner
// - limit: max rows to return (default 200)
app.get('/api/scans', (req, res) => {
  try {
    const { day, studentBatch, foodType } = req.query;
    const limit = Math.min(parseInt(req.query.limit || '200', 10) || 200, 1000);

    // Compute day start/end boundaries in ms
    let startMs = 0, endMs = Date.now();
    if (day) {
      const parsed = parseDay(String(day));
      if (!parsed) return res.status(400).json({ error: 'invalid day format' });
      startMs = parsed.startMs;
      endMs = parsed.endMs;
    }

    // Fetch rows for the day (or all if no day provided)
    const rows = (startMs > 0)
      ? db.prepare('SELECT roll, mode, hostel_id, device_id, timestamp, status, metadata FROM scans WHERE timestamp BETWEEN ? AND ? ORDER BY timestamp DESC LIMIT ?').all(startMs, endMs, limit)
      : db.prepare('SELECT roll, mode, hostel_id, device_id, timestamp, status, metadata FROM scans ORDER BY timestamp DESC LIMIT ?').all(limit);

    // Apply in-memory filters for studentBatch and foodType
    let filtered = rows.map(r => ({ ...r, metadata: safeJson(r.metadata) }));

    if (foodType) {
      const ft = String(foodType).toLowerCase();
      filtered = filtered.filter(r => (r.metadata?.foodType || '').toLowerCase() === ft);
    }

    if (studentBatch) {
      const batches = String(studentBatch)
        .split(',')
        .map(s => s.trim())
        .filter(Boolean);
      if (batches.length) {
        filtered = filtered.filter(r => {
          const yr = deriveAdmissionYear(r.roll);
          return yr && batches.includes(String(yr));
        });
      }
    }

    return res.json({ ok: true, count: filtered.length, rows: filtered });
  } catch (e) {
    console.error('[scans] error', e);
    return res.status(500).json({ error: 'failed to fetch scans', detail: String(e.message || e) });
  }
});

function safeJson(text) {
  try { return text ? JSON.parse(text) : {}; } catch { return {}; }
}

function parseDay(input) {
  // Accept YYYY-MM-DD or DD/Mon/YYYY (e.g., 06/Nov/2025)
  let date;
  const iso = /^\d{4}-\d{2}-\d{2}$/;
  const pretty = /^(\d{2})\/(\w{3})\/(\d{4})$/; // 06/Nov/2025
  if (iso.test(input)) {
    date = new Date(input + 'T00:00:00');
  } else if (pretty.test(input)) {
    const m = input.match(pretty);
    const day = parseInt(m[1], 10);
    const mon = m[2];
    const year = parseInt(m[3], 10);
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    const monthIdx = months.indexOf(mon);
    if (monthIdx === -1) return null;
    date = new Date(year, monthIdx, day, 0, 0, 0, 0);
  } else {
    return null;
  }
  const start = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0);
  const end = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999);
  return { startMs: start.getTime(), endMs: end.getTime() };
}

function deriveAdmissionYear(roll) {
  // Heuristic: first two digits of roll are last two digits of admission year, e.g., 22A91... -> 2022
  if (!roll) return null;
  const m = String(roll).match(/^(\d{2})/);
  if (!m) return null;
  const yy = parseInt(m[1], 10);
  return 2000 + yy;
}

// Return hostel key bundle (roll->secret) for offline verification by scanners
app.get('/api/sync/hostel-keys', (req, res) => {
  const hostelId = req.query.hostelId;
  if (!hostelId) return res.status(400).json({ error: 'hostelId query required' });
  const rows = db.prepare('SELECT roll, secret_encrypted FROM students WHERE hostel_id = ?').all(hostelId);
  const bundle = rows.map(r => ({ roll: r.roll, secret_b64: Buffer.from(r.secret_encrypted).toString('base64') }));
  return res.json({ hostelId, bundle });
});

// New: Get student's own activity/scan history (requires auth token)
// Returns scans filtered by the authenticated student's roll
app.get('/api/student/activity', (req, res) => {
  const auth = req.headers.authorization;
  if (!auth) return res.status(401).json({ error: 'missing auth' });
  const token = auth.split(' ')[1];
  
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    const roll = payload.roll ? payload.roll.trim().toUpperCase() : '';
    
    if (!roll) return res.status(400).json({ error: 'invalid token payload' });
    
    const { foodType } = req.query;
    const limit = Math.min(parseInt(req.query.limit || '100', 10) || 100, 500);
    
    // Fetch scans for this student only
    let rows = db.prepare('SELECT roll, mode, hostel_id, device_id, timestamp, status, metadata FROM scans WHERE UPPER(roll) = ? ORDER BY timestamp DESC LIMIT ?').all(roll, limit);
    
    // Parse metadata and apply optional foodType filter
    let filtered = rows.map(r => ({ ...r, metadata: safeJson(r.metadata) }));
    
    if (foodType) {
      const ft = String(foodType).toLowerCase();
      filtered = filtered.filter(r => (r.metadata?.foodType || '').toLowerCase() === ft);
    }
    
    return res.json({ ok: true, roll, count: filtered.length, rows: filtered });
  } catch (e) {
    console.error('[student/activity] error', e);
    return res.status(401).json({ error: 'invalid token' });
  }
});

const port = process.env.PORT || 8080;
app.listen(port, () => console.log('API server listening on', port));

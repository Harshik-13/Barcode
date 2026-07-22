-- SQLite schema for Campus Passport

CREATE TABLE IF NOT EXISTS hostels (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS students (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  roll TEXT UNIQUE NOT NULL,
  name TEXT,
  email TEXT UNIQUE,
  hostel_id TEXT,
  secret_encrypted BLOB,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(hostel_id) REFERENCES hostels(id)
);

CREATE TABLE IF NOT EXISTS devices (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  device_uuid TEXT UNIQUE,
  hostel_id TEXT,
  registered_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(hostel_id) REFERENCES hostels(id)
);

CREATE TABLE IF NOT EXISTS scans (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  roll TEXT,
  mode TEXT,
  hostel_id TEXT,
  device_id INTEGER,
  timestamp DATETIME,
  status TEXT,
  metadata TEXT
);

-- Memberships: generic membership assignments for rolls
-- kind examples: 'hostel', 'event', 'gatepass'
-- value examples: 'BH1', 'Event1', 'GatePass'
CREATE TABLE IF NOT EXISTS memberships (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  roll TEXT NOT NULL,
  kind TEXT NOT NULL,
  value TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_memberships_kind_value ON memberships(kind, value);
CREATE INDEX IF NOT EXISTS idx_memberships_roll ON memberships(roll);

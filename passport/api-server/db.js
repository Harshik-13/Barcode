const Database = require('better-sqlite3');
const path = require('path');

const dbPath = process.env.DATABASE_URL || path.join(__dirname, 'campus_passport.db');
const db = new Database(dbPath);

module.exports = db;

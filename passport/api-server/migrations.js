const fs = require('fs');
const Database = require('better-sqlite3');
const path = require('path');

const dbPath = process.env.DATABASE_URL || path.join(__dirname, 'campus_passport.db');
const db = new Database(dbPath);

const sql = fs.readFileSync(path.join(__dirname, 'migrations.sql'), 'utf8');
db.exec(sql);

// seed a couple of hostels for demo
const insertHostel = db.prepare('INSERT OR IGNORE INTO hostels(id, name) VALUES(?,?)');
insertHostel.run('H1', 'Block H1');
insertHostel.run('H4', 'Block H4');
// Also seed IDs used by the application logic and hostel data files
insertHostel.run('BH1', 'Boys Main Hostel');
insertHostel.run('GH1', 'Girls Main Hostel');
insertHostel.run('NONE', 'No Hostel');

console.log('Migrations applied to', dbPath);

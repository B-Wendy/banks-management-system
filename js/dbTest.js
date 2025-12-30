const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, '../bank.sqlite');
const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READWRITE, (err) => {
  if (err) {
    console.error('Failed to connect:', err.message);
    process.exit(1);
  }
  console.log('Connected to bank.sqlite');
});

db.all("SELECT name FROM sqlite_master WHERE type='table'", [], (err, rows) => {
  if (err) {
    console.error('Error listing tables:', err.message);
    return;
  }
  console.log('Tables:');
  rows.forEach(r => console.log(r.name));
});

db.close();
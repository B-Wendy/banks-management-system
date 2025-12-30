const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, '../bank.sqlite');
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
  db.all("SELECT * FROM users", [], (err, rows) => {
    if (err) throw err;
    console.log("Users:", rows);
  });

  db.all("SELECT * FROM accounts", [], (err, rows) => {
    if (err) throw err;
    console.log("Accounts:", rows);
  });

  db.all("SELECT * FROM transactions", [], (err, rows) => {
    if (err) throw err;
    console.log("Transactions:", rows);
  });
});

db.close();
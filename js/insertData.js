const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, '../bank.sqlite');
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
  db.run("INSERT INTO users (name, balance) VALUES ('Alice', 1000.50)");
  db.run("INSERT INTO users (name, balance) VALUES ('Bob', 250.75)");

  db.run("INSERT INTO accounts (user_id, type, balance) VALUES (1, 'Checking', 1000.50)");
  db.run("INSERT INTO accounts (user_id, type, balance) VALUES (2, 'Savings', 250.75)");

  db.run("INSERT INTO transactions (account_id, amount, type) VALUES (1, 200, 'Deposit')");
  db.run("INSERT INTO transactions (account_id, amount, type) VALUES (2, 50, 'Withdrawal')");
});

db.close(() => console.log("Sample data inserted"));
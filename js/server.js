const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const session = require('express-session');
const bcrypt = require('bcrypt');

const app = express();
const PORT = process.env.PORT || 3000;

// Database
const dbPath = path.resolve(__dirname, '../bank.sqlite');
const db = new sqlite3.Database(dbPath);

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(session({
  secret: 'change_this_secret_for_production',
  resave: false,
  saveUninitialized: false,
  cookie: { httpOnly: true }
}));
app.use(express.static('public'));

// Helpers
function requireAuth(req, res, next) {
  if (req.session && req.session.userId) return next();
  return res.status(401).json({ error: 'Unauthorized' });
}

// Root → redirect to login or dashboard
app.get('/', (req, res) => {
  if (req.session && req.session.userId) {
    return res.redirect('/dashboard.html');
  }
  return res.redirect('/login.html');
});

// --- Auth routes ---
app.post('/auth/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) return res.status(400).json({ error: 'Missing fields' });

    const saltRounds = 10;
    const hash = await bcrypt.hash(password, saltRounds);

    db.run(
      "INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)",
      [name, email, hash],
      function(err) {
        if (err) return res.status(500).json({ error: err.message });
        return res.json({ id: this.lastID, name, email });
      }
    );
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
});

app.post('/auth/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Missing email or password' });

  db.get("SELECT id, name, email, password_hash FROM users WHERE email = ?", [email], async (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!row) return res.status(401).json({ error: 'Invalid credentials' });

    const ok = await bcrypt.compare(password, row.password_hash);
    if (!ok) return res.status(401).json({ error: 'Invalid credentials' });

    req.session.userId = row.id;
    req.session.userName = row.name;
    return res.json({ message: 'Logged in', user: { id: row.id, name: row.name, email: row.email } });
  });
});

app.post('/auth/logout', (req, res) => {
  req.session.destroy(() => {
    res.json({ message: 'Logged out' });
  });
});

// --- Protected data routes ---
app.get('/users', requireAuth, (req, res) => {
  db.all("SELECT id, name, email FROM users", [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.get('/accounts', requireAuth, (req, res) => {
  db.all("SELECT * FROM accounts", [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.get('/transactions', requireAuth, (req, res) => {
  db.all("SELECT * FROM transactions", [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// Inserts
app.post('/users', requireAuth, (req, res) => {
  const { name, email, password } = req.body;
  // Allows admin to create users; if password omitted, create without login capability
  const doInsert = (hash) => {
    db.run("INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)", [name, email, hash || null], function(err) {
      if (err) return res.status(500).json({ error: err.message });
      return res.json({ id: this.lastID, name, email });
    });
  };
  if (password) {
    bcrypt.hash(password, 10).then(doInsert).catch(e => res.status(500).json({ error: e.message }));
  } else {
    doInsert(null);
  }
});

app.post('/accounts', requireAuth, (req, res) => {
  const { user_id, balance } = req.body;
  if (!user_id || balance === undefined) return res.status(400).json({ error: 'Missing fields' });
  db.run("INSERT INTO accounts (user_id, balance) VALUES (?, ?)", [user_id, balance], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ id: this.lastID, user_id, balance });
  });
});

app.post('/transactions', requireAuth, (req, res) => {
  const { account_id, amount, date } = req.body;
  if (!account_id || amount === undefined || !date) return res.status(400).json({ error: 'Missing fields' });
  db.run("INSERT INTO transactions (account_id, amount, date) VALUES (?, ?, ?)", [account_id, amount, date], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ id: this.lastID, account_id, amount, date });
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
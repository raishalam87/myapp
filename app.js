// Load environment variables from .env file
require('dotenv').config();

const express = require('express');
const mysql = require('mysql2');
const bodyParser = require('body-parser');
const bcrypt = require('bcryptjs');

const app = express();
app.use(bodyParser.json());

// MySQL Connection using .env variables
const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME
});

// Connect to MySQL Database
db.connect(err => {
  if (err) throw err;
  console.log('Connected to MySQL database');
});

// Add user if not exists (Only for first time setup, you can remove it later)
const username = 'Raish';
const plainPassword = 'Raish@2025';

db.query('SELECT * FROM users WHERE username = ?', [username], async (err, results) => {
  if (err) throw err;

  if (results.length === 0) {
    const hashedPassword = await bcrypt.hash(plainPassword, 10);
    db.query('INSERT INTO users (username, password) VALUES (?, ?)', [username, hashedPassword], (err, result) => {
      if (err) throw err;
      console.log('User Raish added');
    });
  }
});

// Login Route
app.post('/login', (req, res) => {
  const { username, password } = req.body;

  db.query('SELECT * FROM users WHERE username = ?', [username], async (err, results) => {
    if (err) return res.status(500).send('Server error');
    if (results.length === 0) return res.status(401).send('Invalid username or password');

    const user = results[0];
    const isMatch = await bcrypt.compare(password, user.password);

    if (isMatch) {
      res.send('Login successful!');
    } else {
      res.status(401).send('Invalid username or password');
    }
  });
});

// Use the PORT from .env or default to 3008
const port = process.env.PORT || 3008;
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});

// Load environment variables from .env file
require('dotenv').config();

// Load required modules
const express = require('express');
const mysql = require('mysql2');
const bodyParser = require('body-parser');
const bcrypt = require('bcryptjs');

// Create the express app
const app = express();
app.use(bodyParser.json());

// Ensure .env file is present
if (!process.env.DB_HOST || !process.env.DB_USER || !process.env.DB_PASS || !process.env.DB_NAME) {
  console.error('Please set the DB connection variables in the .env file');
  process.exit(1);
}

// MySQL Connection using .env variables
const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME
});

// Connect to MySQL Database
db.connect((err) => {
  if (err) {
    console.error('Error connecting to MySQL:', err.stack);
    return;
  }
  console.log('Connected to MySQL database');
});

// Add user if not exists (Only for first-time setup, you can remove it later)
const username = 'Raish';
const plainPassword = 'Raish@2025';

db.query('SELECT * FROM users WHERE username = ?', [username], async (err, results) => {
  if (err) {
    console.error('Error fetching user:', err);
    return;
  }

  if (results.length === 0) {
    try {
      const hashedPassword = await bcrypt.hash(plainPassword, 10);
      db.query('INSERT INTO users (username, password) VALUES (?, ?)', [username, hashedPassword], (err, result) => {
        if (err) {
          console.error('Error inserting user:', err);
        } else {
          console.log('User Raish added successfully');
        }
      });
    } catch (error) {
      console.error('Error hashing password:', error);
    }
  }
});

// Login Route
app.post('/login', async (req, res) => {
  const { username, password } = req.body;

  // Ensure both fields are present
  if (!username || !password) {
    return res.status(400).send('Username and password are required');
  }

  db.query('SELECT * FROM users WHERE username = ?', [username], async (err, results) => {
    if (err) {
      console.error('Database query error:', err);
      return res.status(500).send('Server error');
    }

    if (results.length === 0) {
      return res.status(401).send('Invalid username or password');
    }

    const user = results[0];
    try {
      const isMatch = await bcrypt.compare(password, user.password);

      if (isMatch) {
        res.send('Login successful!');
      } else {
        res.status(401).send('Invalid username or password');
      }
    } catch (err) {
      console.error('Error comparing passwords:', err);
      res.status(500).send('Server error');
    }
  });
});

// Use the PORT from .env or default to 3008
const port = process.env.PORT || 3008;
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});

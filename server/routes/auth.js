const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const mysql = require('mysql2/promise');
const config = require('../config/config');

const router = express.Router();

// JWT secret key (in production, use environment variable)
const JWT_SECRET = process.env.JWT_SECRET || 'bittrade_secret_key_2024';

// Database connection
let db;

async function initDB() {
  try {
    db = await mysql.createConnection(config.database);
    console.log('Auth routes: Database connected');
  } catch (error) {
    console.error('Auth routes: Database connection failed:', error);
    throw error;
  }
}

// Initialize database connection
initDB();

// Register new user
router.post('/register', async (req, res) => {
  try {
    const { email, name, password, confirmPassword } = req.body;

    // Validation
    if (!email || !name || !password || !confirmPassword) {
      return res.status(400).json({ 
        error: 'All fields are required' 
      });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ 
        error: 'Passwords do not match' 
      });
    }

    if (password.length < 6) {
      return res.status(400).json({ 
        error: 'Password must be at least 6 characters long' 
      });
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ 
        error: 'Invalid email format' 
      });
    }

    // Check if user already exists
    const [existingUsers] = await db.execute(
      'SELECT id FROM users WHERE email = ?',
      [email]
    );

    if (existingUsers.length > 0) {
      return res.status(409).json({ 
        error: 'User with this email already exists' 
      });
    }

    // Hash password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create user
    const [result] = await db.execute(
      'INSERT INTO users (email, name, password_hash) VALUES (?, ?, ?)',
      [email, name, hashedPassword]
    );

    // Generate JWT token
    const token = jwt.sign(
      { 
        id: result.insertId, 
        email: email,
        name: name 
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: {
        id: result.insertId,
        email: email,
        name: name
      }
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ 
      error: 'Internal server error' 
    });
  }
});

// Login user
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({ 
        error: 'Email and password are required' 
      });
    }

    // Find user
    const [users] = await db.execute(
      'SELECT id, email, name, password_hash, is_admin FROM users WHERE email = ?',
      [email]
    );

    if (users.length === 0) {
      return res.status(401).json({ 
        error: 'Invalid email or password' 
      });
    }

    const user = users[0];

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      return res.status(401).json({ 
        error: 'Invalid email or password' 
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      { 
        id: user.id, 
        email: user.email,
        name: user.name 
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        is_admin: user.is_admin
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ 
      error: 'Internal server error' 
    });
  }
});

// Verify token endpoint
router.get('/verify', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ 
        error: 'No token provided' 
      });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Get fresh user data
    const [users] = await db.execute(
      'SELECT id, email, name, is_admin FROM users WHERE id = ?',
      [decoded.id]
    );

    if (users.length === 0) {
      return res.status(401).json({ 
        error: 'User not found' 
      });
    }

    res.json({
      valid: true,
      user: users[0]
    });

  } catch (error) {
    console.error('Token verification error:', error);
    res.status(401).json({ 
      error: 'Invalid token' 
    });
  }
});

module.exports = router;

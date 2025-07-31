const express = require('express');
const bcrypt = require('bcrypt');
const mysql = require('mysql2/promise');
const config = require('../config/config');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Database connection
let db;

async function initDB() {
  try {
    db = await mysql.createConnection(config.database);
    console.log('User routes: Database connected');
  } catch (error) {
    console.error('User routes: Database connection failed:', error);
    throw error;
  }
}

// Initialize database connection
initDB();

// Update user profile name
router.put('/profile/name', authenticateToken, async (req, res) => {
  try {
    const { name, currentPassword } = req.body;
    const userId = req.user.id;

    // Validation
    if (!name || !currentPassword) {
      return res.status(400).json({
        error: 'Name and current password are required'
      });
    }

    if (name.trim().length < 2) {
      return res.status(400).json({
        error: 'Name must be at least 2 characters long'
      });
    }

    // Get current user data
    const [users] = await db.execute(
      'SELECT password_hash FROM users WHERE id = ?',
      [userId]
    );

    if (users.length === 0) {
      return res.status(404).json({
        error: 'User not found'
      });
    }

    // Verify current password
    const isPasswordValid = await bcrypt.compare(currentPassword, users[0].password_hash);
    if (!isPasswordValid) {
      return res.status(401).json({
        error: 'Current password is incorrect'
      });
    }

    // Update name
    await db.execute(
      'UPDATE users SET name = ? WHERE id = ?',
      [name.trim(), userId]
    );

    res.json({
      message: 'Name updated successfully',
      name: name.trim()
    });

  } catch (error) {
    console.error('Name update error:', error);
    res.status(500).json({
      error: 'Internal server error'
    });
  }
});

// Update user profile email
router.put('/profile/email', authenticateToken, async (req, res) => {
  try {
    const { email, currentPassword } = req.body;
    const userId = req.user.id;

    // Validation
    if (!email || !currentPassword) {
      return res.status(400).json({
        error: 'Email and current password are required'
      });
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        error: 'Invalid email format'
      });
    }

    // Check if email already exists for another user
    const [existingUsers] = await db.execute(
      'SELECT id FROM users WHERE email = ? AND id != ?',
      [email, userId]
    );

    if (existingUsers.length > 0) {
      return res.status(409).json({
        error: 'Email is already in use by another account'
      });
    }

    // Get current user data
    const [users] = await db.execute(
      'SELECT password_hash FROM users WHERE id = ?',
      [userId]
    );

    if (users.length === 0) {
      return res.status(404).json({
        error: 'User not found'
      });
    }

    // Verify current password
    const isPasswordValid = await bcrypt.compare(currentPassword, users[0].password_hash);
    if (!isPasswordValid) {
      return res.status(401).json({
        error: 'Current password is incorrect'
      });
    }

    // Update email
    await db.execute(
      'UPDATE users SET email = ? WHERE id = ?',
      [email.toLowerCase(), userId]
    );

    res.json({
      message: 'Email updated successfully',
      email: email.toLowerCase()
    });

  } catch (error) {
    console.error('Email update error:', error);
    res.status(500).json({
      error: 'Internal server error'
    });
  }
});

// Update user password
router.put('/profile/password', authenticateToken, async (req, res) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;
    const userId = req.user.id;

    // Validation
    if (!currentPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({
        error: 'All password fields are required'
      });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        error: 'New passwords do not match'
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        error: 'New password must be at least 6 characters long'
      });
    }

    if (currentPassword === newPassword) {
      return res.status(400).json({
        error: 'New password must be different from current password'
      });
    }

    // Get current user data
    const [users] = await db.execute(
      'SELECT password_hash FROM users WHERE id = ?',
      [userId]
    );

    if (users.length === 0) {
      return res.status(404).json({
        error: 'User not found'
      });
    }

    // Verify current password
    const isPasswordValid = await bcrypt.compare(currentPassword, users[0].password_hash);
    if (!isPasswordValid) {
      return res.status(401).json({
        error: 'Current password is incorrect'
      });
    }

    // Hash new password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

    // Update password
    await db.execute(
      'UPDATE users SET password_hash = ? WHERE id = ?',
      [hashedPassword, userId]
    );

    res.json({
      message: 'Password updated successfully'
    });

  } catch (error) {
    console.error('Password update error:', error);
    res.status(500).json({
      error: 'Internal server error'
    });
  }
});

// Get user profile
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    // Get user data
    const [users] = await db.execute(
      'SELECT id, email, name FROM users WHERE id = ?',
      [userId]
    );

    if (users.length === 0) {
      return res.status(404).json({
        error: 'User not found'
      });
    }

    res.json({
      user: users[0]
    });

  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      error: 'Internal server error'
    });
  }
});

module.exports = router;

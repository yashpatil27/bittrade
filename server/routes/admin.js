const express = require('express');
const mysql = require('mysql2/promise');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Database connection
let db;

async function initDB() {
  try {
    db = await mysql.createConnection(require('../config/config').database);
    console.log('Admin routes: Database connected');
  } catch (error) {
    console.error('Admin routes: Database connection failed:', error);
    throw error;
  }
}

// Initialize database connection
initDB();

// Get all transactions for admin
router.get('/transactions', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Check if user is admin from database
    const [userRows] = await db.execute(
      'SELECT is_admin FROM users WHERE id = ?',
      [userId]
    );
    
    if (userRows.length === 0 || !userRows[0].is_admin) {
      return res.status(403).json({ error: 'Access denied. Admin privileges required.' });
    }

    const [transactions] = await db.execute(
      `SELECT id, user_id, type, status, btc_amount, inr_amount, execution_price, created_at, executed_at 
       FROM transactions 
       ORDER BY created_at DESC 
       LIMIT 1000`
    );

    res.json({ 
      transactions
    });
  } catch (error) {
    console.error('Error fetching all transactions:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get all DCA plans for admin
router.get('/dca-plans', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Check if user is admin from database
    const [userRows] = await db.execute(
      'SELECT is_admin FROM users WHERE id = ?',
      [userId]
    );
    
    if (userRows.length === 0 || !userRows[0].is_admin) {
      return res.status(403).json({ error: 'Access denied. Admin privileges required.' });
    }

    const [plans] = await db.execute(
      `SELECT id, user_id, plan_type, status, frequency, amount_per_execution_inr, amount_per_execution_btc, 
              next_execution_at, total_executions, remaining_executions, max_price, min_price, 
              created_at, completed_at
       FROM active_plans 
       ORDER BY created_at DESC`
    );

    // Get execution history and performance for each plan
    const plansWithHistory = await Promise.all(plans.map(async (plan) => {
      const [executions] = await db.execute(
        `SELECT id, btc_amount, inr_amount, execution_price, executed_at, status
         FROM transactions 
         WHERE user_id = ? AND dca_plan_id = ? AND type = ? 
         ORDER BY executed_at DESC 
         LIMIT 10`,
        [plan.user_id, plan.id, plan.plan_type]
      );

      // Calculate performance metrics
      const [metrics] = await db.execute(
        `SELECT 
           COUNT(*) as total_executed,
           SUM(inr_amount) as total_invested,
           SUM(btc_amount) as total_btc,
           AVG(execution_price) as avg_price
         FROM transactions 
         WHERE user_id = ? AND dca_plan_id = ? AND type = ? AND status = 'EXECUTED'`,
        [plan.user_id, plan.id, plan.plan_type]
      );

      return {
        ...plan,
        recent_executions: executions,
        performance: metrics[0] || {
          total_executed: 0,
          total_invested: 0,
          total_btc: 0,
          avg_price: 0
        }
      };
    }));

    res.json({ 
      plans: plansWithHistory,
      totalCount: plans.length
    });
  } catch (error) {
    console.error('Error fetching all DCA plans:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get all users for admin
router.get('/users', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Check if user is admin from database
    const [userRows] = await db.execute(
      'SELECT is_admin FROM users WHERE id = ?',
      [userId]
    );
    
    if (userRows.length === 0 || !userRows[0].is_admin) {
      return res.status(403).json({ error: 'Access denied. Admin privileges required.' });
    }

    const [users] = await db.execute(
      `SELECT id, name, email, 
              available_btc as btcBalance,
              available_inr as inrBalance,
              created_at
       FROM users 
       ORDER BY created_at DESC`
    );

    res.json({ 
      users
    });
  } catch (error) {
    console.error('Error fetching all users:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;

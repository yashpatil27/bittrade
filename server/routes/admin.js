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

// Deposit Bitcoin to user account
router.post('/users/:userId/deposit-bitcoin', authenticateToken, async (req, res) => {
  try {
    const adminUserId = req.user.id;
    const { userId } = req.params;
    const { amount } = req.body; // Amount in satoshis
    
    // Check if user is admin from database
    const [userRows] = await db.execute(
      'SELECT is_admin FROM users WHERE id = ?',
      [adminUserId]
    );
    
    if (userRows.length === 0 || !userRows[0].is_admin) {
      return res.status(403).json({ error: 'Access denied. Admin privileges required.' });
    }

    // Validate amount
    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Invalid amount' });
    }

    // Check if target user exists
    const [targetUserRows] = await db.execute(
      'SELECT id, name, email FROM users WHERE id = ?',
      [userId]
    );

    if (targetUserRows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const targetUser = targetUserRows[0];

    // Update user's Bitcoin balance
    await db.execute(
      'UPDATE users SET available_btc = available_btc + ? WHERE id = ?',
      [amount, userId]
    );

    // Get updated balance
    const [updatedBalanceRows] = await db.execute(
      'SELECT available_btc FROM users WHERE id = ?',
      [userId]
    );

    const newBalance = updatedBalanceRows[0].available_btc;

    console.log(`✅ Admin ${adminUserId} deposited ${amount} satoshis to user ${userId}`);

    res.json({
      success: true,
      message: 'Bitcoin deposited successfully',
      user: targetUser,
      depositedAmount: amount,
      newBalance: newBalance
    });
  } catch (error) {
    console.error('Error depositing Bitcoin:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Deposit cash to user account
router.post('/users/:userId/deposit-cash', authenticateToken, async (req, res) => {
  try {
    const adminUserId = req.user.id;
    const { userId } = req.params;
    const { amount } = req.body; // Amount in rupees
    
    // Check if user is admin from database
    const [userRows] = await db.execute(
      'SELECT is_admin FROM users WHERE id = ?',
      [adminUserId]
    );
    
    if (userRows.length === 0 || !userRows[0].is_admin) {
      return res.status(403).json({ error: 'Access denied. Admin privileges required.' });
    }

    // Validate amount
    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Invalid amount' });
    }

    // Check if target user exists
    const [targetUserRows] = await db.execute(
      'SELECT id, name, email FROM users WHERE id = ?',
      [userId]
    );

    if (targetUserRows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const targetUser = targetUserRows[0];

    // Update user's cash balance
    await db.execute(
      'UPDATE users SET available_inr = available_inr + ? WHERE id = ?',
      [amount, userId]
    );

    // Get updated balance
    const [updatedBalanceRows] = await db.execute(
      'SELECT available_inr FROM users WHERE id = ?',
      [userId]
    );

    const newBalance = updatedBalanceRows[0].available_inr;

    console.log(`✅ Admin ${adminUserId} deposited ₹${amount} to user ${userId}`);

    res.json({
      success: true,
      message: 'Cash deposited successfully',
      user: targetUser,
      depositedAmount: amount,
      newBalance: newBalance
    });
  } catch (error) {
    console.error('Error depositing cash:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Withdraw Bitcoin from user account
router.post('/users/:userId/withdraw-bitcoin', authenticateToken, async (req, res) => {
  try {
    const adminUserId = req.user.id;
    const { userId } = req.params;
    const { amount } = req.body; // Amount in satoshis
    
    // Check if user is admin from database
    const [userRows] = await db.execute(
      'SELECT is_admin FROM users WHERE id = ?',
      [adminUserId]
    );
    
    if (userRows.length === 0 || !userRows[0].is_admin) {
      return res.status(403).json({ error: 'Access denied. Admin privileges required.' });
    }

    // Validate amount
    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Invalid amount' });
    }

    // Check if target user exists and has sufficient balance
    const [targetUserRows] = await db.execute(
      'SELECT id, name, email, available_btc FROM users WHERE id = ?',
      [userId]
    );

    if (targetUserRows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const targetUser = targetUserRows[0];

    // Check if user has sufficient balance
    if (targetUser.available_btc < amount) {
      return res.status(400).json({ error: 'Insufficient Bitcoin balance' });
    }

    // Update user's Bitcoin balance
    await db.execute(
      'UPDATE users SET available_btc = available_btc - ? WHERE id = ?',
      [amount, userId]
    );

    // Get updated balance
    const [updatedBalanceRows] = await db.execute(
      'SELECT available_btc FROM users WHERE id = ?',
      [userId]
    );

    const newBalance = updatedBalanceRows[0].available_btc;

    console.log(`✅ Admin ${adminUserId} withdrew ${amount} satoshis from user ${userId}`);

    res.json({
      success: true,
      message: 'Bitcoin withdrawn successfully',
      user: { id: targetUser.id, name: targetUser.name, email: targetUser.email },
      withdrawnAmount: amount,
      newBalance: newBalance
    });
  } catch (error) {
    console.error('Error withdrawing Bitcoin:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Withdraw cash from user account
router.post('/users/:userId/withdraw-cash', authenticateToken, async (req, res) => {
  try {
    const adminUserId = req.user.id;
    const { userId } = req.params;
    const { amount } = req.body; // Amount in rupees
    
    // Check if user is admin from database
    const [userRows] = await db.execute(
      'SELECT is_admin FROM users WHERE id = ?',
      [adminUserId]
    );
    
    if (userRows.length === 0 || !userRows[0].is_admin) {
      return res.status(403).json({ error: 'Access denied. Admin privileges required.' });
    }

    // Validate amount
    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Invalid amount' });
    }

    // Check if target user exists and has sufficient balance
    const [targetUserRows] = await db.execute(
      'SELECT id, name, email, available_inr FROM users WHERE id = ?',
      [userId]
    );

    if (targetUserRows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const targetUser = targetUserRows[0];

    // Check if user has sufficient balance
    if (targetUser.available_inr < amount) {
      return res.status(400).json({ error: 'Insufficient cash balance' });
    }

    // Update user's cash balance
    await db.execute(
      'UPDATE users SET available_inr = available_inr - ? WHERE id = ?',
      [amount, userId]
    );

    // Get updated balance
    const [updatedBalanceRows] = await db.execute(
      'SELECT available_inr FROM users WHERE id = ?',
      [userId]
    );

    const newBalance = updatedBalanceRows[0].available_inr;

    console.log(`✅ Admin ${adminUserId} withdrew ₹${amount} from user ${userId}`);

    res.json({
      success: true,
      message: 'Cash withdrawn successfully',
      user: { id: targetUser.id, name: targetUser.name, email: targetUser.email },
      withdrawnAmount: amount,
      newBalance: newBalance
    });
  } catch (error) {
    console.error('Error withdrawing cash:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;

const express = require('express');
const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');
const { authenticateToken } = require('../middleware/auth');
const logger = require('../utils/logger');

const router = express.Router();

// Database connection
let db;

async function initDB() {
  try {
    db = await mysql.createConnection(require('../config/config').database);
    logger.success('Admin routes: Database connected', 'ADMIN');
  } catch (error) {
    logger.error('Admin routes: Database connection failed', error, 'ADMIN');
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
      `SELECT t.id, t.user_id, t.type, t.status, t.btc_amount, t.inr_amount, t.execution_price, t.created_at, t.executed_at,
              u.name as user_name, u.email as user_email
       FROM transactions t
       JOIN users u ON t.user_id = u.id
       WHERE (u.is_admin = false OR u.is_admin IS NULL)
       ORDER BY t.created_at DESC 
       LIMIT 1000`
    );

    res.json({ 
      transactions
    });
  } catch (error) {
    logger.error('Error fetching all transactions', error, 'ADMIN');
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
      `SELECT ap.id, ap.user_id, ap.plan_type, ap.status, ap.frequency, ap.amount_per_execution_inr, ap.amount_per_execution_btc, 
              ap.next_execution_at, ap.total_executions, ap.remaining_executions, ap.max_price, ap.min_price, 
              ap.created_at, ap.completed_at
       FROM active_plans ap
       JOIN users u ON ap.user_id = u.id
       WHERE (u.is_admin = false OR u.is_admin IS NULL)
       ORDER BY ap.created_at DESC`
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
    logger.error('Error fetching all DCA plans', error, 'ADMIN');
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get total balance across all non-admin users
router.get('/total-balance', authenticateToken, async (req, res) => {
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

    // Get total balance for all non-admin users
    const [balanceRows] = await db.execute(
      `SELECT 
         SUM(available_inr) as total_available_inr,
         SUM(available_btc) as total_available_btc,
         SUM(reserved_inr) as total_reserved_inr,
         SUM(reserved_btc) as total_reserved_btc,
         SUM(collateral_btc) as total_collateral_btc,
         SUM(borrowed_inr) as total_borrowed_inr,
         SUM(interest_accrued) as total_interest_accrued
       FROM users 
       WHERE is_admin = false OR is_admin IS NULL`
    );

    const result = balanceRows[0] || {
      total_available_inr: 0,
      total_available_btc: 0,
      total_reserved_inr: 0,
      total_reserved_btc: 0,
      total_collateral_btc: 0,
      total_borrowed_inr: 0,
      total_interest_accrued: 0
    };

    // Convert nulls to 0
    Object.keys(result).forEach(key => {
      if (result[key] === null) {
        result[key] = 0;
      }
    });

    res.json(result);
  } catch (error) {
    logger.error('Error fetching admin total balance', error, 'ADMIN');
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
              available_inr + reserved_inr + borrowed_inr as inrBalance,
              available_btc + reserved_btc + collateral_btc as btcBalance,
              is_admin,
              created_at
       FROM users 
       ORDER BY created_at DESC`
    );

    res.json({ 
      users
    });
  } catch (error) {
    logger.error('Error fetching all users', error, 'ADMIN');
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete user
router.delete('/users/:userId', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { userId: targetUserId } = req.params;

    // Check if user is admin from database
    const [userRows] = await db.execute(
      'SELECT is_admin FROM users WHERE id = ?',
      [userId]
    );

    if (userRows.length === 0 || !userRows[0].is_admin) {
      return res.status(403).json({ error: 'Access denied. Admin privileges required.' });
    }

    // Check if target user exists
    const [targetUserRows] = await db.execute(
      'SELECT is_admin FROM users WHERE id = ?',
      [targetUserId]
    );

    if (targetUserRows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const isTargetAdmin = targetUserRows[0].is_admin;

    // Start transaction to ensure all deletions are atomic
    await db.beginTransaction();

    try {
      // First, delete all user's DCA plans
      const [deletedPlansResult] = await db.execute(
        'DELETE FROM active_plans WHERE user_id = ?',
        [targetUserId]
      );

      // Then, delete all user's transactions
      const [deletedTransactionsResult] = await db.execute(
        'DELETE FROM transactions WHERE user_id = ?',
        [targetUserId]
      );

      // Finally, delete the user (or just clear balances for admins)
      let deletedUserResult;
      if (isTargetAdmin) {
        // For admins: Clear all balances but keep the user record
        deletedUserResult = await db.execute(
          `UPDATE users SET 
           available_btc = 0, 
           available_inr = 0, 
           reserved_btc = 0, 
           reserved_inr = 0, 
           collateral_btc = 0, 
           borrowed_inr = 0, 
           interest_accrued = 0
           WHERE id = ?`,
          [targetUserId]
        );
      } else {
        // For regular users: Complete deletion
        deletedUserResult = await db.execute(
          'DELETE FROM users WHERE id = ?',
          [targetUserId]
        );
      }

      // Commit the transaction
      await db.commit();

      const actionType = isTargetAdmin ? 'cleared' : 'deleted';
      logger.success(`User ${targetUserId} ${actionType} with cleanup`, 'ADMIN', `plans: ${deletedPlansResult.affectedRows}, transactions: ${deletedTransactionsResult.affectedRows}`);

      // Send admin user update via WebSocket
      if (global.sendAdminUserUpdate) {
        await global.sendAdminUserUpdate();
      }

      res.json({
        success: true,
        message: isTargetAdmin 
          ? 'Admin user data cleared successfully (account preserved)'
          : 'User and all associated data deleted successfully',
        deletedData: {
          plans: deletedPlansResult.affectedRows,
          transactions: deletedTransactionsResult.affectedRows,
          userAction: isTargetAdmin ? 'balances_cleared' : 'deleted'
        }
      });
    } catch (error) {
      // Rollback transaction on error
      await db.rollback();
      throw error;
    }
  } catch (error) {
    logger.error('Error deleting user', error, 'ADMIN');
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

    // Create transaction record for the deposit
    await db.execute(
      `INSERT INTO transactions (user_id, type, status, btc_amount, inr_amount, execution_price, created_at, executed_at)
       VALUES (?, 'DEPOSIT_BTC', 'EXECUTED', ?, 0, 0, UTC_TIMESTAMP(), UTC_TIMESTAMP())`,
      [userId, amount]
    );

    // Get updated balance
    const [updatedBalanceRows] = await db.execute(
      'SELECT available_btc FROM users WHERE id = ?',
      [userId]
    );

    const newBalance = updatedBalanceRows[0].available_btc;

    logger.transaction('DEPOSIT_BTC', userId, `${amount} sats`, 'EXECUTED', `by admin ${adminUserId}`);

    // Broadcast balance update to user's connected clients
    if (global.sendUserBalanceUpdate) {
      await global.sendUserBalanceUpdate(userId);
    }

    // Broadcast transaction update to user's connected clients
    if (global.sendUserTransactionUpdate) {
      await global.sendUserTransactionUpdate(userId);
    }

    // Send admin user update via WebSocket
    if (global.sendAdminUserUpdate) {
      await global.sendAdminUserUpdate();
    }

    // Send admin transaction update via WebSocket
    if (global.sendAdminTransactionUpdate) {
      await global.sendAdminTransactionUpdate();
    }

    res.json({
      success: true,
      message: 'Bitcoin deposited successfully',
      user: targetUser,
      depositedAmount: amount,
      newBalance: newBalance
    });
  } catch (error) {
    logger.error('Error depositing Bitcoin', error, 'ADMIN');
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

    // Create transaction record for the deposit
    await db.execute(
      `INSERT INTO transactions (user_id, type, status, btc_amount, inr_amount, execution_price, created_at, executed_at)
       VALUES (?, 'DEPOSIT_INR', 'EXECUTED', 0, ?, 0, UTC_TIMESTAMP(), UTC_TIMESTAMP())`,
      [userId, amount]
    );

    // Get updated balance
    const [updatedBalanceRows] = await db.execute(
      'SELECT available_inr FROM users WHERE id = ?',
      [userId]
    );

    const newBalance = updatedBalanceRows[0].available_inr;

    logger.transaction('DEPOSIT_INR', userId, `₹${amount}`, 'EXECUTED', `by admin ${adminUserId}`);

    // Broadcast balance update to user's connected clients
    if (global.sendUserBalanceUpdate) {
      await global.sendUserBalanceUpdate(userId);
    }

    // Broadcast transaction update to user's connected clients
    if (global.sendUserTransactionUpdate) {
      await global.sendUserTransactionUpdate(userId);
    }

    // Send admin user update via WebSocket
    if (global.sendAdminUserUpdate) {
      await global.sendAdminUserUpdate();
    }

    // Send admin transaction update via WebSocket
    if (global.sendAdminTransactionUpdate) {
      await global.sendAdminTransactionUpdate();
    }

    res.json({
      success: true,
      message: 'Cash deposited successfully',
      user: targetUser,
      depositedAmount: amount,
      newBalance: newBalance
    });
  } catch (error) {
    logger.error('Error depositing cash', error, 'ADMIN');
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

    // Create transaction record for the withdrawal
    await db.execute(
      `INSERT INTO transactions (user_id, type, status, btc_amount, inr_amount, execution_price, created_at, executed_at)
       VALUES (?, 'WITHDRAW_BTC', 'EXECUTED', ?, 0, 0, UTC_TIMESTAMP(), UTC_TIMESTAMP())`,
      [userId, amount]
    );

    // Get updated balance
    const [updatedBalanceRows] = await db.execute(
      'SELECT available_btc FROM users WHERE id = ?',
      [userId]
    );

    const newBalance = updatedBalanceRows[0].available_btc;

    logger.transaction('WITHDRAW_BTC', userId, `${amount} sats`, 'EXECUTED', `by admin ${adminUserId}`);

    // Broadcast balance update to user's connected clients
    if (global.sendUserBalanceUpdate) {
      await global.sendUserBalanceUpdate(userId);
    }

    // Broadcast transaction update to user's connected clients
    if (global.sendUserTransactionUpdate) {
      await global.sendUserTransactionUpdate(userId);
    }

    // Send admin user update via WebSocket
    if (global.sendAdminUserUpdate) {
      await global.sendAdminUserUpdate();
    }

    // Send admin transaction update via WebSocket
    if (global.sendAdminTransactionUpdate) {
      await global.sendAdminTransactionUpdate();
    }

    res.json({
      success: true,
      message: 'Bitcoin withdrawn successfully',
      user: { id: targetUser.id, name: targetUser.name, email: targetUser.email },
      withdrawnAmount: amount,
      newBalance: newBalance
    });
  } catch (error) {
    logger.error('Error withdrawing Bitcoin', error, 'ADMIN');
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get admin metrics
router.get('/metrics', authenticateToken, async (req, res) => {
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

    // Get total trades count (excluding admin users)
    const [tradesCountRows] = await db.execute(
      `SELECT COUNT(*) as total_trades 
       FROM transactions t
       JOIN users u ON t.user_id = u.id
       WHERE t.status = 'EXECUTED' AND (u.is_admin = false OR u.is_admin IS NULL)`
    );

    // Get total volume (sum of all executed INR amounts, excluding admin users)
    const [totalVolumeRows] = await db.execute(
      `SELECT SUM(t.inr_amount) as total_volume 
       FROM transactions t
       JOIN users u ON t.user_id = u.id
       WHERE t.status = 'EXECUTED' AND (u.is_admin = false OR u.is_admin IS NULL)`
    );

    // Get buy volume (sum of all executed buy transactions, excluding admin users)
    const [buyVolumeRows] = await db.execute(
      `SELECT SUM(t.inr_amount) as buy_volume 
       FROM transactions t
       JOIN users u ON t.user_id = u.id
       WHERE t.status = 'EXECUTED' 
       AND t.type IN ('MARKET_BUY', 'LIMIT_BUY', 'DCA_BUY')
       AND (u.is_admin = false OR u.is_admin IS NULL)`
    );

    // Get sell volume (sum of all executed sell transactions, excluding admin users)
    const [sellVolumeRows] = await db.execute(
      `SELECT SUM(t.inr_amount) as sell_volume 
       FROM transactions t
       JOIN users u ON t.user_id = u.id
       WHERE t.status = 'EXECUTED' 
       AND t.type IN ('MARKET_SELL', 'LIMIT_SELL', 'DCA_SELL')
       AND (u.is_admin = false OR u.is_admin IS NULL)`
    );

    // Get total active DCA plans (excluding admin users)
    const [activeDCAPlansRows] = await db.execute(
      `SELECT COUNT(*) as active_dca_plans 
       FROM active_plans ap
       JOIN users u ON ap.user_id = u.id
       WHERE ap.status = 'ACTIVE' AND (u.is_admin = false OR u.is_admin IS NULL)`
    );

    // Get average daily DCA amount (only from active DCA plans with INR amounts, excluding admin users)
    const [avgDCAAmountRows] = await db.execute(
      `SELECT 
         AVG(CASE 
           WHEN ap.frequency = 'DAILY' THEN ap.amount_per_execution_inr
           WHEN ap.frequency = 'WEEKLY' THEN ap.amount_per_execution_inr / 7
           WHEN ap.frequency = 'MONTHLY' THEN ap.amount_per_execution_inr / 30
           WHEN ap.frequency = 'HOURLY' THEN ap.amount_per_execution_inr * 24
           ELSE 0
         END) as avg_daily_dca_amount
       FROM active_plans ap
       JOIN users u ON ap.user_id = u.id
       WHERE ap.status = 'ACTIVE' 
       AND ap.plan_type = 'DCA_BUY' 
       AND ap.amount_per_execution_inr IS NOT NULL
       AND (u.is_admin = false OR u.is_admin IS NULL)`
    );

    const metrics = {
      total_trades: tradesCountRows[0]?.total_trades || 0,
      total_volume: totalVolumeRows[0]?.total_volume || 0,
      buy_volume: buyVolumeRows[0]?.buy_volume || 0,
      sell_volume: sellVolumeRows[0]?.sell_volume || 0,
      active_dca_plans: activeDCAPlansRows[0]?.active_dca_plans || 0,
      avg_daily_dca_amount: Math.round(avgDCAAmountRows[0]?.avg_daily_dca_amount || 0)
    };

    res.json(metrics);
  } catch (error) {
    logger.error('Error fetching admin metrics', error, 'ADMIN');
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

    // Create transaction record for the withdrawal
    await db.execute(
      `INSERT INTO transactions (user_id, type, status, btc_amount, inr_amount, execution_price, created_at, executed_at)
       VALUES (?, 'WITHDRAW_INR', 'EXECUTED', 0, ?, 0, UTC_TIMESTAMP(), UTC_TIMESTAMP())`,
      [userId, amount]
    );

    // Get updated balance
    const [updatedBalanceRows] = await db.execute(
      'SELECT available_inr FROM users WHERE id = ?',
      [userId]
    );

    const newBalance = updatedBalanceRows[0].available_inr;

    logger.transaction('WITHDRAW_INR', userId, `₹${amount}`, 'EXECUTED', `by admin ${adminUserId}`);

    // Broadcast balance update to user's connected clients
    if (global.sendUserBalanceUpdate) {
      await global.sendUserBalanceUpdate(userId);
    }

    // Broadcast transaction update to user's connected clients
    if (global.sendUserTransactionUpdate) {
      await global.sendUserTransactionUpdate(userId);
    }

    // Send admin user update via WebSocket
    if (global.sendAdminUserUpdate) {
      await global.sendAdminUserUpdate();
    }

    // Send admin transaction update via WebSocket
    if (global.sendAdminTransactionUpdate) {
      await global.sendAdminTransactionUpdate();
    }

    res.json({
      success: true,
      message: 'Cash withdrawn successfully',
      user: { id: targetUser.id, name: targetUser.name, email: targetUser.email },
      withdrawnAmount: amount,
      newBalance: newBalance
    });
  } catch (error) {
    logger.error('Error withdrawing cash', error, 'ADMIN');
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Change user password (admin only)
router.put('/users/:userId/password', authenticateToken, async (req, res) => {
  try {
    const adminUserId = req.user.id;
    const { userId } = req.params;
    const { password } = req.body;
    
    // Check if user is admin from database
    const [userRows] = await db.execute(
      'SELECT is_admin FROM users WHERE id = ?',
      [adminUserId]
    );
    
    if (userRows.length === 0 || !userRows[0].is_admin) {
      return res.status(403).json({ error: 'Access denied. Admin privileges required.' });
    }

    // Validate password
    if (!password || password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long' });
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

    // Hash the new password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Update user's password
    await db.execute(
      'UPDATE users SET password_hash = ? WHERE id = ?',
      [hashedPassword, userId]
    );

    logger.success(`Password changed for user ${userId} by admin ${adminUserId}`, 'ADMIN', targetUser.name);

    res.json({
      success: true,
      message: 'Password changed successfully',
      user: targetUser
    });
  } catch (error) {
    logger.error('Error changing user password', error, 'ADMIN');
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get settings (admin only)
router.get('/settings', authenticateToken, async (req, res) => {
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

    // Get all settings
    const [settings] = await db.execute(
      'SELECT `key`, value, updated_at FROM settings ORDER BY `key`'
    );

    // Convert to object for easier use
    const settingsObj = {};
    settings.forEach(setting => {
      settingsObj[setting.key] = {
        value: setting.value,
        updated_at: setting.updated_at
      };
    });

    res.json(settingsObj);
  } catch (error) {
    logger.error('Error fetching settings', error, 'ADMIN');
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update settings (admin only)
router.put('/settings', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { settings } = req.body; // Expected format: { key: value, key2: value2 }
    
    // Check if user is admin from database
    const [userRows] = await db.execute(
      'SELECT is_admin FROM users WHERE id = ?',
      [userId]
    );
    
    if (userRows.length === 0 || !userRows[0].is_admin) {
      return res.status(403).json({ error: 'Access denied. Admin privileges required.' });
    }

    if (!settings || typeof settings !== 'object') {
      return res.status(400).json({ error: 'Settings object is required' });
    }

    // Update each setting
    const updatedSettings = {};
    for (const [key, value] of Object.entries(settings)) {
      // Validate value is a number for these settings
      if (!['buy_multiplier', 'sell_multiplier', 'loan_interest_rate'].includes(key)) {
        continue; // Skip unknown settings
      }
      
      const numValue = Number(value);
      if (isNaN(numValue) || numValue <= 0) {
        return res.status(400).json({ error: `Invalid value for ${key}. Must be a positive number.` });
      }

      // Update or insert setting
      await db.execute(
        'INSERT INTO settings (`key`, value) VALUES (?, ?) ON DUPLICATE KEY UPDATE value = VALUES(value), updated_at = CURRENT_TIMESTAMP',
        [key, numValue]
      );
      
      updatedSettings[key] = numValue;
    }

    logger.success(`Settings updated by admin ${userId}`, 'ADMIN', JSON.stringify(updatedSettings));

    // Reload settings in DataService to update cached multipliers
    if (global.dataService && global.dataService.reloadSettings) {
      await global.dataService.reloadSettings();
      logger.debug('DataService settings reloaded', 'ADMIN');
    }

    res.json({
      success: true,
      message: 'Settings updated successfully',
      updatedSettings
    });
  } catch (error) {
    logger.error('Error updating settings', error, 'ADMIN');
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Reverse transaction (admin only)
router.post('/transactions/:transactionId/reverse', authenticateToken, async (req, res) => {
  try {
    const adminUserId = req.user.id;
    const { transactionId } = req.params;
    
    // Check if user is admin from database
    const [userRows] = await db.execute(
      'SELECT is_admin FROM users WHERE id = ?',
      [adminUserId]
    );
    
    if (userRows.length === 0 || !userRows[0].is_admin) {
      return res.status(403).json({ error: 'Access denied. Admin privileges required.' });
    }

    // Start database transaction for atomicity
    await db.beginTransaction();

    try {
      // Get the transaction details
      const [transactionRows] = await db.execute(
        `SELECT t.id, t.user_id, t.type, t.status, t.btc_amount, t.inr_amount, 
                t.execution_price, t.created_at, t.executed_at, u.name as user_name
         FROM transactions t
         JOIN users u ON t.user_id = u.id
         WHERE t.id = ?`,
        [transactionId]
      );

      if (transactionRows.length === 0) {
        await db.rollback();
        return res.status(404).json({ error: 'Transaction not found' });
      }

      const transaction = transactionRows[0];

      // Check if transaction can be reversed (only executed transactions)
      if (transaction.status !== 'EXECUTED') {
        await db.rollback();
        return res.status(400).json({ error: 'Only executed transactions can be reversed' });
      }

      // Calculate balance adjustments based on transaction type
      let btcAdjustment = 0;
      let inrAdjustment = 0;

      switch (transaction.type) {
        case 'MARKET_BUY':
        case 'LIMIT_BUY':
        case 'DCA_BUY':
          // Reverse buy: remove BTC, add INR back
          btcAdjustment = -transaction.btc_amount;
          inrAdjustment = transaction.inr_amount;
          break;
          
        case 'MARKET_SELL':
        case 'LIMIT_SELL':
        case 'DCA_SELL':
          // Reverse sell: add BTC back, remove INR
          btcAdjustment = transaction.btc_amount;
          inrAdjustment = -transaction.inr_amount;
          break;
          
        case 'DEPOSIT_INR':
          // Reverse INR deposit: remove INR
          inrAdjustment = -transaction.inr_amount;
          break;
          
        case 'DEPOSIT_BTC':
          // Reverse BTC deposit: remove BTC
          btcAdjustment = -transaction.btc_amount;
          break;
          
        case 'WITHDRAW_INR':
          // Reverse INR withdrawal: add INR back
          inrAdjustment = transaction.inr_amount;
          break;
          
        case 'WITHDRAW_BTC':
          // Reverse BTC withdrawal: add BTC back
          btcAdjustment = transaction.btc_amount;
          break;
          
        case 'LOAN_BORROW':
          // Reverse loan borrow: remove borrowed INR, add collateral BTC back
          inrAdjustment = -transaction.inr_amount;
          // Note: This might need more complex logic for collateral handling
          break;
          
        case 'LOAN_REPAY':
          // Reverse loan repayment: add repaid INR back, remove freed collateral
          inrAdjustment = transaction.inr_amount;
          // Note: This might need more complex logic for collateral handling
          break;
          
        case 'INTEREST_ACCRUAL':
          // Reverse interest: remove accrued interest
          inrAdjustment = -transaction.inr_amount;
          break;
          
        default:
          await db.rollback();
          return res.status(400).json({ error: `Transaction type '${transaction.type}' cannot be reversed` });
      }

      // Get current user balance to check if reversal is possible
      const [balanceRows] = await db.execute(
        'SELECT available_btc, available_inr FROM users WHERE id = ?',
        [transaction.user_id]
      );

      if (balanceRows.length === 0) {
        await db.rollback();
        return res.status(404).json({ error: 'User not found' });
      }

      const currentBalance = balanceRows[0];
      const newBtcBalance = currentBalance.available_btc + btcAdjustment;
      const newInrBalance = currentBalance.available_inr + inrAdjustment;

      // Check if user would have negative balance after reversal
      if (newBtcBalance < 0 || newInrBalance < 0) {
        await db.rollback();
        return res.status(400).json({ 
          error: 'Cannot reverse transaction: would result in negative balance',
          details: {
            currentBtc: currentBalance.available_btc,
            currentInr: currentBalance.available_inr,
            btcAdjustment,
            inrAdjustment,
            resultingBtc: newBtcBalance,
            resultingInr: newInrBalance
          }
        });
      }

      // Update user balance
      await db.execute(
        'UPDATE users SET available_btc = available_btc + ?, available_inr = available_inr + ? WHERE id = ?',
        [btcAdjustment, inrAdjustment, transaction.user_id]
      );

      // Delete the transaction
      const [deleteResult] = await db.execute(
        'DELETE FROM transactions WHERE id = ?',
        [transactionId]
      );

      if (deleteResult.affectedRows === 0) {
        await db.rollback();
        return res.status(500).json({ error: 'Failed to delete transaction' });
      }

      // Commit the transaction
      await db.commit();

      logger.success(`Transaction ${transactionId} reversed by admin ${adminUserId}`, 'ADMIN', `user: ${transaction.user_name}, type: ${transaction.type}, BTC adj: ${btcAdjustment}, INR adj: ${inrAdjustment}`);

      // Broadcast balance update to user's connected clients
      if (global.sendUserBalanceUpdate) {
        await global.sendUserBalanceUpdate(transaction.user_id);
      }

      // Broadcast transaction update to user's connected clients
      if (global.sendUserTransactionUpdate) {
        await global.sendUserTransactionUpdate(transaction.user_id);
      }

      // Send admin user update via WebSocket
      if (global.sendAdminUserUpdate) {
        await global.sendAdminUserUpdate();
      }

      res.json({
        success: true,
        message: 'Transaction reversed successfully',
        reversedTransaction: {
          id: transaction.id,
          type: transaction.type,
          user_name: transaction.user_name,
          btc_amount: transaction.btc_amount,
          inr_amount: transaction.inr_amount
        },
        balanceAdjustment: {
          btc: btcAdjustment,
          inr: inrAdjustment
        }
      });
    } catch (error) {
      // Rollback transaction on error
      await db.rollback();
      throw error;
    }
  } catch (error) {
    logger.error('Error reversing transaction', error, 'ADMIN');
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;

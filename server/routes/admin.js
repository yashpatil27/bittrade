const express = require('express');
const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');
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
      `SELECT t.id, t.user_id, t.type, t.status, t.btc_amount, t.inr_amount, t.execution_price, t.created_at, t.executed_at 
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
    console.error('Error fetching all DCA plans:', error);
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
    console.error('Error fetching admin total balance:', error);
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
              is_admin,
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
      console.log(`✅ User ${targetUserId} ${actionType} with cleanup:`, {
        deletedPlans: deletedPlansResult.affectedRows,
        deletedTransactions: deletedTransactionsResult.affectedRows,
        userAction: isTargetAdmin ? 'balances_cleared' : 'deleted',
        affectedRows: deletedUserResult.affectedRows
      });

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
    console.error('Error deleting user:', error);
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

    console.log(`✅ Admin ${adminUserId} deposited ${amount} satoshis to user ${userId} (transaction created)`);

    // Broadcast balance update to user's connected clients
    if (global.sendUserBalanceUpdate) {
      await global.sendUserBalanceUpdate(userId);
    }

    // Broadcast transaction update to user's connected clients
    if (global.sendUserTransactionUpdate) {
      await global.sendUserTransactionUpdate(userId);
    }

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

    console.log(`✅ Admin ${adminUserId} deposited ₹${amount} to user ${userId} (transaction created)`);

    // Broadcast balance update to user's connected clients
    if (global.sendUserBalanceUpdate) {
      await global.sendUserBalanceUpdate(userId);
    }

    // Broadcast transaction update to user's connected clients
    if (global.sendUserTransactionUpdate) {
      await global.sendUserTransactionUpdate(userId);
    }

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

    console.log(`✅ Admin ${adminUserId} withdrew ${amount} satoshis from user ${userId} (transaction created)`);

    // Broadcast balance update to user's connected clients
    if (global.sendUserBalanceUpdate) {
      await global.sendUserBalanceUpdate(userId);
    }

    // Broadcast transaction update to user's connected clients
    if (global.sendUserTransactionUpdate) {
      await global.sendUserTransactionUpdate(userId);
    }

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
    console.error('Error fetching admin metrics:', error);
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

    console.log(`✅ Admin ${adminUserId} withdrew ₹${amount} from user ${userId} (transaction created)`);

    // Broadcast balance update to user's connected clients
    if (global.sendUserBalanceUpdate) {
      await global.sendUserBalanceUpdate(userId);
    }

    // Broadcast transaction update to user's connected clients
    if (global.sendUserTransactionUpdate) {
      await global.sendUserTransactionUpdate(userId);
    }

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

    console.log(`✅ Admin ${adminUserId} changed password for user ${userId} (${targetUser.name})`);

    res.json({
      success: true,
      message: 'Password changed successfully',
      user: targetUser
    });
  } catch (error) {
    console.error('Error changing user password:', error);
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
    console.error('Error fetching settings:', error);
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

    console.log(`✅ Admin ${userId} updated settings:`, updatedSettings);

    // Reload settings in DataService to update cached multipliers
    if (global.dataService && global.dataService.reloadSettings) {
      await global.dataService.reloadSettings();
      console.log('🔄 DataService settings reloaded');
    }

    res.json({
      success: true,
      message: 'Settings updated successfully',
      updatedSettings
    });
  } catch (error) {
    console.error('Error updating settings:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;

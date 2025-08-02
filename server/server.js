const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');
const { createServer } = require('http');
const { Server } = require('socket.io');
const config = require('./config/config');
const DataService = require('./services/data-service');
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/user');
const adminRoutes = require('./routes/admin');
const { authenticateToken, optionalAuth } = require('./middleware/auth');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Database connection
let db;

// Initialize database connection
async function initDB() {
  try {
    db = await mysql.createConnection(config.database);
    console.log('Database connected for API server');
  } catch (error) {
    console.error('Database connection failed:', error);
    process.exit(1);
  }
}

// Authentication Routes
app.use('/api/auth', authRoutes);

// User Profile Routes
app.use('/api/user', userRoutes);

// Admin Routes
app.use('/api/admin', adminRoutes);

// API Routes

// Get current Bitcoin data (with Redis cache fallback)
app.get('/api/bitcoin/current', async (req, res) => {
  try {
    // Try Redis cache first for instant response
    if (global.dataService && global.dataService.redis) {
      try {
        const cachedPrice = await global.dataService.redis.get('latest_btc_price');
        if (cachedPrice) {
          const bitcoinData = JSON.parse(cachedPrice);
          const rates = global.dataService.calculateRates(bitcoinData.btc_usd_price);
          
          return res.json({
            ...bitcoinData,
            buy_rate_inr: rates.buy_rate_inr,
            sell_rate_inr: rates.sell_rate_inr,
            cached: true
          });
        }
      } catch (redisError) {
        console.error('Redis cache error, falling back to database:', redisError);
      }
    }
    
    // Fallback to database
    const [rows] = await db.execute(
      'SELECT * FROM bitcoin_data ORDER BY created_at DESC LIMIT 1'
    );
    
    if (rows.length === 0) {
      return res.status(404).json({ error: 'No Bitcoin data found' });
    }
    
    res.json(rows[0]);
  } catch (error) {
    console.error('Error fetching Bitcoin data:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get market rates (instant from Redis cache)
app.get('/api/market-rates', async (req, res) => {
  try {
    // Try Redis cache first for instant response
    if (global.dataService && global.dataService.redis) {
      try {
        const cachedPrice = await global.dataService.redis.get('latest_btc_price');
        if (cachedPrice) {
          const bitcoinData = JSON.parse(cachedPrice);
          const rates = global.dataService.calculateRates(bitcoinData.btc_usd_price);
          
          return res.json({
            btc_usd_price: rates.btc_usd_price,
            buy_rate_inr: rates.buy_rate_inr,
            sell_rate_inr: rates.sell_rate_inr,
            timestamp: new Date().toISOString(),
            cached: true
          });
        }
      } catch (redisError) {
        console.error('Redis cache error, falling back to database:', redisError);
      }
    }
    
    // Fallback to database
    const [rows] = await db.execute(
      'SELECT btc_usd_price FROM bitcoin_data ORDER BY created_at DESC LIMIT 1'
    );
    
    if (rows.length === 0) {
      return res.status(404).json({ error: 'No Bitcoin data found' });
    }
    
    const bitcoinData = rows[0];
    const rates = global.dataService.calculateRates(bitcoinData.btc_usd_price);
    
    res.json({
      btc_usd_price: rates.btc_usd_price,
      buy_rate_inr: rates.buy_rate_inr,
      sell_rate_inr: rates.sell_rate_inr,
      timestamp: new Date().toISOString(),
      cached: false
    });
  } catch (error) {
    console.error('Error fetching market rates:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get Bitcoin chart data (with Redis cache fallback)
app.get('/api/bitcoin/chart/:timeframe', async (req, res) => {
  try {
    const { timeframe } = req.params;
    const validTimeframes = ['1d', '7d', '30d', '90d', '365d'];
    
    if (!validTimeframes.includes(timeframe)) {
      return res.status(400).json({ error: 'Invalid timeframe' });
    }
    
    // Try Redis cache first for instant response
    if (global.dataService && global.dataService.redis) {
      try {
        const cacheKey = `chart_data_${timeframe}`;
        const cachedData = await global.dataService.redis.get(cacheKey);
        if (cachedData) {
          const chartData = JSON.parse(cachedData);
          
          // Parse price_data if it's a string
          if (chartData.price_data && typeof chartData.price_data === 'string') {
            chartData.price_data = JSON.parse(chartData.price_data);
          }
          
          console.log(`📦 Served ${timeframe} chart data from Redis cache`);
          return res.json({
            ...chartData,
            cached: true
          });
        }
      } catch (redisError) {
        console.error(`Redis cache error for ${timeframe} chart data, falling back to database:`, redisError);
      }
    }
    
    // Fallback to database
    const [rows] = await db.execute(
      'SELECT * FROM bitcoin_chart_data WHERE timeframe = ? ORDER BY last_updated DESC LIMIT 1',
      [timeframe]
    );
    
    if (rows.length === 0) {
      return res.status(404).json({ error: `No chart data found for ${timeframe}` });
    }
    
    const chartData = rows[0];
    
    // Parse price_data as JSON, but keep other fields as-is
    if (chartData.price_data && typeof chartData.price_data === 'string') {
      chartData.price_data = JSON.parse(chartData.price_data);
    }
    
    // Cache the data in Redis for future requests
    if (global.dataService && global.dataService.redis) {
      try {
        const ttlMap = {
          '1d': 3600,    // 1 hour
          '7d': 21600,   // 6 hours
          '30d': 43200,  // 12 hours
          '90d': 64800,  // 18 hours
          '365d': 86400  // 24 hours
        };
        
        const cacheKey = `chart_data_${timeframe}`;
        const ttl = ttlMap[timeframe] || 3600;
        
        // Cache the raw database data (before parsing price_data)
        const cacheData = {
          ...rows[0],  // Use original row data
          cached: true
        };
        
        await global.dataService.redis.set(cacheKey, JSON.stringify(cacheData), 'EX', ttl);
        console.log(`📦 Cached ${timeframe} chart data from database request (TTL: ${ttl}s)`);
      } catch (redisError) {
        console.error(`Error caching ${timeframe} chart data:`, redisError);
      }
    }
    
    console.log(`🗄️ Served ${timeframe} chart data from database`);
    res.json({
      ...chartData,
      cached: false
    });
  } catch (error) {
    console.error('Error fetching chart data:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get Bitcoin sentiment data
app.get('/api/bitcoin/sentiment', async (req, res) => {
  try {
    const [rows] = await db.execute(
      'SELECT * FROM bitcoin_sentiment ORDER BY data_date DESC LIMIT 1'
    );
    
    if (rows.length === 0) {
      return res.status(404).json({ error: 'No sentiment data found' });
    }
    
    res.json(rows[0]);
  } catch (error) {
    console.error('Error fetching sentiment data:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get recent Bitcoin data history
app.get('/api/bitcoin/history', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const [rows] = await db.execute(
      'SELECT * FROM bitcoin_data ORDER BY created_at DESC LIMIT ?',
      [limit]
    );
    
    res.json(rows);
  } catch (error) {
    console.error('Error fetching Bitcoin history:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    server: 'BitTrade API Server'
  });
});

// Get all user transactions (real data from database with Redis caching)
app.get('/api/transactions', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const limit = parseInt(req.query.limit) || 50;
    const page = parseInt(req.query.page) || 1;
    const offset = (page - 1) * limit;
    
    // Try Redis cache first for recent transactions (page 1 only)
    if (page === 1 && global.dataService && global.dataService.redis) {
      try {
        const redisKey = `user_transactions_${userId}`;
        const cachedData = await global.dataService.redis.get(redisKey);
        if (cachedData) {
          const transactionData = JSON.parse(cachedData);
          console.log('💾 Transactions served from Redis cache:', redisKey);
          
          // Send raw cached transactions data
          const transactions = transactionData.slice(0, limit).map(row => ({
            id: row.id,
            type: row.type,
            btc_amount: row.btc_amount,
            inr_amount: row.inr_amount,
            execution_price: row.execution_price,
            executed_at: row.executed_at,
            created_at: row.created_at,
            status: row.status,
            cached: true
          }));
          
          return res.json({
            transactions,
            page,
            limit,
            hasMore: transactionData.length > limit
          });
        }
      } catch (redisError) {
        console.error('Redis error, falling back to database:', redisError);
      }
    }
    
    // Fetch from database (both PENDING and EXECUTED transactions)
    const [rows] = await db.execute(
      `SELECT id, type, status, btc_amount, inr_amount, execution_price, 
              created_at, executed_at FROM transactions 
       WHERE user_id = ? AND status IN ('PENDING', 'EXECUTED') 
       ORDER BY 
         CASE WHEN status = 'PENDING' THEN 0 ELSE 1 END,
         COALESCE(executed_at, created_at) DESC, 
         created_at DESC 
       LIMIT ? OFFSET ?`,
      [userId, limit + 1, offset] // Fetch one extra to check if there are more
    );
    
    const hasMore = rows.length > limit;
    const actualTransactions = hasMore ? rows.slice(0, limit) : rows;
    
    // Send raw database transactions data
    const transactions = actualTransactions.map(row => ({
      id: row.id,
      type: row.type,
      btc_amount: row.btc_amount,
      inr_amount: row.inr_amount,
      execution_price: row.execution_price,
      executed_at: row.executed_at,
      created_at: row.created_at,
      status: row.status,
      cached: false
    }));
    
    // Cache first page results in Redis (if available)
    if (page === 1 && global.dataService && global.dataService.redis) {
      try {
        const redisKey = `user_transactions_${userId}`;
        const cacheData = actualTransactions.map(row => ({
          id: row.id,
          type: row.type,
          status: row.status,
          btc_amount: row.btc_amount,
          inr_amount: row.inr_amount,
          execution_price: row.execution_price,
          executed_at: row.executed_at,
          created_at: row.created_at
        }));
        await global.dataService.redis.set(redisKey, JSON.stringify(cacheData), 'EX', 60 * 60); // Cache for 1 hour
        console.log('💾 Transactions cached in Redis:', redisKey);
      } catch (redisError) {
        console.error('Error caching transactions in Redis:', redisError);
      }
    }
    
    res.json({
      transactions,
      page,
      limit,
      hasMore
    });
  } catch (error) {
    console.error('Error fetching transactions:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Function to handle trade execution
async function executeTrade(userId, type, btcAmount, inrAmount, price, action) {
  // Start database transaction
  await db.beginTransaction();

  try {
    // Check user balance and reserve funds for limit orders
    if (type.startsWith('LIMIT')) {
      const [balanceRows] = await db.execute(
        'SELECT available_inr, available_btc FROM users WHERE id = ?',
        [userId]
      );
      
      if (balanceRows.length === 0) {
        throw new Error('User not found');
      }
      
      const balance = balanceRows[0];
      
      // Check and reserve funds based on order type
      if (type === 'LIMIT_BUY') {
        // For limit buy: need to reserve INR
        if (balance.available_inr < inrAmount) {
          throw new Error(`Insufficient INR balance. Required: ₹${inrAmount}, Available: ₹${balance.available_inr}`);
        }
        
        // Reserve INR: move from available_inr to reserved_inr
        await db.execute(
          'UPDATE users SET available_inr = available_inr - ?, reserved_inr = reserved_inr + ? WHERE id = ?',
          [inrAmount, inrAmount, userId]
        );
        
        console.log(`💰 Reserved ₹${inrAmount} for limit buy order (User ${userId})`);
        
      } else if (type === 'LIMIT_SELL') {
        // For limit sell: need to reserve BTC
        if (balance.available_btc < btcAmount) {
          throw new Error(`Insufficient BTC balance. Required: ${btcAmount} satoshis, Available: ${balance.available_btc} satoshis`);
        }
        
        // Reserve BTC: move from available_btc to reserved_btc
        await db.execute(
          'UPDATE users SET available_btc = available_btc - ?, reserved_btc = reserved_btc + ? WHERE id = ?',
          [btcAmount, btcAmount, userId]
        );
        
        console.log(`₿ Reserved ${btcAmount} satoshis for limit sell order (User ${userId})`);
      }
    }
    
    // Insert transaction record
    const [transactionResult] = await db.execute(
      `INSERT INTO transactions (user_id, type, status, btc_amount, inr_amount, execution_price, created_at) 
       VALUES (?, ?, 'PENDING', ?, ?, ?, UTC_TIMESTAMP())`,
      [userId, type, btcAmount, inrAmount, price]
    );

    // Commit transaction
    await db.commit();

    return transactionResult.insertId;
  } catch (error) {
    // Rollback transaction on error
    await db.rollback();
    throw error;
  }
}

// Endpoint to create a trade order
app.post('/api/orders', authenticateToken, async (req, res) => {
  const userId = req.user.id;
  const { type, btc_amount, inr_amount, execution_price } = req.body;

  if (!['LIMIT_BUY', 'LIMIT_SELL', 'MARKET_BUY', 'MARKET_SELL'].includes(type)) {
    return res.status(400).json({ error: 'Invalid order type' });
  }

  try {
    const transactionId = await executeTrade(userId, type, btc_amount, inr_amount, execution_price, req.body.action);
    
    // Clear transaction cache and reload pending limit orders cache
    if (global.dataService && global.dataService.redis) {
      try {
        await global.dataService.redis.del(`user_transactions_${userId}`);
        console.log('💾 Cleared transaction cache for user:', userId);
        
        // Reload pending limit orders cache for limit orders
        if (type.startsWith('LIMIT')) {
          await global.dataService.loadPendingLimitOrdersToCache();
          console.log('🔄 Refreshed pending limit orders cache after order creation');
        }
      } catch (error) {
        console.error('Error clearing transaction cache or reloading limit orders:', error);
      }
    }
    
    // Send balance update via WebSocket (for reserved funds)
    if (global.sendUserBalanceUpdate) {
      global.sendUserBalanceUpdate(userId);
    }
    
    // Send transaction update via WebSocket
    if (global.sendUserTransactionUpdate) {
      global.sendUserTransactionUpdate(userId);
    }
    
    console.log(`✅ LIMIT order created:`, {
      userId,
      transactionId,
      type,
      btc_amount,
      inr_amount,
      execution_price
    });
    
    res.status(201).json({ transactionId, status: 'PENDING' });
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get user's DCA plans
app.get('/api/dca-plans', authenticateToken, async (req, res) => {
  const userId = req.user.id;

  try {
    const [plans] = await db.execute(
      `SELECT id, plan_type, status, frequency, amount_per_execution_inr, amount_per_execution_btc, next_execution_at, 
              total_executions, remaining_executions, max_price, min_price, created_at, completed_at
       FROM active_plans 
       WHERE user_id = ? 
       ORDER BY created_at DESC`,
      [userId]
    );

    // Get execution history for each plan
    const plansWithHistory = await Promise.all(plans.map(async (plan) => {
      const [executions] = await db.execute(
        `SELECT id, btc_amount, inr_amount, execution_price, executed_at, status
         FROM transactions 
         WHERE user_id = ? AND dca_plan_id = ? AND type = ? 
         ORDER BY executed_at DESC 
         LIMIT 10`,
        [userId, plan.id, plan.plan_type]
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
        [userId, plan.id, plan.plan_type]
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
      total_plans: plans.length,
      active_plans: plans.filter(p => p.status === 'ACTIVE').length,
      paused_plans: plans.filter(p => p.status === 'PAUSED').length
    });
  } catch (error) {
    console.error('Error fetching DCA plans:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create a new DCA plan
app.post('/api/dca-plans', authenticateToken, async (req, res) => {
  const userId = req.user.id;
  const { plan_type, frequency, amount_per_execution_inr, amount_per_execution_btc, remaining_executions, max_price, min_price } = req.body;

  if (!['DCA_BUY', 'DCA_SELL'].includes(plan_type) || !['HOURLY', 'DAILY', 'WEEKLY', 'MONTHLY'].includes(frequency)) {
    return res.status(400).json({ error: 'Invalid plan type or frequency' });
  }

  // Validate that the correct amount field is provided for each plan type
  if (plan_type === 'DCA_BUY' && (!amount_per_execution_inr || amount_per_execution_inr <= 0)) {
    return res.status(400).json({ error: 'DCA_BUY plans require a valid amount_per_execution_inr' });
  }
  
  if (plan_type === 'DCA_SELL' && (!amount_per_execution_btc || amount_per_execution_btc <= 0)) {
    return res.status(400).json({ error: 'DCA_SELL plans require a valid amount_per_execution_btc' });
  }

  try {
    // Convert undefined values to null for MySQL
    const safeRemainingExecutions = remaining_executions !== undefined ? remaining_executions : null;
    const safeMaxPrice = max_price !== undefined ? max_price : null;
    const safeMinPrice = min_price !== undefined ? min_price : null;
    const safeAmountInr = plan_type === 'DCA_BUY' ? amount_per_execution_inr : null;
    const safeAmountBtc = plan_type === 'DCA_SELL' ? amount_per_execution_btc : null;
    
    // Calculate next execution time using MySQL's date functions for timezone consistency
    let nextExecutionSQL;
    switch (frequency) {
      case 'HOURLY':
        nextExecutionSQL = 'DATE_ADD(UTC_TIMESTAMP(), INTERVAL 1 HOUR)';
        break;
      case 'DAILY':
        nextExecutionSQL = 'DATE_ADD(UTC_TIMESTAMP(), INTERVAL 1 DAY)';
        break;
      case 'WEEKLY':
        nextExecutionSQL = 'DATE_ADD(UTC_TIMESTAMP(), INTERVAL 1 WEEK)';
        break;
      case 'MONTHLY':
        nextExecutionSQL = 'DATE_ADD(UTC_TIMESTAMP(), INTERVAL 1 MONTH)';
        break;
      default:
        nextExecutionSQL = 'DATE_ADD(UTC_TIMESTAMP(), INTERVAL 1 HOUR)'; // Default to 1 hour
    }
    
    const [result] = await db.execute(
      `INSERT INTO active_plans (user_id, plan_type, status, frequency, amount_per_execution_inr, amount_per_execution_btc, next_execution_at, remaining_executions, max_price, min_price, created_at)
       VALUES (?, ?, 'ACTIVE', ?, ?, ?, ${nextExecutionSQL}, ?, ?, ?, UTC_TIMESTAMP())`,
      [userId, plan_type, frequency, safeAmountInr, safeAmountBtc, safeRemainingExecutions, safeMaxPrice, safeMinPrice]
    );
    // Send updates via WebSocket
    if (global.sendUserDCAPlansUpdate) {
      global.sendUserDCAPlansUpdate(userId);
    }

    res.status(201).json({ planId: result.insertId, message: 'DCA plan created successfully' });
  } catch (error) {
    console.error('Error creating DCA plan:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update DCA plan status (pause/resume)
app.patch('/api/dca-plans/:planId/status', authenticateToken, async (req, res) => {
  const userId = req.user.id;
  const { planId } = req.params;
  const { status } = req.body;

  if (!['ACTIVE', 'PAUSED'].includes(status)) {
    return res.status(400).json({ error: 'Invalid status. Must be ACTIVE or PAUSED' });
  }

  try {
    // If resuming a plan (ACTIVE), recalculate next execution time
    if (status === 'ACTIVE') {
      // First get the plan's frequency to calculate new next execution time
      const [planRows] = await db.execute(
        'SELECT frequency FROM active_plans WHERE id = ? AND user_id = ?',
        [planId, userId]
      );
      
      if (planRows.length === 0) {
        return res.status(404).json({ error: 'Plan not found or unauthorized' });
      }
      
      const { frequency } = planRows[0];
      
      // Calculate next execution time using MySQL's date functions for timezone consistency
      let nextExecutionSQL;
      switch (frequency) {
        case 'HOURLY':
          nextExecutionSQL = 'DATE_ADD(UTC_TIMESTAMP(), INTERVAL 1 HOUR)';
          break;
        case 'DAILY':
          nextExecutionSQL = 'DATE_ADD(UTC_TIMESTAMP(), INTERVAL 1 DAY)';
          break;
        case 'WEEKLY':
          nextExecutionSQL = 'DATE_ADD(UTC_TIMESTAMP(), INTERVAL 1 WEEK)';
          break;
        case 'MONTHLY':
          nextExecutionSQL = 'DATE_ADD(UTC_TIMESTAMP(), INTERVAL 1 MONTH)';
          break;
        default:
          nextExecutionSQL = 'DATE_ADD(UTC_TIMESTAMP(), INTERVAL 1 HOUR)'; // Default to 1 hour
      }
      
      // Update both status and next execution time
      const [result] = await db.execute(
        `UPDATE active_plans SET status = ?, next_execution_at = ${nextExecutionSQL} WHERE id = ? AND user_id = ?`,
        [status, planId, userId]
      );
      
      if (result.affectedRows === 0) {
        return res.status(404).json({ error: 'Plan not found or unauthorized' });
      }
      
      console.log(`✅ DCA plan resumed with new execution time:`, {
        userId,
        planId,
        frequency,
        status: 'ACTIVE'
      });
      
    } else {
      // For pausing, just update the status
      const [result] = await db.execute(
        'UPDATE active_plans SET status = ? WHERE id = ? AND user_id = ?',
        [status, planId, userId]
      );

      if (result.affectedRows === 0) {
        return res.status(404).json({ error: 'Plan not found or unauthorized' });
      }
      
      console.log(`✅ DCA plan paused:`, {
        userId,
        planId,
        status: 'PAUSED'
      });
    }

    // Send updates via WebSocket
    if (global.sendUserDCAPlansUpdate) {
      global.sendUserDCAPlansUpdate(userId);
    }

    res.json({ message: `Plan ${status.toLowerCase()} successfully` });
  } catch (error) {
    console.error('Error updating DCA plan status:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete DCA plan
app.delete('/api/dca-plans/:planId', authenticateToken, async (req, res) => {
  const userId = req.user.id;
  const { planId } = req.params;

  try {
    // Start database transaction
    await db.beginTransaction();

    try {
      // First, verify the plan exists and belongs to the user
      const [planRows] = await db.execute(
        'SELECT id, plan_type, status FROM active_plans WHERE id = ? AND user_id = ?',
        [planId, userId]
      );

      if (planRows.length === 0) {
        await db.rollback();
        return res.status(404).json({ error: 'Plan not found or unauthorized' });
      }

      const plan = planRows[0];

      // Delete related transactions first (to maintain referential integrity)
      const [deleteTransactionsResult] = await db.execute(
        'DELETE FROM transactions WHERE parent_id = ? AND user_id = ? AND type = ?',
        [planId, userId, plan.plan_type]
      );

      // Delete the DCA plan
      const [deletePlanResult] = await db.execute(
        'DELETE FROM active_plans WHERE id = ? AND user_id = ?',
        [planId, userId]
      );

      if (deletePlanResult.affectedRows === 0) {
        await db.rollback();
        return res.status(404).json({ error: 'Plan not found or unauthorized' });
      }

      // Commit the transaction
      await db.commit();

      console.log(`✅ DCA plan deleted:`, {
        userId,
        planId,
        planType: plan.plan_type,
        relatedTransactionsDeleted: deleteTransactionsResult.affectedRows
      });

      // Send updates via WebSocket
      if (global.sendUserDCAPlansUpdate) {
        global.sendUserDCAPlansUpdate(userId);
      }

      res.json({ 
        message: 'Plan deleted successfully',
        planId: planId,
        planType: plan.plan_type,
        relatedTransactionsDeleted: deleteTransactionsResult.affectedRows
      });

    } catch (error) {
      // Rollback transaction on error
      await db.rollback();
      throw error;
    }

  } catch (error) {
    console.error('Error deleting DCA plan:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Cancel limit order (delete pending transaction and release reserved funds)
app.delete('/api/transactions/:transactionId/cancel', authenticateToken, async (req, res) => {
  const userId = req.user.id;
  const { transactionId } = req.params;

  try {
    // Start database transaction
    await db.beginTransaction();

    try {
      // Get the transaction details to verify ownership and get amounts for fund release
      const [transactionRows] = await db.execute(
        'SELECT id, user_id, type, status, btc_amount, inr_amount FROM transactions WHERE id = ? AND user_id = ?',
        [transactionId, userId]
      );

      if (transactionRows.length === 0) {
        await db.rollback();
        return res.status(404).json({ error: 'Transaction not found or unauthorized' });
      }

      const transaction = transactionRows[0];

      // Only allow cancellation of PENDING limit orders
      if (transaction.status !== 'PENDING') {
        await db.rollback();
        return res.status(400).json({ error: 'Only pending transactions can be cancelled' });
      }

      if (!transaction.type.startsWith('LIMIT')) {
        await db.rollback();
        return res.status(400).json({ error: 'Only limit orders can be cancelled' });
      }

      // Release reserved funds based on order type
      if (transaction.type === 'LIMIT_BUY') {
        // For limit buy: release reserved INR back to available INR
        await db.execute(
          'UPDATE users SET available_inr = available_inr + ?, reserved_inr = reserved_inr - ? WHERE id = ?',
          [transaction.inr_amount, transaction.inr_amount, userId]
        );
        console.log(`💰 Released ₹${transaction.inr_amount} from cancelled limit buy order (User ${userId})`);
        
      } else if (transaction.type === 'LIMIT_SELL') {
        // For limit sell: release reserved BTC back to available BTC
        await db.execute(
          'UPDATE users SET available_btc = available_btc + ?, reserved_btc = reserved_btc - ? WHERE id = ?',
          [transaction.btc_amount, transaction.btc_amount, userId]
        );
        console.log(`₿ Released ${transaction.btc_amount} satoshis from cancelled limit sell order (User ${userId})`);
      }

      // Update transaction status to CANCELLED
      await db.execute(
        'UPDATE transactions SET status = "CANCELLED" WHERE id = ?',
        [transactionId]
      );

      // Remove from pending limit orders cache
      if (global.dataService && global.dataService.redis) {
        try {
          await global.dataService.loadPendingLimitOrdersToCache();
          console.log('🔄 Refreshed pending limit orders cache after cancellation');
        } catch (redisError) {
          console.error('Error refreshing limit orders cache:', redisError);
        }
      }

      // Commit the transaction
      await db.commit();

      // Clear user caches
      if (global.dataService && global.dataService.redis) {
        try {
          await global.dataService.redis.del(`user_transactions_${userId}`);
          await global.dataService.redis.del(`user_balance_${userId}`);
          console.log('💾 Cleared user caches after order cancellation');
        } catch (error) {
          console.error('Error clearing user caches:', error);
        }
      }

      // Send real-time updates
      if (global.sendUserBalanceUpdate) {
        global.sendUserBalanceUpdate(userId);
      }

      if (global.sendUserTransactionUpdate) {
        global.sendUserTransactionUpdate(userId);
      }

      console.log(`✅ LIMIT order cancelled:`, {
        userId,
        transactionId,
        type: transaction.type,
        btc_amount: transaction.btc_amount,
        inr_amount: transaction.inr_amount
      });

      res.json({ 
        message: 'Limit order cancelled successfully',
        transactionId: transactionId,
        type: transaction.type,
        funds_released: transaction.type === 'LIMIT_BUY' 
          ? { inr_amount: transaction.inr_amount }
          : { btc_amount: transaction.btc_amount }
      });

    } catch (error) {
      // Rollback transaction on error
      await db.rollback();
      throw error;
    }

  } catch (error) {
    console.error('Error cancelling limit order:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Execute a market trade (buy or sell)
app.post('/api/trade', authenticateToken, async (req, res) => {
  const userId = req.user.id;
  const { action, type, amount, currency, execution_price } = req.body;

  // Validate input
  if (!['buy', 'sell'].includes(action)) {
    return res.status(400).json({ error: 'Invalid action. Must be "buy" or "sell"' });
  }

  if (type !== 'market') {
    return res.status(400).json({ error: 'Only market orders are supported in this endpoint' });
  }

  if (!amount || isNaN(amount) || parseFloat(amount) <= 0) {
    return res.status(400).json({ error: 'Invalid amount' });
  }

  if (!['inr', 'btc'].includes(currency)) {
    return res.status(400).json({ error: 'Invalid currency. Must be "inr" or "btc"' });
  }

  try {
    // Get current market rates
    let marketPrice;
    if (global.dataService && global.dataService.redis) {
      try {
        const cachedPrice = await global.dataService.redis.get('latest_btc_price');
        if (cachedPrice) {
          const bitcoinData = JSON.parse(cachedPrice);
          const rates = global.dataService.calculateRates(bitcoinData.btc_usd_price);
          marketPrice = action === 'buy' ? rates.buy_rate_inr : rates.sell_rate_inr;
        }
      } catch (redisError) {
        console.error('Redis error, falling back to database for price:', redisError);
      }
    }

    // Fallback to database for market price
    if (!marketPrice) {
      const [priceRows] = await db.execute(
        'SELECT btc_usd_price FROM bitcoin_data ORDER BY created_at DESC LIMIT 1'
      );
      
      if (priceRows.length === 0) {
        return res.status(500).json({ error: 'Unable to fetch current Bitcoin price' });
      }
      
      const btcUsdPrice = priceRows[0].btc_usd_price;
      const rates = global.dataService.calculateRates(btcUsdPrice);
      marketPrice = action === 'buy' ? rates.buy_rate_inr : rates.sell_rate_inr;
    }

    // Convert amounts based on currency
    const amountFloat = parseFloat(amount);
    let btcAmount, inrAmount;
    
    if (currency === 'inr') {
      // User specified INR amount
      inrAmount = Math.round(amountFloat);
      btcAmount = Math.round((inrAmount / marketPrice) * 100000000); // Convert to satoshis
    } else {
      // User specified BTC amount (frontend sends as BTC decimal, need to convert to satoshis)
      btcAmount = Math.round(amountFloat * 100000000); // Convert BTC to satoshis
      inrAmount = Math.round((btcAmount * marketPrice) / 100000000);
    }

    // Start database transaction
    await db.beginTransaction();

    try {
      // Check user balance
      const [balanceRows] = await db.execute(
        'SELECT available_inr, available_btc FROM users WHERE id = ?',
        [userId]
      );
      
      if (balanceRows.length === 0) {
        throw new Error('User not found');
      }
      
      const balance = balanceRows[0];
      
      // Validate balance based on action
      if (action === 'buy') {
        if (balance.available_inr < inrAmount) {
          throw new Error(`Insufficient INR balance. Required: ₹${inrAmount}, Available: ₹${balance.available_inr}`);
        }
        
        // Execute buy: deduct INR, add BTC
        await db.execute(
          'UPDATE users SET available_inr = available_inr - ?, available_btc = available_btc + ? WHERE id = ?',
          [inrAmount, btcAmount, userId]
        );
        
      } else { // sell
        if (balance.available_btc < btcAmount) {
          throw new Error(`Insufficient BTC balance. Required: ${btcAmount} satoshis, Available: ${balance.available_btc} satoshis`);
        }
        
        // Execute sell: deduct BTC, add INR
        await db.execute(
          'UPDATE users SET available_btc = available_btc - ?, available_inr = available_inr + ? WHERE id = ?',
          [btcAmount, inrAmount, userId]
        );
      }
      
      // Insert transaction record
      const transactionType = action === 'buy' ? 'MARKET_BUY' : 'MARKET_SELL';
      const [transactionResult] = await db.execute(
        `INSERT INTO transactions (user_id, type, status, btc_amount, inr_amount, execution_price, executed_at, created_at) 
         VALUES (?, ?, 'EXECUTED', ?, ?, ?, UTC_TIMESTAMP(), UTC_TIMESTAMP())`,
        [userId, transactionType, btcAmount, inrAmount, marketPrice]
      );
      
      // Commit transaction
      await db.commit();
      
      // Get updated balance
      const [updatedBalanceRows] = await db.execute(
        'SELECT available_inr, available_btc, reserved_inr, reserved_btc, collateral_btc, borrowed_inr, interest_accrued FROM users WHERE id = ?',
        [userId]
      );
      
      const updatedBalance = updatedBalanceRows[0];
      
      // Clear caches
      if (global.dataService && global.dataService.redis) {
        try {
          await global.dataService.redis.del(`user_transactions_${userId}`);
          await global.dataService.redis.del(`user_balance_${userId}`);
          console.log('💾 Cleared user caches after trade execution');
        } catch (error) {
          console.error('Error clearing user caches:', error);
        }
      }
      
      // Send real-time updates
      if (global.sendUserBalanceUpdate) {
        global.sendUserBalanceUpdate(userId);
      }
      
      if (global.sendUserTransactionUpdate) {
        global.sendUserTransactionUpdate(userId);
      }
      
      console.log(`✅ MARKET ${action.toUpperCase()} executed:`, {
        userId,
        transactionId: transactionResult.insertId,
        type: transactionType,
        btc_amount: btcAmount,
        inr_amount: inrAmount,
        execution_price: marketPrice
      });
      
      // Return success response
      res.json({
        id: transactionResult.insertId,
        type: transactionType,
        action: action,
        btc_amount: btcAmount,
        inr_amount: inrAmount,
        execution_price: marketPrice,
        status: 'EXECUTED',
        timestamp: new Date().toISOString(),
        updated_balance: updatedBalance
      });
      
    } catch (error) {
      // Rollback transaction on error
      await db.rollback();
      throw error;
    }
    
  } catch (error) {
    console.error('Error executing trade:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

// Get user balance (real data with Redis caching)
app.get('/api/balance', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id; // Fixed: use 'id' instead of 'userId'
    
    // Debug logging
    console.log('🔍 Balance request - req.user:', req.user);
    console.log('🔍 Balance request - userId:', userId);
    
    if (!userId) {
      console.error('❌ UserId is undefined in balance request');
      return res.status(400).json({ error: 'User ID not found in token' });
    }
    
    // Check if Redis is available
    if (global.dataService && global.dataService.redis) {
      try {
        const redisKey = `user_balance_${userId}`;
        
        // Try to fetch balance from Redis
        const cachedData = await global.dataService.redis.get(redisKey);
        if (cachedData) {
          console.log('💾 Balance served from Redis cache:', redisKey);
          return res.json(JSON.parse(cachedData));
        }
      } catch (redisError) {
        console.error('Redis error, falling back to database:', redisError);
      }
    }
    
    // If not cached, fetch real balance data from database
    const [rows] = await db.execute(
      'SELECT available_inr, available_btc, reserved_inr, reserved_btc, collateral_btc, borrowed_inr, interest_accrued FROM users WHERE id = ?',
      [userId]
    );
    
    if (rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const balanceData = rows[0];
    
    // Cache the fetched balance in Redis (if available)
    if (global.dataService && global.dataService.redis) {
      try {
        const redisKey = `user_balance_${userId}`;
        await global.dataService.redis.set(redisKey, JSON.stringify(balanceData), 'EX', 60 * 10); // Cache for 10 minutes
        console.log('💾 Balance cached in Redis:', redisKey);
      } catch (redisError) {
        console.error('Error caching balance in Redis:', redisError);
      }
    }
    
    // Return raw satoshi values - conversions will be handled at display level
    res.json({
      available_inr: balanceData.available_inr,
      available_btc: balanceData.available_btc,
      reserved_inr: balanceData.reserved_inr,
      reserved_btc: balanceData.reserved_btc,
      collateral_btc: balanceData.collateral_btc,
      borrowed_inr: balanceData.borrowed_inr,
      interest_accrued: balanceData.interest_accrued
    });
  } catch (error) {
    console.error('Error fetching balance:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Create HTTP server and Socket.IO instance
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Store user socket mappings
const userSockets = new Map(); // userId -> Set of socket.id

// Socket.IO connection handling
io.on('connection', async (socket) => {
  console.log(`📡 Client connected: ${socket.id}`);
  
  // Handle user authentication for WebSocket
  socket.on('authenticate', async (token) => {
    try {
      const jwt = require('jsonwebtoken');
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'bittrade_secret_key_2024');
      
      socket.userId = decoded.id; // Fixed: use 'id' instead of 'userId'
      socket.userEmail = decoded.email;
      
      // Add to user socket mapping
      if (!userSockets.has(decoded.id)) {
        userSockets.set(decoded.id, new Set());
      }
      userSockets.get(decoded.id).add(socket.id);
      
      console.log(`🔐 User authenticated: ${decoded.email} (${socket.id})`);
      
      // Send initial balance data after authentication
      await sendUserBalanceUpdate(decoded.id);
      
      // Send initial transaction data after authentication
      await sendUserTransactionUpdate(decoded.id);
      
      // Send initial DCA plans data after authentication
      await sendUserDCAPlansUpdate(decoded.id);
      
      socket.emit('authentication_success', {
        message: 'WebSocket authenticated successfully',
        userId: decoded.id, // Fixed: use 'id' instead of 'userId'
        email: decoded.email
      });
      
    } catch (error) {
      console.error('WebSocket authentication failed:', error);
      socket.emit('authentication_error', {
        message: 'Authentication failed',
        error: error.message
      });
    }
  });
  
  // Send current Bitcoin data immediately upon connection
  socket.emit('connection_established', {
    message: 'Connected to BitTrade WebSocket',
    timestamp: new Date().toISOString()
  });
  
  // Send cached Bitcoin price immediately if available
  if (global.dataService && global.dataService.redis) {
    try {
      const cachedPrice = await global.dataService.redis.get('latest_btc_price');
      if (cachedPrice) {
        const bitcoinData = JSON.parse(cachedPrice);
        const rates = global.dataService.calculateRates(bitcoinData.btc_usd_price);
        
        socket.emit('btc_price_update', {
          btc_usd_price: rates.btc_usd_price,
          buy_rate_inr: rates.buy_rate_inr,
          sell_rate_inr: rates.sell_rate_inr,
          timestamp: new Date().toISOString()
        });
        
        console.log(`🔄 Sent cached Bitcoin price to ${socket.id}: $${bitcoinData.btc_usd_price}`);
      }
    } catch (error) {
      console.error('Error sending cached price to client:', error);
    }
  }
  
  // Handle client disconnect
  socket.on('disconnect', (reason) => {
    console.log(`📡 Client disconnected: ${socket.id} (${reason})`);
    
    // Clean up user socket mapping
    if (socket.userId) {
      const userSocketSet = userSockets.get(socket.userId);
      if (userSocketSet) {
        userSocketSet.delete(socket.id);
        if (userSocketSet.size === 0) {
          userSockets.delete(socket.userId);
        }
      }
    }
  });
  
  // Handle client errors
  socket.on('error', (error) => {
    console.error(`📡 Socket error for ${socket.id}:`, error);
  });
});

// Function to send balance update to specific user
async function sendUserBalanceUpdate(userId) {
  try {
    // Validate userId
    if (!userId) {
      console.error('❌ sendUserBalanceUpdate: userId is undefined');
      return;
    }
    
    console.log(`🔍 Sending balance update for userId: ${userId}`);
    
    // Fetch balance data from database
    const [rows] = await db.execute(
      'SELECT available_inr, available_btc, reserved_inr, reserved_btc, collateral_btc, borrowed_inr, interest_accrued FROM users WHERE id = ?',
      [userId]
    );
    
    if (rows.length === 0) {
      console.log(`❌ User ${userId} not found for balance update`);
      return;
    }

    const balanceData = rows[0];
    console.log(`💰 Sending balance update for user ${userId}:`, balanceData);

    // Update Redis cache with fresh balance data
    if (global.dataService && global.dataService.redis) {
      try {
        const redisKey = `user_balance_${userId}`;
        await global.dataService.redis.set(redisKey, JSON.stringify(balanceData), 'EX', 60 * 10); // Cache for 10 minutes
        console.log(`💾 Balance cache updated in Redis: ${redisKey}`);
      } catch (redisError) {
        console.error('Error updating balance cache in Redis:', redisError);
      }
    }

    // Emit update to all sockets of the user
    let userSocketSet = userSockets.get(userId);
    
    // Try alternate type if primary lookup failed
    if (!userSocketSet || userSocketSet.size === 0) {
      if (typeof userId === 'number') {
        userSocketSet = userSockets.get(String(userId));
      } else if (typeof userId === 'string') {
        userSocketSet = userSockets.get(Number(userId));
      }
    }
    
    if (userSocketSet && userSocketSet.size > 0) {
      userSocketSet.forEach((socketId) => {
        io.to(socketId).emit('user_balance_update', {
          ...balanceData,
          timestamp: new Date().toISOString()
        });
      });
      console.log(`📡 Balance update sent to ${userSocketSet.size} client(s) for user ${userId}`);
    } else {
      console.log(`⚠️  No active connections for user ${userId}`);
    }
  } catch (error) {
    console.error(`Error sending balance update for user ${userId}:`, error);
  }
}

// Function to send transaction update to specific user (most recent 15 transactions)
async function sendUserTransactionUpdate(userId) {
  try {
    // Validate userId
    if (!userId) {
      console.error('❌ sendUserTransactionUpdate: userId is undefined');
      return;
    }
    
    console.log(`🔍 Sending transaction update for userId: ${userId}`);
    
    // Fetch most recent 15 transactions from database (both PENDING and EXECUTED)
    const [rows] = await db.execute(
      `SELECT id, type, status, btc_amount, inr_amount, execution_price, executed_at, created_at 
       FROM transactions 
       WHERE user_id = ? AND status IN ('PENDING', 'EXECUTED') 
       ORDER BY 
         CASE WHEN status = 'PENDING' THEN 0 ELSE 1 END,
         COALESCE(executed_at, created_at) DESC, 
         created_at DESC 
       LIMIT 15`,
      [userId]
    );
    
    const transactionData = rows.map(row => ({
      id: row.id,
      type: row.type,
      status: row.status,
      btc_amount: row.btc_amount,
      inr_amount: row.inr_amount,
      execution_price: row.execution_price,
      executed_at: row.executed_at,
      created_at: row.created_at
    }));
    
    console.log(`💳 Sending ${transactionData.length} transactions for user ${userId}`);

    // Cache transaction data in Redis (if available)
    if (global.dataService && global.dataService.redis) {
      try {
        const redisKey = `user_transactions_${userId}`;
        await global.dataService.redis.set(redisKey, JSON.stringify(transactionData), 'EX', 60 * 60); // Cache for 1 hour
        console.log(`💾 Transaction data cached in Redis: ${redisKey}`);
      } catch (redisError) {
        console.error('Error caching transaction data in Redis:', redisError);
      }
    }

    // Emit update to all sockets of the user
    let userSocketSet = userSockets.get(userId);
    
    // Try alternate type if primary lookup failed
    if (!userSocketSet || userSocketSet.size === 0) {
      if (typeof userId === 'number') {
        userSocketSet = userSockets.get(String(userId));
      } else if (typeof userId === 'string') {
        userSocketSet = userSockets.get(Number(userId));
      }
    }
    
    if (userSocketSet && userSocketSet.size > 0) {
      userSocketSet.forEach((socketId) => {
        io.to(socketId).emit('user_transaction_update', {
          transactions: transactionData,
          timestamp: new Date().toISOString()
        });
      });
      console.log(`📡 Transaction update sent to ${userSocketSet.size} client(s) for user ${userId}`);
    } else {
      console.log(`⚠️  No active connections for user ${userId}`);
    }
  } catch (error) {
    console.error(`Error sending transaction update for user ${userId}:`, error);
  }
}

// Function to send DCA plans update to specific user
async function sendUserDCAPlansUpdate(userId) {
  try {
    // Validate userId
    if (!userId) {
      console.error('❌ sendUserDCAPlansUpdate: userId is undefined');
      return;
    }
    
    console.log(`🔍 Sending DCA plans update for userId: ${userId}`);
    
    // Fetch DCA plans from database
    const [rows] = await db.execute(
      `SELECT id, plan_type, status, amount_per_execution_inr, amount_per_execution_btc, frequency, max_price, min_price, 
              remaining_executions, next_execution_at, created_at, completed_at
       FROM active_plans 
       WHERE user_id = ? AND status IN ('ACTIVE', 'PAUSED')
       ORDER BY created_at DESC`,
      [userId]
    );
    
    // Get performance data for each plan
    const plansWithPerformance = await Promise.all(rows.map(async (plan) => {
      try {
        const [perfRows] = await db.execute(
          `SELECT COUNT(*) as total_executions,
                  SUM(inr_amount) as total_invested,
                  SUM(btc_amount) as total_btc,
                  AVG(execution_price) as avg_price
           FROM transactions 
           WHERE dca_plan_id = ? AND status = 'EXECUTED'`,
          [plan.id]
        );
        
        const performance = perfRows[0];
        return {
          ...plan,
          performance: {
            total_executions: performance.total_executions || 0,
            total_invested: performance.total_invested || 0,
            total_btc: performance.total_btc || 0,
            avg_price: performance.avg_price || 0
          }
        };
      } catch (error) {
        console.error(`Error fetching performance for plan ${plan.id}:`, error);
        return {
          ...plan,
          performance: {
            total_executions: 0,
            total_invested: 0,
            total_btc: 0,
            avg_price: 0
          }
        };
      }
    }));
    
    // Calculate summary statistics
    const totalPlans = plansWithPerformance.length;
    const activePlans = plansWithPerformance.filter(p => p.status === 'ACTIVE').length;
    const pausedPlans = plansWithPerformance.filter(p => p.status === 'PAUSED').length;
    
    const dcaPlansData = {
      plans: plansWithPerformance,
      total_plans: totalPlans,
      active_plans: activePlans,
      paused_plans: pausedPlans
    };
    
    console.log(`📋 Sending ${totalPlans} DCA plans for user ${userId} (${activePlans} active, ${pausedPlans} paused)`);

    // Cache DCA plans data in Redis (if available)
    if (global.dataService && global.dataService.redis) {
      try {
        const redisKey = `user_dca_plans_${userId}`;
        await global.dataService.redis.set(redisKey, JSON.stringify(dcaPlansData), 'EX', 60 * 30); // Cache for 30 minutes
        console.log(`💾 DCA plans data cached in Redis: ${redisKey}`);
      } catch (redisError) {
        console.error('Error caching DCA plans data in Redis:', redisError);
      }
    }

    // Emit update to all sockets of the user
    const userSocketSet = userSockets.get(userId);
    if (userSocketSet && userSocketSet.size > 0) {
      userSocketSet.forEach((socketId) => {
        io.to(socketId).emit('user_dca_plans_update', {
          ...dcaPlansData,
          timestamp: new Date().toISOString()
        });
      });
      console.log(`📡 DCA plans update sent to ${userSocketSet.size} client(s) for user ${userId}`);
    } else {
      console.log(`⚠️  No active connections for user ${userId}`);
    }
  } catch (error) {
    console.error(`Error sending DCA plans update for user ${userId}:`, error);
  }
}

// Function to broadcast data to all connected clients
function broadcastToClients(eventName, data) {
  io.emit(eventName, {
    ...data,
    timestamp: new Date().toISOString()
  });
}

// Make broadcast function available globally
global.broadcastToClients = broadcastToClients;
global.sendUserBalanceUpdate = sendUserBalanceUpdate;
global.sendUserTransactionUpdate = sendUserTransactionUpdate;
global.sendUserDCAPlansUpdate = sendUserDCAPlansUpdate;

// Function to get local network IP address
function getLocalNetworkIP() {
  const os = require('os');
  const networkInterfaces = os.networkInterfaces();
  
  // Priority order for interface types
  const interfacePriority = ['en0', 'eth0', 'wlan0', 'Wi-Fi', 'Ethernet'];
  
  // First, try priority interfaces
  for (const interfaceName of interfacePriority) {
    const networkInterface = networkInterfaces[interfaceName];
    if (networkInterface) {
      for (const net of networkInterface) {
        // Skip internal (loopback) and non-IPv4 addresses
        if (net.family === 'IPv4' && !net.internal) {
          return net.address;
        }
      }
    }
  }
  
  // Fallback: search all interfaces for IPv4 non-internal addresses
  for (const interfaceName of Object.keys(networkInterfaces)) {
    const networkInterface = networkInterfaces[interfaceName];
    for (const net of networkInterface) {
      if (net.family === 'IPv4' && !net.internal) {
        return net.address;
      }
    }
  }
  
  return 'localhost'; // Fallback if no network IP found
}

// Start server
async function startServer() {
  await initDB();
  
  // Start the data service with Socket.IO integration
  const dataService = new DataService(io);
  global.dataService = dataService;
  await dataService.start();
  
  // Broadcast initial Bitcoin price immediately after service starts
  await dataService.broadcastInitialPrice();
  
  // Cache existing chart data from database to Redis for instant access
  await dataService.cacheExistingChartData();
  
  // Get dynamic network IP
  const networkIP = getLocalNetworkIP();
  
  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 BitTrade API Server running on port ${PORT}`);
    console.log(`📱 Server accessible at:`);
    console.log(`[SERVER]    - http://localhost:${PORT}`);
    console.log(`[SERVER]    - http://0.0.0.0:${PORT}`);
    console.log(`[SERVER]    - http://${networkIP}:${PORT}`);
    console.log(`[SERVER] 🏥 Health check: http://localhost:${PORT}/api/health`);
    console.log(`🌐 WebSocket server ready for real-time data broadcasting`);
    console.log(`📡 WebSocket 'btc_price_update' broadcasts enabled`);
    console.log(`📡 Connected clients: ${io.engine.clientsCount}`);
  });
}

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down server...');
  if (global.dataService) {
    await global.dataService.stop();
  }
  if (db) {
    await db.end();
  }
  process.exit(0);
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  process.exit(1);
});

process.on('unhandledRejection', (err) => {
  console.error('Unhandled Rejection:', err);
  process.exit(1);
});

async function startDCAExecutionService() {
  const DCAExecutionService = require('./services/dca-execution-service');
  const dcaExecutionService = new DCAExecutionService();
  await dcaExecutionService.start();
}

async function startAllServices() {
  await startServer();
  await startDCAExecutionService();
}

startAllServices().catch(console.error);

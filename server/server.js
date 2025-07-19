const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');
const { createServer } = require('http');
const { Server } = require('socket.io');
const config = require('./config/config');
const DataService = require('./services/data-service');
const authRoutes = require('./routes/auth');
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

// Execute market buy/sell trade
app.post('/api/trade', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { action, type, amount, currency } = req.body;
    
    // Validate request
    if (!action || !type || !amount || !currency) {
      return res.status(400).json({ error: 'Missing required fields: action, type, amount, currency' });
    }
    
    if (!['buy', 'sell'].includes(action)) {
      return res.status(400).json({ error: 'Invalid action. Must be "buy" or "sell"' });
    }
    
    if (type !== 'market') {
      return res.status(400).json({ error: 'Only market orders are supported currently' });
    }
    
    if (!['inr', 'btc'].includes(currency)) {
      return res.status(400).json({ error: 'Invalid currency. Must be "inr" or "btc"' });
    }
    
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      return res.status(400).json({ error: 'Invalid amount. Must be a positive number' });
    }
    
    // Get current market rates
    let currentRates;
    try {
      if (global.dataService && global.dataService.redis) {
        const cachedPrice = await global.dataService.redis.get('latest_btc_price');
        if (cachedPrice) {
          const bitcoinData = JSON.parse(cachedPrice);
          currentRates = global.dataService.calculateRates(bitcoinData.btc_usd_price);
        }
      }
    } catch (error) {
      console.error('Error fetching current rates:', error);
    }
    
    if (!currentRates) {
      return res.status(503).json({ error: 'Market rates unavailable. Please try again later' });
    }
    
    // Get user balance
    const [balanceRows] = await db.execute(
      'SELECT available_inr, available_btc FROM users WHERE id = ?',
      [userId]
    );
    
    if (balanceRows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const balance = balanceRows[0];
    
    // Calculate trade amounts based on action and currency
    let btcAmount, inrAmount, executionPrice;
    
    if (action === 'buy') {
      executionPrice = currentRates.buy_rate_inr;
      
      if (currency === 'inr') {
        // User specified INR amount, calculate BTC amount
        inrAmount = Math.round(numAmount);
        btcAmount = Math.round((inrAmount / executionPrice) * 100000000); // Convert to satoshis
      } else {
        // User specified BTC amount, calculate INR amount
        btcAmount = Math.round(numAmount * 100000000); // Convert to satoshis
        inrAmount = Math.round((btcAmount / 100000000) * executionPrice);
      }
      
      // Validate user has sufficient INR balance
      if (balance.available_inr < inrAmount) {
        return res.status(400).json({ 
          error: 'Insufficient INR balance', 
          required: inrAmount, 
          available: balance.available_inr 
        });
      }
    } else { // sell
      executionPrice = currentRates.sell_rate_inr;
      
      if (currency === 'btc') {
        // User specified BTC amount, calculate INR amount
        btcAmount = Math.round(numAmount * 100000000); // Convert to satoshis
        inrAmount = Math.round((btcAmount / 100000000) * executionPrice);
      } else {
        // User specified INR amount, calculate BTC amount
        inrAmount = Math.round(numAmount);
        btcAmount = Math.round((inrAmount / executionPrice) * 100000000); // Convert to satoshis
      }
      
      // Validate user has sufficient BTC balance
      if (balance.available_btc < btcAmount) {
        return res.status(400).json({ 
          error: 'Insufficient BTC balance', 
          required: btcAmount, 
          available: balance.available_btc 
        });
      }
    }
    
    // Start database transaction
    await db.beginTransaction();
    
    try {
      // Create transaction record
      const transactionType = action === 'buy' ? 'MARKET_BUY' : 'MARKET_SELL';
      const [transactionResult] = await db.execute(
        `INSERT INTO transactions (user_id, type, status, btc_amount, inr_amount, execution_price, executed_at) 
         VALUES (?, ?, 'EXECUTED', ?, ?, ?, NOW())`,
        [userId, transactionType, btcAmount, inrAmount, executionPrice]
      );
      
      // Update user balance
      if (action === 'buy') {
        // Buy: Decrease INR, increase BTC
        await db.execute(
          'UPDATE users SET available_inr = available_inr - ?, available_btc = available_btc + ? WHERE id = ?',
          [inrAmount, btcAmount, userId]
        );
      } else {
        // Sell: Decrease BTC, increase INR
        await db.execute(
          'UPDATE users SET available_btc = available_btc - ?, available_inr = available_inr + ? WHERE id = ?',
          [btcAmount, inrAmount, userId]
        );
      }
      
      // Commit transaction
      await db.commit();
      
      // Get updated balance
      const [updatedBalanceRows] = await db.execute(
        'SELECT available_inr, available_btc, reserved_inr, reserved_btc, collateral_btc, borrowed_inr, interest_accrued FROM users WHERE id = ?',
        [userId]
      );
      
      const updatedBalance = updatedBalanceRows[0];
      
      // Clear balance cache
      if (global.dataService && global.dataService.redis) {
        try {
          await global.dataService.redis.del(`user_balance_${userId}`);
        } catch (error) {
          console.error('Error clearing balance cache:', error);
        }
      }
      
      // Send updated balance via WebSocket
      if (global.sendUserBalanceUpdate) {
        global.sendUserBalanceUpdate(userId);
      }
      
      // Send transaction update via WebSocket
      if (global.sendUserTransactionUpdate) {
        global.sendUserTransactionUpdate(userId);
      }
      
      console.log(`✅ ${action.toUpperCase()} transaction completed:`, {
        userId,
        transactionId: transactionResult.insertId,
        btcAmount,
        inrAmount,
        executionPrice
      });
      
      // Return transaction details
      res.status(201).json({
        id: transactionResult.insertId,
        type: transactionType,
        action,
        btc_amount: btcAmount,
        inr_amount: inrAmount,
        execution_price: executionPrice,
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
    res.status(500).json({ error: 'Internal server error' });
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
    const userSocketSet = userSockets.get(userId);
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
    const userSocketSet = userSockets.get(userId);
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
  
  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 BitTrade API Server running on port ${PORT}`);
    console.log(`📱 Server accessible at:`);
    console.log(`   - http://localhost:${PORT}`);
    console.log(`   - http://0.0.0.0:${PORT}`);
    console.log(`   - http://192.168.1.164:${PORT}`);
    console.log(`🏥 Health check: http://localhost:${PORT}/api/health`);
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

startServer().catch(console.error);

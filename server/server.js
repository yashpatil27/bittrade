const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');
const config = require('./config/config');
const DataService = require('./services/data-service');

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

// API Routes

// Get current Bitcoin data
app.get('/api/bitcoin/current', async (req, res) => {
  try {
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

// Get Bitcoin chart data
app.get('/api/bitcoin/chart/:timeframe', async (req, res) => {
  try {
    const { timeframe } = req.params;
    const validTimeframes = ['1d', '7d', '30d', '90d', '365d'];
    
    if (!validTimeframes.includes(timeframe)) {
      return res.status(400).json({ error: 'Invalid timeframe' });
    }
    
    const [rows] = await db.execute(
      'SELECT * FROM bitcoin_chart_data WHERE timeframe = ? ORDER BY last_updated DESC LIMIT 1',
      [timeframe]
    );
    
    if (rows.length === 0) {
      return res.status(404).json({ error: `No chart data found for ${timeframe}` });
    }
    
    const chartData = rows[0];
    chartData.price_data = JSON.parse(chartData.price_data);
    
    res.json(chartData);
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

// Get all user transactions (mock data for now)
app.get('/api/transactions', async (req, res) => {
  try {
    // For now, return mock data
    // In a real app, this would fetch from a user_transactions table
    const mockTransactions = [
      {
        id: 1,
        type: 'buy',
        amount: 0.0005,
        price: 45000,
        total: 22.5,
        date: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        status: 'completed'
      },
      {
        id: 2,
        type: 'sell',
        amount: 0.0003,
        price: 44800,
        total: 13.44,
        date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'completed'
      },
      {
        id: 3,
        type: 'buy',
        amount: 0.001,
        price: 44500,
        total: 44.5,
        date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'completed'
      }
    ];
    
    res.json(mockTransactions);
  } catch (error) {
    console.error('Error fetching transactions:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create a new transaction (mock endpoint)
app.post('/api/transactions', async (req, res) => {
  try {
    const { type, amount, price } = req.body;
    
    if (!type || !amount || !price) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    if (!['buy', 'sell'].includes(type)) {
      return res.status(400).json({ error: 'Invalid transaction type' });
    }
    
    // Mock transaction creation
    const transaction = {
      id: Date.now(),
      type,
      amount: parseFloat(amount),
      price: parseFloat(price),
      total: parseFloat(amount) * parseFloat(price),
      date: new Date().toISOString(),
      status: 'completed'
    };
    
    // In a real app, this would insert into a user_transactions table
    console.log('Mock transaction created:', transaction);
    
    res.status(201).json(transaction);
  } catch (error) {
    console.error('Error creating transaction:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get user portfolio/balance (mock data)
app.get('/api/portfolio', async (req, res) => {
  try {
    // Mock portfolio data
    const portfolio = {
      btc_balance: 0.00128,
      usd_balance: 150.75,
      total_invested: 500,
      current_value: 547.32,
      profit_loss: 47.32,
      profit_loss_percentage: 9.46
    };
    
    res.json(portfolio);
  } catch (error) {
    console.error('Error fetching portfolio:', error);
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

// Start server
async function startServer() {
  await initDB();
  
  // Start the data service
  const dataService = new DataService();
  global.dataService = dataService;
  dataService.start().catch(console.error);
  
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 BitTrade API Server running on port ${PORT}`);
    console.log(`📱 Server accessible at:`);
    console.log(`   - http://localhost:${PORT}`);
    console.log(`   - http://0.0.0.0:${PORT}`);
    console.log(`   - http://[your-ip-address]:${PORT}`);
    console.log(`🏥 Health check: http://localhost:${PORT}/api/health`);
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

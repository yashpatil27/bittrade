const mysql = require('mysql2/promise');
const axios = require('axios');
const cron = require('node-cron');
const { createClient } = require('redis');
const config = require('../config/config');
const { pool } = require('../config/database');
const logger = require('../utils/logger');

class DataService {
  async loadPendingLimitOrdersToCache() {
    try {
      logger.info('Loading pending limit orders from database', 'DATA');
      const [orders] = await this.db.execute(`
        SELECT * FROM transactions 
        WHERE status = 'PENDING' AND type IN ('LIMIT_BUY', 'LIMIT_SELL')
      `);
      
      await this.redis.set('pending_limit_orders', JSON.stringify(orders));
      logger.success(`Loaded ${orders.length} pending limit orders into cache`, 'DATA');
      
      // Log summary of pending orders
      if (orders.length > 0) {
        const buyOrders = orders.filter(o => o.type === 'LIMIT_BUY').length;
        const sellOrders = orders.filter(o => o.type === 'LIMIT_SELL').length;
        logger.info(`${buyOrders} buy orders, ${sellOrders} sell orders loaded`, 'DATA');
      }
    } catch (error) {
      logger.error('Error loading pending limit orders', error, 'DATA');
    }
  }

  async checkAndExecuteLimitOrders(btcUsdPrice) {
    try {
      const rates = this.calculateRates(btcUsdPrice);
      const ordersJson = await this.redis.get('pending_limit_orders');
      let orders = JSON.parse(ordersJson) || [];
      
      const initialOrderCount = orders.length;
      let executedCount = 0;
      
      // Check and execute orders
      if (initialOrderCount > 0) {
        logger.info(`Checking ${initialOrderCount} orders at $${btcUsdPrice.toLocaleString()}`, 'LIMIT');
      }

      orders = orders.filter(order => {
        if (order.type === 'LIMIT_BUY' && rates.buy_rate_inr <= order.execution_price) {
          logger.success(`Executing buy order ${order.id} at ₹${rates.buy_rate_inr.toLocaleString()}`, 'LIMIT');
          this.executeOrder(order, rates);
          executedCount++;
          return false; // Remove executed order
        } else if (order.type === 'LIMIT_SELL' && rates.sell_rate_inr >= order.execution_price) {
          logger.success(`Executing sell order ${order.id} at ₹${rates.sell_rate_inr.toLocaleString()}`, 'LIMIT');
          this.executeOrder(order, rates);
          executedCount++;
          return false; // Remove executed order
        }
        return true; // Keep pending order
      });

      // Log summary if orders were processed
      if (initialOrderCount > 0) {
        logger.info(`Orders processed: ${executedCount} executed, ${orders.length} pending`, 'LIMIT');
      }

      await this.redis.set('pending_limit_orders', JSON.stringify(orders));
    } catch (error) {
      logger.error('Error checking/executing limit orders', error, 'LIMIT');
    }
  }

  async executeOrder(order, rates) {
    try {
      const executionTime = new Date().toISOString();
      
      // Start database transaction for order execution
      await this.db.beginTransaction();
      
      try {
        // Update transaction status
        await this.db.execute(`
          UPDATE transactions 
          SET status = 'EXECUTED', executed_at = UTC_TIMESTAMP()
          WHERE id = ?
        `, [order.id]);
        
        // Update user balances based on order type
        if (order.type === 'LIMIT_BUY') {
          // For limit buy: convert reserved INR to available BTC
          await this.db.execute(
            'UPDATE users SET reserved_inr = reserved_inr - ?, available_btc = available_btc + ? WHERE id = ?',
            [order.inr_amount, order.btc_amount, order.user_id]
          );
          logger.transaction('LIMIT_BUY', order.user_id, `₹${order.inr_amount}`, 'EXECUTED');
          
        } else if (order.type === 'LIMIT_SELL') {
          // For limit sell: convert reserved BTC to available INR
          await this.db.execute(
            'UPDATE users SET reserved_btc = reserved_btc - ?, available_inr = available_inr + ? WHERE id = ?',
            [order.btc_amount, order.inr_amount, order.user_id]
          );
          logger.transaction('LIMIT_SELL', order.user_id, `${order.btc_amount} sats`, 'EXECUTED');
        }
        
        await this.db.commit();
        
        logger.success(`Order ${order.id} executed for user ${order.user_id}`, 'ORDER');
        
        // Broadcast order execution to WebSocket clients if available
        if (this.io) {
          this.io.emit('order_executed', {
            orderId: order.id,
            userId: order.user_id,
            type: order.type,
            btcAmount: order.btc_amount,
            inrAmount: order.inr_amount,
            executionPrice: order.execution_price,
            executedAt: executionTime
          });
          logger.websocket('order_executed', `broadcasted to ${this.io.engine.clientsCount} clients`);
        }
        
        // Send real-time updates to the specific user
        if (global.sendUserBalanceUpdate) {
          global.sendUserBalanceUpdate(order.user_id);
        }
        
        if (global.sendUserTransactionUpdate) {
          global.sendUserTransactionUpdate(order.user_id);
        }
        
        // Send admin transaction update notification
        if (global.sendAdminTransactionUpdate) {
          global.sendAdminTransactionUpdate();
        }
        
        // Send admin user update notification (balance changed)
        if (global.sendAdminUserUpdate) {
          global.sendAdminUserUpdate();
        }
        
      } catch (dbError) {
        await this.db.rollback();
        throw dbError;
      }
      
    } catch (error) {
      logger.error(`Error executing order ${order.id}`, error, 'ORDER');
    }
  }
  constructor(io = null) {
    this.db = pool; // Use shared connection pool
    this.redis = null;
    this.io = io; // Socket.IO instance for broadcasting
    this.lastBtcPrice = null; // Track last price to detect changes
    this.settings = { buy_multiplier: 91.0, sell_multiplier: 88.0 }; // Cache settings
  }

async connect() {
    try {
      // Database pool is already initialized and available via this.db
      logger.success('Using shared MySQL connection pool', 'DATA');
      
      // Connect to Redis
      this.redis = createClient({
        host: config.redis.host,
        port: config.redis.port,
        password: config.redis.password,
        db: config.redis.db
      });
      
      this.redis.on('error', (err) => {
        logger.error('Redis connection error', err, 'DATA');
      });
      
      await this.redis.connect();
      logger.success('Redis connected', 'DATA');
      
      // Load initial settings
      await this.loadSettings();
      
      // Load pending limit orders into Redis cache
      await this.loadPendingLimitOrdersToCache();
    } catch (error) {
      logger.error('Redis connection failed', error, 'DATA');
      throw error;
    }
  }

  async disconnect() {
    // Note: We don't close the shared connection pool here
    // The pool will be closed when the entire application shuts down
    logger.info('DataService disconnected (pool remains active)', 'DATA');
    
    if (this.redis) {
      await this.redis.quit();
      logger.info('Redis disconnected', 'DATA');
    }
  }

  // Load settings from database
  async loadSettings() {
    try {
      const [rows] = await this.db.execute(
        'SELECT `key`, value FROM settings WHERE `key` IN (?, ?)',
        ['buy_multiplier', 'sell_multiplier']
      );
      
      rows.forEach(row => {
        this.settings[row.key] = row.value;
      });
      
      logger.info(`Settings loaded: buy=${this.settings.buy_multiplier}, sell=${this.settings.sell_multiplier}`, 'DATA');
    } catch (error) {
      logger.error('Error loading settings', error, 'DATA');
    }
  }

  // Set Socket.IO instance for broadcasting
  setSocketIO(io) {
    this.io = io;
  }

  // Calculate buy and sell rates in INR
  // As per notes/state.txt requirements:
  // buy_rate_inr = btc_usd_price * settings.buy_multiplier
  // sell_rate_inr = btc_usd_price * settings.sell_multiplier
  calculateRates(btcUsdPrice) {
    return {
      btc_usd_price: btcUsdPrice,
      buy_rate_inr: Math.round(btcUsdPrice * this.settings.buy_multiplier),
      sell_rate_inr: Math.round(btcUsdPrice * this.settings.sell_multiplier)
    };
  }

  // Broadcast BTC price update via WebSocket
  // As per notes/state.txt requirements:
  // Event: btc_price_update
  // Payload: [btc_usd_price, buy_rate_inr, sell_rate_inr]
  // Triggered when bitcoin_data.btc_usd_price changes
  broadcastPriceUpdate(btcUsdPrice) {
    if (!this.io) {
      logger.warn('No WebSocket connection available for broadcasting', 'WS');
      return;
    }
    
    const rates = this.calculateRates(btcUsdPrice);
    
    // Broadcast globally to all connected clients
    this.io.emit('btc_price_update', {
      btc_usd_price: rates.btc_usd_price,
      buy_rate_inr: rates.buy_rate_inr,
      sell_rate_inr: rates.sell_rate_inr,
      timestamp: new Date().toISOString()
    });
    
    logger.bitcoin('price_update', btcUsdPrice, `broadcasted to ${this.io.engine.clientsCount} clients`);
  }

  // Broadcast initial Bitcoin price from database
  // This ensures clients get the latest data immediately after connecting
  async broadcastInitialPrice() {
    if (!this.io) {
      logger.warn('No WebSocket connection available for initial broadcast', 'WS');
      return;
    }
    
    if (!this.db) {
      logger.warn('No database connection available for initial broadcast', 'DATA');
      return;
    }
    
    try {
      // Get the latest Bitcoin data from database
      const [rows] = await this.db.execute(
        'SELECT btc_usd_price FROM bitcoin_data ORDER BY created_at DESC LIMIT 1'
      );
      
      if (rows.length > 0) {
        const btcUsdPrice = rows[0].btc_usd_price;
        this.lastBtcPrice = btcUsdPrice; // Set to avoid duplicate broadcast
        this.broadcastPriceUpdate(btcUsdPrice);
        logger.success(`Initial Bitcoin price broadcasted: $${btcUsdPrice}`, 'WS');
      } else {
        logger.warn('No Bitcoin data found for initial broadcast', 'DATA');
      }
    } catch (error) {
      logger.error('Error broadcasting initial price', error, 'WS');
    }
  }

  // Cache existing chart data from database to Redis on startup
  async cacheExistingChartData() {
    if (!this.redis || !this.db) {
      logger.warn('Redis or database not available for initial chart caching', 'CACHE');
      return;
    }

    const timeframes = ['1d', '7d', '30d', '90d', '365d'];
    const ttlMap = {
      '1d': 3600,    // 1 hour
      '7d': 21600,   // 6 hours
      '30d': 43200,  // 12 hours
      '90d': 64800,  // 18 hours
      '365d': 86400  // 24 hours
    };

    for (const timeframe of timeframes) {
      try {
        // Get latest chart data from database
        const [rows] = await this.db.execute(
          'SELECT * FROM bitcoin_chart_data WHERE timeframe = ? ORDER BY last_updated DESC LIMIT 1',
          [timeframe]
        );

        if (rows.length > 0) {
          const chartData = rows[0];
          const cacheKey = `chart_data_${timeframe}`;
          const ttl = ttlMap[timeframe];

          // Convert the database row to the same format as fetchBitcoinChartData
          const formattedData = {
            timeframe: chartData.timeframe,
            price_data: chartData.price_data,
            data_points_count: chartData.data_points_count,
            price_change_pct: chartData.price_change_pct,
            date_from: chartData.date_from,
            date_to: chartData.date_to,
            last_updated: chartData.last_updated
          };

          await this.redis.set(cacheKey, JSON.stringify(formattedData), 'EX', ttl);
          logger.cache('STORE', `chart_data_${timeframe}`);
        } else {
          logger.warn(`No existing ${timeframe} chart data found in database`, 'CACHE');
        }
      } catch (error) {
        logger.error(`Error caching existing ${timeframe} chart data`, error, 'CACHE');
      }
    }
  }

  // Fetch Bitcoin data from CoinGecko
async reloadSettings() {
  logger.info('Reloading settings', 'DATA');
  await this.loadSettings();
}

async fetchBitcoinData() {
    try {
      const response = await axios.get(`${config.apis.coingecko}/coins/bitcoin`, {
        params: {
          localization: false,
          tickers: false,
          market_data: true,
          community_data: false,
          developer_data: false,
          sparkline: false
        }
      });

      const data = response.data;
      const marketData = data.market_data;

      return {
        btc_usd_price: Math.round(marketData.current_price.usd) // Store as dollars - only field we need
      };
    } catch (error) {
      logger.error('Error fetching Bitcoin data', error, 'DATA');
      throw error;
    }
  }

  // Insert Bitcoin data and keep only last 5 records
  async updateBitcoinData() {
    try {
      const bitcoinData = await this.fetchBitcoinData();
      
      // Check and execute limit orders
      await this.checkAndExecuteLimitOrders(bitcoinData.btc_usd_price);

      // Insert new data (only btc_usd_price - other columns were dropped)
      const insertQuery = `
        INSERT INTO bitcoin_data (btc_usd_price) VALUES (?)
      `;

      await this.db.execute(insertQuery, [
        bitcoinData.btc_usd_price
      ]);
      
      // Cache the latest Bitcoin price in Redis
      await this.redis.set('latest_btc_price', JSON.stringify(bitcoinData));

      // Check if price changed and broadcast update
      // This implements the trigger condition from notes/state.txt
      if (this.lastBtcPrice !== bitcoinData.btc_usd_price) {
        const priceDirection = this.lastBtcPrice ? (bitcoinData.btc_usd_price > this.lastBtcPrice ? '↗' : '↘') : '';
        logger.bitcoin('price_changed', bitcoinData.btc_usd_price, `${this.lastBtcPrice || 'N/A'} → ${bitcoinData.btc_usd_price} ${priceDirection}`);
        this.lastBtcPrice = bitcoinData.btc_usd_price;
        this.broadcastPriceUpdate(bitcoinData.btc_usd_price);
      } else {
        logger.debug(`Bitcoin price unchanged: $${bitcoinData.btc_usd_price}`, 'DATA');
      }

      // Keep only last 5 records
      await this.db.execute(`
        DELETE FROM bitcoin_data 
        WHERE id NOT IN (
          SELECT * FROM (
            SELECT id FROM bitcoin_data 
            ORDER BY created_at DESC 
            LIMIT 5
          ) as t
        )
      `);

      logger.success('Bitcoin data updated', 'DATA');
    } catch (error) {
      logger.error('Error updating Bitcoin data', error, 'DATA');
    }
  }

  // NOTE: Bitcoin sentiment functionality removed - bitcoin_sentiment table was dropped
  // Fear & Greed Index is no longer tracked to keep the database lean

  // Fetch Bitcoin chart data from CoinGecko
  // NOTE: CoinGecko automatically determines intervals based on days parameter:
  // - 1 day: ~5-minute intervals (288 data points)
  // - 7 days: ~1-hour intervals (169 data points)
  // - 30 days: ~1-hour intervals (721 data points)
  // - 90 days: ~1-hour intervals (2,160 data points)
  // - 365 days: 1-day intervals (366 data points)
  async fetchBitcoinChartData(timeframe) {
    try {
      const daysMap = {
        '1d': 1,    // Returns ~5-minute intervals
        '7d': 7,    // Returns ~1-hour intervals
        '30d': 30,  // Returns ~1-hour intervals
        '90d': 90,  // Returns ~1-hour intervals
        '365d': 365 // Returns 1-day intervals
      };

      const days = daysMap[timeframe];
      const response = await axios.get(`${config.apis.coingecko}/coins/bitcoin/market_chart`, {
        params: {
          vs_currency: 'usd',
          days: days
        }
      });

      const chartData = response.data;
      const priceData = chartData.prices.map(([timestamp, price]) => ({
        timestamp: new Date(timestamp).toISOString(),
        price: Math.round(price) // Store as dollars
      }));

      return {
        timeframe,
price_data: JSON.stringify(priceData),
        data_points_count: priceData.length,
        price_change_pct: priceData.length > 0 ? ((priceData[priceData.length - 1].price - priceData[0].price) / priceData[0].price) * 100 : null,
        date_from: new Date(chartData.prices[0][0]).toISOString().slice(0, 19).replace('T', ' '),
        date_to: new Date(chartData.prices[chartData.prices.length - 1][0]).toISOString().slice(0, 19).replace('T', ' ')
      };
    } catch (error) {
      logger.error(`Error fetching ${timeframe} chart data`, error, 'DATA');
      throw error;
    }
  }

  // Update Bitcoin chart data and keep only last 2 records per timeframe
  async updateBitcoinChartData(timeframe) {
    try {
      const chartData = await this.fetchBitcoinChartData(timeframe);
      
      // Insert new data
      const insertQuery = `
INSERT INTO bitcoin_chart_data (
          timeframe, price_data, data_points_count, price_change_pct, date_from, date_to
        ) VALUES (?, ?, ?, ?, ?, ?)
      `;

      await this.db.execute(insertQuery, [
        chartData.timeframe,
        chartData.price_data,
        chartData.data_points_count,
chartData.price_change_pct, 
        chartData.date_from,
        chartData.date_to
      ]);

      // Cache the chart data in Redis with appropriate TTL
      if (this.redis) {
        const ttlMap = {
          '1d': 3600,    // 1 hour
          '7d': 21600,   // 6 hours
          '30d': 43200,  // 12 hours
          '90d': 64800,  // 18 hours
          '365d': 86400  // 24 hours
        };
        
        const cacheKey = `chart_data_${timeframe}`;
        const ttl = ttlMap[timeframe] || 3600; // Default to 1 hour if timeframe not found
        
        try {
          await this.redis.set(cacheKey, JSON.stringify(chartData), 'EX', ttl);
          logger.cache('STORE', `chart_data_${timeframe}`, `TTL: ${ttl}s`);
        } catch (redisError) {
          logger.error(`Error caching ${timeframe} chart data in Redis`, redisError, 'CACHE');
        }
      }

      // Keep only last 2 records for this timeframe
      await this.db.execute(`
        DELETE FROM bitcoin_chart_data 
        WHERE timeframe = ? AND id NOT IN (
          SELECT * FROM (
            SELECT id FROM bitcoin_chart_data 
            WHERE timeframe = ?
            ORDER BY last_updated DESC 
            LIMIT 2
          ) as t
        )
      `, [timeframe, timeframe]);

      logger.success(`${timeframe} chart data updated`, 'DATA', `${chartData.data_points_count} data points`);
    } catch (error) {
      logger.error(`Error updating ${timeframe} chart data`, error, 'DATA');
    }
  }

  // Schedule chart data updates with staggered startup times
  scheduleChartDataUpdates() {
    const schedules = [
      { timeframe: '1d', startupDelay: 5 * 60 * 1000, updateInterval: '0 * * * *' }, // 5 min delay, every hour
      { timeframe: '7d', startupDelay: 10 * 60 * 1000, updateInterval: '0 */6 * * *' }, // 10 min delay, every 6 hours
      { timeframe: '30d', startupDelay: 15 * 60 * 1000, updateInterval: '0 */12 * * *' }, // 15 min delay, every 12 hours
      { timeframe: '90d', startupDelay: 20 * 60 * 1000, updateInterval: '0 */18 * * *' }, // 20 min delay, every 18 hours
      { timeframe: '365d', startupDelay: 25 * 60 * 1000, updateInterval: '0 0 * * *' } // 25 min delay, daily
    ];

    schedules.forEach(({ timeframe, startupDelay, updateInterval }) => {
      // Initial fetch with startup delay
      setTimeout(async () => {
        logger.info(`Fetching initial ${timeframe} chart data`, 'DATA');
        await this.updateBitcoinChartData(timeframe);
        
        // Schedule regular updates
        cron.schedule(updateInterval, async () => {
          logger.info(`Updating ${timeframe} chart data`, 'DATA');
          await this.updateBitcoinChartData(timeframe);
        });
        
        logger.info(`${timeframe} chart data scheduled for updates: ${updateInterval}`, 'DATA');
      }, startupDelay);
    });
  }

  // Start the data service with cron jobs
  async start() {
    await this.connect();

    // Update Bitcoin data every 30 seconds
    cron.schedule('*/30 * * * * *', async () => {
      logger.debug('Updating Bitcoin data', 'CRON');
      await this.updateBitcoinData();
    });

    // Schedule chart data updates
    this.scheduleChartDataUpdates();

    logger.success('Data service started (LEAN VERSION)', 'DATA');
    logger.info('- Bitcoin price updates every 30 seconds', 'DATA');
    logger.info('- Chart data updates scheduled with staggered startup:', 'DATA');
    logger.info('  * 1d chart: 5 min startup delay, then every hour', 'DATA');
    logger.info('  * 7d chart: 10 min startup delay, then every 6 hours', 'DATA');
    logger.info('  * 30d chart: 15 min startup delay, then every 12 hours', 'DATA');
    logger.info('  * 90d chart: 20 min startup delay, then every 18 hours', 'DATA');
    logger.info('  * 365d chart: 25 min startup delay, then daily', 'DATA');
    logger.info('- Bitcoin sentiment tracking removed (database cleanup)', 'DATA');

    // Initial data fetch
    await this.updateBitcoinData();
  }

  // Stop the service
  async stop() {
    await this.disconnect();
    logger.info('Data service stopped', 'DATA');
  }
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
  logger.warn('Shutting down data service...', 'DATA');
  if (global.dataService) {
    await global.dataService.stop();
  }
  process.exit(0);
});

// Start the service if this file is run directly
if (require.main === module) {
  const dataService = new DataService();
  global.dataService = dataService;
  dataService.start().catch((error) => logger.error('Failed to start data service', error, 'DATA'));
}

module.exports = DataService;

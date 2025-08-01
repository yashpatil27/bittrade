const mysql = require('mysql2/promise');
const axios = require('axios');
const cron = require('node-cron');
const { createClient } = require('redis');
const config = require('../config/config');

class DataService {
  async loadPendingLimitOrdersToCache() {
    try {
      console.log('🔄 Loading pending limit orders from database...');
      const [orders] = await this.db.execute(`
        SELECT * FROM transactions 
        WHERE status = 'PENDING' AND type IN ('LIMIT_BUY', 'LIMIT_SELL')
      `);
      
      console.log('📊 Raw database query result:', orders);
      
      await this.redis.set('pending_limit_orders', JSON.stringify(orders));
      console.log(`📋 Loaded ${orders.length} pending limit orders into Redis cache`);
      
      // Log summary of pending orders
      if (orders.length > 0) {
        const buyOrders = orders.filter(o => o.type === 'LIMIT_BUY').length;
        const sellOrders = orders.filter(o => o.type === 'LIMIT_SELL').length;
        console.log(`   • ${buyOrders} LIMIT_BUY orders`);
        console.log(`   • ${sellOrders} LIMIT_SELL orders`);
        
        // Log individual orders for debugging
        orders.forEach(order => {
          console.log(`   📝 Order ${order.id}: ${order.type} - Target: ₹${order.execution_price?.toLocaleString()} - User: ${order.user_id}`);
        });
      }
    } catch (error) {
      console.error('❌ Error loading pending limit orders:', error);
      console.error('   Error details:', error.message);
      console.error('   Stack:', error.stack);
    }
  }

  async checkAndExecuteLimitOrders(btcUsdPrice) {
    try {
      const rates = this.calculateRates(btcUsdPrice);
      const ordersJson = await this.redis.get('pending_limit_orders');
      let orders = JSON.parse(ordersJson) || [];
      
      const initialOrderCount = orders.length;
      let executedCount = 0;
      
      // Debug logging
      console.log(`\n🔍 LIMIT ORDER CHECK:`);
      console.log(`   📊 BTC USD Price: $${btcUsdPrice.toLocaleString()}`);
      console.log(`   💱 Buy Rate INR: ₹${rates.buy_rate_inr.toLocaleString()}`);
      console.log(`   💱 Sell Rate INR: ₹${rates.sell_rate_inr.toLocaleString()}`);
      console.log(`   📋 Pending orders in cache: ${initialOrderCount}`);

      orders = orders.filter(order => {
        if (order.type === 'LIMIT_BUY' && rates.buy_rate_inr <= order.execution_price) {
          // Execute buy order
          console.log(`\n🟢 EXECUTING LIMIT_BUY ORDER`);
          console.log(`   Order ID: ${order.id}`);
          console.log(`   User ID: ${order.user_id}`);
          console.log(`   Target Price: ₹${order.execution_price.toLocaleString()}`);
          console.log(`   Current Buy Rate: ₹${rates.buy_rate_inr.toLocaleString()}`);
          console.log(`   BTC Amount: ${(order.btc_amount / 100000000).toFixed(8)} BTC`);
          console.log(`   INR Amount: ₹${order.inr_amount.toLocaleString()}`);
          
          this.executeOrder(order, rates);
          executedCount++;
          return false; // Remove executed order
        } else if (order.type === 'LIMIT_SELL' && rates.sell_rate_inr >= order.execution_price) {
          // Execute sell order
          console.log(`\n🔴 EXECUTING LIMIT_SELL ORDER`);
          console.log(`   Order ID: ${order.id}`);
          console.log(`   User ID: ${order.user_id}`);
          console.log(`   Target Price: ₹${order.execution_price.toLocaleString()}`);
          console.log(`   Current Sell Rate: ₹${rates.sell_rate_inr.toLocaleString()}`);
          console.log(`   BTC Amount: ${(order.btc_amount / 100000000).toFixed(8)} BTC`);
          console.log(`   INR Amount: ₹${order.inr_amount.toLocaleString()}`);
          
          this.executeOrder(order, rates);
          executedCount++;
          return false; // Remove executed order
        }
        return true; // Keep pending order
      });

      // Log summary if orders were checked
      if (initialOrderCount > 0) {
        console.log(`\n📊 LIMIT ORDER CHECK SUMMARY:`);
        console.log(`   📋 Orders checked: ${initialOrderCount}`);
        console.log(`   ✅ Orders executed: ${executedCount}`);
        console.log(`   ⏳ Orders still pending: ${orders.length}`);
        console.log(`   💰 Current BTC USD: $${btcUsdPrice.toLocaleString()}`);
        console.log(`   💱 Buy Rate INR: ₹${rates.buy_rate_inr.toLocaleString()}`);
        console.log(`   💱 Sell Rate INR: ₹${rates.sell_rate_inr.toLocaleString()}`);
      }

      await this.redis.set('pending_limit_orders', JSON.stringify(orders));
    } catch (error) {
      console.error('❌ Error checking/executing limit orders:', error);
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
          console.log(`   💰 Converted ₹${order.inr_amount} to ${order.btc_amount} satoshis for user ${order.user_id}`);
          
        } else if (order.type === 'LIMIT_SELL') {
          // For limit sell: convert reserved BTC to available INR
          await this.db.execute(
            'UPDATE users SET reserved_btc = reserved_btc - ?, available_inr = available_inr + ? WHERE id = ?',
            [order.btc_amount, order.inr_amount, order.user_id]
          );
          console.log(`   ₿ Converted ${order.btc_amount} satoshis to ₹${order.inr_amount} for user ${order.user_id}`);
        }
        
        await this.db.commit();
        
        console.log(`✅ ORDER EXECUTION SUCCESSFUL`);
        console.log(`   Order ID: ${order.id}`);
        console.log(`   Type: ${order.type}`);
        console.log(`   User ID: ${order.user_id}`);
        console.log(`   Executed at: ${executionTime}`);
        console.log(`   Status: EXECUTED`);
        
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
          console.log(`📡 Broadcasted order execution to ${this.io.engine.clientsCount} clients`);
        }
        
        // Send real-time updates to the specific user
        if (global.sendUserBalanceUpdate) {
          global.sendUserBalanceUpdate(order.user_id);
        }
        
        if (global.sendUserTransactionUpdate) {
          global.sendUserTransactionUpdate(order.user_id);
        }
        
      } catch (dbError) {
        await this.db.rollback();
        throw dbError;
      }
      
    } catch (error) {
      console.error(`❌ ERROR EXECUTING ORDER ${order.id}:`, error);
      console.error(`   Error details:`, error.message);
    }
  }
  constructor(io = null) {
    this.db = null;
    this.redis = null;
    this.io = io; // Socket.IO instance for broadcasting
    this.lastBtcPrice = null; // Track last price to detect changes
    this.settings = { buy_multiplier: 91, sell_multiplier: 88 }; // Cache settings
  }

async connect() {
    try {
      // Connect to MySQL
      this.db = await mysql.createConnection(config.database);
      console.log('Connected to MySQL database');
      
      // Connect to Redis
      this.redis = createClient({
        host: config.redis.host,
        port: config.redis.port,
        password: config.redis.password,
        db: config.redis.db
      });
      
      this.redis.on('error', (err) => {
        console.error('Redis connection error:', err);
      });
      
      await this.redis.connect();
      console.log('Connected to Redis cache');
      
      // Load initial settings
      await this.loadSettings();
      
      // Load pending limit orders into Redis cache
      await this.loadPendingLimitOrdersToCache();
    } catch (error) {
      console.error('Database/Redis connection failed:', error);
      throw error;
    }
  }

  async disconnect() {
    if (this.db) {
      await this.db.end();
      console.log('Database connection closed');
    }
    
    if (this.redis) {
      await this.redis.quit();
      console.log('Redis connection closed');
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
      
      console.log('Settings loaded:', this.settings);
    } catch (error) {
      console.error('Error loading settings:', error);
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
      console.log('⚠️  No WebSocket connection available for broadcasting');
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
    
    console.log(`📡 Broadcasted btc_price_update: $${btcUsdPrice} USD (Buy: ₹${rates.buy_rate_inr}, Sell: ₹${rates.sell_rate_inr})`);
    console.log(`📡 Connected clients: ${this.io.engine.clientsCount}`);
  }

  // Broadcast initial Bitcoin price from database
  // This ensures clients get the latest data immediately after connecting
  async broadcastInitialPrice() {
    if (!this.io) {
      console.log('⚠️  No WebSocket connection available for initial broadcast');
      return;
    }
    
    if (!this.db) {
      console.log('⚠️  No database connection available for initial broadcast');
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
        console.log(`🔄 Initial Bitcoin price broadcasted: $${btcUsdPrice}`);
      } else {
        console.log('⚠️  No Bitcoin data found in database for initial broadcast');
      }
    } catch (error) {
      console.error('Error broadcasting initial price:', error);
    }
  }

  // Cache existing chart data from database to Redis on startup
  async cacheExistingChartData() {
    if (!this.redis || !this.db) {
      console.log('⚠️  Redis or database not available for initial chart caching');
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
          console.log(`📦 Cached existing ${timeframe} chart data in Redis (TTL: ${ttl}s)`);
        } else {
          console.log(`⚠️  No existing ${timeframe} chart data found in database`);
        }
      } catch (error) {
        console.error(`Error caching existing ${timeframe} chart data:`, error);
      }
    }
  }

  // Fetch Bitcoin data from CoinGecko
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
        btc_usd_price: Math.round(marketData.current_price.usd), // Store as dollars
        market_cap_usd: marketData.market_cap.usd,
        volume_24h_usd: marketData.total_volume.usd,
        high_24h_usd: Math.round(marketData.high_24h.usd),
        ath_usd: Math.round(marketData.ath.usd),
        ath_date: marketData.ath_date.usd ? new Date(marketData.ath_date.usd).toISOString().split('T')[0] : null,
        ath_change_pct: marketData.ath_change_percentage.usd
      };
    } catch (error) {
      console.error('Error fetching Bitcoin data:', error);
      throw error;
    }
  }

  // Insert Bitcoin data and keep only last 5 records
  async updateBitcoinData() {
    try {
      const bitcoinData = await this.fetchBitcoinData();
      
// Check and execute limit orders
      await this.checkAndExecuteLimitOrders(bitcoinData.btc_usd_price);

      // Insert new data
      const insertQuery = `
        INSERT INTO bitcoin_data (
          btc_usd_price, market_cap_usd, volume_24h_usd, high_24h_usd,
          ath_usd, ath_date, ath_change_pct
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
      `;

      await this.db.execute(insertQuery, [
        bitcoinData.btc_usd_price,
        bitcoinData.market_cap_usd,
        bitcoinData.volume_24h_usd,
        bitcoinData.high_24h_usd,
        bitcoinData.ath_usd,
        bitcoinData.ath_date,
        bitcoinData.ath_change_pct
      ]);
      
      // Cache the latest Bitcoin price in Redis
      await this.redis.set('latest_btc_price', JSON.stringify(bitcoinData));

      // Check if price changed and broadcast update
      // This implements the trigger condition from notes/state.txt
      if (this.lastBtcPrice !== bitcoinData.btc_usd_price) {
        const priceDirection = this.lastBtcPrice ? (bitcoinData.btc_usd_price > this.lastBtcPrice ? '⬆️' : '⬇️') : '🔄';
        console.log(`💰 Bitcoin price changed: $${this.lastBtcPrice || 'N/A'} → $${bitcoinData.btc_usd_price} ${priceDirection}`);
        this.lastBtcPrice = bitcoinData.btc_usd_price;
        this.broadcastPriceUpdate(bitcoinData.btc_usd_price);
      } else {
        console.log(`💰 Bitcoin price unchanged: $${bitcoinData.btc_usd_price} (no broadcast)`);
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

      console.log('Bitcoin data updated successfully');
    } catch (error) {
      console.error('Error updating Bitcoin data:', error);
    }
  }

  // Fetch Fear & Greed Index from Alternative.me
  async fetchFearGreedData() {
    try {
      const response = await axios.get(`${config.apis.fearGreed}?limit=1`);
      const data = response.data.data[0];

      return {
        fear_greed_value: parseInt(data.value),
        fear_greed_classification: data.value_classification,
        data_date: new Date(parseInt(data.timestamp) * 1000).toISOString().split('T')[0]
      };
    } catch (error) {
      console.error('Error fetching Fear & Greed data:', error);
      throw error;
    }
  }

  // Update Bitcoin sentiment and keep only last 5 records
  async updateBitcoinSentiment() {
    try {
      const sentimentData = await this.fetchFearGreedData();
      
      // Check if data for this date already exists
      const [existing] = await this.db.execute(
        'SELECT id FROM bitcoin_sentiment WHERE data_date = ?',
        [sentimentData.data_date]
      );

      if (existing.length > 0) {
        // Update existing record
        await this.db.execute(`
          UPDATE bitcoin_sentiment 
          SET fear_greed_value = ?, fear_greed_classification = ?
          WHERE data_date = ?
        `, [
          sentimentData.fear_greed_value,
          sentimentData.fear_greed_classification,
          sentimentData.data_date
        ]);
      } else {
        // Insert new record
        await this.db.execute(`
          INSERT INTO bitcoin_sentiment (fear_greed_value, fear_greed_classification, data_date)
          VALUES (?, ?, ?)
        `, [
          sentimentData.fear_greed_value,
          sentimentData.fear_greed_classification,
          sentimentData.data_date
        ]);
      }

      // Keep only last 5 records
      await this.db.execute(`
        DELETE FROM bitcoin_sentiment 
        WHERE id NOT IN (
          SELECT * FROM (
            SELECT id FROM bitcoin_sentiment 
            ORDER BY data_date DESC 
            LIMIT 5
          ) as t
        )
      `);

      console.log('Bitcoin sentiment updated successfully');
    } catch (error) {
      console.error('Error updating Bitcoin sentiment:', error);
    }
  }

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
      console.error(`Error fetching ${timeframe} chart data:`, error);
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
          console.log(`📦 Cached ${timeframe} chart data in Redis (TTL: ${ttl}s)`);
        } catch (redisError) {
          console.error(`Error caching ${timeframe} chart data in Redis:`, redisError);
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

      console.log(`${timeframe} chart data updated successfully (${chartData.data_points_count} data points)`);
    } catch (error) {
      console.error(`Error updating ${timeframe} chart data:`, error);
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
        console.log(`Fetching initial ${timeframe} chart data...`);
        await this.updateBitcoinChartData(timeframe);
        
        // Schedule regular updates
        cron.schedule(updateInterval, async () => {
          console.log(`Updating ${timeframe} chart data...`);
          await this.updateBitcoinChartData(timeframe);
        });
        
        console.log(`${timeframe} chart data scheduled for updates: ${updateInterval}`);
      }, startupDelay);
    });
  }

  // Start the data service with cron jobs
  async start() {
    await this.connect();

    // Update Bitcoin data every 30 seconds
    cron.schedule('*/30 * * * * *', async () => {
      console.log('Updating Bitcoin data...');
      await this.updateBitcoinData();
    });

    // Update Bitcoin sentiment once per day at 12:00 AM
    cron.schedule('0 0 * * *', async () => {
      console.log('Updating Bitcoin sentiment...');
      await this.updateBitcoinSentiment();
    });

    // Schedule chart data updates
    this.scheduleChartDataUpdates();

    console.log('Data service started');
    console.log('- Bitcoin data updates every 30 seconds');
    console.log('- Bitcoin sentiment updates daily at midnight');
    console.log('- Chart data updates scheduled with staggered startup:');
    console.log('  * 1d chart: 5 min startup delay, then every hour');
    console.log('  * 7d chart: 10 min startup delay, then every 6 hours');
    console.log('  * 30d chart: 15 min startup delay, then every 12 hours');
    console.log('  * 90d chart: 20 min startup delay, then every 18 hours');
    console.log('  * 365d chart: 25 min startup delay, then daily');

    // Initial data fetch
    await this.updateBitcoinData();
    await this.updateBitcoinSentiment();
  }

  // Stop the service
  async stop() {
    await this.disconnect();
    console.log('Data service stopped');
  }
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log('\nShutting down data service...');
  if (global.dataService) {
    await global.dataService.stop();
  }
  process.exit(0);
});

// Start the service if this file is run directly
if (require.main === module) {
  const dataService = new DataService();
  global.dataService = dataService;
  dataService.start().catch(console.error);
}

module.exports = DataService;

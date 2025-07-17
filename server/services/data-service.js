const mysql = require('mysql2/promise');
const axios = require('axios');
const cron = require('node-cron');
const config = require('../config/config');

class DataService {
  constructor(io = null) {
    this.db = null;
    this.io = io; // Socket.IO instance for broadcasting
    this.lastBtcPrice = null; // Track last price to detect changes
    this.settings = { buy_multiplier: 91, sell_multiplier: 88 }; // Cache settings
  }

  async connect() {
    try {
      this.db = await mysql.createConnection(config.database);
      console.log('Connected to MySQL database');
      
      // Load initial settings
      await this.loadSettings();
    } catch (error) {
      console.error('Database connection failed:', error);
      throw error;
    }
  }

  async disconnect() {
    if (this.db) {
      await this.db.end();
      console.log('Database connection closed');
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
  calculateRates(btcUsdPrice) {
    const usdToInr = 83; // Approximate USD to INR conversion rate
    const btcInrPrice = btcUsdPrice * usdToInr;
    
    return {
      btc_usd_price: btcUsdPrice,
      buy_rate_inr: Math.round(btcInrPrice * (this.settings.buy_multiplier / 100)),
      sell_rate_inr: Math.round(btcInrPrice * (this.settings.sell_multiplier / 100))
    };
  }

  // Broadcast BTC price update via WebSocket
  broadcastPriceUpdate(btcUsdPrice) {
    if (!this.io) return;
    
    const rates = this.calculateRates(btcUsdPrice);
    
    this.io.emit('btc_price_update', {
      btc_usd_price: rates.btc_usd_price,
      buy_rate_inr: rates.buy_rate_inr,
      sell_rate_inr: rates.sell_rate_inr,
      timestamp: new Date().toISOString()
    });
    
    console.log(`Broadcasted price update: $${btcUsdPrice} USD (Buy: ₹${rates.buy_rate_inr}, Sell: ₹${rates.sell_rate_inr})`);
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

      // Check if price changed and broadcast update
      if (this.lastBtcPrice !== bitcoinData.btc_usd_price) {
        this.lastBtcPrice = bitcoinData.btc_usd_price;
        this.broadcastPriceUpdate(bitcoinData.btc_usd_price);
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

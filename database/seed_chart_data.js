#!/usr/bin/env node

/**
 * Bitcoin Chart Data Seeder
 * 
 * This script fetches Bitcoin chart data from CoinGecko API and seeds the
 * bitcoin_chart_data table for all timeframes (1d, 7d, 30d, 90d, 365d).
 * 
 * Usage: node database/seed_chart_data.js
 */

const mysql = require('../server/node_modules/mysql2/promise');
const axios = require('../server/node_modules/axios').default;
const config = require('../server/config/config');

class ChartDataSeeder {
  constructor() {
    this.db = null;
    this.timeframes = [
      { timeframe: '1d', days: 1 },    // ~5-minute intervals
      { timeframe: '7d', days: 7 },    // ~1-hour intervals
      { timeframe: '30d', days: 30 },  // ~1-hour intervals
      { timeframe: '90d', days: 90 },  // ~1-hour intervals
      { timeframe: '365d', days: 365 } // 1-day intervals
    ];
    this.delayBetweenRequests = 3000; // 3 seconds between API calls
  }

  async connect() {
    try {
      this.db = await mysql.createConnection(config.database);
      console.log('✅ Connected to MySQL database');
    } catch (error) {
      console.error('❌ Database connection failed:', error);
      throw error;
    }
  }

  async disconnect() {
    if (this.db) {
      await this.db.end();
      console.log('✅ Database connection closed');
    }
  }

  async fetchBitcoinChartData(timeframe, days) {
    try {
      console.log(`📊 Fetching ${timeframe} chart data from CoinGecko...`);
      
      const response = await axios.get(`${config.apis.coingecko}/coins/bitcoin/market_chart`, {
        params: {
          vs_currency: 'usd',
          days: days
        },
        timeout: 30000 // 30 second timeout
      });

      const chartData = response.data;
      const priceData = chartData.prices.map(([timestamp, price]) => ({
        timestamp: new Date(timestamp).toISOString(),
        price: Math.round(price) // Store as dollars
      }));

      const result = {
        timeframe,
        price_data: JSON.stringify(priceData),
        data_points_count: priceData.length,
        price_change_pct: priceData.length > 0 ? 
          ((priceData[priceData.length - 1].price - priceData[0].price) / priceData[0].price) * 100 : null,
        date_from: new Date(chartData.prices[0][0]).toISOString().slice(0, 19).replace('T', ' '),
        date_to: new Date(chartData.prices[chartData.prices.length - 1][0]).toISOString().slice(0, 19).replace('T', ' ')
      };

      console.log(`✅ Successfully fetched ${timeframe} data:`);
      console.log(`   📈 Data points: ${result.data_points_count}`);
      console.log(`   📅 Date range: ${result.date_from} to ${result.date_to}`);
      console.log(`   💹 Price change: ${result.price_change_pct?.toFixed(2)}%`);

      return result;
    } catch (error) {
      console.error(`❌ Error fetching ${timeframe} chart data:`, error.message);
      throw error;
    }
  }

  async insertChartData(chartData) {
    try {
      // Delete existing data for this timeframe
      await this.db.execute(
        'DELETE FROM bitcoin_chart_data WHERE timeframe = ?',
        [chartData.timeframe]
      );

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

      console.log(`✅ Inserted ${chartData.timeframe} chart data into database`);
    } catch (error) {
      console.error(`❌ Error inserting ${chartData.timeframe} chart data:`, error);
      throw error;
    }
  }

  async delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async seedAllTimeframes() {
    console.log('🚀 Starting Bitcoin chart data seeding...\n');
    
    let successCount = 0;
    let failureCount = 0;

    for (let i = 0; i < this.timeframes.length; i++) {
      const { timeframe, days } = this.timeframes[i];
      
      try {
        // Fetch data from CoinGecko API
        const chartData = await this.fetchBitcoinChartData(timeframe, days);
        
        // Insert into database
        await this.insertChartData(chartData);
        
        successCount++;
        
        // Add delay between requests (except for the last one)
        if (i < this.timeframes.length - 1) {
          console.log(`⏳ Waiting ${this.delayBetweenRequests/1000} seconds before next request...\n`);
          await this.delay(this.delayBetweenRequests);
        }
        
      } catch (error) {
        console.error(`❌ Failed to seed ${timeframe} data:`, error.message);
        failureCount++;
        
        // Still wait before next request even if this one failed
        if (i < this.timeframes.length - 1) {
          console.log(`⏳ Waiting ${this.delayBetweenRequests/1000} seconds before next request...\n`);
          await this.delay(this.delayBetweenRequests);
        }
      }
    }

    console.log('\n🎉 Chart data seeding completed!');
    console.log(`✅ Successful: ${successCount}/${this.timeframes.length}`);
    console.log(`❌ Failed: ${failureCount}/${this.timeframes.length}`);
    
    if (successCount > 0) {
      console.log('\n📊 You can now view the charts in your BitTrade application!');
    }
  }

  async run() {
    try {
      await this.connect();
      await this.seedAllTimeframes();
    } catch (error) {
      console.error('❌ Seeding process failed:', error);
      process.exit(1);
    } finally {
      await this.disconnect();
    }
  }
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n⚠️  Seeding interrupted by user');
  process.exit(0);
});

// Run the seeder if this file is executed directly
if (require.main === module) {
  console.log('₿itTrade Chart Data Seeder');
  console.log('===========================\n');
  
  const seeder = new ChartDataSeeder();
  seeder.run().catch(console.error);
}

module.exports = ChartDataSeeder;

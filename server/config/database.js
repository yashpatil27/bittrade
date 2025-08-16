const mysql = require('mysql2/promise');
const config = require('./config');
const logger = require('../utils/logger');

// Create MySQL connection pool optimized for BitTrade's usage patterns
const pool = mysql.createPool({
  ...config.database,
  
  // Pool Configuration - Optimized for BitTrade's scale
  connectionLimit: 5,           // Max 5 concurrent connections (perfect for current scale)
  timeout: 60000,        // 60s timeout to get connection from pool
  idleTimeout: 300000,          // Close idle connections after 5 minutes
  
  // Database-specific settings
  supportBigNumbers: true,      // Handle large numbers properly
  bigNumberStrings: true,       // Return big numbers as strings
  dateStrings: true,            // Return dates as strings for consistency
});

// Pool event handlers for monitoring and debugging
pool.on('connection', (connection) => {
  logger.success(`New database connection established (ID: ${connection.threadId})`, 'POOL');
});

pool.on('enqueue', () => {
  logger.debug('Waiting for available database connection', 'POOL');
});

pool.on('error', (err) => {
  logger.error('Database pool error', err, 'POOL');
  
  // Handle specific error types
  if (err.code === 'PROTOCOL_CONNECTION_LOST') {
    logger.warn('Database connection lost - pool will auto-reconnect', 'POOL');
  } else if (err.code === 'ER_CON_COUNT_ERROR') {
    logger.error('Too many database connections - consider increasing pool limit', 'POOL');
  } else if (err.code === 'ECONNREFUSED') {
    logger.error('Database connection refused - check if MySQL is running', 'POOL');
  }
});

// Graceful shutdown handler
process.on('SIGINT', async () => {
  logger.info('Closing database connection pool...', 'POOL');
  try {
    await pool.end();
    logger.success('Database pool closed gracefully', 'POOL');
  } catch (error) {
    logger.error('Error closing database pool', error, 'POOL');
  }
});

process.on('SIGTERM', async () => {
  logger.info('Closing database connection pool...', 'POOL');
  try {
    await pool.end();
    logger.success('Database pool closed gracefully', 'POOL');
  } catch (error) {
    logger.error('Error closing database pool', error, 'POOL');
  }
});

// Test the pool connection on startup
async function testConnection() {
  try {
    const connection = await pool.getConnection();
    await connection.ping();
    connection.release();
    logger.success('Database pool connection test successful', 'POOL');
    return true;
  } catch (error) {
    logger.error('Database pool connection test failed', error, 'POOL');
    return false;
  }
}

// Export both the pool and test function
module.exports = {
  pool,
  testConnection
};

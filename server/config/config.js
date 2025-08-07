// Create database config with proper password handling
const databaseConfig = {
  host: process.env.DB_HOST || '127.0.0.1',
  user: process.env.DB_USER || 'bittrade',
  database: process.env.DB_NAME || 'bittrade',
  timezone: 'Z' // Force UTC timezone for all datetime operations
};

// Only add password if DB_PASSWORD is explicitly set in environment
if (process.env.DB_PASSWORD !== undefined) {
  databaseConfig.password = process.env.DB_PASSWORD;
} else if (process.env.NODE_ENV === 'production') {
  // In production, require a password if not explicitly set
  databaseConfig.password = 'bittrade123';
}
// For development with root user, no password property means no password authentication

module.exports = {
  database: databaseConfig,
  
  redis: {
    host: process.env.REDIS_HOST || '127.0.0.1',
    port: process.env.REDIS_PORT || 6379,
    password: process.env.REDIS_PASSWORD || null,
    db: process.env.REDIS_DB || 0
  },
  
  apis: {
    coingecko: 'https://api.coingecko.com/api/v3',
    fearGreed: 'https://api.alternative.me/fng/'
  },
  
  updateIntervals: {
    bitcoinData: 30, // seconds
    sentiment: '0 0 * * *' // daily at midnight (cron format)
  },
  
  dataRetention: {
    bitcoinDataRecords: 5,
    sentimentRecords: 5
  }
};

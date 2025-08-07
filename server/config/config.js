module.exports = {
  database: {
    host: '127.0.0.1',
    user: process.env.DB_USER || 'bittrade',
    password: process.env.DB_PASSWORD || 'bittrade123',
    database: process.env.DB_NAME || 'bittrade',
    timezone: 'Z' // Force UTC timezone for all datetime operations
  },
  
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

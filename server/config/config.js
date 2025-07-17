module.exports = {
  database: {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '', // Set your MySQL password here or use environment variable
    database: process.env.DB_NAME || 'bittrade'
  },
  
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
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

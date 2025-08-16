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
    db: process.env.REDIS_DB || 0,
    
    // Redis Cluster configuration
    cluster: {
      // Cluster nodes can be specified as environment variable REDIS_CLUSTER_NODES
      // Format: "host1:port1,host2:port2,host3:port3"
      nodes: process.env.REDIS_CLUSTER_NODES ? 
        process.env.REDIS_CLUSTER_NODES.split(',').map(node => {
          const [host, port] = node.trim().split(':');
          return {
            host: host || '127.0.0.1',
            port: parseInt(port) || 6379
          };
        }) : null,
      
      // Single cluster host/port (alternative to nodes list)
      host: process.env.REDIS_CLUSTER_HOST,
      port: process.env.REDIS_CLUSTER_PORT ? parseInt(process.env.REDIS_CLUSTER_PORT) : null,
      
      // Cluster-specific options
      maxRedirections: process.env.REDIS_CLUSTER_MAX_REDIRECTIONS ? parseInt(process.env.REDIS_CLUSTER_MAX_REDIRECTIONS) : 3,
      retryDelayOnFailover: process.env.REDIS_CLUSTER_RETRY_DELAY ? parseInt(process.env.REDIS_CLUSTER_RETRY_DELAY) : 100,
      maxRetriesPerRequest: process.env.REDIS_CLUSTER_MAX_RETRIES ? parseInt(process.env.REDIS_CLUSTER_MAX_RETRIES) : 3
    },
    
    // Connection pooling and reliability options
    options: {
      maxRetriesPerRequest: process.env.REDIS_MAX_RETRIES_PER_REQUEST ? parseInt(process.env.REDIS_MAX_RETRIES_PER_REQUEST) : 3,
      retryDelayOnFailover: process.env.REDIS_RETRY_DELAY_ON_FAILURE ? parseInt(process.env.REDIS_RETRY_DELAY_ON_FAILURE) : 100,
      connectTimeout: process.env.REDIS_CONNECT_TIMEOUT ? parseInt(process.env.REDIS_CONNECT_TIMEOUT) : 10000,
      lazyConnect: process.env.REDIS_LAZY_CONNECT === 'true' || false
    }
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

const { createClient, createCluster } = require('redis');
const config = require('./config');
const logger = require('../utils/logger');

class RedisConnectionManager {
  constructor() {
    this.client = null;
    this.isCluster = false;
    this.isConnected = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 10;
    this.reconnectDelay = 1000; // Start with 1 second delay
    this.maxReconnectDelay = 30000; // Max 30 seconds delay
  }

  /**
   * Initialize Redis connection based on configuration
   * Supports both single Redis instance and Redis Cluster
   */
  async connect() {
    try {
      // Check if already connected
      if (this.isConnected && this.client) {
        logger.info('Redis client already connected', 'REDIS');
        return this.client;
      }

      // Determine if cluster mode is enabled
      this.isCluster = this.isClusterMode();

      if (this.isCluster) {
        await this.connectCluster();
      } else {
        await this.connectSingle();
      }

      this.setupEventHandlers();
      this.isConnected = true;
      this.reconnectAttempts = 0;

      logger.success(`Redis ${this.isCluster ? 'Cluster' : 'Client'} connected successfully`, 'REDIS');
      return this.client;

    } catch (error) {
      logger.error('Redis connection failed', error, 'REDIS');
      throw error;
    }
  }

  /**
   * Check if cluster mode should be used
   */
  isClusterMode() {
    // Check for cluster-specific environment variables
    return !!(
      process.env.REDIS_CLUSTER_NODES ||
      process.env.REDIS_CLUSTER_HOST ||
      (config.redis.cluster && config.redis.cluster.nodes)
    );
  }

  /**
   * Connect to single Redis instance
   */
  async connectSingle() {
    const clientConfig = {
      socket: {
        host: config.redis.host,
        port: config.redis.port,
        connectTimeout: 10000,
        lazyConnect: false,
        reconnectStrategy: (retries) => this.getReconnectDelay(retries)
      },
      database: config.redis.db
    };

    // Add password if provided
    if (config.redis.password) {
      clientConfig.password = config.redis.password;
    }

    // Add additional Redis options from environment
    if (process.env.REDIS_MAX_RETRIES_PER_REQUEST) {
      clientConfig.socket.maxRetriesPerRequest = parseInt(process.env.REDIS_MAX_RETRIES_PER_REQUEST);
    }

    if (process.env.REDIS_RETRY_DELAY_ON_FAILURE) {
      clientConfig.socket.retryDelayOnFailover = parseInt(process.env.REDIS_RETRY_DELAY_ON_FAILURE);
    }

    this.client = createClient(clientConfig);
    await this.client.connect();
    
    logger.info(`Connected to Redis at ${config.redis.host}:${config.redis.port}`, 'REDIS');
  }

  /**
   * Connect to Redis Cluster
   */
  async connectCluster() {
    const clusterConfig = {
      rootNodes: this.getClusterNodes(),
      defaults: {
        socket: {
          connectTimeout: 10000,
          lazyConnect: false,
          reconnectStrategy: (retries) => this.getReconnectDelay(retries)
        }
      },
      useReplicas: true, // Enable read from replicas for better performance
      enableAutoPipelining: true // Automatic command pipelining
    };

    // Add password if provided
    if (config.redis.password) {
      clusterConfig.defaults.password = config.redis.password;
    }

    // Add cluster-specific options
    if (process.env.REDIS_CLUSTER_MAX_REDIRECTIONS) {
      clusterConfig.maxCommandRedirections = parseInt(process.env.REDIS_CLUSTER_MAX_REDIRECTIONS);
    }

    if (process.env.REDIS_CLUSTER_RETRY_DELAY) {
      clusterConfig.defaults.socket.retryDelayOnFailover = parseInt(process.env.REDIS_CLUSTER_RETRY_DELAY);
    }

    this.client = createCluster(clusterConfig);
    await this.client.connect();

    logger.info(`Connected to Redis Cluster with ${clusterConfig.rootNodes.length} nodes`, 'REDIS');
  }

  /**
   * Get cluster node configuration
   */
  getClusterNodes() {
    // Priority 1: Environment variable with comma-separated nodes
    if (process.env.REDIS_CLUSTER_NODES) {
      return process.env.REDIS_CLUSTER_NODES.split(',').map(node => {
        const [host, port] = node.trim().split(':');
        return {
          host: host || '127.0.0.1',
          port: parseInt(port) || 6379
        };
      });
    }

    // Priority 2: Single cluster host/port from environment
    if (process.env.REDIS_CLUSTER_HOST) {
      return [{
        host: process.env.REDIS_CLUSTER_HOST,
        port: parseInt(process.env.REDIS_CLUSTER_PORT) || 6379
      }];
    }

    // Priority 3: Configuration object
    if (config.redis.cluster && config.redis.cluster.nodes) {
      return config.redis.cluster.nodes;
    }

    // Fallback: Use regular Redis config as single cluster node
    return [{
      host: config.redis.host,
      port: config.redis.port
    }];
  }

  /**
   * Calculate reconnection delay with exponential backoff
   */
  getReconnectDelay(retries) {
    if (retries >= this.maxReconnectAttempts) {
      logger.error(`Max reconnection attempts (${this.maxReconnectAttempts}) reached`, null, 'REDIS');
      return false; // Stop reconnecting
    }

    const delay = Math.min(
      this.reconnectDelay * Math.pow(2, retries),
      this.maxReconnectDelay
    );

    logger.warn(`Redis reconnection attempt ${retries + 1} in ${delay}ms`, 'REDIS');
    return delay;
  }

  /**
   * Set up event handlers for connection monitoring
   */
  setupEventHandlers() {
    this.client.on('error', (error) => {
      logger.error('Redis client error', error, 'REDIS');
      this.isConnected = false;
    });

    this.client.on('connect', () => {
      logger.info('Redis client connected', 'REDIS');
      this.isConnected = true;
      this.reconnectAttempts = 0;
    });

    this.client.on('ready', () => {
      logger.success('Redis client ready for commands', 'REDIS');
    });

    this.client.on('end', () => {
      logger.warn('Redis connection ended', 'REDIS');
      this.isConnected = false;
    });

    this.client.on('reconnecting', () => {
      this.reconnectAttempts++;
      logger.info(`Redis reconnecting (attempt ${this.reconnectAttempts})`, 'REDIS');
    });

    // Cluster-specific events
    if (this.isCluster) {
      this.client.on('shardError', (error, shard) => {
        logger.error(`Redis cluster shard error on ${shard.host}:${shard.port}`, error, 'REDIS');
      });

      this.client.on('nodeError', (error, node) => {
        logger.error(`Redis cluster node error on ${node.host}:${node.port}`, error, 'REDIS');
      });
    }
  }

  /**
   * Get the Redis client instance
   */
  getClient() {
    if (!this.client || !this.isConnected) {
      throw new Error('Redis client not connected. Call connect() first.');
    }
    return this.client;
  }

  /**
   * Check if Redis is connected and ready
   */
  isReady() {
    return this.isConnected && this.client && this.client.isReady;
  }

  /**
   * Get connection status information
   */
  getConnectionInfo() {
    return {
      isConnected: this.isConnected,
      isCluster: this.isCluster,
      isReady: this.isReady(),
      reconnectAttempts: this.reconnectAttempts
    };
  }

  /**
   * Gracefully disconnect from Redis
   */
  async disconnect() {
    try {
      if (this.client) {
        await this.client.quit();
        logger.info(`Redis ${this.isCluster ? 'Cluster' : 'Client'} disconnected gracefully`, 'REDIS');
      }
    } catch (error) {
      logger.error('Error during Redis disconnection', error, 'REDIS');
    } finally {
      this.isConnected = false;
      this.client = null;
    }
  }

  /**
   * Force disconnect (for emergency situations)
   */
  async forceDisconnect() {
    try {
      if (this.client) {
        await this.client.disconnect();
        logger.warn(`Redis ${this.isCluster ? 'Cluster' : 'Client'} force disconnected`, 'REDIS');
      }
    } catch (error) {
      logger.error('Error during Redis force disconnection', error, 'REDIS');
    } finally {
      this.isConnected = false;
      this.client = null;
    }
  }

  /**
   * Test the Redis connection
   */
  async testConnection() {
    try {
      if (!this.isReady()) {
        return false;
      }

      const result = await this.client.ping();
      return result === 'PONG';
    } catch (error) {
      logger.error('Redis connection test failed', error, 'REDIS');
      return false;
    }
  }

  /**
   * Get Redis info
   */
  async getInfo(section = null) {
    try {
      if (!this.isReady()) {
        throw new Error('Redis not connected');
      }

      if (section) {
        return await this.client.info(section);
      }
      return await this.client.info();
    } catch (error) {
      logger.error('Error getting Redis info', error, 'REDIS');
      throw error;
    }
  }
}

// Create singleton instance
const redisManager = new RedisConnectionManager();

// Export both the manager instance and convenience methods
module.exports = {
  redisManager,
  
  // Convenience methods for easy access
  connect: () => redisManager.connect(),
  getClient: () => redisManager.getClient(),
  disconnect: () => redisManager.disconnect(),
  isReady: () => redisManager.isReady(),
  testConnection: () => redisManager.testConnection(),
  getConnectionInfo: () => redisManager.getConnectionInfo()
};

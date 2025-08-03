# BitTrade Server Documentation

## Overview

The BitTrade server is a robust Node.js-based API server that provides cryptocurrency trading functionality, real-time data management, and WebSocket communication. Built with Express.js, it integrates with external APIs for Bitcoin data, manages user authentication, and handles trading operations with comprehensive balance management.

## Technology Stack

### Core Technologies
- **Node.js** - JavaScript runtime environment
- **Express.js 4.18.2** - Web application framework
- **Socket.IO 4.8.1** - Real-time bidirectional event-based communication
- **MySQL2 3.6.0** - MySQL database client with promise support
- **Redis 4.7.1** - In-memory data structure store for caching

### Security & Authentication
- **JSON Web Tokens (jsonwebtoken 9.0.2)** - Secure token-based authentication
- **bcrypt 6.0.0** - Password hashing and encryption
- **CORS 2.8.5** - Cross-Origin Resource Sharing middleware

### External Integrations
- **Axios 1.5.0** - HTTP client for external API calls
- **Node-cron 3.0.2** - Task scheduler for automated data updates

### Development Tools
- **Nodemon 3.0.1** - Development server with auto-reload

## Project Structure

```
server/
├── config/
│   └── config.js              # Database and API configuration
├── middleware/
│   └── auth.js                # Authentication middleware
├── routes/
│   └── auth.js                # Authentication routes
├── services/
│   └── data-service.js        # External data integration service
├── package.json               # Dependencies and scripts
├── server.js                  # Main server application
└── index.js                   # Server entry point
```

## Core Features

### 1. Real-Time Data Management
- **Bitcoin Price Tracking**: Fetches Bitcoin data every 30 seconds from CoinGecko API
- **Market Data Broadcasting**: Real-time price updates via WebSocket
- **Chart Data**: Multi-timeframe chart data (1d, 7d, 30d, 90d, 365d)
- **Sentiment Analysis**: Fear & Greed Index integration
- **Redis Caching**: High-performance data caching for instant responses

### 2. User Authentication & Authorization
- **JWT-based Authentication**: Secure token-based user sessions
- **Password Security**: bcrypt hashing for password protection
- **Protected Routes**: Middleware-based route protection
- **WebSocket Authentication**: Secure real-time connections

### 3. Trading System
- **Market Orders**: Real-time buy/sell execution
- **Balance Management**: Multi-currency balance tracking (INR/BTC)
- **Transaction History**: Comprehensive transaction logging
- **Price Calculation**: Dynamic buy/sell rate calculation
- **Balance Validation**: Real-time balance checking before trades

### 4. Database Integration
- **MySQL Integration**: Robust relational database operations
- **Transaction Support**: ACID-compliant trade execution
- **Connection Pooling**: Efficient database connection management
- **Migration Support**: Database schema versioning

### 5. External API Integration
- **CoinGecko API**: Real-time Bitcoin market data
- **Alternative.me API**: Fear & Greed Index data
- **Rate Limiting**: Respectful API usage patterns
- **Error Handling**: Graceful API failure management

## API Endpoints

### Authentication Routes

#### POST /api/auth/register
```javascript
// User registration
{
  "email": "user@example.com",
  "password": "securepassword",
  "name": "User Name"
}

Response:
{
  "message": "User registered successfully",
  "token": "jwt_token_here",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "name": "User Name"
  }
}
```

#### POST /api/auth/login
```javascript
// User login
{
  "email": "user@example.com",
  "password": "securepassword"
}

Response:
{
  "message": "Login successful",
  "token": "jwt_token_here",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "name": "User Name"
  }
}
```

### Market Data Routes

#### GET /api/bitcoin/current
```javascript
// Get current Bitcoin market data
Response:
{
  "id": 1,
  "btc_usd_price": 45000,
  "market_cap_usd": 850000000000,
  "volume_24h_usd": 25000000000,
  "high_24h_usd": 46000,
  "ath_usd": 69000,
  "ath_date": "2021-11-10",
  "ath_change_pct": -34.78,
  "last_updated": "2024-07-20T10:30:00.000Z",
  "buy_rate_inr": 4095000,    // btc_usd_price * 91
  "sell_rate_inr": 3960000,   // btc_usd_price * 88
  "cached": true
}
```

#### GET /api/market-rates
```javascript
// Get current buy/sell rates (optimized for trading)
Response:
{
  "btc_usd_price": 45000,
  "buy_rate_inr": 4095000,
  "sell_rate_inr": 3960000,
  "timestamp": "2024-07-20T10:30:00.000Z",
  "cached": true
}
```

#### GET /api/bitcoin/chart/:timeframe
```javascript
// Get chart data for specific timeframe
// Timeframes: 1d, 7d, 30d, 90d, 365d

Response:
{
  "timeframe": "1d",
  "price_data": [
    {
      "timestamp": "2024-07-20T00:00:00.000Z",
      "price": 44500
    },
    // ... more data points
  ],
  "data_points_count": 288,
  "price_change_pct": 2.25,
  "date_from": "2024-07-19T10:30:00",
  "date_to": "2024-07-20T10:30:00",
  "last_updated": "2024-07-20T10:30:00.000Z",
  "cached": false
}
```

#### GET /api/bitcoin/sentiment
```javascript
// Get Bitcoin Fear & Greed Index
Response:
{
  "id": 1,
  "fear_greed_value": 72,
  "fear_greed_classification": "Greed",
  "data_date": "2024-07-20",
  "last_updated": "2024-07-20T10:30:00.000Z"
}
```

#### GET /api/bitcoin/history
```javascript
// Get recent Bitcoin price history
Query Parameters:
- limit: Number of records (default: 10)

Response:
[
  {
    "id": 1,
    "btc_usd_price": 45000,
    "market_cap_usd": 850000000000,
    "created_at": "2024-07-20T10:30:00.000Z"
  },
  // ... more records
]
```

### Trading Routes (Protected)

#### POST /api/trade
```javascript
// Execute a market order
Headers: { "Authorization": "Bearer jwt_token" }

Request:
{
  "action": "buy",           // "buy" or "sell"
  "type": "market",         // Only market orders supported
  "amount": "1000",         // Amount in specified currency
  "currency": "inr"         // "inr" or "btc"
}

Response:
{
  "id": 123,
  "type": "MARKET_BUY",
  "action": "buy",
  "btc_amount": 2222222,      // Amount in satoshis
  "inr_amount": 1000,         // Amount in rupees
  "execution_price": 4095000, // Price per BTC in INR
  "status": "EXECUTED",
  "timestamp": "2024-07-20T10:30:00.000Z",
  "updated_balance": {
    "available_inr": 9000,
    "available_btc": 2222222,
    // ... other balance fields
  }
}
```

### User Data Routes (Protected)

#### GET /api/balance
```javascript
// Get user balance
Headers: { "Authorization": "Bearer jwt_token" }

Response:
{
  "available_inr": 10000,      // Available INR in rupees
  "available_btc": 5000000,    // Available BTC in satoshis
  "reserved_inr": 0,           // INR locked in orders
  "reserved_btc": 0,           // BTC locked in orders
  "collateral_btc": 0,         // BTC locked as collateral
  "borrowed_inr": 0,           // INR borrowed against collateral
  "interest_accrued": 0        // Accumulated interest
}
```

#### GET /api/transactions
```javascript
// Get user transaction history
Headers: { "Authorization": "Bearer jwt_token" }

Query Parameters:
- limit: Number of transactions (default: 50)
- page: Page number (default: 1)

Response:
{
  "transactions": [
    {
      "id": 123,
      "type": "MARKET_BUY",
      "status": "EXECUTED",
      "btc_amount": 2222222,
      "inr_amount": 1000,
      "execution_price": 4095000,
      "created_at": "2024-07-20T10:30:00.000Z",
      "executed_at": "2024-07-20T10:30:00.000Z",
      "cached": false
    }
    // ... more transactions
  ],
  "page": 1,
  "limit": 50,
  "hasMore": true
}
```

### Utility Routes

#### GET /api/health
```javascript
// Health check endpoint
Response:
{
  "status": "OK",
  "timestamp": "2024-07-20T10:30:00.000Z",
  "server": "BitTrade API Server"
}
```

## WebSocket Events

### Connection Management

#### Client Connection
```javascript
// Client connects to WebSocket
socket.on('connection', (socket) => {
  // Server sends welcome message
  socket.emit('connection_established', {
    message: 'Connected to BitTrade WebSocket',
    timestamp: '2024-07-20T10:30:00.000Z'
  });
});
```

#### Authentication
```javascript
// Client authenticates WebSocket connection
socket.emit('authenticate', jwt_token);

// Server responds
socket.emit('authentication_success', {
  message: 'WebSocket authenticated successfully',
  userId: 1,
  email: 'user@example.com'
});

// Or on failure
socket.emit('authentication_error', {
  message: 'Authentication failed',
  error: 'Invalid token'
});
```

### Real-Time Data Events

#### Bitcoin Price Updates
```javascript
// Server broadcasts price changes to all clients
socket.emit('btc_price_update', {
  btc_usd_price: 45000,
  buy_rate_inr: 4095000,
  sell_rate_inr: 3960000,
  timestamp: '2024-07-20T10:30:00.000Z'
});
```

#### User-Specific Events (Authenticated)
```javascript
// Balance updates (sent to specific user)
socket.emit('user_balance_update', {
  available_inr: 9000,
  available_btc: 2222222,
  // ... other balance fields
  timestamp: '2024-07-20T10:30:00.000Z'
});

// Transaction updates (sent to specific user)
socket.emit('user_transaction_update', {
  transactions: [
    // ... latest 15 transactions
  ],
  timestamp: '2024-07-20T10:30:00.000Z'
});
```

## Configuration

### Environment Variables
```bash
# Server Configuration
PORT=3001
NODE_ENV=production

# Database Configuration
DB_HOST=localhost
DB_PORT=3306
DB_NAME=bittrade
DB_USER=bittrade_user
DB_PASSWORD=secure_password

# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=redis_password
REDIS_DB=0

# Authentication
JWT_SECRET=your_super_secure_jwt_secret_key_here

# API Configuration
COINGECKO_API_URL=https://api.coingecko.com/api/v3
FEAR_GREED_API_URL=https://api.alternative.me/fng
```

### Config File Structure
```javascript
// config/config.js
module.exports = {
  database: {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    database: process.env.DB_NAME || 'bittrade',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || ''
  },
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT || 6379,
    password: process.env.REDIS_PASSWORD || null,
    db: process.env.REDIS_DB || 0
  },
  apis: {
    coingecko: process.env.COINGECKO_API_URL || 'https://api.coingecko.com/api/v3',
    fearGreed: process.env.FEAR_GREED_API_URL || 'https://api.alternative.me/fng'
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'bittrade_secret_key_2024',
    expiresIn: '24h'
  }
};
```

## Data Service Architecture

### DataService Class
```javascript
// services/data-service.js
class DataService {
  constructor(io = null) {
    this.db = null;           // MySQL connection
    this.redis = null;        // Redis client
    this.io = io;            // Socket.IO instance
    this.lastBtcPrice = null; // Track price changes
    this.settings = {         // Cached settings
      buy_multiplier: 91,     // USD to INR buy rate
      sell_multiplier: 88     // USD to INR sell rate
    };
  }
}
```

### Key Methods

#### Rate Calculation
```javascript
calculateRates(btcUsdPrice) {
  return {
    btc_usd_price: btcUsdPrice,
    buy_rate_inr: Math.round(btcUsdPrice * this.settings.buy_multiplier),
    sell_rate_inr: Math.round(btcUsdPrice * this.settings.sell_multiplier)
  };
}
```

#### Price Broadcasting
```javascript
broadcastPriceUpdate(btcUsdPrice) {
  const rates = this.calculateRates(btcUsdPrice);
  
  this.io.emit('btc_price_update', {
    btc_usd_price: rates.btc_usd_price,
    buy_rate_inr: rates.buy_rate_inr,
    sell_rate_inr: rates.sell_rate_inr,
    timestamp: new Date().toISOString()
  });
}
```

### Scheduled Tasks

#### Data Update Schedule
```javascript
// Bitcoin data: Every 30 seconds
cron.schedule('*/30 * * * * *', async () => {
  await this.updateBitcoinData();
});

// Sentiment data: Daily at midnight
cron.schedule('0 0 * * *', async () => {
  await this.updateBitcoinSentiment();
});

// Chart data: Staggered updates
const schedules = [
  { timeframe: '1d', updateInterval: '0 * * * *' },      // Every hour
  { timeframe: '7d', updateInterval: '0 */6 * * *' },    // Every 6 hours
  { timeframe: '30d', updateInterval: '0 */12 * * *' },  // Every 12 hours
  { timeframe: '90d', updateInterval: '0 */18 * * *' },  // Every 18 hours
  { timeframe: '365d', updateInterval: '0 0 * * *' }     // Daily
];
```

## Caching Strategy

### Redis Cache Implementation

#### Cache Keys
```javascript
// Price data
'latest_btc_price' // Current Bitcoin market data

// Chart data
'chart_data_1d'    // 1-day chart data
'chart_data_7d'    // 7-day chart data
'chart_data_30d'   // 30-day chart data
'chart_data_90d'   // 90-day chart data
'chart_data_365d'  // 365-day chart data

// User data
'user_balance_${userId}'      // User balance data
'user_transactions_${userId}' // User transaction history
```

#### Cache TTL (Time To Live)
```javascript
const cacheTTL = {
  'latest_btc_price': 60,        // 1 minute
  'chart_data_1d': 3600,        // 1 hour
  'chart_data_7d': 21600,       // 6 hours
  'chart_data_30d': 43200,      // 12 hours
  'chart_data_90d': 64800,      // 18 hours
  'chart_data_365d': 86400,     // 24 hours
  'user_balance': 600,          // 10 minutes
  'user_transactions': 3600      // 1 hour
};
```

### Cache-First Strategy
1. **Check Redis Cache**: Always check cache first for instant response
2. **Fallback to Database**: If cache miss, query database
3. **Update Cache**: Store database result in cache for future requests
4. **Return Data**: Send response with cache status indicator

## Authentication & Security

### JWT Implementation
```javascript
// Token generation
const token = jwt.sign(
  { id: user.id, email: user.email },
  process.env.JWT_SECRET || 'bittrade_secret_key_2024',
  { expiresIn: '24h' }
);

// Token verification middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }
  
  jwt.verify(token, process.env.JWT_SECRET || 'bittrade_secret_key_2024', (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
};
```

### Password Security
```javascript
// Password hashing during registration
const hashedPassword = await bcrypt.hash(password, 12);

// Password verification during login
const isValidPassword = await bcrypt.compare(password, user.password_hash);
```

### WebSocket Authentication
```javascript
socket.on('authenticate', async (token) => {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.userId = decoded.id;
    socket.userEmail = decoded.email;
    
    // Add to authenticated user mapping
    userSockets.set(decoded.id, socket.id);
    
    socket.emit('authentication_success', {
      message: 'WebSocket authenticated successfully',
      userId: decoded.id,
      email: decoded.email
    });
  } catch (error) {
    socket.emit('authentication_error', {
      message: 'Authentication failed',
      error: error.message
    });
  }
});
```

## Database Operations

### Transaction Management
```javascript
// Trading operations use database transactions for ACID compliance
await db.beginTransaction();

try {
  // 1. Create transaction record
  const [transactionResult] = await db.execute(
    `INSERT INTO transactions (user_id, type, status, btc_amount, inr_amount, execution_price, executed_at) 
     VALUES (?, ?, 'EXECUTED', ?, ?, ?, NOW())`,
    [userId, transactionType, btcAmount, inrAmount, executionPrice]
  );
  
  // 2. Update user balance
  if (action === 'buy') {
    await db.execute(
      'UPDATE users SET available_inr = available_inr - ?, available_btc = available_btc + ? WHERE id = ?',
      [inrAmount, btcAmount, userId]
    );
  } else {
    await db.execute(
      'UPDATE users SET available_btc = available_btc - ?, available_inr = available_inr + ? WHERE id = ?',
      [btcAmount, inrAmount, userId]
    );
  }
  
  await db.commit();
} catch (error) {
  await db.rollback();
  throw error;
}
```

### Connection Management
```javascript
// Database connection with automatic reconnection
async function initDB() {
  try {
    db = await mysql.createConnection(config.database);
    console.log('Database connected for API server');
  } catch (error) {
    console.error('Database connection failed:', error);
    process.exit(1);
  }
}
```

## Error Handling

### Global Error Middleware
```javascript
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});
```

### Graceful Shutdown
```javascript
process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down server...');
  
  // Stop data service
  if (global.dataService) {
    await global.dataService.stop();
  }
  
  // Close database connection
  if (db) {
    await db.end();
  }
  
  process.exit(0);
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  process.exit(1);
});

process.on('unhandledRejection', (err) => {
  console.error('Unhandled Rejection:', err);
  process.exit(1);
});
```

## Performance Optimizations

### Caching Strategy
- **Redis Integration**: In-memory caching for high-frequency data
- **Cache-First Approach**: Check cache before database queries
- **Intelligent TTL**: Different cache durations based on data volatility
- **Cache Invalidation**: Strategic cache clearing on data updates

### Database Optimization
- **Connection Pooling**: Efficient database connection management
- **Indexed Queries**: Optimized database queries with proper indexing
- **Transaction Batching**: Group related operations in database transactions
- **Query Optimization**: Minimize database round trips

### WebSocket Optimization
- **User Mapping**: Efficient user-to-socket mapping for targeted broadcasts
- **Event Filtering**: Send only relevant events to specific users
- **Connection Management**: Proper cleanup on disconnect
- **Heartbeat Monitoring**: Connection health monitoring

## Development Workflow

### Available Scripts
```bash
# Development
npm run dev                 # Start with nodemon (auto-reload)
npm start                  # Start production server
npm test                   # Run test suite (placeholder)

# From root directory
npm run server:dev         # Start server development
npm run dev               # Start both client and server
npm run install:all       # Install all dependencies
```

### Development Setup
```bash
# Install dependencies
cd server
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your configuration

# Start development server
npm run dev
```

## Monitoring & Logging

### Server Logging
```javascript
// Comprehensive logging throughout the application
console.log('🚀 BitTrade API Server running on port', PORT);
console.log('📱 Server accessible at http://localhost:' + PORT);
console.log('🏥 Health check: http://localhost:' + PORT + '/api/health');
console.log('🌐 WebSocket server ready for real-time data broadcasting');
console.log('📡 Connected clients:', io.engine.clientsCount);

// Data service logging
console.log('💰 Bitcoin price changed: $45000 → $45100 ⬆️');
console.log('📡 Broadcasted btc_price_update to 5 clients');
console.log('💾 Balance cached in Redis: user_balance_123');
console.log('📦 Cached 1d chart data from database request (TTL: 3600s)');
```

### Performance Metrics
- **Response Times**: Track API response times
- **Cache Hit Rates**: Monitor Redis cache effectiveness
- **WebSocket Connections**: Track active connections and events
- **Database Query Performance**: Monitor query execution times
- **External API Response Times**: Track third-party API performance

## Deployment

### Production Configuration
```javascript
// Production environment variables
NODE_ENV=production
PORT=3001

// Database (Production)
DB_HOST=production-db-host
DB_NAME=bittrade_prod
DB_USER=bittrade_prod_user
DB_PASSWORD=very_secure_production_password

// Redis (Production)
REDIS_HOST=production-redis-host
REDIS_PASSWORD=secure_redis_password

// Security
JWT_SECRET=super_secure_production_jwt_secret_256_bit
```

### Process Management
```bash
# Using PM2 for production
npm install -g pm2

# Start server with PM2
pm2 start server.js --name "bittrade-server"

# Monitor
pm2 list
pm2 logs bittrade-server
pm2 restart bittrade-server
```

### Load Balancing
- **Horizontal Scaling**: Multiple server instances behind load balancer
- **Session Affinity**: Sticky sessions for WebSocket connections
- **Redis Clustering**: Distributed caching for multiple server instances
- **Database Clustering**: Master-slave database setup for read scaling

## Security Best Practices

### API Security
- **Rate Limiting**: Prevent API abuse
- **Input Validation**: Sanitize all user inputs
- **SQL Injection Protection**: Use parameterized queries
- **CORS Configuration**: Restrict cross-origin requests
- **HTTPS Only**: Force secure connections in production

### Authentication Security
- **Strong JWT Secrets**: 256-bit random keys
- **Token Expiration**: Limited token lifetime
- **Password Requirements**: Strong password policies
- **Account Lockouts**: Prevent brute force attacks
- **Audit Logging**: Track authentication events

### Data Protection
- **Environment Variables**: Never commit secrets to version control
- **Database Encryption**: Encrypt sensitive data at rest
- **Connection Security**: Use TLS for all external connections
- **Access Control**: Principle of least privilege
- **Regular Updates**: Keep dependencies updated

## Troubleshooting

### Common Issues

#### Database Connection Errors
```javascript
// Check database configuration
console.log('Database config:', config.database);

// Test connection
mysql.createConnection(config.database)
  .then(() => console.log('Database connection successful'))
  .catch(err => console.error('Database connection failed:', err));
```

#### Redis Connection Issues
```javascript
// Check Redis configuration
console.log('Redis config:', config.redis);

// Test Redis connection
const redis = createClient(config.redis);
redis.on('error', (err) => console.error('Redis error:', err));
redis.on('connect', () => console.log('Redis connected'));
```

#### WebSocket Connection Problems
```javascript
// Monitor WebSocket connections
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);
  
  socket.on('disconnect', (reason) => {
    console.log('Client disconnected:', socket.id, reason);
  });
  
  socket.on('error', (error) => {
    console.error('Socket error:', socket.id, error);
  });
});
```

#### External API Failures
```javascript
// Implement retry logic for external APIs
async function fetchWithRetry(url, options, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await axios.get(url, options);
    } catch (error) {
      console.warn(`API call failed (attempt ${i + 1}/${maxRetries}):`, error.message);
      if (i === maxRetries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
    }
  }
}
```

### Debug Mode
```bash
# Enable debug logging
DEBUG=bittrade:* npm run dev

# Or set in environment
export DEBUG=bittrade:*
```

### Health Monitoring
```javascript
// Health check endpoint provides system status
GET /api/health

{
  "status": "OK",
  "timestamp": "2024-07-20T10:30:00.000Z",
  "server": "BitTrade API Server",
  "database": "connected",
  "redis": "connected",
  "external_apis": "operational"
}
```

## Contributing

### Code Standards
- **ESLint**: JavaScript code linting
- **Prettier**: Code formatting
- **JSDoc**: Function documentation
- **Error Handling**: Comprehensive error management
- **Logging**: Consistent logging throughout

### Development Guidelines
- **Async/Await**: Use modern async patterns
- **Error Boundaries**: Proper error handling at all levels
- **Security First**: Security considerations in all code
- **Performance**: Optimize for high-throughput scenarios
- **Testing**: Write comprehensive tests for new features

### Pull Request Process
1. **Feature Branch**: Create feature branch from main
2. **Code Review**: Peer review required
3. **Testing**: All tests must pass
4. **Documentation**: Update relevant documentation
5. **Security Review**: Security implications assessed

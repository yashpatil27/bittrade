# BitTrade API Documentation

## Overview

BitTrade is a cryptocurrency trading platform that provides REST API endpoints for user authentication, Bitcoin market data, and trading functionality. The API supports real-time updates via WebSocket connections and uses Redis caching for optimal performance.

**Base URL**: `http://localhost:3001/api`  
**WebSocket URL**: `http://localhost:3001`

---

## 🔐 Authentication

The API uses JWT (JSON Web Tokens) for authentication. Protected endpoints require an `Authorization` header with a Bearer token.

### Header Format
```
Authorization: Bearer <your_jwt_token>
```

### Token Expiration
- Tokens expire after 24 hours
- Use the `/api/auth/verify` endpoint to check token validity

---

## 📋 API Endpoints

### 🔐 Authentication Endpoints

#### 1. Register User
**POST** `/api/auth/register`

Register a new user account.

**Request Body:**
```json
{
  "email": "user@example.com",
  "name": "John Doe",
  "password": "password123",
  "confirmPassword": "password123"
}
```

**Response (201):**
```json
{
  "message": "User registered successfully",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "name": "John Doe"
  }
}
```

**Validation:**
- All fields are required
- Password must be at least 6 characters
- Email must be valid format
- Email must be unique

---

#### 2. Login User
**POST** `/api/auth/login`

Authenticate existing user.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response (200):**
```json
{
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "name": "John Doe"
  }
}
```

---

#### 3. Verify Token
**GET** `/api/auth/verify`

Verify JWT token validity.

**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
{
  "valid": true,
  "user": {
    "id": 1,
    "email": "user@example.com",
    "name": "John Doe"
  }
}
```

---

### 📊 Bitcoin Data Endpoints

#### 4. Get Current Bitcoin Data
**GET** `/api/bitcoin/current`

Get current Bitcoin price and market data.

**Response (200):**
```json
{
  "btc_usd_price": 45000.50,
  "buy_rate_inr": 4095045.50,
  "sell_rate_inr": 3960044.00,
  "cached": true,
  "created_at": "2024-01-15T10:30:00.000Z"
}
```

**Features:**
- Redis cache-first with database fallback
- Real-time market rates calculation
- INR conversion rates included

---

#### 5. Get Market Rates
**GET** `/api/market-rates`

Get current market rates for trading.

**Response (200):**
```json
{
  "btc_usd_price": 45000.50,
  "buy_rate_inr": 4095045.50,
  "sell_rate_inr": 3960044.00,
  "timestamp": "2024-01-15T10:30:00.000Z",
  "cached": true
}
```

---

#### 6. Get Chart Data
**GET** `/api/bitcoin/chart/:timeframe`

Get Bitcoin chart data for specified timeframe.

**URL Parameters:**
- `timeframe`: `1d`, `7d`, `30d`, `90d`, `365d`

**Example:** `/api/bitcoin/chart/7d`

**Response (200):**
```json
{
  "timeframe": "7d",
  "price_data": [
    {
      "timestamp": "2024-01-15T00:00:00.000Z",
      "price": 45000.50
    }
  ],
  "data_points_count": 168,
  "price_change_pct": 2.5,
  "date_from": "2024-01-08T00:00:00.000Z",
  "date_to": "2024-01-15T00:00:00.000Z",
  "last_updated": "2024-01-15T10:30:00.000Z",
  "cached": true
}
```

**Cache TTL:**
- 1d: 1 hour
- 7d: 6 hours
- 30d: 12 hours
- 90d: 18 hours
- 365d: 24 hours

---

#### 7. Get Sentiment Data
**GET** `/api/bitcoin/sentiment`

Get Bitcoin sentiment analysis data.

**Response (200):**
```json
{
  "sentiment_score": 0.75,
  "sentiment_label": "Bullish",
  "data_date": "2024-01-15",
  "fear_greed_index": 68,
  "created_at": "2024-01-15T10:30:00.000Z"
}
```

---

#### 8. Get Bitcoin History
**GET** `/api/bitcoin/history`

Get recent Bitcoin price history.

**Query Parameters:**
- `limit` (optional): Number of records (default: 10, max: 100)

**Example:** `/api/bitcoin/history?limit=20`

**Response (200):**
```json
[
  {
    "id": 1,
    "btc_usd_price": 45000.50,
    "created_at": "2024-01-15T10:30:00.000Z"
  }
]
```

---

### 💰 Trading Endpoints

#### 9. Execute Trade
**POST** `/api/trade`

Execute a market buy or sell order.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "action": "buy",
  "type": "market",
  "amount": "100.50",
  "currency": "inr"
}
```

**Parameters:**
- `action`: `"buy"` or `"sell"`
- `type`: `"market"` (only market orders supported)
- `amount`: String representation of amount
- `currency`: `"inr"` or `"btc"`

**Response (201):**
```json
{
  "id": 123,
  "type": "MARKET_BUY",
  "action": "buy",
  "btc_amount": 223456,
  "inr_amount": 10050,
  "execution_price": 4095045.50,
  "status": "EXECUTED",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "updated_balance": {
    "available_inr": 989950.00,
    "available_btc": 223456,
    "reserved_inr": 0.00,
    "reserved_btc": 0,
    "collateral_btc": 0,
    "borrowed_inr": 0.00,
    "interest_accrued": 0.00
  }
}
```

**Features:**
- Real-time balance validation
- Automatic balance updates
- WebSocket notifications
- Database transaction support

**Validation:**
- Sufficient balance check
- Positive amount validation
- Market rate availability check

---

#### 10. Get User Balance
**GET** `/api/balance`

Get user's current balance.

**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
{
  "available_inr": 1000000.00,
  "available_btc": 223456,
  "reserved_inr": 0.00,
  "reserved_btc": 0,
  "collateral_btc": 0,
  "borrowed_inr": 0.00,
  "interest_accrued": 0.00
}
```

**Features:**
- Redis caching (10 minutes TTL)
- Real-time balance data
- WebSocket updates

**Note:** BTC amounts are in satoshis (1 BTC = 100,000,000 satoshis)

---

#### 11. Get Transaction History
**GET** `/api/transactions`

Get user's transaction history.

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
- `limit` (optional): Number of transactions (default: 50, max: 100)

**Example:** `/api/transactions?limit=20`

**Response (200):**
```json
[
  {
    "id": 123,
    "type": "buy",
    "btc_amount": 223456,
    "inr_amount": 10050.00,
    "execution_price": 4095045.50,
    "date": "2024-01-15T10:30:00.000Z",
    "status": "executed"
  }
]
```

**Features:**
- Only returns executed transactions
- Ordered by most recent first
- Formatted for frontend consumption

---

### 🔧 System Endpoints

#### 12. Health Check
**GET** `/api/health`

Check server health status.

**Response (200):**
```json
{
  "status": "OK",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "server": "BitTrade API Server"
}
```

---

## 🌐 WebSocket Real-Time Updates

The API supports WebSocket connections for real-time data updates.

### Connection
```javascript
const socket = io('http://localhost:3001');
```

### Authentication
```javascript
// Send JWT token for user-specific updates
socket.emit('authenticate', 'your_jwt_token_here');

// Listen for authentication response
socket.on('authentication_success', (data) => {
  console.log('Authenticated:', data);
});
```

### Events

#### Global Events (No authentication required)

**`connection_established`**
```json
{
  "message": "Connected to BitTrade WebSocket",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

**`btc_price_update`**
```json
{
  "btc_usd_price": 45000.50,
  "buy_rate_inr": 4095045.50,
  "sell_rate_inr": 3960044.00,
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

#### User-Specific Events (Authentication required)

**`user_balance_update`**
```json
{
  "available_inr": 1000000.00,
  "available_btc": 223456,
  "reserved_inr": 0.00,
  "reserved_btc": 0,
  "collateral_btc": 0,
  "borrowed_inr": 0.00,
  "interest_accrued": 0.00,
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

### Client Example
```javascript
const socket = io('http://localhost:3001');

// Authenticate for user-specific updates
socket.emit('authenticate', localStorage.getItem('jwt_token'));

// Listen for price updates
socket.on('btc_price_update', (data) => {
  console.log('New BTC price:', data.btc_usd_price);
});

// Listen for balance updates
socket.on('user_balance_update', (data) => {
  console.log('Balance updated:', data);
});
```

---

## 📊 Data Formats

### Currency Formats
- **INR amounts**: Decimal numbers (e.g., 1000.50)
- **BTC amounts**: Integer satoshis (1 BTC = 100,000,000 satoshis)
- **USD prices**: Decimal numbers (e.g., 45000.50)

### Date Formats
- All timestamps are in ISO 8601 format: `"2024-01-15T10:30:00.000Z"`

### Number Precision
- INR: 2 decimal places
- BTC: 8 decimal places (satoshi precision)
- USD: 2 decimal places

---

## 🔒 Security

### Authentication
- JWT tokens with 24-hour expiration
- Bearer token authentication for protected endpoints
- Secure password hashing with bcrypt (12 rounds)

### Data Protection
- User-specific data isolation
- Balance validation before trades
- Database transaction support for trade execution

### Rate Limiting
- No current rate limiting implemented
- Consider implementing for production use

---

## 📈 Performance Features

### Caching Strategy
- **Redis-first approach** for frequently accessed data
- **Database fallback** ensures reliability
- **TTL-based expiration** for different data types

### Cache TTL Settings
- Current Bitcoin price: Real-time updates
- Chart data: 1-24 hours based on timeframe
- User balance: 10 minutes
- Market rates: Real-time updates

### WebSocket Optimizations
- User-specific rooms for targeted updates
- Connection pooling and management
- Automatic reconnection support

---

## 🚨 Error Handling

### HTTP Status Codes
- `200`: Success
- `201`: Created (successful trade)
- `400`: Bad Request (validation errors)
- `401`: Unauthorized (invalid/missing token)
- `404`: Not Found (resource doesn't exist)
- `409`: Conflict (duplicate email during registration)
- `500`: Internal Server Error
- `503`: Service Unavailable (market rates unavailable)

### Error Response Format
```json
{
  "error": "Description of the error",
  "required": 1000.00,
  "available": 500.00
}
```

### Common Errors

**Authentication Errors:**
```json
{
  "error": "No token provided"
}
```

**Validation Errors:**
```json
{
  "error": "Insufficient INR balance",
  "required": 10000.00,
  "available": 5000.00
}
```

**Not Found Errors:**
```json
{
  "error": "No Bitcoin data found"
}
```

---

## 🏗️ Current Implementation Status

### ✅ Fully Implemented
- User registration and authentication
- JWT token management
- Real-time Bitcoin price data
- Market trading (buy/sell)
- Balance management with caching
- Transaction history
- WebSocket real-time updates
- Redis caching for performance
- Database transaction support

### 🔄 Partially Implemented
- User-specific WebSocket events (balance updates working)
- Error handling and validation (basic implementation)

### ❌ Not Yet Implemented
- Portfolio management endpoints
- Advanced trading features (limit orders, stop-loss)
- User profile management
- Transaction filtering and search
- Rate limiting
- Push notifications
- Advanced analytics endpoints

---

## 🛠️ Development Notes

### Environment Setup
- Node.js with Express framework
- MySQL database for persistent data
- Redis for caching and session management
- Socket.IO for WebSocket functionality

### Database Schema
- Users table with authentication data
- Transactions table for trade history
- Bitcoin data tables for market information
- Settings table for configuration

### Dependencies
- `express`: Web framework
- `mysql2`: Database connectivity
- `redis`: Caching layer
- `socket.io`: WebSocket support
- `jsonwebtoken`: JWT authentication
- `bcrypt`: Password hashing

---

## 📞 Support

For API support or questions:
- Check server logs for detailed error information
- Verify authentication tokens are valid and not expired
- Ensure proper request formatting and required fields
- Monitor WebSocket connection status for real-time features

---

*Last updated: 2024-01-15*

# ₿itTrade

<div align="center">
  <h3>Modern Cryptocurrency Trading Platform</h3>
  <p>A comprehensive, secure, and scalable Bitcoin trading application built with modern web technologies</p>
  
  [![React](https://img.shields.io/badge/React-19.1.0-61dafb?style=flat-square&logo=react)](https://reactjs.org/)
  [![Node.js](https://img.shields.io/badge/Node.js-Express-green?style=flat-square&logo=node.js)](https://nodejs.org/)
  [![TypeScript](https://img.shields.io/badge/TypeScript-4.9.5-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
  [![MySQL](https://img.shields.io/badge/MySQL-8.0-orange?style=flat-square&logo=mysql)](https://www.mysql.com/)
  [![Redis](https://img.shields.io/badge/Redis-Cache-red?style=flat-square&logo=redis)](https://redis.io/)
  [![WebSocket](https://img.shields.io/badge/WebSocket-Real--time-yellow?style=flat-square)](https://socket.io/)
</div>

## 🚀 Overview

BitTrade is a full-stack cryptocurrency trading platform designed for seamless Bitcoin buying and selling operations. The application features a modern, mobile-first interface with real-time market data, secure authentication, and comprehensive trading functionality.

### ✨ Key Highlights
- 📱 **Mobile-First Design** - Optimized for all devices with responsive UI
- ⚡ **Real-Time Updates** - Live Bitcoin prices and instant trade execution
- 🔒 **Bank-Grade Security** - JWT authentication with bcrypt password hashing
- 📊 **Interactive Charts** - Multi-timeframe Bitcoin price visualization
- 💾 **Redis Caching** - High-performance data caching for instant responses
- 🌐 **WebSocket Integration** - Real-time bidirectional communication
- 📈 **Trading Analytics** - Comprehensive transaction history and statistics

## 🏗️ Architecture

### Frontend (Client)
**React 19.1.0 + TypeScript** 
- 🎨 **Modern UI** - Tailwind CSS with Strike-inspired dark theme
- 📡 **Real-Time Data** - Socket.IO client for live updates
- 🔄 **State Management** - React Context for global state
- 📊 **Data Visualization** - Recharts for interactive Bitcoin charts
- 🎭 **Smooth Animations** - Number flow animations and transitions
- 🛡️ **Type Safety** - Full TypeScript implementation

### Backend (Server)
**Node.js + Express.js**
- 🌐 **RESTful API** - Comprehensive API endpoints
- 📡 **WebSocket Server** - Socket.IO for real-time communication
- 🔐 **JWT Authentication** - Secure token-based authentication
- 📊 **External APIs** - CoinGecko and Fear & Greed Index integration
- ⚡ **Redis Caching** - High-performance in-memory caching
- 📅 **Scheduled Tasks** - Automated data updates with node-cron

### Database
**MySQL + Redis**
- 🗄️ **Relational Database** - MySQL for structured data
- 💾 **In-Memory Cache** - Redis for high-speed data access
- 🔗 **Optimized Schema** - Comprehensive indexing strategy
- 💰 **Precise Currency** - Satoshi-level Bitcoin precision
- 📋 **Transaction Logging** - Complete audit trail

## 🚀 Quick Start

### Prerequisites
- **Node.js** v14+ ([Download](https://nodejs.org/))
- **MySQL** 8.0+ ([Download](https://dev.mysql.com/downloads/))
- **Redis** 6.0+ ([Download](https://redis.io/download))

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/bittrade.git
   cd bittrade
   ```

2. **Install all dependencies**
   ```bash
   npm run install:all
   ```

3. **Set up the database**
   ```bash
   # Create MySQL database
   mysql -u root -p < database/schema.sql
   
   # Seed admin user (optional)
   mysql -u root -p < database/seed_admin.sql
   ```

4. **Configure environment variables**
   ```bash
   # Server environment
   cp server/.env.example server/.env
   
   # Client environment  
   cp client/.env.example client/.env
   
   # Edit the files with your configuration
   ```

### Running the Application

#### Development Mode (Recommended)
```bash
npm run dev
```
This starts both the client (port 3000) and server (port 3001) with hot reload.

#### Individual Components
```bash
# Client only
npm run client:dev

# Server only
npm run server:dev
```

#### Production Mode
```bash
# Build client
npm run build

# Start server
npm start
```

### 🌐 Access Points
- **Client Application**: http://localhost:3000
- **API Server**: http://localhost:3001/api
- **Health Check**: http://localhost:3001/api/health
- **WebSocket**: ws://localhost:3001

## 📋 Features

### 🔐 Authentication & Security
- JWT-based authentication with secure token management
- bcrypt password hashing with salt rounds
- Protected API routes and WebSocket connections
- Session management with automatic token refresh

### 💹 Trading Features
- **Market Orders** - Instant buy/sell execution
- **Real-Time Pricing** - Live Bitcoin USD/INR rates
- **Balance Management** - Multi-currency balance tracking
- **Transaction History** - Complete trading activity log
- **Price Charts** - Interactive charts with multiple timeframes

### 📊 Data & Analytics
- **Market Data Integration** - CoinGecko API for Bitcoin data
- **Sentiment Analysis** - Fear & Greed Index integration
- **Chart Data** - Historical price data (1d, 7d, 30d, 90d, 365d)
- **User Analytics** - Trading statistics and performance metrics

### ⚡ Performance
- **Redis Caching** - Sub-millisecond data access
- **WebSocket Real-Time** - Instant updates without polling
- **Database Optimization** - Comprehensive indexing strategy
- **CDN Ready** - Static asset optimization

### 📱 User Experience
- **Mobile-First Design** - Optimized for mobile devices
- **Dark Theme** - Strike-inspired modern interface
- **Smooth Animations** - Polished micro-interactions
- **Touch Gestures** - Drag-to-close modals and touch-friendly controls

## 📊 Technology Stack

<table>
<tr>
<td valign="top" width="33%">

### Frontend
- **React** 19.1.0
- **TypeScript** 4.9.5
- **Tailwind CSS** 3.4.17
- **Socket.IO Client** 4.8.1
- **Recharts** 3.1.0
- **React Router** 7.7.0
- **Lucide React** 0.525.0

</td>
<td valign="top" width="33%">

### Backend
- **Node.js** with Express.js 4.18.2
- **Socket.IO** 4.8.1
- **MySQL2** 3.6.0
- **Redis** 4.7.1
- **JWT** 9.0.2
- **bcrypt** 6.0.0
- **node-cron** 3.0.2
- **Axios** 1.5.0

</td>
<td valign="top" width="33%">

### Database & Tools
- **MySQL** 8.0+
- **Redis** 6.0+
- **Nodemon** 3.0.1
- **Concurrently** 8.2.0
- **Testing Library** 16.3.0
- **ESLint** & **Prettier**

</td>
</tr>
</table>

## 🗂️ Project Structure

```
bittrade/
├── client/                 # React frontend application
│   ├── src/
│   │   ├── components/     # Reusable React components
│   │   ├── pages/         # Page components
│   │   ├── context/       # React Context providers
│   │   ├── utils/         # Utility functions
│   │   └── types/         # TypeScript definitions
│   ├── public/            # Static assets
│   └── package.json       # Frontend dependencies
├── server/                # Node.js backend application
│   ├── config/           # Configuration files
│   ├── middleware/       # Express middleware
│   ├── routes/           # API route handlers
│   ├── services/         # Business logic services
│   └── package.json      # Backend dependencies
├── database/             # Database schema and migrations
│   ├── schema.sql        # Main database schema
│   ├── migrations/       # Database migration files
│   └── seed_admin.sql    # Initial data seeding
├── docs/                 # Comprehensive documentation
│   ├── CLIENT_README.md  # Frontend documentation
│   ├── SERVER_README.md  # Backend documentation
│   └── DATABASE_README.md # Database documentation
└── package.json          # Root package configuration
```

## 📚 Documentation

Detailed documentation is available for each component:

| Component | Description | Link |
|-----------|-------------|------|
| 🎨 **Frontend** | React client application with TypeScript | [📖 Client Docs](docs/CLIENT_README.md) |
| ⚙️ **Backend** | Node.js API server with WebSocket support | [📖 Server Docs](docs/SERVER_README.md) |
| 🗄️ **Database** | MySQL schema with optimization strategies | [📖 Database Docs](docs/DATABASE_README.md) |

## 🚀 API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration

### Market Data
- `GET /api/bitcoin/current` - Current Bitcoin market data
- `GET /api/market-rates` - Real-time buy/sell rates
- `GET /api/bitcoin/chart/:timeframe` - Historical chart data
- `GET /api/bitcoin/sentiment` - Fear & Greed Index

### Trading (Protected)
- `POST /api/trade` - Execute buy/sell orders
- `GET /api/balance` - User balance information
- `GET /api/transactions` - Transaction history

### WebSocket Events
- `btc_price_update` - Real-time price updates
- `user_balance_update` - User balance changes
- `user_transaction_update` - New transaction notifications

## 🔧 Configuration

### Environment Variables

**Server (.env)**
```env
PORT=3001
DB_HOST=localhost
DB_NAME=bittrade
DB_USER=your_db_user
DB_PASSWORD=your_db_password
REDIS_HOST=localhost
REDIS_PORT=6379
JWT_SECRET=your_super_secure_secret
```

**Client (.env)**
```env
REACT_APP_API_URL=http://localhost:3001/api
REACT_APP_WS_URL=http://localhost:3001
```

## 🧪 Testing

```bash
# Run client tests
cd client && npm test

# Run server tests (when implemented)
cd server && npm test

# Run all tests
npm test
```

## 📦 Deployment

### Production Build
```bash
# Build client for production
npm run build

# Start production server
NODE_ENV=production npm start
```

### Docker (Optional)
```bash
# Build and run with Docker Compose
docker-compose up --build
```

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

### Development Guidelines
- Follow TypeScript best practices
- Write comprehensive tests
- Update documentation for new features
- Follow the existing code style
- Ensure all tests pass before submitting

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **CoinGecko** for providing comprehensive Bitcoin market data
- **Alternative.me** for Fear & Greed Index data
- **React Team** for the amazing frontend framework
- **Socket.IO** for real-time communication capabilities
- **Tailwind CSS** for the utility-first styling approach
- **MySQL** and **Redis** teams for robust data solutions

## 🐛 Issues & Support

If you encounter any issues or need support:

1. Check the [documentation](docs/)
2. Search existing [issues](https://github.com/your-username/bittrade/issues)
3. Create a new issue with detailed information
4. Join our community discussions

---

<div align="center">
  <p>Made with ❤️ for the cryptocurrency community</p>
  <p>⭐ Star this repo if you find it useful!</p>
</div>


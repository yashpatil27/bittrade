# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Overview

BitTrade is a cryptocurrency trading platform built with Node.js/Express backend, React/TypeScript frontend, MySQL database, and Redis caching. The application features real-time Bitcoin trading, WebSocket-based price updates, user authentication, and admin management capabilities.

## Common Development Commands

### Development Workflow

```bash
# Install all dependencies (root, server, client)
npm run install:all

# Start both server and client in development mode
npm run dev

# Start only server in development mode
npm run server:dev

# Start only client in development mode
npm run client:dev

# Local development (client on localhost instead of 0.0.0.0)
npm run dev:local
```

### Production Commands

```bash
# Build client for production
npm run build

# Start production server only
npm start

# Start with PM2 (production process manager)
pm2 start ecosystem.config.js

# PM2 management
pm2 status          # Check process status
pm2 logs            # View logs
pm2 monit           # Real-time monitoring
pm2 restart all     # Restart all processes
pm2 stop all        # Stop all processes
```

### Testing

```bash
# Run client tests
npm test

# Run client tests with coverage
cd client && npm test -- --coverage

# Run specific test file
cd client && npm test -- Components/Balance.test.js
```

### Server-Specific Commands

```bash
# Development with auto-reload
cd server && npm run dev

# Production start
cd server && npm start

# Test database connection (with proper NODE_ENV)
cd server && NODE_ENV=production node -e "
const mysql = require('mysql2/promise');
const config = require('./config/config');
mysql.createConnection(config.database)
  .then(() => console.log('✅ DB Connected'))
  .catch(err => console.error('❌ DB Failed:', err.message));
"
```

### Client-Specific Commands

```bash
# Start development server
cd client && npm start

# Start with host binding (network access)
cd client && npm run start:host

# Build for production
cd client && npm run build

# Analyze bundle size
cd client && npm run build && npx webpack-bundle-analyzer build/static/js/*.js
```

### Deployment Commands

```bash
# Enhanced deployment with validation
./deployment/scripts/update-with-validation.sh

# Simple deployment
./deployment/scripts/update.sh

# Validation only
./deployment/scripts/validate-deployment.sh

# Docker deployment
docker-compose -f deployment/docker-compose.yml up -d
```

## High-Level Architecture

### System Architecture

BitTrade follows a three-tier architecture with clear separation of concerns:

**Frontend (React/TypeScript)**
- Modern React 19 with TypeScript for type safety
- Context-based state management (AuthContext, WebSocketContext, BalanceContext, etc.)
- Mobile-first responsive design with Tailwind CSS
- Real-time WebSocket integration for live price updates
- Protected routes with JWT authentication
- Component-based architecture with reusable UI elements

**Backend (Node.js/Express)**
- RESTful API server with Express.js
- JWT-based authentication middleware
- WebSocket server using Socket.IO for real-time communication
- Modular route structure (auth, user, admin, trading)
- DataService class for external API integration and scheduled tasks
- Database transactions for ACID compliance in trading operations

**Data Layer**
- MySQL 8.0 primary database with proper indexing
- Redis cache for high-frequency data (prices, user sessions, chart data)
- Database migrations and seeding scripts
- Connection pooling and error handling

### Key Architectural Patterns

**Real-Time Data Flow**
```
External APIs (CoinGecko) → DataService → Database/Redis → WebSocket → Client
```

**Trading Flow**
```
Client Request → Auth Middleware → Trading API → Database Transaction → Balance Update → WebSocket Broadcast
```

**Caching Strategy**
```
Request → Redis Check → Database Fallback → Cache Update → Response
```

### Core Components

**Server Architecture**
- `server/server.js` - Main application entry point with middleware setup
- `server/services/data-service.js` - External API integration and data processing
- `server/routes/` - API endpoint definitions (auth, user, admin, trading)
- `server/middleware/auth.js` - JWT authentication and authorization
- `server/config/config.js` - Environment-based configuration management

**Client Architecture**
- `client/src/pages/` - Route-based page components (Home, Login, History, Admin)
- `client/src/components/` - Reusable UI components (modals, charts, forms)
- `client/src/context/` - Global state management contexts
- `client/src/utils/` - API clients and utility functions
- `client/static-server.js` - Production static file server

**Data Service Responsibilities**
- Periodic Bitcoin price fetching (30-second intervals)
- Chart data aggregation for multiple timeframes
- Rate calculation with configurable multipliers
- Redis cache management with TTL strategies
- WebSocket broadcasting for real-time updates

### Environment Configuration

**Development Setup**
- Server runs on port 3001 with nodemon auto-reload
- Client runs on port 3000 with hot module replacement
- Environment variables loaded from `.env.development`
- CORS enabled for cross-origin development

**Production Deployment**
- PM2 process management with restart policies
- Static file serving for React build
- Environment variables from `.env.production`
- Database connection with explicit IPv4 addressing
- Redis caching with connection retry logic

### Critical Deployment Considerations

**Database Connection Issues**
- Always use explicit IP addresses (127.0.0.1) instead of 'localhost'
- Ensure NODE_ENV=production is set in PM2 configuration
- Test database connections before deployment with proper environment variables

**PM2 Configuration**
- Both server and client processes defined in `ecosystem.config.js`
- Memory limits and restart policies configured
- Log file management with separate error/output streams

**Validation Scripts**
- Always include connection timeout mechanisms
- Close database connections properly to prevent hanging
- Set NODE_ENV=production for deployment tests

### Security Architecture

- JWT tokens with configurable expiration
- Password hashing with bcrypt (12 rounds)
- Protected API routes with authentication middleware
- WebSocket authentication for real-time connections
- Environment variable management for secrets
- CORS configuration for production domains

### Performance Optimizations

- Redis caching with intelligent TTL based on data volatility
- Database query optimization with proper indexing
- WebSocket connection pooling and user mapping
- React component optimization with context separation
- Lazy loading for admin routes and heavy components

This architecture enables BitTrade to handle real-time cryptocurrency trading with reliable performance, security, and scalability while maintaining clean separation between frontend presentation, backend business logic, and data persistence layers.

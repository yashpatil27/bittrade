# BitTrade Client Documentation

## Overview

The BitTrade client is a modern React-based cryptocurrency trading platform built with TypeScript, providing a mobile-first user interface for Bitcoin trading operations. The application features real-time price updates, user authentication, trading functionality, and comprehensive portfolio management.

## Technology Stack

### Core Technologies
- **React 19.1.0** - Modern frontend framework with hooks and context
- **TypeScript 4.9.5** - Type-safe development environment
- **React Router DOM 7.7.0** - Client-side routing and navigation
- **Socket.IO Client 4.8.1** - Real-time WebSocket communication

### UI & Styling
- **Tailwind CSS 3.4.17** - Utility-first CSS framework
- **Lucide React 0.525.0** - Modern icon library
- **PostCSS 8.5.6** - CSS processing and optimization
- **Autoprefixer 10.4.21** - Cross-browser CSS compatibility

### Data Visualization & Animation
- **Recharts 3.1.0** - React-based charting library
- **@number-flow/react 0.5.10** - Smooth number animations

### Development & Testing
- **React Scripts 5.0.1** - Build tools and development server
- **@testing-library/react 16.3.0** - React component testing utilities
- **@testing-library/jest-dom 6.6.3** - Custom Jest matchers
- **@testing-library/user-event 13.5.0** - User interaction simulation
- **Web Vitals 2.1.4** - Performance monitoring

## Project Structure

```
client/
├── public/                     # Static assets
│   ├── manifest.json          # PWA manifest
│   └── index.html             # Main HTML template
├── src/
│   ├── components/            # Reusable React components
│   │   ├── Layout.tsx         # Main layout wrapper
│   │   ├── AdminLayout.tsx    # Admin-specific layout
│   │   ├── Header.tsx         # App header with navigation
│   │   ├── BottomNav.tsx      # Mobile bottom navigation
│   │   ├── AdminBottomNav.tsx # Admin navigation
│   │   ├── Card.tsx           # Reusable card component
│   │   ├── BitcoinChart.tsx   # Price chart visualization
│   │   ├── PortfolioChart.tsx # Portfolio value charts
│   │   ├── MarketRate.tsx     # Real-time price display
│   │   ├── Balance.tsx        # User balance display
│   │   ├── TransactionList.tsx # Transaction history
│   │   ├── DCATransactionList.tsx # DCA-specific transactions
│   │   ├── PendingOrdersList.tsx # Pending orders display
│   │   ├── TradingModal.tsx   # Buy/Sell trading interface
│   │   ├── DCAModal.tsx       # Dollar-Cost Averaging setup
│   │   ├── SingleInputModal.tsx # Generic input modal
│   │   ├── ConfirmationModal.tsx # Transaction confirmation
│   │   ├── DetailsModal.tsx   # Transaction/order details
│   │   ├── DepositCashModal.tsx # Cash deposit interface
│   │   ├── DepositBitcoinModal.tsx # Bitcoin deposit interface
│   │   ├── ProfileModal.tsx   # User profile management
│   │   ├── ProfileUpdateModal.tsx # Profile update interface
│   │   ├── AdminChangePasswordModal.tsx # Admin password change
│   │   ├── OptionsModal.tsx   # Notification/options modal
│   │   ├── AnimateNumberFlow.tsx # Number animation wrapper
│   │   ├── WebSocketStatus.tsx # Connection status indicator
│   │   ├── WebSocketAuthenticator.tsx # WS authentication
│   │   ├── AdminMetrics.tsx   # Admin dashboard metrics
│   │   ├── AdminMultiplier.tsx # Trading multiplier management
│   │   ├── DCAPlans.tsx       # DCA plans management
│   │   └── ProtectedRoute.tsx # Route authentication guard
│   ├── pages/                 # Page components
│   │   ├── Home.tsx          # Main dashboard page
│   │   ├── Login.tsx         # User login page
│   │   ├── Register.tsx      # User registration page
│   │   ├── History.tsx       # Transaction history page
│   │   ├── DCA.tsx           # Dollar-Cost Averaging page
│   │   ├── Loans.tsx         # Lending/borrowing page
│   │   └── admin/            # Admin-specific pages
│   │       ├── AdminHome.tsx # Admin dashboard
│   │       ├── AdminHistory.tsx # Admin transaction history
│   │       ├── AdminSettings.tsx # System settings
│   │       └── AdminUsers.tsx # User management
│   ├── context/              # React Context providers
│   │   ├── AuthContext.tsx   # Authentication state management
│   │   ├── WebSocketContext.tsx # WebSocket connection management
│   │   ├── BalanceContext.tsx # Balance data management
│   │   ├── TransactionContext.tsx # Transaction data management
│   │   ├── PriceContext.tsx  # Price and market data management
│   │   └── DCAPlansContext.tsx # DCA plans data management
│   ├── utils/                # Utility functions
│   │   ├── api.ts           # HTTP API client
│   │   ├── tradingApi.ts    # Trading-specific API calls
│   │   └── formatters.ts    # Number and currency formatters
│   ├── types/               # TypeScript type definitions
│   │   └── index.ts        # Global type definitions
│   ├── App.tsx             # Main application component
│   ├── App.css             # Global styles
│   ├── index.tsx           # Application entry point
│   └── react-app-env.d.ts  # React TypeScript declarations
├── build/                   # Production build output
├── package.json            # Dependencies and scripts
├── tsconfig.json          # TypeScript configuration
├── tailwind.config.js     # Tailwind CSS configuration
└── postcss.config.js      # PostCSS configuration
```

## New Contexts

### 1. Balance Context
- Manages user and admin balance data.
- Fetches from API and updates via WebSocket.
- Offers balance refetching functionality.

### 2. Transactions Context
- Manages user/admin transactions with pagination.
- Fetches from API, utilizing WebSocket for updates.
- Includes transaction filtering.

### 3. Price Context
- Manages Bitcoin price and market rates.
- Fetches data and updates through WebSocket.
- Manages chart data for various timeframes.

### 4. DCA Plans Context
- Manages user and admin DCA plans data.
- Handles real-time updates via WebSocket.
- Centralizes DCA plans state across components.

## Key Features

### 1. Real-Time Data Management
- **WebSocket Integration**: Live Bitcoin price updates via Socket.IO
- **Context-Based State**: React Context for global state management
- **Automatic Reconnection**: Robust WebSocket connection handling
- **Data Caching**: Client-side caching for optimal performance

### 2. User Authentication
- **JWT-Based Auth**: Secure token-based authentication
- **Protected Routes**: Route-level authentication guards
- **Session Management**: Automatic token refresh and logout
- **WebSocket Authentication**: Authenticated real-time connections

### 3. Trading Interface
- **Market Orders**: Real-time buy/sell operations
- **Dual Currency Input**: Support for INR and BTC amount entry
- **Balance Validation**: Real-time balance checking
- **Price Display**: Live buy/sell rate display
- **Transaction Confirmation**: Multi-step transaction flow
- **DCA Trading**: Automated Dollar-Cost Averaging with flexible scheduling
- **Pending Orders**: Limit order management with real-time status updates
- **Lending System**: Bitcoin-collateralized lending with LTV monitoring

### 4. User Interface
- **Mobile-First Design**: Optimized for mobile devices
- **Dark Theme**: Strike-inspired dark color scheme
- **Smooth Animations**: Number flow animations and transitions
- **Touch-Friendly**: Drag-to-close modals and touch interactions
- **Responsive Layout**: Adaptive design for all screen sizes

### 5. Data Visualization
- **Bitcoin Charts**: Interactive price charts with Recharts
- **Multiple Timeframes**: 1d, 7d, 30d, 90d, 365d chart views
- **Real-Time Updates**: Live price data integration
- **Performance Metrics**: Price change indicators and statistics
- **Portfolio Charts**: Value tracking and performance visualization

### 6. Administrative Features
- **Admin Dashboard**: Comprehensive interface for system management
- **User Management**: Admin tools for modifying user profiles and permissions
- **Metrics Tracking**: Visualization of key performance indicators
- **System Settings**: Configuration management for trading parameters

## Core Components

### Layout Components

#### Layout.tsx
```typescript
// Main application layout wrapper
interface LayoutProps {
  children: React.ReactNode;
  showBottomNav?: boolean;
}
```
- Provides consistent layout structure
- Manages bottom navigation visibility
- Handles responsive design breakpoints

#### Header.tsx
```typescript
// Application header with title and notifications
interface HeaderProps {
  title: string;
  onNotificationClick?: () => void;
}
```
- Displays application title
- Notification bell with click handling
- Mobile-optimized spacing and typography

#### BottomNav.tsx
```typescript
// Mobile bottom navigation bar
interface BottomNavProps {
  // Navigation handled via React Router
}
```
- Five-tab navigation (Home, Portfolio, Trade, History, Profile)
- Active state indication
- Mobile-optimized touch targets

### Trading Components

#### MarketRate.tsx
```typescript
// Real-time Bitcoin price display with buy/sell buttons
interface MarketRateProps {
  onBuyClick: () => void;
  onSellClick: () => void;
  onRatesUpdate: (buyRate: number, sellRate: number) => void;
  onBalanceUpdate: (balance: BalanceData | null) => void;
}
```
- Real-time price updates via WebSocket
- Buy/Sell button integration
- Rate calculation and display
- Balance data management

#### TradingModal.tsx
```typescript
// Comprehensive buy/sell trading interface
interface TradingModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'buy' | 'sell';
  buyRate: number;
  sellRate: number;
  balanceData: BalanceData | null;
  onComplete: (type: 'buy' | 'sell', amount: string) => void;
}
```
- Multi-step trading flow
- Amount input validation
- Balance checking
- Transaction execution
- Success/error handling

#### SingleInputModal.tsx
```typescript
// Generic input modal for amounts and values
interface SingleInputModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  confirmText: string;
  onConfirm: (value: string) => void;
  type: 'inr' | 'btc';
  sectionTitle?: string;
  sectionAmount?: string | React.ReactNode;
  maxValue?: number;
  maxButtonText?: string;
  sectionDetail?: string | React.ReactNode;
  onSectionClick?: () => void;
  isLoading?: boolean;
  tabSwitcher?: React.ReactNode;
  initialValue?: string;
}
```
- Flexible input modal for various use cases
- Custom keypad for touch devices
- Amount validation and formatting
- Drag-to-close functionality
- Maximum value enforcement

### Data Components

#### BitcoinChart.tsx
```typescript
// Interactive Bitcoin price charts
interface BitcoinChartProps {
  className?: string;
}
```
- Multiple timeframe support (1d, 7d, 30d, 90d, 365d)
- Interactive chart with Recharts
- Real-time price data integration
- Loading states and error handling
- Price change indicators

#### Balance.tsx
```typescript
// User balance display component
interface BalanceProps {
  // Balance data from WebSocket context
}
```
- Real-time balance updates
- Multiple balance types (available, reserved, collateral)
- Formatted currency display
- Loading and error states

#### TransactionList.tsx
```typescript
// Transaction history display
interface TransactionListProps {
  title: string;
  maxItems?: number;
  onTransactionClick?: (transaction: Transaction) => void;
  onViewAllClick?: () => void;
}
```
- Paginated transaction display
- Real-time transaction updates
- Transaction type formatting
- Click handling for details
- Loading states

### Modal Components

#### OptionsModal.tsx
```typescript
// Notifications and options display
interface OptionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  type?: 'notifications' | 'custom';
  notifications?: NotificationItem[];
  children?: React.ReactNode;
}

interface NotificationItem {
  id: string;
  title: string;
  description: string;
  timestamp: string;
  type: 'success' | 'warning' | 'info' | 'error';
  clickable?: boolean;
  onClick?: () => void;
}
```
- Notification display and management
- Clickable notification items
- Drag-to-close functionality
- Custom content support
- Type-based styling

## Context Providers

### AuthContext.tsx
```typescript
interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => void;
  loading: boolean;
}
```

**Features:**
- JWT token management
- Automatic token persistence
- Login/logout functionality
- User registration
- Authentication state management
- Loading state handling

### WebSocketContext.tsx
```typescript
interface WebSocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  marketData: MarketData | null;
  balanceData: BalanceData | null;
  transactionData: TransactionData[];
  connectionStatus: 'connecting' | 'connected' | 'disconnected' | 'error';
}
```

**Features:**
- Socket.IO connection management
- Automatic reconnection logic
- Real-time data synchronization
- Connection status tracking
- Event subscription management
- Authentication integration

### BalanceContext.tsx
```typescript
interface BalanceContextType {
  balanceData: BalanceData | null;
  adminBalanceData: AdminTotalBalanceData | null;
  isLoading: boolean;
  error: string | null;
  refetchBalance: () => Promise<void>;
  refetchAdminBalance: () => Promise<void>;
}
```

**Features:**
- User balance data management
- Admin total balance tracking
- Real-time balance updates via WebSocket
- Balance refetching functionality
- Loading states and error handling
- Automatic balance sync on authentication changes

### TransactionContext.tsx
```typescript
interface TransactionContextType {
  userTransactions: Transaction[];
  userTransactionsLoading: boolean;
  userTransactionsError: string | null;
  adminTransactions: Transaction[];
  adminTransactionsLoading: boolean;
  adminTransactionsError: string | null;
  hasMoreUserTransactions: boolean;
  userTransactionsPage: number;
  refetchUserTransactions: (page?: number, limit?: number) => Promise<void>;
  refetchAdminTransactions: () => Promise<void>;
  getPendingOrders: (isAdmin?: boolean) => Transaction[];
  getDCATransactions: (isAdmin?: boolean) => Transaction[];
  getCompletedTransactions: (isAdmin?: boolean) => Transaction[];
  getRecentTransactions: (limit: number, isAdmin?: boolean) => Transaction[];
}
```

**Features:**
- User and admin transaction management
- Pagination support for transaction loading
- Real-time transaction updates via WebSocket
- Transaction filtering by type and status
- Computed transaction lists (pending orders, DCA, completed)
- Error handling and loading states

### PriceContext.tsx
```typescript
interface PriceContextType {
  btcUsdPrice: number | null;
  buyRateInr: number | null;
  sellRateInr: number | null;
  lastUpdated: string | null;
  pricesLoading: boolean;
  pricesError: string | null;
  chartData: ChartDataCache;
  currentChartTimeframe: string;
  refetchPrices: () => Promise<void>;
  fetchChartData: (timeframe: string) => Promise<void>;
  setCurrentChartTimeframe: (timeframe: string) => void;
  isConnected: boolean;
  hasValidPrices: boolean;
}
```

**Features:**
- Real-time Bitcoin price and rate management
- Chart data management for multiple timeframes
- Price updates via WebSocket integration
- Market rate calculation and display
- Loading states and error handling
- Chart data caching and optimization

### DCAPlansContext.tsx
```typescript
interface DCAPlansContextType {
  userDCAPlans: DCAPlansData | null;
  userDCAPlansLoading: boolean;
  userDCAPlansError: string | null;
  adminDCAPlans: AdminDCAPlansData | null;
  adminDCAPlansLoading: boolean;
  adminDCAPlansError: string | null;
  refetchUserDCAPlans: () => Promise<void>;
  refetchAdminDCAPlans: () => Promise<void>;
  hasActivePlans: boolean;
  totalActivePlans: number;
}
```

**Features:**
- User and admin DCA plans management
- Real-time DCA plans updates via WebSocket
- Centralized state for multiple components
- Computed values for plan statistics
- Unified data fetching and error handling
- Automatic data synchronization across views

## Utility Functions

### api.ts
```typescript
// HTTP API client with authentication
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:3001/api'
});

// Automatic token attachment
// Request/response interceptors
// Error handling
```

### tradingApi.ts
```typescript
// Trading-specific API functions
export const executeTrade = async (tradeData: TradeRequest): Promise<TradeResponse>;
export const getBalance = async (): Promise<BalanceData>;
export const getTransactions = async (params?: TransactionParams): Promise<TransactionResponse>;
```

### formatters.ts
```typescript
// Number and currency formatting utilities
export const formatRupeesForDisplay = (amount: number): string;
export const formatBitcoinForDisplay = (satoshis: number): string;
export const formatTransactionAmount = (amount: number, type: string): string;
```

## Styling System

### Tailwind Configuration
```javascript
// tailwind.config.js - Strike-inspired color scheme
theme: {
  extend: {
    colors: {
      brand: '#ffd4d4',           // Strike's pink accent
      primary: '#fff',            // Primary text (white)
      secondary: '#bfbfbf',       // Secondary text (light gray)
      'bg-primary': '#1e1e1e',    // Main background
      'bg-secondary': '#2e2e2e',  // Card background
      'btn-primary': '#fff',       // Primary button
      'btn-secondary': '#2e2e2e',  // Secondary button
    }
  }
}
```

### Design System
- **Dark Theme**: Consistent dark color palette
- **Mobile-First**: Responsive breakpoints and touch targets
- **Typography**: Clean, readable font hierarchy
- **Spacing**: Consistent padding and margin system
- **Animations**: Smooth transitions and micro-interactions

## Development Workflow

### Available Scripts

```bash
# Development
npm start                    # Start development server (port 3000)
npm run build               # Build production bundle
npm test                   # Run test suite
npm run eject              # Eject from Create React App

# From root directory
npm run client:dev         # Start client development server
npm run dev                # Start both client and server
npm run install:all        # Install all dependencies
```

### Environment Configuration

```bash
# .env (client-specific)
REACT_APP_API_URL=http://localhost:3001/api
REACT_APP_WS_URL=http://localhost:3001
REACT_APP_ENV=development
```

### Build Configuration

```json
// package.json - build settings
{
  "homepage": "./",
  "browserslist": {
    "production": [">0.2%", "not dead", "not op_mini all"],
    "development": ["last 1 chrome version", "last 1 firefox version", "last 1 safari version"]
  }
}
```

## Performance Optimizations

### Code Splitting
- Route-based code splitting with React.lazy()
- Component-level lazy loading for heavy components
- Dynamic imports for utility functions

### Caching Strategy
- React Context for state caching
- WebSocket data caching
- Browser storage for authentication tokens
- API response caching where appropriate

### Bundle Optimization
- Tree shaking for unused code elimination
- Minification and compression
- Image optimization and lazy loading
- CSS purging with Tailwind

## Real-Time Features

### WebSocket Integration
```typescript
// WebSocket event handling
socket.on('btc_price_update', (data) => {
  // Update market data in context
  setMarketData(data);
});

socket.on('user_balance_update', (data) => {
  // Update user balance
  setBalanceData(data);
});

socket.on('user_transaction_update', (data) => {
  // Update transaction list
  setTransactionData(data.transactions);
});
```

### Event Management
- Automatic event subscription/unsubscription
- Connection state management
- Graceful error handling
- Automatic reconnection logic

## Testing Strategy

### Test Setup
- Jest for unit testing
- React Testing Library for component testing
- User event simulation for interaction testing
- Custom render helpers with context providers

### Test Coverage Areas
- Component rendering and props
- User interactions and event handling
- Context state changes
- API integration
- Error boundary behavior
- Authentication flows

## Browser Compatibility

### Supported Browsers
- Chrome 88+ (primary target)
- Safari 14+ (iOS/macOS)
- Firefox 85+
- Edge 88+

### Progressive Web App (PWA)
- Service worker for offline functionality
- Web app manifest for installation
- Responsive design for all devices
- Touch-friendly interactions

## Security Considerations

### Authentication Security
- JWT token storage in httpOnly cookies (recommended)
- Automatic token expiration handling
- CSRF protection
- XSS prevention with proper sanitization

### API Security
- Request authentication headers
- Input validation and sanitization
- Error message sanitization
- Rate limiting awareness

## Deployment

### Build Process
```bash
npm run build              # Create production build
# Output: build/ directory with optimized static files
```

### Static File Serving
- Build output can be served from any static file server
- CDN compatibility for global distribution
- Gzip compression recommended
- HTTP/2 server push for critical resources

### Environment Variables
- Production API endpoints
- WebSocket connection URLs
- Feature flags and configuration
- Analytics and monitoring keys

## Troubleshooting

### Common Issues

**WebSocket Connection Failures:**
```javascript
// Check connection status in WebSocketContext
const { connectionStatus } = useWebSocket();
// Status: 'connecting' | 'connected' | 'disconnected' | 'error'
```

**Authentication Token Expiry:**
```javascript
// Handled automatically in AuthContext
// Manual refresh available via useAuth().refreshToken()
```

**Build Errors:**
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

**Type Errors:**
```bash
# Regenerate TypeScript declarations
npx tsc --noEmit
```

### Debug Mode
```javascript
// Enable debug logging
localStorage.setItem('debug', 'bittrade:*');
```

### Performance Profiling
- React Developer Tools for component performance
- Chrome DevTools for bundle analysis
- Lighthouse for web vitals assessment
- Network tab for API monitoring

## Code Quality

### ESLint Configuration
The project maintains zero ESLint warnings through comprehensive linting rules:

```javascript
// Recent fixes implemented:
// ✅ Removed unused variables and imports
// ✅ Fixed React Hook dependency warnings
// ✅ Properly managed useCallback dependencies
// ✅ Commented out unused but potentially useful code
// ✅ Fixed missing imports and circular dependencies
```

### Code Quality Improvements
- **Zero ESLint Warnings**: All components pass ESLint validation
- **TypeScript Strict Mode**: Full type safety enforcement
- **Consistent Code Style**: Unified formatting and patterns
- **Proper Dependency Management**: React hooks with correct dependencies
- **Clean Imports**: No unused imports or circular dependencies
- **Performance Optimizations**: useCallback for stable function references

### Recent Code Quality Fixes
1. **Modal Components**: Fixed unused variables in ConfirmationModal and DetailsModal
2. **Trading Components**: Resolved dependency issues in SingleInputModal
3. **Chart Components**: Fixed missing imports in DCAPlans component
4. **Context Providers**: Resolved circular dependency in AuthContext
5. **Hook Dependencies**: Added proper dependencies to useEffect hooks

## Contributing

### Code Standards
- TypeScript strict mode enabled
- ESLint with React rules (zero warnings policy)
- Prettier for code formatting
- Conventional commit messages
- Clean code principles

### Component Guidelines
- Functional components with hooks
- TypeScript interfaces for all props
- Error boundaries for error handling
- Loading states for async operations
- Accessible markup and ARIA labels
- Proper cleanup in useEffect hooks
- Stable function references with useCallback

### Testing Requirements
- Unit tests for utility functions
- Component tests for UI components
- Integration tests for user flows
- E2E tests for critical paths
- Code coverage monitoring

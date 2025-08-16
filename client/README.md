# BitTrade Client - React Frontend Documentation

[![React](https://img.shields.io/badge/React-19.1.0-blue.svg)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-4.9.5-blue.svg)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-3.4.17-blue.svg)](https://tailwindcss.com/)

The BitTrade client is a modern React-based cryptocurrency trading platform built with TypeScript, providing a mobile-first user interface for Bitcoin trading operations. The application features real-time price updates, user authentication, trading functionality, and comprehensive portfolio management.

## 🚀 Key Features

### Core Trading Experience
- **Real-time Bitcoin Trading** - Market and limit orders with live WebSocket updates
- **Dual Currency Input** - Trade with either INR or BTC amount specification  
- **Interactive Price Charts** - Multiple timeframe Bitcoin charts (1d, 7d, 30d, 90d, 365d)
- **Live Balance Tracking** - Real-time balance updates with available/reserved separation
- **Transaction History** - Comprehensive trading history with filtering and details

### Advanced Trading Features
- **Dollar-Cost Averaging (DCA)** - Automated recurring investment plans
- **Limit Orders** - Set target prices for automatic execution
- **Portfolio Management** - Real-time portfolio value and performance tracking
- **Lending System** - Bitcoin-collateralized lending interface (coming soon)

### User Experience
- **Mobile-First Design** - Optimized for touch devices and mobile workflows
- **Strike-Inspired UI** - Modern dark theme with smooth animations
- **Touch-Friendly Interactions** - Drag-to-close modals and gesture navigation
- **Real-time Updates** - Live data via WebSocket connections
- **Progressive Web App** - Installable PWA with offline capabilities

### Administrative Interface
- **Admin Dashboard** - Comprehensive platform management interface
- **User Management** - Account administration and balance management
- **Trading Configuration** - USD-INR multiplier settings
- **Platform Analytics** - Trading volume and user metrics visualization

## 🏗️ Technology Stack

### Core Technologies
- **React 19.1.0** - Modern frontend framework with concurrent features
- **TypeScript 4.9.5** - Type-safe development environment
- **React Router DOM 7.7.0** - Client-side routing and navigation
- **Socket.IO Client 4.8.1** - Real-time WebSocket communication

### UI & Styling
- **Tailwind CSS 3.4.17** - Utility-first CSS framework
- **Lucide React 0.525.0** - Modern icon library
- **PostCSS 8.5.6** - CSS processing and optimization
- **Autoprefixer 10.4.21** - Cross-browser CSS compatibility
- **Framer Motion 12.23.12** - Animation and gesture library

### Data Visualization & Animation
- **Recharts 3.1.0** - React-based charting library
- **@number-flow/react 0.5.10** - Smooth number animations

### Development & Testing
- **React Scripts 5.0.1** - Build tools and development server
- **@testing-library/react 16.3.0** - React component testing utilities
- **@testing-library/jest-dom 6.6.3** - Custom Jest matchers
- **@testing-library/user-event 13.5.0** - User interaction simulation
- **Web Vitals 2.1.4** - Performance monitoring

## 📁 Project Structure

```
client/
├── public/                     # Static assets
│   ├── manifest.json          # PWA manifest
│   ├── favicon.ico            # App favicon
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
│   │   ├── HeroAmount.tsx     # Main portfolio value display
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
│   │   ├── AdminBalance.tsx   # Admin total balance display
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
│   │   ├── PriceContext.tsx  # Price and market data management
│   │   └── PortfolioContext.tsx # Unified portfolio data management
│   ├── utils/                # Utility functions
│   │   ├── api.ts           # HTTP API client
│   │   ├── tradingApi.ts    # Trading-specific API calls
│   │   ├── formatters.ts    # Number and currency formatters
│   │   ├── dateUtils.ts     # Date formatting utilities
│   │   └── logger.ts        # Logging utilities
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
├── postcss.config.js      # PostCSS configuration
└── static-server.js       # Production static file server
```

## 🧩 Core Context Architecture

The BitTrade client uses a sophisticated React Context architecture for state management, providing type-safe, real-time data flow across the entire application.

### PortfolioContext - Unified Data Management
**Location**: `src/context/PortfolioContext.tsx`

The central context that manages all user and admin data in a unified way:

```typescript
interface PortfolioContextType {
  // User Data
  userBalance: BalanceData | null;
  userTransactions: Transaction[];
  userDCAPlans: DCAPlansData | null;
  
  // Admin Data
  adminBalance: AdminTotalBalanceData | null;
  adminTransactions: Transaction[];
  adminDCAPlans: AdminDCAPlansData | null;
  adminUsers: UserWithBalance[];
  adminSettings: AdminSettingsData | null;
  adminMetrics: AdminMetricsData | null;
  
  // Actions & Utilities
  refetchUserData: () => Promise<void>;
  refetchAdminData: () => Promise<void>;
  getPendingOrders: (isAdmin?: boolean) => Transaction[];
  getDCATransactions: (isAdmin?: boolean) => Transaction[];
}
```

**Features:**
- **Unified State Management**: Single source of truth for all portfolio data
- **Real-time Updates**: Automatic WebSocket synchronization
- **Loading States**: Granular loading states for each data type  
- **Error Handling**: Comprehensive error state management
- **Batch Operations**: Efficient bulk data fetching
- **Admin/User Separation**: Context automatically handles admin vs user data

### AuthContext - Authentication Management
**Location**: `src/context/AuthContext.tsx`

Handles user authentication, JWT token management, and session state:

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
- **JWT Token Management**: Automatic token storage and refresh
- **Session Persistence**: Browser storage integration
- **Auto-logout**: Expired token handling
- **Loading States**: Authentication flow loading states

### WebSocketContext - Real-time Communication
**Location**: `src/context/WebSocketContext.tsx`

Manages WebSocket connections and real-time data synchronization:

```typescript
interface WebSocketContextType {
  socket: Socket | null;
  connectionStatus: 'connecting' | 'connected' | 'disconnected' | 'reconnecting';
  isConnected: boolean;
  useWebSocketEvent: <T>(event: string, handler: (data: T) => void) => void;
}
```

**Features:**
- **Auto-reconnection**: Robust connection management
- **Authentication**: Secure authenticated WebSocket connections
- **Event Subscription**: Type-safe event handling
- **Connection Status**: Real-time connection state tracking

### PriceContext - Market Data Management
**Location**: `src/context/PriceContext.tsx`

Dedicated context for Bitcoin price data and market information:

```typescript
interface PriceContextType {
  btcUsdPrice: number | null;
  buyRateInr: number | null;
  sellRateInr: number | null;
  lastUpdated: string | null;
  chartData: ChartDataCache;
  currentChartTimeframe: string;
  refetchPrices: () => Promise<void>;
  fetchChartData: (timeframe: string) => Promise<void>;
  hasValidPrices: boolean;
}
```

**Features:**
- **Real-time Prices**: Live Bitcoin USD and INR rates
- **Chart Data Management**: Multi-timeframe chart data caching
- **Rate Calculation**: Buy/sell rate computation
- **Cache Strategy**: Intelligent data caching and refresh

## 🎨 Design System & Styling

### Tailwind CSS Configuration
**File**: `tailwind.config.js`

Custom Strike-inspired color scheme:

```javascript
theme: {
  extend: {
    colors: {
      brand: '#ffd4d4',           // Strike's signature pink
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

### Component Design Principles
- **Mobile-First**: All components designed for touch interaction
- **Dark Theme**: Consistent dark color palette throughout
- **Smooth Animations**: Framer Motion for micro-interactions
- **Touch-Friendly**: 44px minimum touch targets
- **Accessibility**: Proper ARIA labels and keyboard navigation

## 🔧 Key Components

### Trading Components

#### TradingModal.tsx
**Purpose**: Complete buy/sell trading interface with dual currency support

**Key Features:**
- Market and limit order support
- Dual currency input (INR/BTC toggle)
- Real-time balance validation
- Multi-step confirmation flow
- Target price setting for limit orders

**Props Interface:**
```typescript
interface TradingModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'buy' | 'sell';
  buyRate?: number;
  sellRate?: number;
  balanceData?: BalanceData | null;
  onComplete?: (type: 'buy' | 'sell', amount: string) => void;
}
```

#### MarketRate.tsx
**Purpose**: Real-time Bitcoin price display with trading buttons

**Key Features:**
- Live WebSocket price updates
- Buy/sell rate display
- Quick trading access
- Price change indicators
- Loading and error states

#### SingleInputModal.tsx
**Purpose**: Flexible input modal for amounts and values

**Key Features:**
- Custom touch-friendly keypad
- Amount validation and formatting
- Drag-to-close functionality
- Maximum value enforcement
- Support for INR and BTC input types

### Portfolio Components

#### HeroAmount.tsx
**Purpose**: Main portfolio value display with toggle functionality

**Key Features:**
- Click to toggle between BTC and INR values
- Smooth number animations
- Cash balance quick access
- Mobile-optimized interactions
- Persistent user preference storage

#### Balance.tsx  
**Purpose**: Detailed balance breakdown display

**Key Features:**
- Available vs reserved balance separation
- Real-time WebSocket updates
- Multiple balance types support
- Formatted currency display
- Loading and error states

#### BitcoinChart.tsx
**Purpose**: Interactive Bitcoin price charts

**Key Features:**
- Multiple timeframe support (1d, 7d, 30d, 90d, 365d)
- Recharts-based interactive visualization
- Real-time price data integration
- Price change indicators
- Responsive design for mobile

### DCA (Dollar-Cost Averaging) Components

#### DCAModal.tsx
**Purpose**: Comprehensive DCA plan creation interface

**Key Features:**
- Flexible scheduling (hourly, daily, weekly, monthly)
- Amount specification in INR or BTC
- Optional price limits (min/max)
- Execution count limits
- Plan preview and confirmation

#### DCAPlans.tsx
**Purpose**: DCA plan management and display

**Key Features:**
- Plan status management (active, paused, completed)
- Performance tracking display
- Next execution timing
- Plan modification capabilities
- Real-time updates via WebSocket

#### DCATransactionList.tsx
**Purpose**: DCA-specific transaction history

**Key Features:**
- Filtered DCA transaction display
- Performance metrics
- Plan association
- Execution history
- Status indicators

### Administrative Components

#### AdminMetrics.tsx
**Purpose**: Platform-wide metrics visualization

**Key Features:**
- Trading volume statistics
- User activity metrics
- DCA plan statistics
- Cash flow monitoring
- Interactive metric cards

#### AdminMultiplier.tsx
**Purpose**: Trading multiplier configuration interface

**Key Features:**
- Buy/sell multiplier settings
- Real-time validation
- Change tracking
- Batch save functionality
- Historical change log

#### AdminBalance.tsx
**Purpose**: Total platform balance overview

**Key Features:**
- Aggregated balance display
- Asset allocation visualization
- Privacy toggle for sensitive data
- Real-time total calculations
- Balance breakdown charts

### Utility Components

#### WebSocketStatus.tsx
**Purpose**: Visual WebSocket connection status indicator

**Key Features:**
- Animated connection states
- Data activity visualization
- Connection quality indicators
- Automatic hide when connected
- Touch feedback on interaction

#### AnimateNumberFlow.tsx
**Purpose**: Smooth number animations for balance and price displays

**Key Features:**
- Configurable animation curves
- Currency-specific formatting
- Performance optimized
- Accessibility compliant
- Multiple number types (INR, BTC, USD)

#### DetailsModal.tsx
**Purpose**: Comprehensive transaction and order details display

**Key Features:**
- Structured detail presentation
- Action buttons (cancel, modify)
- Status-specific styling
- Copy functionality
- Deep-link support

## 🛠️ Development Workflow

### Available Scripts

```bash
# Development
npm start                    # Start development server (port 3000)
npm run start:host          # Start with network access (0.0.0.0:3000)
npm run build               # Build production bundle
npm test                   # Run test suite with Jest
npm test -- --coverage     # Run tests with coverage report
npm run eject              # Eject from Create React App (irreversible)

# From project root
npm run client:dev         # Start client development server
npm run dev                # Start both client and server
npm run dev:local          # Local development (localhost instead of 0.0.0.0)
```

### Environment Configuration

**Development (.env.development):**
```env
REACT_APP_API_URL=http://localhost:3001/api
REACT_APP_WS_URL=http://localhost:3001
REACT_APP_ENV=development
```

**Production (.env.production):**
```env
REACT_APP_API_URL=https://yourdomain.com/api
REACT_APP_WS_URL=https://yourdomain.com
REACT_APP_ENV=production
```

### Build Configuration

The project uses Create React App with additional optimizations:

- **TypeScript**: Strict mode enabled for type safety
- **Tailwind CSS**: Utility-first styling with custom theme
- **PostCSS**: Autoprefixer and optimization
- **Bundle Analyzer**: Webpack bundle analysis available
- **PWA**: Progressive Web App configuration

### Code Quality Standards

- **ESLint**: Zero warnings policy enforced
- **TypeScript**: Strict mode with comprehensive type checking
- **Prettier**: Consistent code formatting
- **Testing**: Component and integration tests with React Testing Library
- **Performance**: Web Vitals monitoring and optimization

## 🔄 Real-Time Features

### WebSocket Integration

The client maintains persistent WebSocket connections for real-time updates:

```typescript
// Price updates
useWebSocketEvent<PriceUpdateData>('btc_price_update', (data) => {
  // Update market data in context
  updatePriceData(data);
});

// Balance updates  
useWebSocketEvent<BalanceData>('user_balance_update', (data) => {
  // Update user balance
  updateUserBalance(data);
});

// Transaction updates
useWebSocketEvent<TransactionUpdateData>('user_transaction_update', (data) => {
  // Update transaction list
  updateTransactions(data.transactions);
});
```

### Event Management
- **Automatic Subscription**: Context-based event subscription
- **Connection Recovery**: Automatic reconnection with backoff
- **Event Cleanup**: Proper event listener cleanup on unmount
- **Type Safety**: Full TypeScript support for WebSocket events

## 🧪 Testing Strategy

### Test Coverage Areas
- **Component Rendering**: All components render without errors
- **User Interactions**: Click, touch, and keyboard interactions
- **Context Integration**: Context provider functionality
- **API Integration**: Mock API responses and error handling
- **Real-time Features**: WebSocket event simulation
- **Authentication Flows**: Login/logout and protected routes

### Testing Tools
- **Jest**: Test runner and assertion library
- **React Testing Library**: Component testing utilities
- **User Event**: User interaction simulation
- **Mock Service Worker**: API mocking for tests
- **Coverage Reports**: Detailed test coverage analysis

### Running Tests
```bash
# Run all tests
npm test

# Run tests with coverage
npm test -- --coverage

# Run specific test file
npm test -- Balance.test.tsx

# Run tests in watch mode
npm test -- --watch
```

## 📱 Progressive Web App (PWA)

### PWA Features
- **Installable**: Can be installed on mobile devices
- **Offline Capability**: Basic offline functionality
- **App-like Experience**: Full-screen native feel
- **Push Notifications**: Real-time notification support (future)
- **Background Sync**: Data synchronization when online

### Manifest Configuration
**File**: `public/manifest.json`

Defines app metadata, icons, and installation behavior for PWA functionality.

## 🚀 Performance Optimizations

### Code Splitting
- **Route-based Splitting**: Automatic code splitting for pages
- **Component Lazy Loading**: Dynamic imports for heavy components
- **Context Separation**: Isolated contexts to prevent unnecessary re-renders

### Caching Strategy  
- **React Context**: Client-side data caching
- **WebSocket Caching**: Real-time data with fallback caching
- **Chart Data**: Aggressive caching for chart data
- **API Response Caching**: Strategic HTTP response caching

### Bundle Optimization
- **Tree Shaking**: Automatic removal of unused code
- **Minification**: Production bundle compression
- **Image Optimization**: Optimized images and lazy loading
- **CSS Purging**: Tailwind CSS unused style removal

### Performance Monitoring
```bash
# Analyze bundle size
npm run build && npx webpack-bundle-analyzer build/static/js/*.js

# Web Vitals reporting
# Automatically tracked in production builds
```

## 🔒 Security Considerations

### Authentication Security
- **JWT Tokens**: Secure token-based authentication
- **Token Expiration**: Automatic token refresh and expiration handling
- **Protected Routes**: Route-level authentication guards
- **Session Management**: Secure session storage and cleanup

### Input Security
- **Data Validation**: Comprehensive client-side validation
- **XSS Prevention**: React's built-in XSS protection
- **CSRF Protection**: Token-based CSRF protection
- **Input Sanitization**: User input sanitization and validation

### API Security
- **Request Authentication**: Automatic API request authentication
- **Error Handling**: Secure error message display
- **Rate Limiting**: Client-side rate limiting awareness
- **HTTPS Only**: Production HTTPS-only communication

## 🐛 Troubleshooting

### Common Development Issues

**WebSocket Connection Failures:**
```javascript
// Check WebSocket connection status
const { connectionStatus, isConnected } = useWebSocket();
console.log('WebSocket Status:', connectionStatus, isConnected);
```

**Authentication Token Expiry:**
```javascript
// Authentication issues are handled automatically
// Check authentication state
const { isAuthenticated, user, token } = useAuth();
```

**Build Errors:**
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install

# Clear React build cache
rm -rf build
npm run build
```

**Type Errors:**
```bash
# Check TypeScript compilation
npx tsc --noEmit

# Generate TypeScript declarations
npx tsc --declaration --emitDeclarationOnly
```

### Debug Mode
```javascript
// Enable debug logging in browser console
localStorage.setItem('debug', 'bittrade:*');

// Disable debug logging
localStorage.removeItem('debug');
```

### Performance Profiling
- **React DevTools**: Component render profiling
- **Chrome DevTools**: Bundle analysis and performance
- **Lighthouse**: PWA and performance auditing
- **Web Vitals**: Core performance metrics

## 🤝 Contributing to Client

### Development Setup
1. **Install Dependencies**: `npm install`
2. **Environment Setup**: Copy and configure `.env.development`
3. **Start Development**: `npm start`
4. **Run Tests**: `npm test`

### Component Guidelines
- **Functional Components**: Use React hooks exclusively
- **TypeScript Interfaces**: Define props interfaces for all components
- **Error Boundaries**: Implement error boundaries for error handling
- **Accessibility**: Include proper ARIA labels and keyboard navigation
- **Performance**: Use React.memo and useCallback for optimization
- **Testing**: Write comprehensive tests for all new components

### Code Style
- **ESLint**: Follow ESLint rules (zero warnings policy)
- **TypeScript**: Use strict mode with comprehensive typing
- **Tailwind**: Use utility classes for styling
- **Conventional Commits**: Use conventional commit messages
- **Component Structure**: Follow established component patterns

---

**BitTrade Client** - *Modern React cryptocurrency trading interface with real-time features*

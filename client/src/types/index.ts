// User types
export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  kycStatus: 'pending' | 'approved' | 'rejected';
  isVerified: boolean;
  createdAt: string;
  avatar?: string;
  is_admin?: boolean;
}

// Bitcoin balance and portfolio
export interface BitcoinBalance {
  btc: number;
  inr: number;
  changePercent: number;
  change24h: number;
}

export interface Portfolio {
  totalValueINR: number;
  totalBTC: number;
  totalInvestment: number;
  profitLoss: number;
  profitLossPercent: number;
  performance: {
    day: number;
    week: number;
    month: number;
    year: number;
  };
}

// Market data
export interface MarketData {
  price: number;
  priceINR: number;
  change24h: number;
  changePercent24h: number;
  volume24h: number;
  volume24hINR: number;
  marketCap: number;
  marketCapINR: number;
  high24h: number;
  low24h: number;
  lastUpdated: string;
}

// DCA Plan types
export interface DCAPlan {
  id: number;
  plan_type: 'DCA_BUY' | 'DCA_SELL';
  status: 'ACTIVE' | 'PAUSED' | 'COMPLETED' | 'CANCELLED';
  frequency: 'HOURLY' | 'DAILY' | 'WEEKLY' | 'MONTHLY';
  amount_per_execution_inr?: number;
  amount_per_execution_btc?: number;
  next_execution_at: string;
  total_executions: number;
  remaining_executions?: number;
  max_price?: number;
  min_price?: number;
  created_at: string;
  completed_at?: string;
  recent_executions: any[];
  performance: {
    total_executed: number;
    total_invested: number;
    total_btc: number;
    avg_price: number;
  };
}

// Transaction types
export interface Transaction {
  id: string;
  type: 'MARKET_BUY' | 'MARKET_SELL' | 'LIMIT_BUY' | 'LIMIT_SELL' | 'DCA_BUY' | 'DCA_SELL' | 
        'LOAN_CREATE' | 'LOAN_BORROW' | 'LOAN_REPAY' | 'LOAN_ADD_COLLATERAL' | 
        'LIQUIDATION' | 'PARTIAL_LIQUIDATION' | 'FULL_LIQUIDATION' | 'INTEREST_ACCRUAL' |
        'DEPOSIT_INR' | 'WITHDRAW_INR' | 'DEPOSIT_BTC' | 'WITHDRAW_BTC' |
        string; // Fallback for any other raw database values
  btc_amount?: number;
  inr_amount?: number;
  execution_price?: number;
  fee?: number;
  status: 'PENDING' | 'EXECUTED' | 'FAILED' | 'CANCELLED' | string; // Fallback for raw database values
  executed_at?: string;
  created_at?: string;
  paymentMethod?: string;
  upiId?: string;
  bankAccount?: string;
  cached?: boolean;
}

// Order types
export interface Order {
  id: string;
  type: 'buy' | 'sell';
  orderType: 'market' | 'limit' | 'stop';
  amount: number;
  price?: number;
  total: number;
  filled: number;
  remaining: number;
  status: 'pending' | 'partial' | 'completed' | 'cancelled';
  timestamp: string;
}

// Payment methods
export interface PaymentMethod {
  id: string;
  type: 'upi' | 'bank' | 'card';
  name: string;
  identifier: string; // UPI ID, account number, etc.
  isDefault: boolean;
  isVerified: boolean;
}

// KYC document types
export interface KYCDocument {
  id: string;
  type: 'aadhar' | 'pan' | 'passport' | 'driving_license';
  documentNumber: string;
  status: 'pending' | 'approved' | 'rejected';
  uploadedAt: string;
  rejectionReason?: string;
}

// Indian specific data
export interface IndianTaxInfo {
  panNumber: string;
  taxYear: string;
  totalGains: number;
  totalLoss: number;
  netGains: number;
  taxLiability: number;
}

// News and updates
export interface NewsItem {
  id: string;
  title: string;
  summary: string;
  content: string;
  category: 'market' | 'regulation' | 'technology' | 'general';
  publishedAt: string;
  source: string;
  imageUrl?: string;
}

// Price alerts
export interface PriceAlert {
  id: string;
  price: number;
  type: 'above' | 'below';
  isActive: boolean;
  triggeredAt?: string;
  createdAt: string;
}

// App state types
export interface AppState {
  user: User | null;
  isAuthenticated: boolean;
  balance: BitcoinBalance;
  portfolio: Portfolio;
  marketData: MarketData;
  isLoading: boolean;
  error: string | null;
}

// API response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Navigation types
export interface NavigationItem {
  id: string;
  label: string;
  path: string;
  icon: any;
  isActive?: boolean;
}

import { User, BitcoinBalance, Portfolio, MarketData, Transaction, PaymentMethod, NewsItem } from '../types';

export const mockUser: User = {
  id: '1',
  name: 'Rajesh Kumar',
  email: 'rajesh.kumar@gmail.com',
  phone: '+91 9876543210',
  kycStatus: 'approved',
  isVerified: true,
  createdAt: '2024-01-15T10:30:00Z',
  avatar: undefined
};

export const mockBalance: BitcoinBalance = {
  btc: 0.05432178,
  inr: 245678.50,
  changePercent: 3.45,
  change24h: 8234.50
};

export const mockPortfolio: Portfolio = {
  totalValueINR: 245678.50,
  totalBTC: 0.05432178,
  totalInvestment: 230000.00,
  profitLoss: 15678.50,
  profitLossPercent: 6.82,
  performance: {
    day: 3.45,
    week: 12.67,
    month: -2.34,
    year: 78.90
  }
};

export const mockMarketData: MarketData = {
  price: 67450.00,
  priceINR: 5632100.00,
  change24h: 1234.50,
  changePercent24h: 1.87,
  volume24h: 28567.89,
  volume24hINR: 1923456789.00,
  marketCap: 1327000000000,
  marketCapINR: 110767100000000,
  high24h: 68200.00,
  low24h: 66800.00,
  lastUpdated: '2024-01-16T14:30:00Z'
};

export const mockTransactions: Transaction[] = [
  {
    id: '1',
    type: 'buy',
    amount: 0.0025,
    price: 5625000.00,
    total: 14062.50,
    fee: 140.63,
    status: 'completed',
    timestamp: '2024-01-16T12:30:00Z',
    paymentMethod: 'UPI',
    upiId: 'rajesh@paytm'
  },
  {
    id: '2',
    type: 'sell',
    amount: 0.001,
    price: 5618000.00,
    total: 5618.00,
    fee: 56.18,
    status: 'completed',
    timestamp: '2024-01-16T10:45:00Z',
    paymentMethod: 'Bank Transfer'
  },
  {
    id: '3',
    type: 'deposit',
    amount: 0,
    price: 0,
    total: 50000.00,
    fee: 0,
    status: 'completed',
    timestamp: '2024-01-15T16:20:00Z',
    paymentMethod: 'UPI',
    upiId: 'rajesh@paytm'
  },
  {
    id: '4',
    type: 'buy',
    amount: 0.0087,
    price: 5610000.00,
    total: 48807.00,
    fee: 488.07,
    status: 'pending',
    timestamp: '2024-01-16T14:15:00Z',
    paymentMethod: 'UPI',
    upiId: 'rajesh@paytm'
  },
  {
    id: '5',
    type: 'withdraw',
    amount: 0,
    price: 0,
    total: 25000.00,
    fee: 50.00,
    status: 'completed',
    timestamp: '2024-01-15T09:30:00Z',
    paymentMethod: 'Bank Transfer',
    bankAccount: 'HDFC****5678'
  }
];

export const mockPaymentMethods: PaymentMethod[] = [
  {
    id: '1',
    type: 'upi',
    name: 'Paytm UPI',
    identifier: 'rajesh@paytm',
    isDefault: true,
    isVerified: true
  },
  {
    id: '2',
    type: 'upi',
    name: 'PhonePe',
    identifier: 'rajesh@ybl',
    isDefault: false,
    isVerified: true
  },
  {
    id: '3',
    type: 'bank',
    name: 'HDFC Bank',
    identifier: 'HDFC0001234 - ****5678',
    isDefault: false,
    isVerified: true
  }
];

export const mockNews: NewsItem[] = [
  {
    id: '1',
    title: 'Bitcoin Crosses ₹56 Lakh Mark in India',
    summary: 'Bitcoin price surges to new highs as institutional adoption increases in India.',
    content: 'Bitcoin has crossed the ₹56 lakh mark in Indian markets...',
    category: 'market',
    publishedAt: '2024-01-16T12:00:00Z',
    source: 'CoinTelegraph India'
  },
  {
    id: '2',
    title: 'RBI Considering Digital Rupee Integration',
    summary: 'Reserve Bank of India explores integrating digital rupee with crypto exchanges.',
    content: 'The Reserve Bank of India is considering...',
    category: 'regulation',
    publishedAt: '2024-01-16T10:30:00Z',
    source: 'Economic Times'
  },
  {
    id: '3',
    title: 'India\'s Crypto Tax Revenue Hits ₹2000 Crore',
    summary: 'Government reports significant tax collection from cryptocurrency transactions.',
    content: 'The Indian government has collected over ₹2000 crore...',
    category: 'regulation',
    publishedAt: '2024-01-16T08:45:00Z',
    source: 'Business Standard'
  }
];

export const formatINR = (amount: number): string => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  }).format(amount);
};

export const formatBTC = (amount: number): string => {
  return `₿${amount.toFixed(8)}`;
};

export const formatCompactNumber = (num: number): string => {
  if (num >= 10000000) {
    return (num / 10000000).toFixed(1) + 'Cr';
  } else if (num >= 100000) {
    return (num / 100000).toFixed(1) + 'L';
  } else if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return num.toString();
};

export const getTimeAgo = (timestamp: string): string => {
  const now = new Date();
  const time = new Date(timestamp);
  const diffInSeconds = Math.floor((now.getTime() - time.getTime()) / 1000);
  
  if (diffInSeconds < 60) return 'Just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)}d ago`;
  
  return time.toLocaleDateString('en-IN');
};

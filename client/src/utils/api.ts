// API configuration
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';
const WS_BASE_URL = process.env.REACT_APP_WS_URL || 'http://localhost:3001';

export const API_CONFIG = {
  BASE_URL: API_BASE_URL,
  WS_URL: WS_BASE_URL,
  ENDPOINTS: {
    // Authentication
    LOGIN: `${API_BASE_URL}/api/auth/login`,
    REGISTER: `${API_BASE_URL}/api/auth/register`,
    VERIFY: `${API_BASE_URL}/api/auth/verify`,
    
    // Bitcoin data
    BITCOIN_CURRENT: `${API_BASE_URL}/api/bitcoin/current`,
    BITCOIN_CHART: `${API_BASE_URL}/api/bitcoin/chart`,
    BITCOIN_SENTIMENT: `${API_BASE_URL}/api/bitcoin/sentiment`,
    BITCOIN_HISTORY: `${API_BASE_URL}/api/bitcoin/history`,
    
    // Trading
    MARKET_RATES: `${API_BASE_URL}/api/market-rates`,
    TRANSACTIONS: `${API_BASE_URL}/api/transactions`,
    TRADE: `${API_BASE_URL}/api/trade`,
    BALANCE: `${API_BASE_URL}/api/balance`,
    PORTFOLIO: `${API_BASE_URL}/api/portfolio`,
    
    // DCA Plans
    DCA_PLANS: `${API_BASE_URL}/api/dca-plans`,
    
    // System
    HEALTH: `${API_BASE_URL}/api/health`,
  }
};

// Helper function to get API URL with environment detection
export const getApiUrl = () => {
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    
    // If we're on mobile (not localhost), use the IP from the server logs
    if (hostname !== 'localhost' && hostname !== '127.0.0.1') {
      return `http://${hostname}:3001`;
    }
  }
  
  return API_BASE_URL;
};

// Helper function to get WebSocket URL with environment detection
export const getWebSocketUrl = () => {
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    
    // If we're on mobile (not localhost), use the IP from the server logs
    if (hostname !== 'localhost' && hostname !== '127.0.0.1') {
      return `http://${hostname}:3001`;
    }
  }
  
  return WS_BASE_URL;
};

// API utility functions

// DCA Plan creation function
export const createDCAPlan = async (planData: {
  plan_type: 'DCA_BUY' | 'DCA_SELL';
  frequency: 'HOURLY' | 'DAILY' | 'WEEKLY' | 'MONTHLY';
  amount_per_execution: number;
  remaining_executions?: number;
  max_price?: number;
  min_price?: number;
}) => {
  const token = localStorage.getItem('bittrade_token');
  if (!token) {
    throw new Error('No authentication token found');
  }

  const apiUrl = getApiUrl();
  
  console.log('Creating DCA Plan:', planData);
  console.log('Using token:', token ? 'Token found' : 'No token');
  console.log('API URL:', `${apiUrl}/api/dca-plans`);
  
  const response = await fetch(`${apiUrl}/api/dca-plans`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(planData),
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
  }

  return response.json();
};

export default API_CONFIG;

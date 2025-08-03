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
      return `https://${hostname}`;
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
      return `https://${hostname}`;
    }
  }
  
  return WS_BASE_URL;
};

// API utility functions

// DCA Plan creation function
export const createDCAPlan = async (planData: {
  plan_type: 'DCA_BUY' | 'DCA_SELL';
  frequency: 'HOURLY' | 'DAILY' | 'WEEKLY' | 'MONTHLY';
  amount_per_execution_inr?: number;
  amount_per_execution_btc?: number;
  remaining_executions?: number;
  max_price?: number;
  min_price?: number;
}) => {
  const token = localStorage.getItem('bittrade_token');
  if (!token) {
    throw new Error('No authentication token found');
  }

  const apiUrl = getApiUrl();
  
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

// Get user's DCA plans
export const getDCAPlans = async () => {
  const token = localStorage.getItem('bittrade_token');
  if (!token) {
    throw new Error('No authentication token found');
  }

  const apiUrl = getApiUrl();
  const response = await fetch(`${apiUrl}/api/dca-plans`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
  }

  return response.json();
};

// Update DCA plan status (pause/resume)
export const updateDCAPlanStatus = async (planId: number, status: 'ACTIVE' | 'PAUSED') => {
  const token = localStorage.getItem('bittrade_token');
  if (!token) {
    throw new Error('No authentication token found');
  }

  const apiUrl = getApiUrl();
  const response = await fetch(`${apiUrl}/api/dca-plans/${planId}/status`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ status }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
  }

  return response.json();
};

// Delete DCA plan
export const deleteDCAPlan = async (planId: number) => {
  const token = localStorage.getItem('bittrade_token');
  if (!token) {
    throw new Error('No authentication token found');
  }

  const apiUrl = getApiUrl();
  const response = await fetch(`${apiUrl}/api/dca-plans/${planId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
  }

  return response.json();
};

// Cancel limit order (delete pending transaction)
export const cancelLimitOrder = async (transactionId: string) => {
  const token = localStorage.getItem('bittrade_token');
  if (!token) {
    throw new Error('No authentication token found');
  }

  const apiUrl = getApiUrl();
  const response = await fetch(`${apiUrl}/api/transactions/${transactionId}/cancel`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
  }

  return response.json();
};

export default API_CONFIG;

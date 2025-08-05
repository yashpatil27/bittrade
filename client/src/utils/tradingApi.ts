import { getApiUrl } from './api';

interface TradeRequest {
  action: 'buy' | 'sell';
  type: 'market' | 'limit';
  amount: string;
  currency: 'inr' | 'btc';
  execution_price?: number; // For limit orders
}

interface TradeResponse {
  id: number;
  type: string;
  action: string;
  btc_amount: number;
  inr_amount: number;
  execution_price: number;
  status: string;
  timestamp: string;
  updated_balance: {
    available_inr: number;
    available_btc: number;
    reserved_inr: number;
    reserved_btc: number;
    collateral_btc: number;
    borrowed_inr: number;
    interest_accrued: number;
  };
}

/**
 * Execute a market trade (buy or sell)
 */
export const executeTrade = async (tradeRequest: TradeRequest): Promise<TradeResponse> => {
  const token = localStorage.getItem('bittrade_token');
  if (!token) {
    throw new Error('No authentication token found');
  }

  const apiUrl = getApiUrl();
  const response = await fetch(`${apiUrl}/trade`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(tradeRequest),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Trade execution failed');
  }

  return await response.json();
};

/**
 * Get user's trading balance
 */
export const getUserBalance = async () => {
  const token = localStorage.getItem('bittrade_token');
  if (!token) {
    throw new Error('No authentication token found');
  }

  const apiUrl = getApiUrl();
  const response = await fetch(`${apiUrl}/balance`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to fetch balance');
  }

  return await response.json();
};

/**
 * Create a limit order
 */
export const createLimitOrder = async (orderData: {
  type: 'LIMIT_BUY' | 'LIMIT_SELL';
  btc_amount: number;
  inr_amount: number;
  execution_price: number;
}) => {
  const token = localStorage.getItem('bittrade_token');
  if (!token) {
    throw new Error('No authentication token found');
  }

  const apiUrl = getApiUrl();
  const response = await fetch(`${apiUrl}/orders`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(orderData),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to create limit order');
  }

  return await response.json();
};

/**
 * Get user's transaction history
 */
export const getUserTransactions = async (limit: number = 50) => {
  const token = localStorage.getItem('bittrade_token');
  if (!token) {
    throw new Error('No authentication token found');
  }

  const apiUrl = getApiUrl();
  const response = await fetch(`${apiUrl}/transactions?limit=${limit}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to fetch transactions');
  }

  return await response.json();
};

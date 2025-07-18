import React, { useState, useEffect, useCallback } from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { useWebSocket, useWebSocketEvent } from '../context/WebSocketContext';
import { useAuth } from '../context/AuthContext';
import { AnimateUSD, AnimateINR } from './AnimateNumberFlow';
import { getApiUrl } from '../utils/api';

interface BalanceData {
  available_inr: number;
  available_btc: number;
  reserved_inr: number;
  reserved_btc: number;
  collateral_btc: number;
  borrowed_inr: number;
  interest_accrued: number;
}

interface MarketRateProps {
  className?: string;
  onBuyClick?: () => void;
  onSellClick?: () => void;
  onRatesUpdate?: (buyRate: number, sellRate: number) => void;
  onBalanceUpdate?: (balanceData: BalanceData | null) => void;
}

interface PriceUpdateData {
  btc_usd_price: number;
  buy_rate_inr: number;
  sell_rate_inr: number;
  timestamp: string;
}

const MarketRate: React.FC<MarketRateProps> = ({ className = "", onBuyClick, onSellClick, onRatesUpdate, onBalanceUpdate }) => {
  const [priceData, setPriceData] = useState<PriceUpdateData | null>(null);
  const [balanceData, setBalanceData] = useState<BalanceData | null>(null);
  const [loading, setLoading] = useState(true);
  const { isAuthenticated, token } = useAuth();
  const { socket, isConnected } = useWebSocket();

  // Fetch initial data from API (Redis cache)
  useEffect(() => {
    const fetchInitialRates = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${getApiUrl()}/api/market-rates`);
        if (response.ok) {
          const data = await response.json();
          setPriceData({
            btc_usd_price: data.btc_usd_price,
            buy_rate_inr: data.buy_rate_inr,
            sell_rate_inr: data.sell_rate_inr,
            timestamp: data.timestamp
          });
          console.log('🔄 Fetched initial market rates from API:', data);
        }
      } catch (error) {
        console.error('Error fetching initial market rates:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchInitialRates();
  }, []);

  // Function to fetch balance from REST API
  const fetchBalance = useCallback(async () => {
    console.log('🔍 fetchBalance called - Auth status:', { isAuthenticated, hasToken: !!token });
    if (!isAuthenticated || !token) {
      console.log('❌ Not authenticated or no token, setting balance to null');
      setBalanceData(null);
      return;
    }
    
    try {
      console.log('📡 Fetching balance from API...');
      const response = await fetch(`${getApiUrl()}/api/balance`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Balance fetch successful:', data);
        setBalanceData(data);
        console.log('💰 Fetched balance data:', data);
      } else {
        console.error('❌ Balance fetch failed:', response.status, response.statusText);
        setBalanceData(null);
      }
    } catch (error) {
      console.error('❌ Balance fetch error:', error);
      setBalanceData(null);
    }
  }, [isAuthenticated, token]);

  // Handle WebSocket balance updates
  const handleBalanceUpdate = useCallback((data: BalanceData) => {
    console.log('📊 Received balance update:', data);
    setBalanceData(data);
  }, []);

  // Initial balance fetch on component mount
  useEffect(() => {
    fetchBalance();
  }, [fetchBalance]);

  // WebSocket authentication and event handling
  useEffect(() => {
    if (socket && isConnected && isAuthenticated && token) {
      // Authenticate the WebSocket connection
      socket.emit('authenticate', token);
      
      // Listen for balance updates
      socket.on('user_balance_update', handleBalanceUpdate);
      
      // Listen for authentication success
      socket.on('authentication_success', (data) => {
        console.log('🔐 WebSocket authenticated:', data);
      });
      
      // Listen for authentication errors
      socket.on('authentication_error', (error) => {
        console.error('🔐 WebSocket authentication failed:', error);
      });
      
      // Cleanup listeners on unmount
      return () => {
        socket.off('user_balance_update', handleBalanceUpdate);
        socket.off('authentication_success');
        socket.off('authentication_error');
      };
    }
  }, [socket, isConnected, isAuthenticated, token, handleBalanceUpdate]);

  // Listen for WebSocket price updates as per notes/state.txt
  useWebSocketEvent<PriceUpdateData>('btc_price_update', (data) => {
    console.log('📡 Received btc_price_update:', data);
    setPriceData(data);
    setLoading(false);
  });

  // Use WebSocket data only - no fallback to mock data
  const buyRate = priceData ? priceData.buy_rate_inr : 0;
  const sellRate = priceData ? priceData.sell_rate_inr : 0;
  const currentBtcPrice = priceData ? priceData.btc_usd_price : 0;

  // Notify parent component of rate updates
  useEffect(() => {
    if (onRatesUpdate) {
      onRatesUpdate(buyRate, sellRate);
    }
  }, [buyRate, sellRate, onRatesUpdate]);

  // Notify parent component of balance updates
  useEffect(() => {
    if (onBalanceUpdate) {
      onBalanceUpdate(balanceData);
    }
  }, [balanceData, onBalanceUpdate]);

  // Show loading state when no data is available
  if (!priceData) {
    return (
      <div className={`bg-gray-900 border border-gray-800 rounded-xl p-3 ${className}`}>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-base font-medium text-white">Market Rates</h3>
          <div className="flex items-center space-x-2">
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>
              <span className="text-xs text-yellow-400">Loading...</span>
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          {/* Buy Rate Loading */}
          <div className="text-center">
            <p className="text-xs text-gray-400 mb-1">Buy Rate</p>
            <div className="h-6 bg-gray-700 rounded animate-pulse mb-2"></div>
            <button 
              disabled
              className="w-full border-2 border-gray-600 bg-gray-700 text-gray-400 rounded-lg py-1.5 px-3 text-xs font-light flex items-center justify-center space-x-1 cursor-not-allowed"
            >
              <span>Loading...</span>
            </button>
          </div>

          {/* Sell Rate Loading */}
          <div className="text-center">
            <p className="text-xs text-gray-400 mb-1">Sell Rate</p>
            <div className="h-6 bg-gray-700 rounded animate-pulse mb-2"></div>
            <button 
              disabled
              className="w-full border-2 border-gray-600 bg-gray-700 text-gray-400 rounded-lg py-1.5 px-3 text-xs font-light flex items-center justify-center space-x-1 cursor-not-allowed"
            >
              <span>Loading...</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-gray-900 border border-gray-800 rounded-xl p-3 ${className}`}>
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-base font-medium text-white">Market Rates</h3>
        <div className="flex items-center space-x-2">
          {currentBtcPrice > 0 && (
            <AnimateUSD 
              value={currentBtcPrice}
              className="justify-center text-xs text-gray-400"
            />
          )}
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        {/* Buy Rate */}
        <div className="text-center">
          <p className="text-xs text-gray-400 mb-1">Buy Rate</p>
          <p className="text-base font-semibold text-white mb-2">
            <AnimateINR 
              value={buyRate}
              className="justify-center text-base font-semibold text-white"
            />
          </p>
          <button 
            onClick={onBuyClick}
            className="w-full border-2 border-transparent bg-brand text-black hover:bg-brand/80 hover:shadow-lg hover:shadow-brand/20 transition-all duration-200 rounded-lg py-1.5 px-3 text-xs font-light flex items-center justify-center space-x-1"
          >
            <TrendingUp className="w-3 h-3" />
            <span>Buy Bitcoin</span>
          </button>
        </div>

        {/* Sell Rate */}
        <div className="text-center">
          <p className="text-xs text-gray-400 mb-1">Sell Rate</p>
          <p className="text-base font-semibold text-white mb-2">
            <AnimateINR 
              value={sellRate}
              className="justify-center text-base font-semibold text-white"
            />
          </p>
          <button 
            onClick={onSellClick}
            className="w-full border-2 border-brand bg-transparent text-brand hover:bg-brand hover:text-black hover:shadow-lg hover:shadow-brand/20 transition-all duration-200 rounded-lg py-1.5 px-3 text-xs font-light flex items-center justify-center space-x-1"
          >
            <TrendingDown className="w-3 h-3" />
            <span>Sell Bitcoin</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default MarketRate;

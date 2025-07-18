import React, { useState, useEffect, useCallback } from 'react';
import { Wallet, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useWebSocket, useWebSocketEvent } from '../context/WebSocketContext';
import { AnimateINR, AnimateBTC } from './AnimateNumberFlow';
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

interface PriceUpdateData {
  btc_usd_price: number;
  buy_rate_inr: number;
  sell_rate_inr: number;
  timestamp: string;
}

interface BalanceProps {
  className?: string;
}

const Balance: React.FC<BalanceProps> = ({ className = '' }) => {
  const [balanceData, setBalanceData] = useState<BalanceData | null>(null);
  const [priceData, setPriceData] = useState<PriceUpdateData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showBalances, setShowBalances] = useState(true);
  const { isAuthenticated, token } = useAuth();
  const { socket, isConnected } = useWebSocket();
  
  // Fetch initial market rates from API (Redis cache)
  useEffect(() => {
    const fetchInitialRates = async () => {
      try {
        const response = await fetch(`${getApiUrl()}/api/market-rates`);
        if (response.ok) {
          const data = await response.json();
          setPriceData({
            btc_usd_price: data.btc_usd_price,
            buy_rate_inr: data.buy_rate_inr,
            sell_rate_inr: data.sell_rate_inr,
            timestamp: data.timestamp
          });
          console.log('🔄 Balance: Fetched initial market rates from API:', data);
        }
      } catch (error) {
        console.error('Balance: Error fetching initial market rates:', error);
      }
    };

    fetchInitialRates();
  }, []);

  // Listen for WebSocket price updates
  useWebSocketEvent<PriceUpdateData>('btc_price_update', (data) => {
    console.log('📡 Balance: Received btc_price_update:', data);
    setPriceData(data);
  });

  // Calculate asset allocation percentages using real-time data
  // Match MarketRate component pattern - no fallback calculation, just use data or 0
  const inrValue = balanceData?.available_inr || 0;
  const btcAmountInBTC = balanceData ? balanceData.available_btc / 100000000 : 0; // Convert satoshis to BTC
  
  // Use sell_rate_inr for BTC value calculation (what user would get if selling)
  // Same pattern as MarketRate: use priceData or 0, no fallback calculation
  const sellRate = priceData ? priceData.sell_rate_inr : 0;
  const btcValueInINR = sellRate > 0 ? btcAmountInBTC * sellRate : 0;
  
  const totalValue = inrValue + btcValueInINR;
  
  const inrPercentage = totalValue > 0 ? (inrValue / totalValue) * 100 : 0;
  const btcPercentage = totalValue > 0 ? (btcValueInINR / totalValue) * 100 : 0;

  // Function to fetch balance from REST API
  const fetchBalance = useCallback(async () => {
    if (!isAuthenticated || !token) return;
    
    try {
      const response = await fetch(`${getApiUrl()}/api/balance`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setBalanceData(data);
      } else {
        console.error('Error fetching balance:', response.status, response.statusText);
      }
    } catch (error) {
      console.error('Error fetching balance:', error);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, token]);

  // Handle WebSocket balance updates
  const handleBalanceUpdate = useCallback((data: BalanceData) => {
    console.log('📊 Received balance update:', data);
    setBalanceData(data);
    setLoading(false);
  }, []);

  // Initial balance fetch on component mount
  useEffect(() => {
    fetchBalance();
  }, [fetchBalance]);

  // Listen for WebSocket balance updates (authentication handled centrally)
  useEffect(() => {
    if (socket && isConnected) {
      // Listen for balance updates
      socket.on('user_balance_update', handleBalanceUpdate);
      
      // Cleanup listeners on unmount
      return () => {
        socket.off('user_balance_update', handleBalanceUpdate);
      };
    }
  }, [socket, isConnected, handleBalanceUpdate]);


  if (!isAuthenticated) {
    return (
      <div className={`bg-gray-900 border border-gray-800 rounded-xl p-3 ${className}`}>
        <div className="text-center py-3">
          <p className="text-gray-400 text-sm">Please log in to view balance</p>
        </div>
      </div>
    );
  }

  if (loading || !balanceData) {
    return (
      <div className={`bg-gray-900 border border-gray-800 rounded-xl p-3 ${className}`}>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-base font-medium text-white">Balance</h3>
          <div className="flex items-center space-x-2">
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>
              <span className="text-xs text-yellow-400">Loading...</span>
            </div>
          </div>
        </div>
        
        <div className="animate-pulse space-y-3">
          <div>
            <div className="h-6 bg-gray-700 rounded mb-1"></div>
            <div className="h-1 bg-gray-600 rounded-full"></div>
          </div>
          <div>
            <div className="h-6 bg-gray-700 rounded mb-1"></div>
            <div className="h-1 bg-gray-600 rounded-full"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-gray-900 border border-gray-800 rounded-xl p-3 ${className}`}>
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-base font-medium text-white">Balance</h3>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowBalances(!showBalances)}
            className="p-1 hover:bg-gray-800 rounded transition-colors duration-150"
          >
            {showBalances ? (
              <Eye className="w-4 h-4 text-gray-400 hover:text-white" />
            ) : (
              <EyeOff className="w-4 h-4 text-gray-400 hover:text-white" />
            )}
          </button>
        </div>
      </div>
      
      <div className="space-y-4">
        {/* INR Balance */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm text-gray-400">₹ INR</span>
            <span className="text-base font-semibold text-white">
              {showBalances ? (
                <AnimateINR value={balanceData.available_inr} />
              ) : (
                '••••••'
              )}
            </span>
          </div>
          {/* INR Allocation Bar */}
          <div className="w-full bg-gray-700 h-1 rounded-full overflow-hidden">
            <div 
              className="h-full bg-white transition-all duration-300 ease-out"
              style={{ width: `${Math.round(inrPercentage)}%` }}
            />
          </div>
        </div>

        {/* BTC Balance */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm text-gray-400">₿ BTC</span>
            <span className="text-base font-semibold text-white">
              {showBalances ? (
                <AnimateBTC value={balanceData.available_btc} />
              ) : (
                '••••••••'
              )}
            </span>
          </div>
          {/* BTC Allocation Bar */}
          <div className="w-full bg-gray-700 h-1 rounded-full overflow-hidden">
            <div 
              className="h-full bg-brand transition-all duration-300 ease-out"
              style={{ width: `${Math.round(btcPercentage)}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Balance;

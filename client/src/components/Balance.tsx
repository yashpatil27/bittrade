import React, { useState, useEffect, useCallback } from 'react';
import { Wallet, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useWebSocket } from '../context/WebSocketContext';
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

interface BalanceProps {
  className?: string;
}

const Balance: React.FC<BalanceProps> = ({ className = '' }) => {
  const [balanceData, setBalanceData] = useState<BalanceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showBalances, setShowBalances] = useState(true);
  const { isAuthenticated, token } = useAuth();
  const { socket, isConnected } = useWebSocket();

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
        
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center">
            <p className="text-xs text-gray-400 mb-1">₹ INR</p>
            <div className="h-6 bg-gray-700 rounded animate-pulse mb-2"></div>
          </div>
          <div className="text-center">
            <p className="text-xs text-gray-400 mb-1">₿ BTC</p>
            <div className="h-6 bg-gray-700 rounded animate-pulse mb-2"></div>
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
      
      <div className="grid grid-cols-2 gap-4">
        {/* INR Balance */}
        <div className="text-center">
          <p className="text-xs text-gray-400 mb-1">₹ INR</p>
          <p className="text-base font-semibold text-white mb-2">
            {showBalances ? (
              <AnimateINR 
                value={balanceData.available_inr}
                className="justify-center text-base font-semibold text-white"
              />
            ) : (
              <span className="text-gray-400 flex justify-center">••••••</span>
            )}
          </p>
        </div>

        {/* BTC Balance */}
        <div className="text-center">
          <p className="text-xs text-gray-400 mb-1">₿ BTC</p>
          <p className="text-base font-semibold text-white mb-2">
            {showBalances ? (
              <AnimateBTC 
                value={balanceData.available_btc}
                className="justify-center text-base font-semibold text-white"
              />
            ) : (
              <span className="text-gray-400 flex justify-center">••••••••</span>
            )}
          </p>
        </div>
      </div>
    </div>
  );
};

export default Balance;

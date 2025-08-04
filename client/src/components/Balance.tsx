import React, { useState, useEffect } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useBalance } from '../context/BalanceContext';
import { usePrice } from '../context/PriceContext';
import { AnimateINR, AnimateBTC } from './AnimateNumberFlow';

interface BalanceData {
  available_inr: number;
  available_btc: number;
  reserved_inr: number;
  reserved_btc: number;
  collateral_btc: number;
  borrowed_inr: number;
  interest_accrued: number;
}

interface AdminTotalBalanceData {
  total_available_inr: number;
  total_available_btc: number;
  total_reserved_inr: number;
  total_reserved_btc: number;
  total_collateral_btc: number;
  total_borrowed_inr: number;
  total_interest_accrued: number;
}


interface BalanceProps {
  className?: string;
  showAllUsers?: boolean; // If true, show platform balance (admin view)
}

const Balance: React.FC<BalanceProps> = ({ className = '', showAllUsers = false }) => {
  const [showBalances, setShowBalances] = useState(true);
  
  // Use centralized balance and price contexts
  const { balanceData: userBalanceData, adminBalanceData, isLoading: loading, refetchAdminBalance } = useBalance();
  const { sellRateInr } = usePrice();
  
  // Choose which balance data to use based on showAllUsers prop
  const balanceData = showAllUsers ? adminBalanceData : userBalanceData;

  // Calculate asset allocation percentages using real-time data
  // Match MarketRate component pattern - no fallback calculation, just use data or 0
  const inrValue = showAllUsers 
    ? Number((balanceData as AdminTotalBalanceData)?.total_available_inr || 0)
    : Number((balanceData as BalanceData)?.available_inr || 0);
  
  const btcAmountInBTC = showAllUsers
    ? balanceData ? Number((balanceData as AdminTotalBalanceData).total_available_btc || 0) / 100000000 : 0
    : balanceData ? Number((balanceData as BalanceData).available_btc || 0) / 100000000 : 0; // Convert satoshis to BTC
  
  // Use sell_rate_inr for BTC value calculation (what user would get if selling)
  // Use PriceContext data
  const sellRate = sellRateInr || 0;
  const btcValueInINR = sellRate > 0 ? btcAmountInBTC * sellRate : 0;
  
  const totalValue = inrValue + btcValueInINR;
  
  const inrPercentage = totalValue > 0 ? (inrValue / totalValue) * 100 : 0;
  const btcPercentage = totalValue > 0 ? (btcValueInINR / totalValue) * 100 : 0;

  // Debug logging for admin view
  if (showAllUsers && balanceData) {
    console.log('🔍 Admin Balance Debug:', {
      inrValue,
      btcAmountInBTC,
      sellRate,
      btcValueInINR,
      totalValue,
      inrPercentage,
      btcPercentage,
      rawBalanceData: balanceData
    });
  }

  // Fetch admin balance data if needed
  useEffect(() => {
    if (showAllUsers && !adminBalanceData) {
      refetchAdminBalance();
    }
  }, [showAllUsers, adminBalanceData, refetchAdminBalance]);

  const { isAuthenticated } = useAuth();


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
        <h3 className="text-base font-medium text-white">
          {showAllUsers ? 'Platform Balance' : 'Balance'}
        </h3>
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
                <AnimateINR value={inrValue} />
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
                <AnimateBTC value={showAllUsers 
                  ? (balanceData as AdminTotalBalanceData)?.total_available_btc || 0
                  : (balanceData as BalanceData)?.available_btc || 0
                } />
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

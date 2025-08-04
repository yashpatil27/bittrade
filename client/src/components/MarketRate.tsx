import React, { useState, useEffect } from 'react';
// Removed unused imports: TrendingUp, TrendingDown
import { useWebSocketEvent } from '../context/WebSocketContext';
import { useBalance } from '../context/BalanceContext';
import { AnimateINR } from './AnimateNumberFlow';
import { getApiUrl } from '../utils/api';

interface MarketRateProps {
  className?: string;
  onBuyClick?: () => void;
  onSellClick?: () => void;
  onRatesUpdate?: (buyRate: number, sellRate: number) => void;
}

interface PriceUpdateData {
  btc_usd_price: number;
  buy_rate_inr: number;
  sell_rate_inr: number;
  timestamp: string;
}

const MarketRate: React.FC<MarketRateProps> = ({ className = "", onBuyClick, onSellClick, onRatesUpdate }) => {
  const [priceData, setPriceData] = useState<PriceUpdateData | null>(null);
  // const [loading, setLoading] = useState(true); // Unused but kept for future loading states
  
  // Use centralized balance context
  const { balanceData } = useBalance();

  // Fetch initial data from API (Redis cache)
  useEffect(() => {
    const fetchInitialRates = async () => {
      try {
        // setLoading(true); // Commented out since loading state is not used
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
        // setLoading(false); // Commented out since loading state is not used
      }
    };

    fetchInitialRates();
  }, []);






  // Listen for WebSocket price updates as per notes/state.txt
  useWebSocketEvent<PriceUpdateData>('btc_price_update', (data) => {
    console.log('📡 Received btc_price_update:', data);
    setPriceData(data);
    // setLoading(false); // Commented out since loading state is not used
  });

  // Use WebSocket data only - no fallback to mock data
  const buyRate = priceData ? priceData.buy_rate_inr : 0;
  const sellRate = priceData ? priceData.sell_rate_inr : 0;
  // const currentBtcPrice = priceData ? priceData.btc_usd_price : 0; // Unused but kept for future BTC price display

  // Notify parent component of rate updates
  useEffect(() => {
    if (onRatesUpdate) {
      onRatesUpdate(buyRate, sellRate);
    }
  }, [buyRate, sellRate, onRatesUpdate]);



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
              className="w-full btn-strike-primary flex items-center justify-center space-x-1"
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
              className="w-full btn-strike-primary flex items-center justify-center space-x-1"
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
            className="w-full btn-strike-primary rounded-xl flex items-center justify-center space-x-1"
          >
            
            <span className="font-medium">Buy</span>
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
            className="w-full btn-strike-primary rounded-xl flex items-center justify-center space-x-1"
          >
            
            <span className="font-medium">Sell</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default MarketRate;

import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { useWebSocketEvent } from '../context/WebSocketContext';
import AnimatedNumber from './AnimatedNumber';
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
  const [loading, setLoading] = useState(true);

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

  const formatINR = (amount: number): string => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

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
            <span className="text-xs text-gray-400">
              $<AnimatedNumber 
                value={currentBtcPrice}
                formatNumber={(value) => Math.round(value).toLocaleString()}
                duration={600}
                className="text-xs text-gray-400"
              />
            </span>
          )}
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        {/* Buy Rate */}
        <div className="text-center">
          <p className="text-xs text-gray-400 mb-1">Buy Rate</p>
          <p className="text-base font-semibold text-white mb-2">
            <AnimatedNumber 
              value={buyRate}
              formatNumber={(value) => formatINR(value)}
              duration={600}
              className="text-base font-semibold text-white"
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
            <AnimatedNumber 
              value={sellRate}
              formatNumber={(value) => formatINR(value)}
              duration={600}
              className="text-base font-semibold text-white"
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

import React, { useState, useEffect } from 'react';
import { useWebSocketEvent } from '../context/WebSocketContext';

interface PriceUpdateData {
  btc_usd_price: number;
  buy_rate_inr: number;
  sell_rate_inr: number;
  timestamp: string;
}

const PriceUpdateTest: React.FC = () => {
  const [priceHistory, setPriceHistory] = useState<PriceUpdateData[]>([]);
  const [updateCount, setUpdateCount] = useState(0);

  // Listen for btc_price_update events as per notes/state.txt
  useWebSocketEvent<PriceUpdateData>('btc_price_update', (data) => {
    console.log('🔔 PriceUpdateTest received btc_price_update:', data);
    
    // Add to history (keep only last 10 updates)
    setPriceHistory(prev => {
      const newHistory = [data, ...prev].slice(0, 10);
      return newHistory;
    });
    
    setUpdateCount(prev => prev + 1);
  });

  const formatINR = (amount: number): string => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatUSD = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 mt-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-white">WebSocket Price Updates</h3>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-400">Updates received:</span>
          <span className="text-sm font-medium text-brand">{updateCount}</span>
        </div>
      </div>
      
      {priceHistory.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-400">Waiting for price updates...</p>
          <p className="text-xs text-gray-500 mt-1">
            Updates trigger when Bitcoin price changes
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {priceHistory.map((update, index) => (
            <div 
              key={`${update.timestamp}-${index}`}
              className={`p-3 rounded-lg border ${
                index === 0 
                  ? 'border-brand bg-brand/10' 
                  : 'border-gray-700 bg-gray-800'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-white">
                  {formatUSD(update.btc_usd_price)}
                </span>
                <span className="text-xs text-gray-400">
                  {new Date(update.timestamp).toLocaleTimeString()}
                </span>
              </div>
              
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-gray-400">Buy: </span>
                  <span className="text-green-400 font-medium">
                    {formatINR(update.buy_rate_inr)}
                  </span>
                </div>
                <div>
                  <span className="text-gray-400">Sell: </span>
                  <span className="text-red-400 font-medium">
                    {formatINR(update.sell_rate_inr)}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      
      <div className="mt-4 pt-3 border-t border-gray-700">
        <p className="text-xs text-gray-500">
          💡 This component demonstrates the WebSocket 'btc_price_update' event implementation
        </p>
      </div>
    </div>
  );
};

export default PriceUpdateTest;

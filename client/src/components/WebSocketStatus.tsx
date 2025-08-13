import React, { useState } from 'react';
import { useWebSocket, useWebSocketEvent } from '../context/WebSocketContext';

interface WebSocketStatusProps {
  className?: string;
}

// Price update data from WebSocket (matches PriceContext interface)
interface PriceUpdateData {
  btc_usd_price: number;
  buy_rate_inr: number;
  sell_rate_inr: number;
  timestamp: string;
}

const WebSocketStatus: React.FC<WebSocketStatusProps> = ({ className = '' }) => {
  const { connectionStatus } = useWebSocket();
  // const [lastUpdate, setLastUpdate] = useState<string | null>(null); // Unused but kept for future features
  const [isReceivingData, setIsReceivingData] = useState(false);

  // Listen for btc_price_update events to show data activity
  useWebSocketEvent<PriceUpdateData>('btc_price_update', (data) => {
    // setLastUpdate(new Date().toLocaleTimeString()); // Unused but kept for future features
    setIsReceivingData(true);
    
    // Reset the receiving indicator after 2 seconds
    setTimeout(() => {
      setIsReceivingData(false);
    }, 2000);
  });

  const getStatusColor = () => {
    switch (connectionStatus) {
      case 'connected':
        return 'bg-brand';
      case 'connecting':
      case 'reconnecting':
        return 'bg-yellow-400';
      case 'disconnected':
        return 'bg-red-400';
      default:
        return 'bg-gray-400';
    }
  };

  const getDotAnimation = () => {
    if (isReceivingData && connectionStatus === 'connected') {
      return 'animate-pulse';
    }
    
    switch (connectionStatus) {
      case 'connecting':
      case 'reconnecting':
        return 'animate-pulse';
      default:
        return '';
    }
  };


  // Don't show anything when connected and idle
  if (connectionStatus === 'connected' && !isReceivingData) {
    return null;
  }

  return (
    <div className={`flex items-center ${className}`}>
      <div 
        className={`w-2 h-2 rounded-full ${getStatusColor()} ${getDotAnimation()}`}
        title={`WebSocket: ${connectionStatus}`}
      >
      </div>
    </div>
  );
};

export default WebSocketStatus;

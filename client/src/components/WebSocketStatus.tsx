import React, { useState } from 'react';
import { useWebSocket, useWebSocketEvent } from '../context/WebSocketContext';
import { Wifi, WifiOff, Loader2, Activity } from 'lucide-react';

interface WebSocketStatusProps {
  className?: string;
}

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
        return 'text-brand';
      case 'connecting':
      case 'reconnecting':
        return 'text-yellow-400';
      case 'disconnected':
        return 'text-red-400';
      default:
        return 'text-gray-400';
    }
  };

  const getStatusIcon = () => {
    if (isReceivingData && connectionStatus === 'connected') {
      return <Activity className="w-4 h-4 animate-pulse" />;
    }
    
    switch (connectionStatus) {
      case 'connected':
        return <Wifi className="w-4 h-4" />;
      case 'connecting':
      case 'reconnecting':
        return <Loader2 className="w-4 h-4 animate-spin" />;
      case 'disconnected':
        return <WifiOff className="w-4 h-4" />;
      default:
        return <WifiOff className="w-4 h-4" />;
    }
  };

  const getStatusText = () => {
    if (isReceivingData && connectionStatus === 'connected') {
      return 'Updating';
    }
    
    switch (connectionStatus) {
      case 'connected':
        return 'Live';
      case 'connecting':
        return 'Connecting';
      case 'reconnecting':
        return 'Reconnecting';
      case 'disconnected':
        return 'Offline';
      default:
        return 'Unknown';
    }
  };

  return (
    <div className={`flex items-center space-x-2 text-xs ${className}`}>
      <div className={getStatusColor()}>
        {getStatusIcon()}
      </div>
      <span className={getStatusColor()}>
        {getStatusText()}
      </span>
    </div>
  );
};

export default WebSocketStatus;

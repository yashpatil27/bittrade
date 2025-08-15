import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Wifi, WifiOff, Zap } from 'lucide-react';
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
  const [isReceivingData, setIsReceivingData] = useState(false);
  const [dataParticles, setDataParticles] = useState<number[]>([]);
  const [connectionPulse, setConnectionPulse] = useState(0);
  // Listen for btc_price_update events to show data activity
  useWebSocketEvent<PriceUpdateData>('btc_price_update', (data) => {
    setIsReceivingData(true);
    
    // Create data particles for fun effect
    const newParticles = Array.from({ length: 3 }, (_, i) => Date.now() + i);
    setDataParticles(newParticles);
    
    // Reset after animation
    setTimeout(() => {
      setIsReceivingData(false);
      setDataParticles([]);
    }, 2000);
  });

  // Create connection pulse effect
  useEffect(() => {
    if (connectionStatus === 'connected') {
      const interval = setInterval(() => {
        setConnectionPulse(prev => prev + 1);
      }, 4000);
      return () => clearInterval(interval);
    }
  }, [connectionStatus]);

  const getStatusIcon = () => {
    switch (connectionStatus) {
      case 'connected':
        return isReceivingData ? Zap : Wifi;
      case 'disconnected':
        return WifiOff;
      default:
        // For the brief connecting/reconnecting states, just show wifi
        return Wifi;
    }
  };

  const getStatusTheme = () => {
    switch (connectionStatus) {
      case 'connected':
        return {
          primary: 'text-brand',
          secondary: 'text-brand/60',
          bg: 'bg-brand/10',
          border: 'border-brand/20',
          glow: 'shadow-brand/30',
          particle: 'bg-brand'
        };
      case 'disconnected':
        return {
          primary: 'text-red-400',
          secondary: 'text-red-400/60',
          bg: 'bg-red-400/10',
          border: 'border-red-400/20',
          glow: 'shadow-red-400/30',
          particle: 'bg-red-400'
        };
      default:
        // For brief intermediate states, use muted brand colors
        return {
          primary: 'text-brand/70',
          secondary: 'text-brand/40',
          bg: 'bg-brand/5',
          border: 'border-brand/10',
          glow: 'shadow-brand/20',
          particle: 'bg-brand/70'
        };
    }
  };

  const StatusIcon = getStatusIcon();
  const theme = getStatusTheme();

  const containerVariants = {
    idle: {
      scale: 1,
      rotate: 0,
      transition: { duration: 0.3, ease: [0.4, 0, 0.2, 1] as const }
    },
    active: {
      scale: [1, 1.1, 1.05],
      rotate: [0, 5, -5, 0],
      transition: { 
        duration: 0.6, 
        ease: [0.68, -0.55, 0.265, 1.55] as const,
        times: [0, 0.3, 0.7, 1]
      }
    },
    connecting: {
      rotate: 360,
      transition: {
        duration: 2,
        repeat: Infinity,
        ease: "linear" as const
      }
    },
    error: {
      x: [-2, 2, -2, 2, 0],
      transition: {
        duration: 0.4,
        repeat: Infinity,
        repeatDelay: 2
      }
    }
  };

  const iconVariants = {
    idle: {
      scale: 1,
      rotateY: 0,
      transition: { duration: 0.3 }
    },
    active: {
      scale: [1, 1.2, 1],
      rotate: [0, 360],
      transition: { 
        duration: 0.8,
        ease: [0.68, -0.55, 0.265, 1.55] as const
      }
    },
    pulse: {
      scale: [1, 1.1, 1],
      transition: {
        duration: 2,
        repeat: Infinity,
        ease: [0.4, 0, 0.6, 1] as const
      }
    }
  };

  const getAnimationState = () => {
    if (connectionStatus === 'connecting' || connectionStatus === 'reconnecting') {
      return 'connecting';
    }
    if (connectionStatus === 'disconnected') {
      return 'error';
    }
    if (isReceivingData) {
      return 'active';
    }
    return 'idle';
  };

  const getIconState = () => {
    if (isReceivingData) return 'active';
    if (connectionStatus === 'connected') return 'pulse';
    return 'idle';
  };

  // Always show component, but render blank content when connected and idle
  const isConnectedIdle = connectionStatus === 'connected' && !isReceivingData;
  
  return (
    <motion.div 
      className={`relative flex items-center justify-center ${className}`}
      variants={containerVariants}
      animate={getAnimationState()}
      initial={{ opacity: 1, scale: 1 }} // Always start visible
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      {/* Only render content when NOT connected idle */}
      {!isConnectedIdle && (
        <>
      {/* Background orb */}
      <motion.div
        className={`absolute w-8 h-8 rounded-full ${theme.bg} ${theme.border} border backdrop-blur-sm`}
        animate={{
          scale: isReceivingData ? [1, 1.3, 1] : connectionStatus === 'connected' ? [1, 1.05, 1] : 1,
          opacity: [0.7, 1, 0.7]
        }}
        transition={{
          duration: isReceivingData ? 0.8 : 3,
          repeat: Infinity,
          ease: [0.4, 0, 0.6, 1]
        }}
      />

      {/* Outer glow ring */}
      <motion.div
        className={`absolute w-10 h-10 rounded-full border-2 ${theme.border}`}
        animate={{
          scale: connectionStatus === 'connected' ? [1, 1.2, 1] : 1,
          opacity: connectionStatus === 'connected' ? [0.3, 0.6, 0.3] : 0.2,
          rotate: connectionStatus === 'connecting' || connectionStatus === 'reconnecting' ? 360 : 0
        }}
        transition={{
          scale: { duration: 4, repeat: Infinity, ease: [0.4, 0, 0.6, 1] },
          opacity: { duration: 4, repeat: Infinity, ease: [0.4, 0, 0.6, 1] },
          rotate: { duration: 2, repeat: Infinity, ease: "linear" }
        }}
      />

      {/* Main icon */}
      <motion.div
        className={`relative z-10 w-4 h-4 ${theme.primary}`}
        variants={iconVariants}
        animate={getIconState()}
      >
        <StatusIcon className="w-full h-full" />
      </motion.div>

      {/* Data particles */}
      <AnimatePresence>
        {dataParticles.map((particle, index) => (
          <motion.div
            key={particle}
            className={`absolute w-1 h-1 rounded-full ${theme.particle}`}
            initial={{
              scale: 0,
              x: 0,
              y: 0,
              opacity: 1
            }}
            animate={{
              scale: [0, 1, 0],
              x: [0, (index - 1) * 20],
              y: [0, -15 + index * 5],
              opacity: [0, 1, 0]
            }}
            exit={{
              scale: 0,
              opacity: 0
            }}
            transition={{
              duration: 1.5,
              delay: index * 0.1,
              ease: [0.68, -0.55, 0.265, 1.55]
            }}
          />
        ))}
      </AnimatePresence>

      {/* Connection pulse waves */}
      <AnimatePresence>
        {connectionStatus === 'connected' && (
          <motion.div
            key={connectionPulse}
            className={`absolute w-12 h-12 rounded-full border ${theme.border}`}
            initial={{ scale: 0.8, opacity: 0.8 }}
            animate={{ scale: 2, opacity: 0 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{
              duration: 2,
              ease: [0.4, 0, 0.2, 1]
            }}
          />
        )}
      </AnimatePresence>

      {/* Data burst effect */}
      <AnimatePresence>
        {isReceivingData && (
          <motion.div
            className={`absolute w-6 h-6 border-2 ${theme.border} rounded-full`}
            initial={{ scale: 0.5, opacity: 0.8 }}
            animate={{ scale: [0.5, 1.5, 2], opacity: [0.8, 0.4, 0] }}
            exit={{ scale: 0.5, opacity: 0 }}
            transition={{
              duration: 1,
              ease: [0.4, 0, 0.2, 1]
            }}
          />
        )}
        </AnimatePresence>
        </>
      )}
    </motion.div>
  );
};

export default WebSocketStatus;

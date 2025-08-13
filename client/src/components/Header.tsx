import React, { useState, useEffect } from 'react';
import { User, Menu, Settings } from 'lucide-react';
import WebSocketStatus from './WebSocketStatus';
import { usePortfolio } from '../context/PortfolioContext';
import { AnimateBTC } from './AnimateNumberFlow';

interface HeaderProps {
  title?: string;
  showProfile?: boolean;
  showSettings?: boolean;
  showMenu?: boolean;
  onProfileClick?: () => void;
  onSettingsClick?: () => void;
  onMenuClick?: () => void;
  onTitleClick?: () => void;
}

const Header: React.FC<HeaderProps> = ({
  title = '₿itTrade',
  showProfile = true,
  showSettings = false,
  showMenu = false,
  onProfileClick,
  onSettingsClick,
  onMenuClick,
  onTitleClick
}) => {
  const [showBalance, setShowBalance] = useState(false);
  const { userBalance } = usePortfolio();

  // Handle scroll to show/hide BTC balance
  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      // Show balance after scrolling 80px
      setShowBalance(scrollY > 80);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-black border-b border-black">
      <div className="relative flex items-center justify-between px-4 py-1">
        {/* Left side */}
        <div className="flex items-center space-x-3">
          {showMenu && (
            <button 
              onClick={onMenuClick}
              className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
            >
              <Menu className="w-5 h-5 text-gray-400" />
            </button>
          )}
          <h1 
            className={`text-lg font-medium text-white cursor-pointer hover:text-gray-300 transition-all duration-300 ${
              showBalance ? 'opacity-0 -translate-y-2 pointer-events-none' : 'opacity-100 translate-y-0'
            }`}
            onClick={onTitleClick}
          >
            {title}
          </h1>
        </div>
        
        {/* Center - BTC Balance (appears on scroll) */}
        <div className={`absolute left-1/2 transform -translate-x-1/2 transition-all duration-300 ${
          showBalance ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2 pointer-events-none'
        }`}>
          {userBalance && (
            <AnimateBTC 
              value={userBalance.available_btc || 0} 
              className="text-white text-sm font-medium" 
            />
          )}
        </div>
        
        {/* Right side */}
        <div className="flex items-center space-x-3">
          <WebSocketStatus />
          
          {showProfile && (
            <button 
              onClick={onProfileClick}
              className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
            >
              <User className="w-5 h-5 text-white" />
            </button>
          )}
          
          {showSettings && (
            <button 
              onClick={onSettingsClick}
              className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
            >
              <Settings className="w-5 h-5 text-gray-400" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Header;

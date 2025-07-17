import React from 'react';
import { Bell, Menu, Settings } from 'lucide-react';
import WebSocketStatus from './WebSocketStatus';

interface HeaderProps {
  title?: string;
  showNotifications?: boolean;
  showSettings?: boolean;
  showMenu?: boolean;
  onNotificationClick?: () => void;
  onSettingsClick?: () => void;
  onMenuClick?: () => void;
}

const Header: React.FC<HeaderProps> = ({
  title = '₿itTrade',
  showNotifications = true,
  showSettings = false,
  showMenu = false,
  onNotificationClick,
  onSettingsClick,
  onMenuClick
}) => {
  return (
    <div className="bg-black border-b border-gray-800">
      <div className="flex items-center justify-between px-4 py-2">
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
          <h1 className="text-lg font-medium text-white">{title}</h1>
        </div>
        
        {/* Right side */}
        <div className="flex items-center space-x-3">
          <WebSocketStatus />
          
          {showNotifications && (
            <button 
              onClick={onNotificationClick}
              className="p-2 hover:bg-gray-800 rounded-lg transition-colors relative"
            >
              <Bell className="w-5 h-5 text-gray-400" />
              {/* Notification dot */}
              <div className="absolute top-1 right-1 w-2 h-2 rounded-full" style={{ backgroundColor: '#a5b4fc' }}></div>
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

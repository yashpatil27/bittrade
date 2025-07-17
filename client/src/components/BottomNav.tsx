import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Home, TrendingUp, Clock, User, PlusCircle } from 'lucide-react';

const BottomNav: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const navItems = [
    { id: 'home', label: 'Home', icon: Home, path: '/' },
    { id: 'portfolio', label: 'Portfolio', icon: TrendingUp, path: '/portfolio' },
    { id: 'trade', label: 'Trade', icon: PlusCircle, path: '/trade' },
    { id: 'history', label: 'History', icon: Clock, path: '/history' },
    { id: 'profile', label: 'Profile', icon: User, path: '/profile' },
  ];

  const handleNavigation = (path: string) => {
    navigate(path);
  };

  return (
    <div className="bg-gray-900 border-t border-gray-800">
      <div className="flex items-center justify-around px-1 py-1">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          const IconComponent = item.icon;
          
          return (
            <button
              key={item.id}
              onClick={() => handleNavigation(item.path)}
              className={`flex flex-col items-center justify-center py-1 px-2 rounded-lg transition-all duration-200 min-w-0 flex-1 ${
                isActive 
                  ? '' 
                  : 'text-gray-500 hover:text-gray-300'
              }`}
              style={isActive ? { color: '#a5b4fc' } : {}}
            >
              <div className={`p-0.5 rounded-lg`} style={isActive ? { backgroundColor: 'rgba(165, 180, 252, 0.1)' } : {}}>
                <IconComponent className="w-4 h-4" />
              </div>
              <span className="text-xs font-light mt-0.5 truncate">{item.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default BottomNav;

import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Home, Repeat, Banknote, Clock } from 'lucide-react';

const BottomNav: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const navItems = [
    { id: 'home', label: 'Home', icon: Home, path: '/' },
    { id: 'dca', label: 'DCA', icon: Repeat, path: '/dca' },
    { id: 'loans', label: 'Loans', icon: Banknote, path: '/loans' },
    { id: 'history', label: 'History', icon: Clock, path: '/history' },
  ];

  const handleNavigation = (path: string) => {
    navigate(path);
    window.scrollTo(0, 0);
  };

  return (
    <div className="bg-black border-t border-black">
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
                  ? 'text-brand' 
                  : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              <div className={`p-0.5 rounded-lg ${
                isActive ? 'bg-brand/10' : ''
              }`}>
                <IconComponent className="w-4 h-4" />
              </div>
              <span className="text-xs font-normal mt-0.5 truncate">{item.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default BottomNav;

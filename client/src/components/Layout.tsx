import React from 'react';
import { useLocation } from 'react-router-dom';
import BottomNav from './BottomNav';

interface LayoutProps {
  children: React.ReactNode;
  showBottomNav?: boolean;
}

const Layout: React.FC<LayoutProps> = ({ children, showBottomNav = true }) => {
  const location = useLocation();
  const isAuthPage = location.pathname === '/login' || location.pathname === '/signup';
  const isModalOpen = !showBottomNav && !isAuthPage;

  return (
    <div className={`min-h-screen bg-black text-white overflow-x-hidden ${isModalOpen ? 'overflow-y-hidden' : ''}`}>
      {/* Main Content */}
      <div className={`flex flex-col ${showBottomNav && !isAuthPage ? 'pb-12' : ''} ${isModalOpen ? 'overflow-hidden' : ''}`}>
        {children}
      </div>
      
      {/* Bottom Navigation - Fixed at bottom */}
      {showBottomNav && !isAuthPage && (
        <div className="fixed bottom-0 left-0 right-0 z-50">
          <BottomNav />
        </div>
      )}
    </div>
  );
};

export default Layout;

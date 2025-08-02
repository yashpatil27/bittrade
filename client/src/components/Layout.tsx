import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import BottomNav from './BottomNav';
import Header from './Header';
import ProfileModal from './ProfileModal';

interface LayoutProps {
  children: React.ReactNode;
  showBottomNav?: boolean;
}

const Layout: React.FC<LayoutProps> = ({ children, showBottomNav = true }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const isAuthPage = location.pathname === '/login' || location.pathname === '/signup' || location.pathname === '/register';
  const isModalOpen = !showBottomNav && !isAuthPage;
  const [profileModalOpen, setProfileModalOpen] = useState(false);

  const handleProfileClick = () => {
    setProfileModalOpen(true);
  };

  const handleTitleClick = () => {
    navigate('/');
  };

  // Reset scroll position on route change
  React.useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  return (
    <div className={`min-h-screen bg-black text-white overflow-x-hidden ${isModalOpen ? 'overflow-y-hidden' : ''}`}>
      {/* Header - Only show on non-auth pages */}
      {!isAuthPage && (
        <Header 
          title="₿itTrade" 
          onProfileClick={handleProfileClick}
          onTitleClick={handleTitleClick}
        />
      )}
      
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
      
      {/* Profile Modal - Available on all non-auth pages */}
      {!isAuthPage && (
        <ProfileModal
          isOpen={profileModalOpen}
          onClose={() => setProfileModalOpen(false)}
        />
      )}
    </div>
  );
};

export default Layout;

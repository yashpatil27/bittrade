import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import AdminBottomNav from './AdminBottomNav';
import Header from './Header';
import ProfileModal from './ProfileModal';

interface AdminLayoutProps {
  children: React.ReactNode;
}

const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [profileModalOpen, setProfileModalOpen] = useState(false);

  // Reset scroll position on route change
  React.useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  // Redirect non-admin users
  if (!user?.is_admin) {
    navigate('/');
    return null;
  }

  const handleProfileClick = () => {
    setProfileModalOpen(true);
  };

  const handleTitleClick = () => {
    navigate('/admin');
  };

  return (
    <div className="min-h-screen bg-black text-white overflow-x-hidden">
      {/* Admin Header */}
      <Header 
        title="₿itTrade Admin" 
        onProfileClick={handleProfileClick}
        onTitleClick={handleTitleClick}
      />
      
      {/* Main Content */}
      <div className="flex flex-col pb-12">
        {children}
      </div>
      
      {/* Admin Bottom Navigation - Fixed at bottom */}
      <div className="fixed bottom-0 left-0 right-0 z-50">
        <AdminBottomNav />
      </div>
      
      {/* Profile Modal */}
      <ProfileModal
        isOpen={profileModalOpen}
        onClose={() => setProfileModalOpen(false)}
      />
    </div>
  );
};

export default AdminLayout;

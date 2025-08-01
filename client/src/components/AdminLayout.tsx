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

  // Security check - only admins can access admin interface
  if (!user?.is_admin) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-xl font-bold mb-4">Access Denied</h1>
          <p className="text-gray-400 mb-4">You need admin privileges to access this page.</p>
          <button 
            onClick={() => navigate('/')}
            className="bg-brand text-white px-4 py-2 rounded-lg"
          >
            Go to Home
          </button>
        </div>
      </div>
    );
  }

  const handleProfileClick = () => {
    setProfileModalOpen(true);
  };

  const handleTitleClick = () => {
    navigate('/admin');
  };

  return (
    <div className="min-h-screen bg-black text-white overflow-x-hidden">
      {/* Header */}
      <Header 
        title="₿itTrade Admin" 
        onProfileClick={handleProfileClick}
        onTitleClick={handleTitleClick}
      />
      
      {/* Main Content */}
      <div className="flex flex-col pb-12">
        {children}
      </div>
      
      {/* Bottom Navigation - Fixed at bottom */}
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

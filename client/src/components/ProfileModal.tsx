import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, User, Mail, ChevronRight, LogOut, Shield } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import ProfileUpdateModal from './ProfileUpdateModal';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onEditName?: () => void;
  onEditEmail?: () => void;
  onChangePassword?: () => void;
}

const ProfileModal: React.FC<ProfileModalProps> = ({
  isOpen,
  onClose,
  onEditName,
  onEditEmail,
  onChangePassword,
}) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [userState, setUserState] = useState(user);
  const [dragStartY, setDragStartY] = useState(0);
  const [dragOffset, setDragOffset] = useState(0);
  const [isProfileUpdateOpen, setProfileUpdateOpen] = useState(false);
  const [updateType, setUpdateType] = useState<'name' | 'email' | 'password'>();
  const [isDragging, setIsDragging] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [screenHeight] = useState(window.innerHeight);
  const modalRef = useRef<HTMLDivElement>(null);

  // Update local user state when auth user changes
  useEffect(() => {
    setUserState(user);
  }, [user]);

  // Animation control
  useEffect(() => {
    if (isOpen) {
      setDragOffset(0);
      setIsAnimating(false);
      setTimeout(() => {
        setIsAnimating(true);
      }, 50);
    } else {
      setIsAnimating(false);
    }
  }, [isOpen]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      // Store current scroll position
      const scrollY = window.scrollY;
      
      // Prevent scrolling
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = '100%';
      
      // Store scroll position for restoration
      document.body.setAttribute('data-scroll-y', scrollY.toString());
    } else {
      // Restore scroll position
      const scrollY = document.body.getAttribute('data-scroll-y');
      
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
      document.body.removeAttribute('data-scroll-y');
      
      // Restore scroll position
      if (scrollY) {
        window.scrollTo(0, parseInt(scrollY));
      }
    }

    return () => {
      const scrollY = document.body.getAttribute('data-scroll-y');
      
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
      document.body.removeAttribute('data-scroll-y');
      
      if (scrollY) {
        window.scrollTo(0, parseInt(scrollY));
      }
    };
  }, [isOpen]);

  // Close animation function
  const animateClose = () => {
    setIsClosing(true);
    setIsAnimating(false);
    setTimeout(() => {
      setIsClosing(false);
      onClose();
    }, 300);
  };

  // Touch handlers for drag-to-close
  const handleTouchStart = (e: React.TouchEvent) => {
    const target = e.target as HTMLElement;
    if (target.tagName === 'BUTTON' || target.closest('button') || target.closest('[data-clickable]')) {
      return;
    }
    
    const touch = e.touches[0];
    setDragStartY(touch.clientY);
    setIsDragging(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    
    e.preventDefault();
    const touch = e.touches[0];
    const deltaY = touch.clientY - dragStartY;
    
    if (deltaY > 0) {
      setDragOffset(deltaY);
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    const closeThreshold = screenHeight * 0.3;
    
    if (dragOffset > closeThreshold) {
      animateClose();
    } else {
      setDragOffset(0);
    }
  };

  const handleLogout = () => {
    logout();
    animateClose();
    // Navigate to login page after logout
    setTimeout(() => {
      navigate('/login');
    }, 300); // Wait for modal close animation
  };

  const handleProfileUpdate = (updatedData: { name?: string; email?: string }) => {
    // Update local state immediately to reflect changes
    setUserState(prevUser => {
      if (!prevUser) return prevUser;
      return {
        ...prevUser,
        ...(updatedData.name && { name: updatedData.name }),
        ...(updatedData.email && { email: updatedData.email })
      };
    });
  };

  const handleAdminToggle = () => {
    const currentPath = window.location.pathname;
    
    if (currentPath.startsWith('/admin')) {
      // Currently in admin view, go back to regular view
      navigate('/');
    } else {
      // Currently in regular view, go to admin view
      navigate('/admin');
    }
    
    animateClose();
  };

  if (!isOpen) return null;

  const modalContent = (
    <div className="fixed inset-0 z-50" style={{ touchAction: 'none' }}>
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={animateClose}
        onTouchMove={(e) => e.preventDefault()}
        style={{ touchAction: 'none' }}
      />
      
      {/* Modal */}
      <div
        ref={modalRef}
        className="absolute inset-x-0 bottom-0 bg-black max-w-md mx-auto rounded-t-3xl flex flex-col pb-safe"
        style={{
          maxHeight: '90vh',
          minHeight: '60vh',
          transform: `translateY(${isClosing ? '100%' : isAnimating ? `${dragOffset}px` : '100%'})`,
          transition: isDragging ? 'none' : (isAnimating || isClosing) ? 'transform 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)' : 'none',
          touchAction: 'none'
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Header */}
        <div className="px-2 pt-2 pb-8">
          <div className="flex items-center justify-between">
            <button
              onClick={animateClose}
              className="text-primary hover:text-primary p-2 w-12 h-12 flex items-center justify-center transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-white text-sm font-medium text-center flex-1">Profile</h2>
            {userState?.is_admin ? (
              <div className="w-12 h-12 flex items-center justify-center">
                <button
                  onClick={handleAdminToggle}
                  className="text-primary hover:text-brand p-2 w-10 h-10 flex items-center justify-center transition-all duration-200 transform hover:scale-110 hover:bg-gray-800/50 rounded-lg"
                  title={window.location.pathname.startsWith('/admin') ? 'Switch to User View' : 'Switch to Admin View'}
                >
                  <Shield className={`w-5 h-5 transition-all duration-200 ${window.location.pathname.startsWith('/admin') ? 'text-brand' : 'text-white hover:text-brand'}`} />
                </button>
              </div>
            ) : (
              <div className="w-10" />
            )}
          </div>
        </div>

        {/* Content */}
        <AnimatePresence mode="wait">
          {isAnimating && (
            <motion.div 
              className="flex flex-col h-full"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              {/* Profile Avatar Section */}
              <motion.div 
                className="flex flex-col items-center px-6 pb-6"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ 
                  delay: 0.1,
                  type: "spring",
                  stiffness: 400,
                  damping: 25
                }}
              >
                <motion.div 
                  className="w-20 h-20 bg-brand/10 rounded-full flex items-center justify-center mb-4"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ 
                    delay: 0.2,
                    type: "spring",
                    stiffness: 500,
                    damping: 20
                  }}
                >
                  <motion.div
                    initial={{ opacity: 0, rotate: -10 }}
                    animate={{ opacity: 1, rotate: 0 }}
                    transition={{ delay: 0.3 }}
                  >
                    <User className="w-10 h-10 text-brand" />
                  </motion.div>
                </motion.div>
                <motion.h3 
                  className="text-white text-xl font-medium mb-1"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4, duration: 0.4 }}
                >
                  {userState?.name}
                </motion.h3>
                <motion.p 
                  className="text-gray-400 text-sm"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5, duration: 0.3 }}
                >
                  {userState?.email}
                </motion.p>
              </motion.div>

              {/* Profile Options */}
              <motion.div 
                className="flex-1 px-6 pb-8"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6, duration: 0.3 }}
              >
                <div className="space-y-3">
                  {/* Edit Name */}
                  <motion.div 
                    className="bg-gray-900 hover:bg-gray-800 border border-gray-700 rounded-lg p-4 cursor-pointer transition-colors"
                    onClick={() => { setUpdateType('name'); setProfileUpdateOpen(true); }}
                    data-clickable="true"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ 
                      delay: 0.7,
                      type: "spring",
                      stiffness: 500,
                      damping: 30
                    }}
                    whileHover={{ scale: 1.02, x: 5 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <motion.div 
                          className="p-2 bg-gray-800 rounded-lg"
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: 0.75 }}
                        >
                          <User className="w-5 h-5 text-brand" />
                        </motion.div>
                        <div>
                          <motion.h3 
                            className="text-white text-sm font-medium"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.8 }}
                          >
                            Name
                          </motion.h3>
                          <motion.p 
                            className="text-gray-400 text-xs mt-1"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.85 }}
                          >
                            {userState?.name}
                          </motion.p>
                        </div>
                      </div>
                      <motion.div
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.8 }}
                      >
                        <ChevronRight className="w-5 h-5 text-gray-400" />
                      </motion.div>
                    </div>
                  </motion.div>

                  {/* Edit Email */}
                  <motion.div 
                    className="bg-gray-900 hover:bg-gray-800 border border-gray-700 rounded-lg p-4 cursor-pointer transition-colors"
                    onClick={() => { setUpdateType('email'); setProfileUpdateOpen(true); }}
                    data-clickable="true"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ 
                      delay: 0.75,
                      type: "spring",
                      stiffness: 500,
                      damping: 30
                    }}
                    whileHover={{ scale: 1.02, x: 5 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <motion.div 
                          className="p-2 bg-gray-800 rounded-lg"
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: 0.8 }}
                        >
                          <Mail className="w-5 h-5 text-brand" />
                        </motion.div>
                        <div>
                          <motion.h3 
                            className="text-white text-sm font-medium"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.85 }}
                          >
                            Email Address
                          </motion.h3>
                          <motion.p 
                            className="text-gray-400 text-xs mt-1"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.9 }}
                          >
                            {userState?.email}
                          </motion.p>
                        </div>
                      </div>
                      <motion.div
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.85 }}
                      >
                        <ChevronRight className="w-5 h-5 text-gray-400" />
                      </motion.div>
                    </div>
                  </motion.div>

                  {/* Change Password */}
                  <motion.div 
                    className="bg-gray-900 hover:bg-gray-800 border border-gray-700 rounded-lg p-4 cursor-pointer transition-colors"
                    onClick={() => { setUpdateType('password'); setProfileUpdateOpen(true); }}
                    data-clickable="true"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ 
                      delay: 0.8,
                      type: "spring",
                      stiffness: 500,
                      damping: 30
                    }}
                    whileHover={{ scale: 1.02, x: 5 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <motion.div 
                          className="p-2 bg-gray-800 rounded-lg"
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: 0.85 }}
                        >
                          <svg className="w-5 h-5 text-brand" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                          </svg>
                        </motion.div>
                        <div>
                          <motion.h3 
                            className="text-white text-sm font-medium"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.9 }}
                          >
                            Change Password
                          </motion.h3>
                          <motion.p 
                            className="text-gray-400 text-xs mt-1"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.95 }}
                          >
                            Update your account password
                          </motion.p>
                        </div>
                      </div>
                      <motion.div
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.9 }}
                      >
                        <ChevronRight className="w-5 h-5 text-gray-400" />
                      </motion.div>
                    </div>
                  </motion.div>
                </div>

                {/* Logout Section */}
                <motion.div 
                  className="mt-8 pt-6 border-t border-gray-800"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.9, duration: 0.3 }}
                >
                  <motion.button
                    onClick={handleLogout}
                    className="w-full bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 rounded-lg p-4 transition-colors"
                    data-clickable="true"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 1.0 }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className="flex items-center justify-center space-x-3">
                      <motion.div
                        initial={{ opacity: 0, rotate: -10 }}
                        animate={{ opacity: 1, rotate: 0 }}
                        transition={{ delay: 1.1 }}
                      >
                        <LogOut className="w-5 h-5 text-red-400" />
                      </motion.div>
                      <motion.span 
                        className="text-red-400 text-sm font-medium"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 1.1 }}
                      >
                        Sign Out
                      </motion.span>
                    </div>
                  </motion.button>
                </motion.div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );

  return (
    <>
      {createPortal(modalContent, document.body)}
      <ProfileUpdateModal
        isOpen={isProfileUpdateOpen}
        onRequestClose={() => setProfileUpdateOpen(false)}
        userName={userState?.name || ''}
        userEmail={userState?.email || ''}
        updateType={updateType}
        onProfileUpdate={handleProfileUpdate}
      />
    </>
  );
};

export default ProfileModal;

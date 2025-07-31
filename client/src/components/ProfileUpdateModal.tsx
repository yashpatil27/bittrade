import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, User, Mail, Lock, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getApiUrl } from '../utils/api';

interface ProfileUpdateModalProps {
  isOpen: boolean;
  onRequestClose: () => void;
  userName: string;
  userEmail: string;
  updateType?: 'name' | 'email' | 'password';
  onProfileUpdate?: (updatedData: { name?: string; email?: string }) => void;
}

const ProfileUpdateModal: React.FC<ProfileUpdateModalProps> = ({ isOpen, onRequestClose, userName, userEmail, updateType, onProfileUpdate }) => {
  const [name, setName] = useState(userName);
  const [email, setEmail] = useState(userEmail);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [isAnimating, setIsAnimating] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  
  const { token } = useAuth() || {};

  // Update local state when props change
  useEffect(() => {
    setName(userName);
    setEmail(userEmail);
  }, [userName, userEmail]);

  // Animation control
  useEffect(() => {
    if (isOpen) {
      setPassword('');
      setConfirmPassword('');
      setCurrentPassword('');
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
      const scrollY = window.scrollY;
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = '100%';
      document.body.setAttribute('data-scroll-y', scrollY.toString());
    } else {
      const scrollY = document.body.getAttribute('data-scroll-y');
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
      document.body.removeAttribute('data-scroll-y');
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

  const animateClose = () => {
    setIsClosing(true);
    setIsAnimating(false);
    setTimeout(() => {
      setIsClosing(false);
      onRequestClose();
    }, 300);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);
    setLoading(true);

    const apiUrl = getApiUrl();
    const headers = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token || ''}`,
    };

    try {
      let response;
      if (updateType === 'name') {
        response = await fetch(`${apiUrl}/api/user/profile/name`, {
          method: 'PUT',
          headers,
          body: JSON.stringify({ name, currentPassword })
        });
      } else if (updateType === 'email') {
        response = await fetch(`${apiUrl}/api/user/profile/email`, {
          method: 'PUT',
          headers,
          body: JSON.stringify({ email, currentPassword })
        });
      } else if (updateType === 'password') {
        if (password !== confirmPassword) {
          throw new Error("Passwords do not match.");
        }
        response = await fetch(`${apiUrl}/api/user/profile/password`, {
          method: 'PUT',
          headers,
          body: JSON.stringify({ password, currentPassword })
        });
      }

      if (!response?.ok) {
        const errorData = await response?.json();
        throw new Error(errorData?.message || 'Failed to update profile.');
      }

      setSuccess(true);
      
      // Update local state immediately to reflect changes
      if (updateType === 'name') {
        // Name is already updated in local state
      } else if (updateType === 'email') {
        // Email is already updated in local state
      } else if (updateType === 'password') {
        // Clear password fields after successful update
        setPassword('');
        setConfirmPassword('');
        setCurrentPassword('');
      }
      
      if (typeof onProfileUpdate === 'function') {
        onProfileUpdate({ name, email });
      }
      
      // Show success message briefly before closing
      setTimeout(() => {
        animateClose();
      }, 1500);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const modalContent = (
    <div className="fixed inset-0 z-50" style={{ touchAction: 'none' }}>
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={animateClose}
        style={{ touchAction: 'none' }}
      />
      
      {/* Modal */}
      <div
        className="absolute inset-x-0 bottom-0 bg-black max-w-md mx-auto rounded-t-3xl flex flex-col"
        style={{
          maxHeight: '90vh',
          minHeight: '60vh',
          transform: `translateY(${isClosing ? '100%' : isAnimating ? '0%' : '100%'})`,
          transition: (isAnimating || isClosing) ? 'transform 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)' : 'none',
          touchAction: 'none'
        }}
      >
        {/* Header */}
        <div className="px-6 pt-4 pb-4">
          <div className="flex items-center justify-between">
            <button
              onClick={animateClose}
              className="text-secondary hover:text-primary p-2 w-12 h-12 flex items-center justify-center transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-white text-sm font-medium text-center flex-1">
              {updateType === 'name' ? 'Update Name' : 
               updateType === 'email' ? 'Update Email' : 
               updateType === 'password' ? 'Change Password' : 'Update Profile'}
            </h2>
            <div className="w-10"></div> {/* Spacer for centering */}
          </div>
        </div>

        {/* Form Content */}
        <div className="flex-1 px-6 pb-8 overflow-y-auto">
          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 bg-red-900/50 border border-red-700 rounded-lg flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
              <span className="text-red-200 text-sm">{error}</span>
            </div>
          )}

          {/* Success Message */}
          {success && (
            <div className="mb-4 p-3 bg-green-900/50 border border-green-700 rounded-lg flex items-center space-x-2">
              <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />
              <span className="text-green-200 text-sm">Profile updated successfully!</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Name Update Form */}
            {updateType === 'name' && (
              <>
                <div className="space-y-2">
                  <label className="flex items-center space-x-3 text-white text-sm font-medium">
                    <User className="w-4 h-4 text-brand" />
                    <span>New Name</span>
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand transition-colors"
                    placeholder="Enter your new name"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="flex items-center space-x-3 text-white text-sm font-medium">
                    <Lock className="w-4 h-4 text-brand" />
                    <span>Current Password</span>
                  </label>
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand transition-colors"
                    placeholder="Enter your current password"
                    required
                  />
                </div>
              </>
            )}

            {/* Email Update Form */}
            {updateType === 'email' && (
              <>
                <div className="space-y-2">
                  <label className="flex items-center space-x-3 text-white text-sm font-medium">
                    <Mail className="w-4 h-4 text-brand" />
                    <span>New Email Address</span>
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand transition-colors"
                    placeholder="Enter your new email"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="flex items-center space-x-3 text-white text-sm font-medium">
                    <Lock className="w-4 h-4 text-brand" />
                    <span>Current Password</span>
                  </label>
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand transition-colors"
                    placeholder="Enter your current password"
                    required
                  />
                </div>
              </>
            )}

            {/* Password Update Form */}
            {updateType === 'password' && (
              <>
                <div className="space-y-2">
                  <label className="flex items-center space-x-3 text-white text-sm font-medium">
                    <Lock className="w-4 h-4 text-brand" />
                    <span>New Password</span>
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand transition-colors"
                    placeholder="Enter new password"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="flex items-center space-x-3 text-white text-sm font-medium">
                    <Lock className="w-4 h-4 text-brand" />
                    <span>Confirm New Password</span>
                  </label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand transition-colors"
                    placeholder="Confirm new password"
                    required
                  />
                </div>
              </>
            )}

            {/* Submit Button */}
            <div className="pt-6">
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-brand hover:bg-brand/90 disabled:bg-brand/50 disabled:cursor-not-allowed text-black font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center space-x-2"
              >
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                <span>
                  {loading ? 'Updating...' :
                   updateType === 'name' ? 'Update Name' : 
                   updateType === 'email' ? 'Update Email' : 
                   updateType === 'password' ? 'Change Password' : 'Update Profile'}
                </span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};

export default ProfileUpdateModal;


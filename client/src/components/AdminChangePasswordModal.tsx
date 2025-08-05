import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Lock, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { getApiUrl } from '../utils/api';

interface AdminChangePasswordModalProps {
  isOpen: boolean;
  onRequestClose: () => void;
  user: { id: string; name: string } | null;
}

const AdminChangePasswordModal: React.FC<AdminChangePasswordModalProps> = ({ isOpen, onRequestClose, user }) => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setPassword('');
      setConfirmPassword('');
      setError('');
      setSuccess(false);
      setLoading(false);
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);
    setLoading(true);

    const apiUrl = getApiUrl();
    try {
      if (password !== confirmPassword) {
        throw new Error("Passwords do not match.");
      }

      const response = await fetch(`${apiUrl}/admin/users/${user?.id}/password`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('bittrade_token')}`
        },
        body: JSON.stringify({ password })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData?.message || 'Failed to change password.');
      }

      setSuccess(true);
      setTimeout(() => {
        onRequestClose();
      }, 1500);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !user) return null;

  return createPortal(
    <div className="fixed inset-0 z-50" style={{ touchAction: 'none' }}>
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onRequestClose} style={{ touchAction: 'none' }} />
      <div className="absolute inset-x-0 bottom-0 bg-black max-w-md mx-auto rounded-t-3xl flex flex-col">
        <div className="px-6 pt-4 pb-4">
          <div className="flex items-center justify-between">
            <button onClick={onRequestClose} className="text-secondary hover:text-primary p-2 w-12 h-12 flex items-center justify-center">
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-white text-sm font-medium text-center flex-1">Change Password for {user.name}</h2>
            <div className="w-10"></div> {/* Spacer for centering */}
          </div>
        </div>
        <div className="flex-1 px-6 pb-8">
          {error && (
            <div className="mb-4 p-3 bg-red-900/50 border border-red-700 rounded-lg flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 text-red-400" />
              <span className="text-red-200 text-sm">{error}</span>
            </div>
          )}
          {success && (
            <div className="mb-4 p-3 bg-green-900/50 border border-green-700 rounded-lg flex items-center space-x-2">
              <CheckCircle className="w-4 h-4 text-green-400" />
              <span className="text-green-200 text-sm">Password changed successfully!</span>
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="flex items-center space-x-3 text-white text-sm font-medium">
                <Lock className="w-4 h-4 text-brand" />
                <span>New Password</span>
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none"
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
                className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none"
                placeholder="Confirm new password"
                required
              />
            </div>
            <div className="pt-6">
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-brand hover:bg-brand/90 disabled:bg-brand/50 disabled:cursor-not-allowed text-black font-medium py-3 px-4 rounded-lg"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Change Password'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default AdminChangePasswordModal;


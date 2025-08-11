import React, { useState } from 'react';
import { usePortfolio } from '../../context/PortfolioContext';
import UserList from '../../components/UserList';
import OptionsModal from '../../components/OptionsModal';
import AdminChangePasswordModal from '../../components/AdminChangePasswordModal';
import DepositBitcoinModal from '../../components/DepositBitcoinModal';
import DepositCashModal from '../../components/DepositCashModal';
import BitcoinQuote from '../../components/BitcoinQuote';
import { getApiUrl } from '../../utils/api';
import { Bitcoin, DollarSign, Key, Trash2 } from 'lucide-react';

interface UserWithBalance {
  id: string;
  name: string;
  email: string;
  btcBalance: number;
  inrBalance: number;
  is_admin?: boolean;
}

const AdminUsers: React.FC = () => {
  const { adminUsersFiltered: users, loading, errors, refetchAdminUsers: refetchUsers } = usePortfolio();
  const usersLoading = loading.adminUsers;
  const usersError = errors.adminUsers;
  const [isOptionsModalOpen, setIsOptionsModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserWithBalance | null>(null);
  const [isDepositBitcoinModalOpen, setIsDepositBitcoinModalOpen] = useState(false);
  const [isDepositCashModalOpen, setIsDepositCashModalOpen] = useState(false);
  const [isChangePasswordModalOpen, setIsChangePasswordModalOpen] = useState(false);
  
  const handleUserClick = (user: UserWithBalance) => {
    setSelectedUser(user);
    setIsOptionsModalOpen(true);
  };
  
  const handleCloseModal = () => {
    setIsOptionsModalOpen(false);
    setSelectedUser(null);
  };
  
  const handleDepositBitcoin = () => {
    setIsOptionsModalOpen(false);
    setIsDepositBitcoinModalOpen(true);
  };
  
  const handleDepositCash = () => {
    setIsOptionsModalOpen(false);
    setIsDepositCashModalOpen(true);
  };
  
  const handleDepositBitcoinClose = () => {
    setIsDepositBitcoinModalOpen(false);
    setSelectedUser(null);
  };
  
  const handleDepositCashClose = () => {
    setIsDepositCashModalOpen(false);
    setSelectedUser(null);
  };
  
  const handleDepositComplete = (user: UserWithBalance, amount: string) => {
    console.log(`Deposit completed for ${user.name}: ${amount}`);
    // Refresh users list to show updated balances
    refetchUsers();
  };
  const handleChangePassword = () => {
    setIsOptionsModalOpen(false);
    setIsChangePasswordModalOpen(true);
  };

  const handleChangePasswordClose = () => {
    setIsChangePasswordModalOpen(false);
    setSelectedUser(null);
  };
  
  const handleDeleteUser = async () => {
    if (!selectedUser) return;
    
    try {
      const token = localStorage.getItem('bittrade_token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch(`${getApiUrl()}/api/admin/users/${selectedUser.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete user');
      }

      console.log('User deleted successfully:', selectedUser.name);
      // Refresh users list
      refetchUsers();
      handleCloseModal();
    } catch (error) {
      console.error('Failed to delete user:', error);
      // TODO: Show error message to user
    }
  };

  // Loading and error states are handled by the UserList component
  // Just show loading indicator while fetching
  if (usersLoading) {
    return (
      <div className="min-h-screen bg-black">
        <div className="max-w-md mx-auto bg-black min-h-screen">
          <div className="px-4 py-3">
            <div className="text-center py-8">
              <p className="text-gray-400 text-sm">Loading users...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (usersError) {
    return (
      <div className="min-h-screen bg-black">
        <div className="max-w-md mx-auto bg-black min-h-screen">
          <div className="px-4 py-3">
            <div className="text-center py-8">
              <p className="text-red-500 text-sm">Error: {usersError}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      <div className="max-w-md mx-auto bg-black min-h-screen">
        {/* Main Content */}
        <div className="px-4 py-3 space-y-3">
          {/* User List Component */}
          <UserList
            title="All Users"
            users={users}
            onUserClick={handleUserClick}
            showSearch={true}
            wrapInCard={true}
          />
        </div>
        
        {/* Bitcoin Quote - Outside space-y container for proper spacing */}
        <BitcoinQuote />
      </div>
      
      {/* User Actions Modal */}
      <OptionsModal
        isOpen={isOptionsModalOpen}
        onClose={handleCloseModal}
        title={selectedUser ? `${selectedUser.name}` : 'User Actions'}
        type="custom"
      >
        <div className="space-y-3">
          {/* Deposit Bitcoin Option */}
          <div 
            className="bg-gray-900 hover:bg-gray-800 border border-gray-700 rounded-lg p-4 cursor-pointer transition-colors"
            onClick={handleDepositBitcoin}
            data-clickable="true"
          >
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-orange-500/10 rounded-lg">
                <Bitcoin className="w-5 h-5 text-orange-400" />
              </div>
              <div>
                <h3 className="text-white text-sm font-medium">Deposit Bitcoin</h3>
                <p className="text-gray-400 text-xs mt-1">Add Bitcoin to user's wallet</p>
              </div>
            </div>
          </div>
          
          {/* Deposit Cash Option */}
          <div 
            className="bg-gray-900 hover:bg-gray-800 border border-gray-700 rounded-lg p-4 cursor-pointer transition-colors"
            onClick={handleDepositCash}
            data-clickable="true"
          >
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-green-500/10 rounded-lg">
                <DollarSign className="w-5 h-5 text-green-400" />
              </div>
              <div>
                <h3 className="text-white text-sm font-medium">Deposit Cash</h3>
                <p className="text-gray-400 text-xs mt-1">Add cash to user's balance</p>
              </div>
            </div>
          </div>
          
          {/* Change Password Option */}
          <div 
            className="bg-gray-900 hover:bg-gray-800 border border-gray-700 rounded-lg p-4 cursor-pointer transition-colors"
            onClick={handleChangePassword}
            data-clickable="true"
          >
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-500/10 rounded-lg">
                <Key className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <h3 className="text-white text-sm font-medium">Change Password</h3>
                <p className="text-gray-400 text-xs mt-1">Reset user's password</p>
              </div>
            </div>
          </div>
          
          {/* Delete User Option - Now available for all users */}
          {selectedUser && (
            <div 
              className="bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 rounded-lg p-4 cursor-pointer transition-colors"
              onClick={handleDeleteUser}
              data-clickable="true"
            >
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-red-500/10 rounded-lg">
                  <Trash2 className="w-5 h-5 text-red-400" />
                </div>
                <div>
                  <h3 className="text-red-400 text-sm font-medium">Delete User</h3>
                  <p className="text-gray-400 text-xs mt-1">
                    {selectedUser.is_admin 
                      ? 'Clear admin data (account preserved)' 
                      : 'Permanently remove user account'}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </OptionsModal>
      
      {/* Deposit Bitcoin Modal */}
      {isDepositBitcoinModalOpen && (
        <DepositBitcoinModal
          isOpen={isDepositBitcoinModalOpen}
          onClose={handleDepositBitcoinClose}
          user={selectedUser}
          onComplete={handleDepositComplete}
        />
      )}
      
      {/* Deposit Cash Modal */}
      {isDepositCashModalOpen && (
        <DepositCashModal
          isOpen={isDepositCashModalOpen}
          onClose={handleDepositCashClose}
          user={selectedUser}
          onComplete={handleDepositComplete}
        />
      )}
      
      {/* Admin Change Password Modal */}
      <AdminChangePasswordModal
        isOpen={isChangePasswordModalOpen}
        onRequestClose={handleChangePasswordClose}
        user={selectedUser}
      />
    </div>
  );
};

export default AdminUsers;


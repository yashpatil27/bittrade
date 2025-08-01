import React, { useState } from 'react';
import { useUsers } from '../../hooks/useUsers';
import Card from '../../components/Card';
import OptionsModal from '../../components/OptionsModal';
import { formatBitcoinForDisplay, formatRupeesForDisplay } from '../../utils/formatters';
import { Bitcoin, DollarSign, Key, Trash2 } from 'lucide-react';

interface UserWithBalance {
  id: string;
  name: string;
  email: string;
  btcBalance: number;
  inrBalance: number;
}

const AdminUsers: React.FC = () => {
  const { users, isLoading, error } = useUsers();
  const [isOptionsModalOpen, setIsOptionsModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserWithBalance | null>(null);
  
  const handleUserClick = (user: UserWithBalance) => {
    setSelectedUser(user);
    setIsOptionsModalOpen(true);
  };
  
  const handleCloseModal = () => {
    setIsOptionsModalOpen(false);
    setSelectedUser(null);
  };
  
  const handleDepositBitcoin = () => {
    console.log('Deposit Bitcoin for user:', selectedUser?.name);
    // TODO: Implement deposit Bitcoin functionality
    handleCloseModal();
  };
  
  const handleDepositCash = () => {
    console.log('Deposit Cash for user:', selectedUser?.name);
    // TODO: Implement deposit cash functionality
    handleCloseModal();
  };
  
  const handleChangePassword = () => {
    console.log('Change Password for user:', selectedUser?.name);
    // TODO: Implement change password functionality
    handleCloseModal();
  };
  
  const handleDeleteUser = () => {
    console.log('Delete user:', selectedUser?.name);
    // TODO: Implement delete user functionality
    handleCloseModal();
  };

  if (isLoading) {
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

  if (error) {
    return (
      <div className="min-h-screen bg-black">
        <div className="max-w-md mx-auto bg-black min-h-screen">
          <div className="px-4 py-3">
            <div className="text-center py-8">
              <p className="text-red-500 text-sm">Error: {error}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (users.length === 0) {
    return (
      <div className="min-h-screen bg-black">
        <div className="max-w-md mx-auto bg-black min-h-screen">
          <div className="px-4 py-3">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-base font-medium text-white">All Users</h3>
            </div>
            <div className="text-center py-8">
              <p className="text-gray-400 text-sm">No users found</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      <div className="max-w-md mx-auto bg-black min-h-screen">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-base font-medium text-white">All Users</h3>
            {users.length > 0 && (
              <span className="bg-brand text-black text-xs px-2 py-0.5 rounded-full font-medium">
                {users.length}
              </span>
            )}
          </div>
          <Card>
            <div className="space-y-0">
              {users.map((user, index) => (
                <div key={user.id}>
                  <div 
                    className="flex items-center justify-between py-3 cursor-pointer hover:bg-gray-800/50 -mx-2 px-2 rounded-lg transition-colors"
                    onClick={() => handleUserClick(user)}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center">
                        <span className="text-white text-sm font-medium">
                          {user.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <p className="text-sm font-light text-white">{user.name}</p>
                        <p className="text-xs text-gray-400">{user.email}</p>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <p className="text-sm font-light text-white">
                        {formatBitcoinForDisplay(user.btcBalance)}
                      </p>
                      <p className="text-xs text-gray-400">
                        {formatRupeesForDisplay(user.inrBalance)}
                      </p>
                    </div>
                  </div>
                  {index < users.length - 1 && (
                    <div className="border-b border-gray-800"></div>
                  )}
                </div>
              ))}
            </div>
          </Card>
        </div>
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
          
          {/* Delete User Option */}
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
                <p className="text-gray-400 text-xs mt-1">Permanently remove user account</p>
              </div>
            </div>
          </div>
        </div>
      </OptionsModal>
    </div>
  );
};

export default AdminUsers;


import React, { useState } from 'react';
import Card from './Card';
import { formatBitcoinForDisplay, formatRupeesForDisplay } from '../utils/formatters';

interface UserWithBalance {
  id: string;
  name: string;
  email: string;
  btcBalance: number;
  inrBalance: number;
  is_admin?: boolean;
}

interface UserListProps {
  title?: string;
  users: UserWithBalance[];
  onUserClick?: (user: UserWithBalance) => void;
  showSearch?: boolean;
  wrapInCard?: boolean;
}

const UserList: React.FC<UserListProps> = ({
  title = 'All Users',
  users = [],
  onUserClick,
  showSearch = true,
  wrapInCard = true
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  const handleUserClick = (user: UserWithBalance) => {
    if (onUserClick) {
      onUserClick(user);
    }
  };

  const filteredUsers = users.filter(user => 
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    String(user.id).includes(searchTerm)
  );

  const renderUserList = () => (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-base font-medium text-white">{title}</h3>
        {users.length > 0 && (
          <span className="bg-brand text-black text-xs px-2 py-0.5 rounded-full font-medium">
            {users.length}
          </span>
        )}
      </div>
      
      {showSearch && (
        <div className="mb-3">
          <input 
            type="text"
            placeholder="Search by name, email, or ID"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-gray-800 text-white placeholder-gray-500 px-3 py-2 rounded-md w-full text-sm border border-gray-700 focus:border-brand focus:outline-none transition-colors"
          />
        </div>
      )}
      
      {(() => {
        // Handle empty states
        if (users.length === 0) {
          return (
            <div className="text-center py-8">
              <p className="text-gray-400 text-sm">No users found</p>
            </div>
          );
        }
        
        if (filteredUsers.length === 0 && searchTerm) {
          return (
            <div className="text-center py-8">
              <p className="text-gray-400 text-sm">No users found matching "{searchTerm}"</p>
            </div>
          );
        }
        
        // Render user list
        const userListContent = (
          <div className="space-y-0">
            {filteredUsers.map((user, index) => (
              <div key={user.id}>
                <div 
                  className={`flex items-center justify-between py-3 ${
                    onUserClick 
                      ? 'cursor-pointer hover:bg-gray-800/50 -mx-2 px-2 rounded-lg transition-colors' 
                      : ''
                  }`}
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
                      <p className="text-xs text-gray-500">ID: {user.id}</p>
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
                {index < filteredUsers.length - 1 && (
                  <div className="border-b border-gray-800"></div>
                )}
              </div>
            ))}
          </div>
        );
        
        return userListContent;
      })()}
    </div>
  );

  return wrapInCard ? <Card>{renderUserList()}</Card> : renderUserList();
};

export default UserList;

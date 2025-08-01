import React from 'react';
import { useUsers } from '../../hooks/useUsers';
import Card from '../../components/Card';
import { formatBitcoinForDisplay, formatRupeesForDisplay } from '../../utils/formatters';

const AdminUsers: React.FC = () => {
  const { users, isLoading, error } = useUsers();

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
                    onClick={() => console.log(`User clicked: ${user.name}`)}
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
    </div>
  );
};

export default AdminUsers;


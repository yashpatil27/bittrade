import React from 'react';

const AdminHome: React.FC = () => {
  return (
    <div className="min-h-screen bg-black">
      <div className="max-w-md mx-auto bg-black min-h-screen">
        <div className="px-4 py-6">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-white mb-4">Admin Dashboard</h1>
            <p className="text-gray-400">Welcome to the admin interface</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminHome;

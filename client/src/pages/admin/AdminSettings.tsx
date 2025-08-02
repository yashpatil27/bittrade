import React from 'react';
import AdminMultiplier from '../../components/AdminMultiplier';

const AdminSettings: React.FC = () => {
  return (
    <div className="min-h-screen bg-black">
      <div className="max-w-md mx-auto bg-black min-h-screen">
        <div className="px-4 py-6">
          {/* Admin Multiplier Component */}
          <AdminMultiplier />
        </div>
      </div>
    </div>
  );
};

export default AdminSettings;

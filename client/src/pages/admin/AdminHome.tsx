import React from 'react';
import Balance from '../../components/Balance';
import BitcoinPrice from '../../components/BitcoinPrice';
import AdminMetrics from '../../components/AdminMetrics';

const AdminHome: React.FC = () => {
  return (
    <div className="min-h-screen bg-black">
      <div className="max-w-md mx-auto bg-black min-h-screen">
        <div className="px-4 py-3 space-y-3">
          {/* Total Platform Balance */}
          <Balance showAllUsers={true} />

          {/* Bitcoin Price - Public data, no buy/sell functionality */}
          <BitcoinPrice />

          {/* Platform Metrics */}
          <AdminMetrics />

        </div>
      </div>
    </div>
  );
};

export default AdminHome;

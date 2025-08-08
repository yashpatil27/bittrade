import React from 'react';
import AdminBalance from '../../components/AdminBalance';
import BitcoinPrice from '../../components/BitcoinPrice';
import AdminMetrics from '../../components/AdminMetrics';
import BitcoinQuote from '../../components/BitcoinQuote';

const AdminHome: React.FC = () => {
  return (
    <div className="min-h-screen bg-black">
      <div className="max-w-md mx-auto bg-black min-h-screen">
        <div className="px-4 py-3 space-y-3">
          {/* Total Platform Balance */}
          <AdminBalance />

          {/* Bitcoin Price - Public data, no buy/sell functionality */}
          <BitcoinPrice />

          {/* Platform Metrics */}
          <AdminMetrics />

        </div>
        
        {/* Bitcoin Quote - Outside space-y container for proper spacing */}
        <BitcoinQuote />
      </div>
    </div>
  );
};

export default AdminHome;

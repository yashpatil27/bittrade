import React from 'react';
import Balance from '../../components/Balance';
import MarketRate from '../../components/MarketRate';
import BitcoinChart from '../../components/BitcoinChart';
import AdminMetrics from '../../components/AdminMetrics';

const AdminHome: React.FC = () => {
  return (
    <div className="min-h-screen bg-black">
      <div className="max-w-md mx-auto bg-black min-h-screen">
        <div className="px-4 py-3 space-y-3">
          {/* Bitcoin Price Chart */}
          <BitcoinChart className="bg-black" />
          
          {/* Total Platform Balance */}
          <Balance showAllUsers={true} />

          {/* Market Rates - Public data, no buy/sell functionality */}
          <MarketRate />

          {/* Platform Metrics */}
          <AdminMetrics />

        </div>
      </div>
    </div>
  );
};

export default AdminHome;

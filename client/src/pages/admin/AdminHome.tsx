import React from 'react';
import Balance from '../../components/Balance';
import MarketRate from '../../components/MarketRate';

const AdminHome: React.FC = () => {
  return (
    <div className="min-h-screen bg-black">
      <div className="max-w-md mx-auto bg-black min-h-screen">
        <div className="px-4 py-6">
          {/* Total Platform Balance */}
          <Balance showAllUsers={true} />

          {/* Market Rates - Public data, no buy/sell functionality */}
          <MarketRate className="mt-4" />

        </div>
      </div>
    </div>
  );
};

export default AdminHome;

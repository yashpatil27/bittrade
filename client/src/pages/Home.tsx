import React from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../components/Card';
import TransactionList from '../components/TransactionList';
import PendingOrdersList from '../components/PendingOrdersList';
import BitcoinPrice from '../components/BitcoinPrice';
import Balance from '../components/Balance';
import HeroAmount from '../components/HeroAmount';
import TradingModal from '../components/TradingModal';
import BitcoinChartModal from '../components/BitcoinChartModal';
import { useBalance } from '../context/BalanceContext';
import { usePrice } from '../context/PriceContext';


interface HomeProps {
  setModalOpen: (open: boolean) => void;
}

const Home: React.FC<HomeProps> = ({ setModalOpen: setAppModalOpen }) => {
  const navigate = useNavigate();
  const [modalOpen, setModalOpen] = React.useState(false);
const [modalType, setModalType] = React.useState<'buy' | 'sell'>('buy');
  const [chartModalOpen, setChartModalOpen] = React.useState(false);
  
  // Use centralized contexts
  const { balanceData } = useBalance();
  const { buyRateInr, sellRateInr } = usePrice();

  const handleBuyClick = () => {
    setModalType('buy');
    setModalOpen(true);
    setAppModalOpen(true);
  };

  const handleSellClick = () => {
    setModalType('sell');
    setModalOpen(true);
    setAppModalOpen(true);
  };

  const handleModalClose = () => {
    setModalOpen(false);
    setAppModalOpen(false);
  };

  const handleTradingComplete = (type: 'buy' | 'sell', amount: string) => {
    console.log(`${type} completed with amount:`, amount);
    // Here you would typically:
    // 1. Update local state with new transaction
    // 2. Refresh balance
    // 3. Show success message
    // 4. Update transaction list
  };





  return (
    <div className="min-h-screen bg-black">
      <div className="max-w-md mx-auto bg-black min-h-screen">
        {/* Main Content */}
<div className="px-4 py-3 space-y-3">
        
        {/* Hero Amount */}
        <HeroAmount />
        
        {/* Balance */}
        <Balance />
        
        {/* Bitcoin Price */}
        <BitcoinPrice 
          onBuyClick={handleBuyClick}
          onSellClick={handleSellClick}
          onChartClick={() => setChartModalOpen(true)}
        />
        
{/* Pending Orders - Only shown when there are pending limit orders */}
        <PendingOrdersList 
          onTransactionClick={(order) => console.log('Clicked pending order:', order)}
        />

        {/* Recent Transactions */}
        <Card>
          <TransactionList 
            title="Recent Activity"
            maxItems={5}
            excludePending={true}
            onTransactionClick={(txn) => console.log('Clicked transaction:', txn)}
onViewAllClick={() => navigate('/history')}
          />
        </Card>

{/* Trading Modal */}
<BitcoinChartModal 
          isOpen={chartModalOpen} 
          onClose={() => setChartModalOpen(false)}
          onBuyClick={handleBuyClick}
          onSellClick={handleSellClick}
        />

        {/* Trading Modal */}
        <TradingModal
          isOpen={modalOpen}
          onClose={handleModalClose}
          type={modalType}
          buyRate={buyRateInr || 0}
          sellRate={sellRateInr || 0}
          balanceData={balanceData}
          onComplete={handleTradingComplete}
        />

        </div>
      </div>
    </div>
  );
};

export default Home;

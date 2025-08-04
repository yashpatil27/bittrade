import React, { Suspense } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../components/Card';
import TransactionList from '../components/TransactionList';
import PendingOrdersList from '../components/PendingOrdersList';
import BitcoinChart from '../components/BitcoinChart';
import MarketRate from '../components/MarketRate';
import Balance from '../components/Balance';
import { useBalance } from '../context/BalanceContext';
import { usePrice } from '../context/PriceContext';

// Lazy load TradingModal since it's only shown on user interaction
const TradingModal = React.lazy(() => import('../components/TradingModal'));


interface HomeProps {
  setModalOpen: (open: boolean) => void;
}

const Home: React.FC<HomeProps> = ({ setModalOpen: setAppModalOpen }) => {
  const navigate = useNavigate();
  const [modalOpen, setModalOpen] = React.useState(false);
  const [modalType, setModalType] = React.useState<'buy' | 'sell'>('buy');
  
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
        {/* Bitcoin Price Chart */}
        <BitcoinChart className="bg-black" />
        
        {/* Balance */}
        <Balance />
        
        {/* Market Rate */}
        <MarketRate 
          onBuyClick={handleBuyClick}
          onSellClick={handleSellClick}
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
        {modalOpen && (
          <Suspense fallback={
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand"></div>
            </div>
          }>
            <TradingModal
              isOpen={modalOpen}
              onClose={handleModalClose}
              type={modalType}
              buyRate={buyRateInr || 0}
              sellRate={sellRateInr || 0}
              balanceData={balanceData}
              onComplete={handleTradingComplete}
            />
          </Suspense>
        )}

        </div>
      </div>
    </div>
  );
};

export default Home;

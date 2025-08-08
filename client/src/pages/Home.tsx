import React from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../components/Card';
import TransactionList from '../components/TransactionList';
import PendingOrdersList from '../components/PendingOrdersList';
import BitcoinPrice from '../components/BitcoinPrice';
import HeroAmount from '../components/HeroAmount';
import TradingModal from '../components/TradingModal';
import SendModal from '../components/SendModal';
import OptionsModal from '../components/OptionsModal';
import { useBalance } from '../context/BalanceContext';
import { usePrice } from '../context/PriceContext';
import { Bitcoin, Send, IndianRupee } from 'lucide-react';
import { AnimateINR, AnimateBTC } from '../components/AnimateNumberFlow';
import BitcoinQuote from '../components/BitcoinQuote';

// Lazy load BitcoinChartModal since it's only shown on user interaction
const BitcoinChartModal = React.lazy(() => import('../components/BitcoinChartModal'));


interface HomeProps {
  setModalOpen: (open: boolean) => void;
}

const Home: React.FC<HomeProps> = ({ setModalOpen: setAppModalOpen }) => {
  const navigate = useNavigate();
  const [modalOpen, setModalOpen] = React.useState(false);
  const [modalType, setModalType] = React.useState<'buy' | 'sell'>('buy');
  const [chartModalOpen, setChartModalOpen] = React.useState(false);
  const [sendModalOpen, setSendModalOpen] = React.useState(false);
  const [balanceOptionsOpen, setBalanceOptionsOpen] = React.useState(false);
  
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

  const handleBalanceOptionsClick = () => {
    setBalanceOptionsOpen(true);
    setAppModalOpen(true);
  };

  const handleBalanceOptionsClose = () => {
    setBalanceOptionsOpen(false);
    setAppModalOpen(false);
  };

  const handleSendClick = () => {
    setBalanceOptionsOpen(false);
    setSendModalOpen(true);
  };





  return (
    <div className="min-h-screen bg-black">
      <div className="max-w-md mx-auto bg-black min-h-screen">
        {/* Main Content */}
        <div className="px-4 py-3 space-y-3">
        
        {/* Hero Amount */}
        <HeroAmount onMaxClick={handleBalanceOptionsClick} />
        
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

        </div>
        
        {/* Trading Modal */}
        {chartModalOpen && (
          <React.Suspense fallback={<div />}>
            <BitcoinChartModal 
              isOpen={chartModalOpen} 
              onClose={() => setChartModalOpen(false)}
              onBuyClick={handleBuyClick}
              onSellClick={handleSellClick}
            />
          </React.Suspense>
        )}

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

        {/* Send Modal */}
        <SendModal
          isOpen={sendModalOpen}
          onRequestClose={() => {
            setSendModalOpen(false);
            setAppModalOpen(false);
          }}
        />

        {/* Balance Options Modal */}
        <OptionsModal
          isOpen={balanceOptionsOpen}
          onClose={handleBalanceOptionsClose}
          title="Your Balance"
          type="custom"
          showXIcon={true}
        >
          <div className="space-y-4">
            {/* Available INR Balance */}
            <div className="bg-gray-900 rounded-lg p-4 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-gray-800 rounded-lg">
                  <IndianRupee className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-white text-sm font-medium">Cash Balance</p>
                </div>
              </div>
              <div className="text-right">
                <AnimateINR 
                  value={balanceData?.available_inr || 0} 
                  className="text-white text-sm font-medium" 
                />
              </div>
            </div>

            {/* Available BTC Balance */}
            <div className="bg-gray-900 rounded-lg p-4 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-gray-800 rounded-lg">
                  <Bitcoin className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-white text-sm font-medium">Bitcoin Balance</p>
                </div>
              </div>
              <div className="text-right">
                <AnimateBTC 
                  value={balanceData?.available_btc || 0} 
                  className="text-white text-sm font-medium" 
                />
              </div>
            </div>

            {/* Send Button */}
            <button
              onClick={handleSendClick}
              className="w-full bg-gray-900 hover:bg-gray-800 rounded-lg p-4 flex items-center justify-between transition-colors"
              data-clickable="true"
            >
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-gray-800 rounded-lg">
                  <Send className="w-5 h-5 text-white" />
                </div>
                <div className="text-left">
                  <p className="text-white text-sm font-medium">Send</p>
                  <p className="text-gray-400 text-xs">Transfer funds to another user</p>
                </div>
              </div>
              <div className="text-gray-400">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </button>
          </div>
        </OptionsModal>
        
        {/* Bitcoin Quote - Fixed positioned at bottom */}
        <BitcoinQuote />
      </div>
    </div>
  );
};

export default Home;

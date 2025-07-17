import React from 'react';
import Header from '../components/Header';
import Card from '../components/Card';
import TransactionList from '../components/TransactionList';
import BitcoinChart from '../components/BitcoinChart';
import MarketRate from '../components/MarketRate';
import TradingModal from '../components/TradingModal';
import Balance from '../components/Balance';
import { mockTransactions } from '../data/mockData';

interface HomeProps {
  setModalOpen: (open: boolean) => void;
}

const Home: React.FC<HomeProps> = ({ setModalOpen: setAppModalOpen }) => {
  const [recentTxns] = React.useState(mockTransactions.slice(0, 5));
  const [modalOpen, setModalOpen] = React.useState(false);
  const [modalType, setModalType] = React.useState<'buy' | 'sell'>('buy');
  const [buyRate, setBuyRate] = React.useState<number>(0);
  const [sellRate, setSellRate] = React.useState<number>(0);

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

  const handleRatesUpdate = (newBuyRate: number, newSellRate: number) => {
    setBuyRate(newBuyRate);
    setSellRate(newSellRate);
  };

  return (
    <div className="min-h-screen bg-black">
      <div className="max-w-md mx-auto bg-black min-h-screen">
        <Header title="₿itTrade" />
        
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
          onRatesUpdate={handleRatesUpdate}
        />
        
        {/* Recent Transactions */}
        <Card>
          <TransactionList 
            transactions={recentTxns}
            title="Recent Activity"
            onTransactionClick={(txn) => console.log('Clicked transaction:', txn)}
            onViewAllClick={() => console.log('View all clicked')}
          />
        </Card>

        {/* Trading Modal */}
        <TradingModal
          isOpen={modalOpen}
          onClose={handleModalClose}
          type={modalType}
          buyRate={buyRate}
          sellRate={sellRate}
          onComplete={handleTradingComplete}
        />
        </div>
      </div>
    </div>
  );
};

export default Home;

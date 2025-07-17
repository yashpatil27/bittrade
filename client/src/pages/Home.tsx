import React from 'react';
import { TrendingUp, TrendingDown, Eye, EyeOff, Zap, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import Header from '../components/Header';
import Card from '../components/Card';
import TransactionList from '../components/TransactionList';
import BitcoinChart from '../components/BitcoinChart';
import MarketRate from '../components/MarketRate';
import TradingModal from '../components/TradingModal';
import { mockBalance, mockMarketData, mockTransactions, formatINR, formatBTC, formatCompactNumber, getTimeAgo } from '../data/mockData';

interface HomeProps {
  setModalOpen: (open: boolean) => void;
}

const Home: React.FC<HomeProps> = ({ setModalOpen: setAppModalOpen }) => {
  const [showBalance, setShowBalance] = React.useState(true);
  const [marketData] = React.useState(mockMarketData);
  const [balance] = React.useState(mockBalance);
  const [recentTxns] = React.useState(mockTransactions.slice(0, 5));
  const [modalOpen, setModalOpen] = React.useState(false);
  const [modalType, setModalType] = React.useState<'buy' | 'sell'>('buy');

  const toggleBalanceVisibility = () => {
    setShowBalance(!showBalance);
  };

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
        <Header title="₿itTrade" />
        
        {/* Main Content */}
        <div className="px-4 py-3 space-y-3">
        {/* Bitcoin Price Chart */}
        <BitcoinChart className="bg-black" />
        
        {/* Market Rate */}
        <MarketRate 
          bitcoinPrice={marketData.price} 
          onBuyClick={handleBuyClick}
          onSellClick={handleSellClick}
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
          bitcoinPrice={marketData.price}
          onComplete={handleTradingComplete}
        />
        </div>
      </div>
    </div>
  );
};

export default Home;

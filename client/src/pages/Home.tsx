import React from 'react';
import Header from '../components/Header';
import Card from '../components/Card';
import TransactionList from '../components/TransactionList';
import BitcoinChart from '../components/BitcoinChart';
import MarketRate from '../components/MarketRate';
import TradingModal from '../components/TradingModal';
import Balance from '../components/Balance';
import OptionsModal from '../components/OptionsModal';

interface BalanceData {
  available_inr: number;
  available_btc: number;
  reserved_inr: number;
  reserved_btc: number;
  collateral_btc: number;
  borrowed_inr: number;
  interest_accrued: number;
}

interface HomeProps {
  setModalOpen: (open: boolean) => void;
}

const Home: React.FC<HomeProps> = ({ setModalOpen: setAppModalOpen }) => {
  const [modalOpen, setModalOpen] = React.useState(false);
  const [modalType, setModalType] = React.useState<'buy' | 'sell'>('buy');
  const [buyRate, setBuyRate] = React.useState<number>(0);
  const [sellRate, setSellRate] = React.useState<number>(0);
  const [balanceData, setBalanceData] = React.useState<BalanceData | null>(null);
  const [optionsModalOpen, setOptionsModalOpen] = React.useState(false);

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

  const handleBalanceUpdate = (newBalanceData: BalanceData | null) => {
    setBalanceData(newBalanceData);
  };

  const handleNotificationClick = () => {
    setOptionsModalOpen(true);
  };

  const handleOptionsModalClose = () => {
    setOptionsModalOpen(false);
  };

  // Mock notifications data
  const mockNotifications = [
    {
      id: '1',
      title: 'Bitcoin Purchase Completed',
      description: '₿0.05 for ₹5,19,526',
      timestamp: '4h ago',
      type: 'info' as const,
      clickable: true,
      onClick: () => {
        console.log('Bitcoin purchase notification clicked');
        // Here you could navigate to transaction details or show more info
      }
    },
    {
      id: '2', 
      title: 'Price Alert Triggered',
      description: 'Target ₹56,00,000 reached',
      timestamp: '6h ago',
      type: 'warning' as const,
      clickable: true,
      onClick: () => {
        console.log('Price alert notification clicked');
        // Here you could show price alert details or settings
      }
    }
  ];

  return (
    <div className="min-h-screen bg-black">
      <div className="max-w-md mx-auto bg-black min-h-screen">
        <Header 
          title="₿itTrade" 
          onNotificationClick={handleNotificationClick}
        />
        
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
          onBalanceUpdate={handleBalanceUpdate}
        />
        
        {/* Recent Transactions */}
        <Card>
          <TransactionList 
            title="Recent Activity"
            maxItems={5}
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
          balanceData={balanceData}
          onComplete={handleTradingComplete}
        />

        {/* Options Modal */}
        <OptionsModal
          isOpen={optionsModalOpen}
          onClose={handleOptionsModalClose}
          title="Notifications"
          type="notifications"
          notifications={mockNotifications}
        />
        </div>
      </div>
    </div>
  );
};

export default Home;

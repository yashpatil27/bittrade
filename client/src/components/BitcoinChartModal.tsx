import React from 'react';
import { ChevronLeft, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePortfolio } from '../context/PortfolioContext';
import { Transaction } from '../types';
import { formatBitcoinForDisplay, formatRupeesForDisplay } from '../utils/formatters';
import { DraggableModal, useModalDragHandling } from './modal/DraggableModal';

// Dynamic import that truly separates Recharts from main bundle
const BitcoinChart = React.lazy(() => 
  import('./BitcoinChart').then(module => ({ default: module.default }))
);

interface BitcoinChartModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  showXIcon?: boolean; // Show X icon instead of ChevronLeft (default: false)
  onBuyClick?: () => void;
  onSellClick?: () => void;
}

const BitcoinChartModal: React.FC<BitcoinChartModalProps> = ({
  isOpen,
  onClose,
  title = "Bitcoin Chart",
  showXIcon = true,
  onBuyClick,
  onSellClick
}) => {
  // Use drag handling hook for animation state
  const { isAnimating, animateClose } = useModalDragHandling({
    isOpen,
    onClose
  });
  
  // Use contexts for balance and transaction data
  const { userBalance: balanceData, userTransactions, loading } = usePortfolio();
  const portfolioLoading = loading.userTransactions;
  
  // Calculate portfolio metrics from balance data
  const totalBitcoinSatoshis = balanceData?.available_btc || 0;
  const totalBitcoin = totalBitcoinSatoshis / 100000000; // Convert satoshis to BTC
  
  // Calculate real portfolio metrics from transaction history
  const portfolioMetrics = React.useMemo(() => {
    // Filter buy transactions (MARKET_BUY, LIMIT_BUY, DCA_BUY)
    const buyTransactions = userTransactions.filter((tx: Transaction) => 
      ['MARKET_BUY', 'LIMIT_BUY', 'DCA_BUY'].includes(tx.type) && 
      tx.status === 'EXECUTED'
    );
    
    if (buyTransactions.length === 0) {
      return {
        averageBuyPriceINR: 0
      };
    }
    
    // Calculate totals
    const totalInvestmentINR = buyTransactions.reduce((sum: number, tx: Transaction) => sum + (tx.inr_amount || 0), 0);
    const totalBoughtSatoshis = buyTransactions.reduce((sum: number, tx: Transaction) => sum + (tx.btc_amount || 0), 0);
    const totalBoughtBTC = totalBoughtSatoshis / 100000000;
    
    // Calculate average buy price in INR
    const averageBuyPriceINR = totalBoughtBTC > 0 ? totalInvestmentINR / totalBoughtBTC : 0;
    
    return {
      averageBuyPriceINR
    };
  }, [userTransactions]);
  
  const { averageBuyPriceINR } = portfolioMetrics;

  if (!isOpen) return null;

  return (
    <DraggableModal isOpen={isOpen} onClose={onClose} fullHeight={true}>
      <div className="absolute inset-x-0 bottom-0 top-0 bg-black max-w-md mx-auto pb-safe">
        {/* Header */}
        <div className="px-2 pt-2 pb-8 flex-shrink-0">
          <div className="flex items-center justify-between">
            <button
              onClick={animateClose}
              className="text-primary hover:text-primary p-2 w-12 h-12 flex items-center justify-center transition-colors"
            >
              {showXIcon ? <X className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
            </button>
            <h2 className="text-white text-sm font-medium text-center flex-1">{title}</h2>
            <div className="w-10" />
          </div>
        </div>

        {/* Content */}
        <AnimatePresence mode="wait">
          {isAnimating && (
            <motion.div 
              className="flex flex-col flex-1 px-2" 
              style={{ minHeight: 0 }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <div className="flex-1 min-h-0">
                {/* Bitcoin Chart Container */}
                <motion.div 
                  className="h-80 sm:h-96 md:h-[28rem] mb-4 min-h-0"
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ 
                    delay: 0.1,
                    type: "spring",
                    stiffness: 400,
                    damping: 25
                  }}
                >
                  <React.Suspense fallback={
                    <div className="h-full bg-black rounded-lg flex items-center justify-center">
                      <div className="text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand mx-auto mb-4"></div>
                        <p className="text-gray-400 text-sm">Loading chart...</p>
                      </div>
                    </div>
                  }>
                    <BitcoinChart className="h-full" />
                  </React.Suspense>
                </motion.div>

                {/* Buy/Sell Buttons */}
                {(onBuyClick || onSellClick) && (
                  <motion.div 
                    className="grid gap-4 mb-6"
                    style={{ gridTemplateColumns: `repeat(${[onBuyClick, onSellClick].filter(Boolean).length}, 1fr)` }}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ 
                      delay: 0.2,
                      type: "spring",
                      stiffness: 400,
                      damping: 25
                    }}
                  >
                    {onBuyClick && (
                      <button 
                        onClick={onBuyClick}
                        className="w-full btn-strike-primary rounded-xl flex items-center justify-center space-x-1"
                      >
                        <span className="font-medium">Buy</span>
                      </button>
                    )}
                    {onSellClick && (
                      <button 
                        onClick={onSellClick}
                        className="w-full btn-strike-primary rounded-xl flex items-center justify-center space-x-1"
                      >
                        <span className="font-medium">Sell</span>
                      </button>
                    )}
                  </motion.div>
                )}

                {/* Portfolio Details */}
                {totalBitcoin > 0 && (
                  <motion.div 
                    className="mb-4 bg-black border border-brand/30 rounded-2xl p-4"
                    initial={{ opacity: 0, y: 30, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ 
                      delay: 0.35,
                      type: "spring",
                      stiffness: 400,
                      damping: 25
                    }}
                  >
                    <motion.div className="divide-y divide-brand/30">
                      <motion.div 
                        className="flex justify-between items-center py-4 first:pt-0 last:pb-0"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ 
                          delay: 0.4,
                          type: "spring",
                          stiffness: 500,
                          damping: 30
                        }}
                      >
                        <motion.span 
                          className="text-zinc-400 text-sm"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 0.45 }}
                        >
                          Total Bitcoin
                        </motion.span>
                        <motion.span 
                          className="text-sm font-normal text-white"
                          initial={{ opacity: 0, x: 10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.5 }}
                        >
                          {formatBitcoinForDisplay(totalBitcoinSatoshis)}
                        </motion.span>
                      </motion.div>
                      <motion.div 
                        className="flex justify-between items-center py-4 first:pt-0 last:pb-0"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ 
                          delay: 0.45,
                          type: "spring",
                          stiffness: 500,
                          damping: 30
                        }}
                      >
                        <motion.span 
                          className="text-zinc-400 text-sm"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 0.5 }}
                        >
                          Average Buy Price
                        </motion.span>
                        <motion.span 
                          className="text-sm font-normal text-white"
                          initial={{ opacity: 0, x: 10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.55 }}
                        >
                          {portfolioLoading ? (
                            <div className="w-16 h-4 bg-gray-700 rounded animate-pulse"></div>
                          ) : (
                            formatRupeesForDisplay(averageBuyPriceINR)
                          )}
                        </motion.span>
                      </motion.div>
                    </motion.div>
                  </motion.div>
                )}

                {/* Bottom spacing for safe area */}
                <div className="pb-safe pb-8"></div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </DraggableModal>
  );
};

export default BitcoinChartModal;

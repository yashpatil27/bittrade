import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { ChevronLeft, X } from 'lucide-react';
import { usePortfolio } from '../context/PortfolioContext';
import { Transaction } from '../types';
import { formatBitcoinForDisplay, formatRupeesForDisplay } from '../utils/formatters';

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
  const [dragStartY, setDragStartY] = useState(0);
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [screenHeight, setScreenHeight] = useState(window.innerHeight);
  const modalRef = useRef<HTMLDivElement>(null);
  
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

  // Animation control
  useEffect(() => {
    if (isOpen) {
      setDragOffset(0);
      setIsAnimating(false);
      setTimeout(() => {
        setIsAnimating(true);
      }, 50);
    } else {
      setIsAnimating(false);
    }
  }, [isOpen]);

  // Update screen height on resize and orientation change
  useEffect(() => {
    const updateScreenHeight = () => {
      setScreenHeight(window.innerHeight);
    };

    window.addEventListener('resize', updateScreenHeight);
    window.addEventListener('orientationchange', updateScreenHeight);
    
    return () => {
      window.removeEventListener('resize', updateScreenHeight);
      window.removeEventListener('orientationchange', updateScreenHeight);
    };
  }, []);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      // Store current scroll position
      const scrollY = window.scrollY;
      
      // Prevent scrolling
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = '100%';
      
      // Store scroll position for restoration
      document.body.setAttribute('data-scroll-y', scrollY.toString());
    } else {
      // Restore scroll position
      const scrollY = document.body.getAttribute('data-scroll-y');
      
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
      document.body.removeAttribute('data-scroll-y');
      
      // Restore scroll position
      if (scrollY) {
        window.scrollTo(0, parseInt(scrollY));
      }
    }

    return () => {
      const scrollY = document.body.getAttribute('data-scroll-y');
      
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
      document.body.removeAttribute('data-scroll-y');
      
      if (scrollY) {
        window.scrollTo(0, parseInt(scrollY));
      }
    };
  }, [isOpen]);

  // Close animation function
  const animateClose = () => {
    setIsClosing(true);
    setIsAnimating(false);
    setTimeout(() => {
      setIsClosing(false);
      onClose();
    }, 300);
  };

  // Touch handlers for drag-to-close
  const handleTouchStart = (e: React.TouchEvent) => {
    const target = e.target as HTMLElement;
    
    if (target.tagName === 'BUTTON' || 
        target.closest('button')) {
      return;
    }
    
    const touch = e.touches[0];
    setDragStartY(touch.clientY);
    setIsDragging(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    
    e.preventDefault();
    const touch = e.touches[0];
    const deltaY = touch.clientY - dragStartY;
    
    if (deltaY > 0) {
      setDragOffset(deltaY);
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    const closeThreshold = screenHeight * 0.3;
    
    if (dragOffset > closeThreshold) {
      animateClose();
    } else {
      setDragOffset(0);
    }
  };

  if (!isOpen) return null;

  const modalContent = (
    <div className="fixed inset-0 z-50" style={{ touchAction: 'none' }}>
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={animateClose}
        onTouchMove={(e) => e.preventDefault()}
        style={{ touchAction: 'none' }}
      />
      
      {/* Modal */}
      <div
        ref={modalRef}
        className="absolute inset-x-0 bottom-0 top-0 bg-black w-full max-w-md mx-auto safe-area-inset"
        style={{
          paddingTop: 'max(20px, env(safe-area-inset-top, 20px))',
          transform: `translateY(${isClosing ? '100%' : isAnimating ? `${dragOffset}px` : '100%'})`,
          transition: isDragging ? 'none' : (isAnimating || isClosing) ? 'transform 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)' : 'none',
          touchAction: 'none'
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Header */}
        <div className="px-2 sm:px-4 pb-6 flex-shrink-0">
          <div className="flex items-center justify-between">
            <button
              onClick={animateClose}
              className="text-primary hover:text-primary p-2 w-12 h-12 flex items-center justify-center transition-colors"
            >
              {showXIcon ? <X className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
            </button>
            <h2 className="text-white text-sm font-medium text-center flex-1">{title}</h2>
            <div className="w-10">
              {/* Empty space for symmetry */}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex flex-col flex-1 px-4 sm:px-6" style={{ minHeight: 0 }}>
          <div className="flex-1 min-h-0">
            {/* Bitcoin Chart Container */}
            <div className="h-80 sm:h-96 md:h-[28rem] mb-4 min-h-0">
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
            </div>

            {/* Buy/Sell Buttons */}
            {(onBuyClick || onSellClick) && (
              <div className="grid grid-cols-2 gap-4 mb-6">
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
              </div>
            )}

            {/* Portfolio Details */}
            {totalBitcoin > 0 && (
              <div className="mb-4 bg-black border border-brand/30 rounded-2xl p-4">
                <div className="divide-y divide-brand/30">
                  <div className="flex justify-between items-center py-4 first:pt-0 last:pb-0">
                    <span className="text-zinc-400 text-sm">Total Bitcoin</span>
                    <span className="text-sm font-normal text-white">
                      {formatBitcoinForDisplay(totalBitcoinSatoshis)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-4 first:pt-0 last:pb-0">
                    <span className="text-zinc-400 text-sm">Average Buy Price</span>
                    <span className="text-sm font-normal text-white">
                      {portfolioLoading ? (
                        <div className="w-16 h-4 bg-gray-700 rounded animate-pulse"></div>
                      ) : (
                        formatRupeesForDisplay(averageBuyPriceINR)
                      )}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Bottom spacing for safe area */}
            <div className="pb-safe pb-8"></div>
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};

export default BitcoinChartModal;

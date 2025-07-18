import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

interface DetailItem {
  label: string;
  value: string | React.ReactNode;
  numericValue?: number; // For animation (deprecated - use React nodes in value)
  highlight?: boolean; // Optional highlighting for important details
}

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  amount?: string | React.ReactNode; // Optional for display-only mode
  amountValue?: number; // Numeric value for animation (deprecated)
  amountType?: 'btc' | 'inr';
  subAmount?: string | React.ReactNode; // Smaller amount below main amount
  subAmountValue?: number; // Numeric value for animation (deprecated)
  subAmountType?: 'btc' | 'inr';
  details: DetailItem[]; // Array of details to show
  confirmText?: string;
  onConfirm?: () => void | Promise<void>; // Optional - if not provided, shows Close button
  isLoading?: boolean;
  // Display-only mode props
  icon?: React.ReactNode; // Optional icon for display mode
  statusBadge?: React.ReactNode; // Optional status badge
  actionButtons?: React.ReactNode; // Optional action buttons (like cancel order)
  mode?: 'confirm' | 'display'; // Mode selector
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  onClose,
  title,
  amount,
  amountValue,
  amountType,
  subAmount,
  subAmountValue,
  subAmountType,
  details,
  confirmText,
  onConfirm,
  isLoading = false,
  icon,
  statusBadge,
  actionButtons,
  mode = 'confirm',
}) => {
  const [dragStartY, setDragStartY] = useState(0);
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [screenHeight] = useState(window.innerHeight);
  const modalRef = useRef<HTMLDivElement>(null);

  // Layout calculations to match SingleInputModal button position
  const layoutConfig = {
    header: 80,
    padding: 24,
    keypadSpace: 200, // Same keypad space as SingleInputModal to maintain button position
    confirmButton: 60,
    safeArea: 20,
  };

  const totalFixedHeight = layoutConfig.header + 
                          layoutConfig.keypadSpace + 
                          layoutConfig.confirmButton + 
                          layoutConfig.safeArea;

  const availableContentHeight = screenHeight - totalFixedHeight;
  const contentHeight = Math.max(availableContentHeight, 200);

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
    if (target.tagName === 'BUTTON' || target.closest('button')) {
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

  const handleConfirm = async () => {
    if (isLoading) return;
    
    if (onConfirm) {
      try {
        await onConfirm();
      } catch (error) {
        // Handle error silently or add proper error handling
      }
    } else {
      // Display mode - just close the modal
      animateClose();
    }
  };

  // Determine button text based on mode
  const getButtonText = () => {
    if (isLoading) return 'Processing...';
    if (confirmText) return confirmText;
    return mode === 'display' ? 'Close' : 'Confirm';
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
        className="absolute inset-x-0 bottom-0 top-0 bg-black max-w-md mx-auto"
        style={{
          transform: `translateY(${isClosing ? '100%' : isAnimating ? `${dragOffset}px` : '100%'})`,
          transition: isDragging ? 'none' : (isAnimating || isClosing) ? 'transform 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)' : 'none',
          touchAction: 'none'
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Header */}
        <div className="px-6 pt-4 pb-4">
          <div className="flex items-center justify-between">
            <button
              onClick={animateClose}
              className="text-gray-400 hover:text-white p-2 w-12 h-12 flex items-center justify-center text-lg"
            >
              ✕
            </button>
            <h2 className="text-white text-sm font-semibold text-center flex-1">{title}</h2>
            <div className="w-10">
              {icon && <div className="p-2 bg-gray-800 rounded-lg">{icon}</div>}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex flex-col h-full px-6 ">
          {/* Amount Display Area */}
          <div className="flex flex-col justify-start items-center pt-4">
            <div className="text-center w-full">
              {/* Main Amount Display */}
              {amount && amountType && (
                <div className="flex items-center justify-center gap-2 mb-1">
                  <span className="text-white text-5xl font-normal">
                    {amount}
                  </span>
                </div>
              )}
              
              {/* Sub Amount Display */}
              {subAmount && subAmountType && (
                <div className="flex items-center justify-center gap-2 mb-8">
                  <span className="text-white text-sm font-normal">
                    {subAmount}
                  </span>
                </div>
              )}
              
              
            </div>
          </div>

          {/* Details Section - positioned exactly like SingleInputModal section */}
          {details.length > 0 && (
            <div className="mb-4 bg-black border border-brand/30 rounded-2xl p-4">
              <div className="divide-y divide-brand/30">
                {details.map((detail, index) => (
                  <div key={index} className="flex justify-between items-center py-4 first:pt-0 last:pb-0">
                    <span className="text-zinc-400 text-sm">{detail.label}</span>
                    <span className="text-sm font-normal text-white">
                      {detail.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Action Buttons (for display mode) */}
          {actionButtons && (
            <div className="mb-2">
              {actionButtons}
            </div>
          )}

          {/* Spacer to maintain button position */}
          <div className="flex-1"></div>

          {/* Confirm/Close Button */}
          <div className="mb-4 pb-20 flex justify-center">
            <button
              onClick={handleConfirm}
              disabled={isLoading}
              className={`px-8 h-12 text-sm font-semibold rounded-lg transition-all disabled:opacity-50 ${
                mode === 'display' 
                  ? 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700' 
                  : 'bg-brand text-black disabled:bg-zinc-800 disabled:text-zinc-500 hover:bg-brand/90'
              }`}
            >
              {getButtonText()}
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};

export default ConfirmationModal;

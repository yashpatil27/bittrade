import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

interface DetailItem {
  label: string;
  value: string | React.ReactNode;
  highlight?: boolean;
}

interface ActionButton {
  label: string;
  onClick: () => void;
  variant?: 'primary' | 'secondary' | 'danger' | 'warning' | 'success';
  disabled?: boolean;
}

interface DetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  mainDetail?: string | React.ReactNode;
  subDetail?: string | React.ReactNode;
  transactionDetails: DetailItem[];
  dcaPlanDetails: DetailItem[];
  actionButtons?: ActionButton[];
}

const DetailsModal: React.FC<DetailsModalProps> = ({
  isOpen,
  onClose,
  title,
  mainDetail,
  subDetail,
  transactionDetails,
  dcaPlanDetails,
  actionButtons
}) => {
  const [dragStartY, setDragStartY] = useState(0);
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [screenHeight] = useState(window.innerHeight);
  const modalRef = useRef<HTMLDivElement>(null);

  const layoutConfig = {
    header: 80,
    padding: 24,
    confirmButton: 60,
    safeArea: 20,
  };

  const totalFixedHeight = layoutConfig.header + 
                          layoutConfig.confirmButton + 
                          layoutConfig.safeArea;

  const availableContentHeight = screenHeight - totalFixedHeight;
  const contentHeight = Math.max(availableContentHeight, 200);

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

  useEffect(() => {
    if (isOpen) {
      const scrollY = window.scrollY;
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = '100%';
      document.body.setAttribute('data-scroll-y', scrollY.toString());
    } else {
      const scrollY = document.body.getAttribute('data-scroll-y');
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
      document.body.removeAttribute('data-scroll-y');
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

  const animateClose = () => {
    setIsClosing(true);
    setIsAnimating(false);
    setTimeout(() => {
      setIsClosing(false);
      onClose();
    }, 300);
  };

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
              className="text-secondary hover:text-primary p-2 w-12 h-12 flex items-center justify-center transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-white text-sm font-medium text-center flex-1">{title}</h2>
            <div className="w-10" />
          </div>
        </div>

        {/* Content */}
        <div className="flex flex-col h-full px-6">
          {/* Main Detail Display Area */}
          <div className="flex flex-col justify-start items-center pt-4">
            <div className="text-center w-full">
              {mainDetail && (
                <div className="flex items-center justify-center gap-2 mb-1">
                  <span className="text-white text-5xl font-normal">
                    {mainDetail}
                  </span>
                </div>
              )}

              {subDetail && (
                <div className="flex items-center justify-center gap-2 mb-8">
                  <span className="text-white text-sm font-normal">
                    {subDetail}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Transaction Details Section */}
          {transactionDetails.length > 0 && (
            <div className="mb-4 bg-black border border-brand/30 rounded-2xl p-4">
              <div className="divide-y divide-brand/30">
                {transactionDetails.map((detail, index) => (
                  <div key={index} className="flex justify-between items-center py-4 first:pt-0 last:pb-0">
                    <span className="text-zinc-400 text-sm">{detail.label}</span>
                    <span className={`text-sm font-normal text-white ${detail.highlight ? 'font-bold' : ''}`}>
                      {detail.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* DCA Plan Details Section */}
          {dcaPlanDetails.length > 0 && (
            <div className="mb-4 bg-black border border-brand/30 rounded-2xl p-4">
              <div className="divide-y divide-brand/30">
                {dcaPlanDetails.map((detail, index) => (
                  <div key={index} className="flex justify-between items-center py-4 first:pt-0 last:pb-0">
                    <span className="text-zinc-400 text-sm">{detail.label}</span>
                    <span className={`text-sm font-normal text-white ${detail.highlight ? 'font-bold' : ''}`}>
                      {detail.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action Buttons - positioned right below details */}
          {actionButtons && actionButtons.length > 0 && (
            <div className="mb-6">
              {actionButtons.length === 1 ? (
                <div className="flex justify-center">
                  <button
                    onClick={actionButtons[0].onClick}
                    disabled={actionButtons[0].disabled}
                    className={`px-6 h-12 text-sm font-medium rounded-xl ${
                      actionButtons[0].variant === 'danger' 
                        ? 'bg-red-200 hover:bg-red-250 text-red-800 border border-red-400 disabled:bg-red-200/50'
                        : actionButtons[0].variant === 'warning'
                        ? 'bg-amber-100 hover:bg-amber-150 text-amber-800 border border-amber-300 disabled:bg-amber-100/50'
                        : actionButtons[0].variant === 'success'
                        ? 'bg-green-100 hover:bg-green-150 text-green-800 border border-green-300 disabled:bg-green-100/50'
                        : actionButtons[0].variant === 'primary'
                        ? 'btn-strike-primary'
                        : 'btn-strike-secondary'
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    {actionButtons[0].label}
                  </button>
                </div>
              ) : (
                <div className="flex space-x-3">
                  {actionButtons.map((button, index) => (
                    <button
                      key={index}
                      onClick={button.onClick}
                      disabled={button.disabled}
                      className={`flex-1 h-12 text-sm font-medium rounded-xl ${
                        button.variant === 'danger' 
                          ? 'bg-red-200 hover:bg-red-250 text-red-800 border border-red-400 disabled:bg-red-200/50'
                          : button.variant === 'warning'
                          ? 'bg-amber-100 hover:bg-amber-150 text-amber-800 border border-amber-300 disabled:bg-amber-100/50'
                          : button.variant === 'success'
                          ? 'bg-green-100 hover:bg-green-150 text-green-800 border border-green-300 disabled:bg-green-100/50'
                          : button.variant === 'primary'
                          ? 'btn-strike-primary'
                          : 'btn-strike-secondary'
                      } disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                      {button.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Spacer to maintain button position */}
          <div className="flex-1"></div>

          {/* Close Button */}
          <div className="mb-4 pb-20 flex justify-center">
            <button
              onClick={animateClose}
              className="px-6 h-12 text-sm font-medium rounded-xl btn-strike-secondary"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};

export default DetailsModal;

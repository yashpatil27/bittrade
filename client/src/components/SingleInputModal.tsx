import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { formatRupeesForDisplay } from '../utils/formatters';

interface SingleInputModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  confirmText: string;
  onConfirm: (value: string) => void;
  type: 'inr' | 'btc';
  sectionTitle?: string;
  sectionAmount?: string | React.ReactNode;
  maxValue?: number;
  maxButtonText?: string;
  sectionDetail?: string | React.ReactNode;
  onSectionClick?: () => void;
  isLoading?: boolean;
  tabSwitcher?: React.ReactNode;
  initialValue?: string;
}

const SingleInputModal: React.FC<SingleInputModalProps> = ({
  isOpen,
  onClose,
  title,
  type,
  maxValue,
  maxButtonText,
  confirmText = "Next",
  onConfirm,
  isLoading = false,
  sectionTitle,
  sectionDetail,
  sectionAmount,
  onSectionClick,
  tabSwitcher,
  initialValue = ''
}) => {
  const [value, setValue] = useState('');
  const [dragStartY, setDragStartY] = useState(0);
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [screenHeight] = useState(window.innerHeight);
  const modalRef = useRef<HTMLDivElement>(null);

  // Layout calculations
  const layoutConfig = {
    header: 80,
    padding: 24,
    keypad: 200,
    confirmButton: 60,
    safeArea: 20,
    maxButton: maxValue !== undefined ? 44 : 0,
    section: sectionTitle ? 64 : 0,
  };

  const totalFixedHeight = layoutConfig.header + 
                          layoutConfig.keypad + 
                          layoutConfig.confirmButton + 
                          layoutConfig.safeArea + 
                          layoutConfig.maxButton + 
                          layoutConfig.section;

  const availableContentHeight = screenHeight - totalFixedHeight;
  const contentHeight = Math.max(availableContentHeight, 200);

  // Animation control
  useEffect(() => {
    if (isOpen) {
      setDragOffset(0);
      setIsAnimating(false);
      setValue(initialValue);
      setTimeout(() => {
        setIsAnimating(true);
      }, 50);
    } else {
      setIsAnimating(false);
    }
  }, [isOpen, initialValue]);

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
        target.closest('button') || 
        target.closest('[data-clickable-section]')) {
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

  // Keypad component
  const KeypadButton: React.FC<{ value: string; onPress: () => void; className?: string }> = ({ 
    value, 
    onPress, 
    className = '' 
  }) => {
    const handleTouchStart = (e: React.TouchEvent) => {
      e.stopPropagation();
    };
    
    const handleTouchEnd = (e: React.TouchEvent) => {
      e.stopPropagation();
      onPress();
    };
    
    const handleClick = (e: React.MouseEvent) => {
      e.stopPropagation();
      onPress();
    };
    
    return (
      <button
        onClick={handleClick}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        className={`h-16 bg-black text-white text-xl font-medium select-none ${className}`}
        style={{
          WebkitTouchCallout: 'none',
          WebkitUserSelect: 'none',
          touchAction: 'manipulation'
        }}
      >
        {value}
      </button>
    );
  };

  const handleKeypadPress = (keyValue: string) => {
    if (keyValue === 'backspace') {
      setValue(prev => prev.slice(0, -1));
    } else if (keyValue === 'clear') {
      setValue('');
    } else if (keyValue === '.') {
      if (type === 'btc' && !value.includes('.')) {
        setValue(prev => prev === '' ? '0.' : prev + keyValue);
      }
    } else {
      // Validate the new value before setting it
      const newValue = value + keyValue;
      const numValue = parseFloat(newValue);
      
      // Don't allow negative values or values exceeding max
      if (numValue < 0) {
        return; // Don't update if it would create a negative value
      }
      
      if (maxValue !== undefined && numValue > maxValue) {
        return; // Don't update if it would exceed max value
      }
      
      setValue(prev => prev + keyValue);
    }
  };

  const handleMaxAmount = () => {
    if (maxValue !== undefined) {
      setValue(maxValue.toString());
    }
  };

  const handleConfirm = () => {
    if (!value || isLoading) return;
    onConfirm(value);
  };

  // Format Bitcoin for input display (preserves trailing zeros and decimal point)
  const formatBitcoinForInput = (val: string) => {
    if (val === '') return '₿0';
    if (val === '.') return '₿0.';
    
    // Handle cases where input starts with decimal point
    let processedVal = val;
    if (val.startsWith('.')) {
      processedVal = '0' + val;
    }
    
    // If it contains a decimal point, preserve trailing zeros
    if (processedVal.includes('.')) {
      // Split into integer and decimal parts
      const [integerPart, decimalPart] = processedVal.split('.');
      
      // Limit decimal places to 8 (standard Bitcoin precision)
      const limitedDecimalPart = decimalPart ? decimalPart.slice(0, 8) : '';
      
      return `₿${integerPart}.${limitedDecimalPart}`;
    }
    
    // No decimal point, just return with Bitcoin symbol
    return `₿${processedVal}`;
  };

  // Format display value
  const formatDisplayValue = (val: string) => {
    if (type === 'btc') {
      return formatBitcoinForInput(val);
    } else {
      const numVal = parseFloat(val) || 0;
      return formatRupeesForDisplay(numVal);
    }
  };

  const isConfirmDisabled = !value || isLoading || parseFloat(value) <= 0;

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
            <div className="w-10"></div> {/* Spacer for centering */}
          </div>
        </div>

        {/* Content */}
        <div className="flex flex-col h-full px-6">
          {/* Input Display Area */}
          <div 
            className="flex flex-col justify-start items-center pt-4" 
            style={{ height: `${contentHeight}px` }}
          >
            <div className="text-center w-full">
              {/* Input Display */}
              <div className="flex items-center justify-center gap-2 mb-4">
                <span className="text-white text-5xl font-normal">
                  {formatDisplayValue(value)}
                </span>
              </div>
              
            {/* Max Button */}
            {maxButtonText && (
              <button
                onClick={handleMaxAmount}
                className="bg-gray-800 text-gray-300 px-6 py-2 rounded-full text-sm font-medium hover:bg-gray-700 transition-colors mb-2 inline-flex items-center justify-center min-w-fit"
              >
                {maxButtonText}
              </button>
            )}
            </div>
          </div>

          {/* Optional Section */}
          {sectionTitle && (onSectionClick || sectionAmount || sectionDetail) && (
            <div 
              data-clickable-section
              onClick={onSectionClick} 
              className="mb-2 bg-gray-900 border border-brand/30 rounded-lg p-4 cursor-pointer hover:bg-gray-800 transition-colors"
            >
              <div className="flex justify-between items-center">
                <div>
                  <span className="text-white text-sm">{sectionTitle}</span>
                  {sectionDetail && (
                    <div className="text-xs text-gray-500 mt-1">
                      {typeof sectionDetail === 'string' ? <p>{sectionDetail}</p> : sectionDetail}
                    </div>
                  )}
                </div>
                {sectionAmount && (
                  <span className="text-sm font-medium text-gray-300">
                    {sectionAmount}
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Optional Tab Switcher */}
          {tabSwitcher && (
            <div className="mb-3">
              {tabSwitcher}
            </div>
          )}

          {/* Keypad */}
          <div className="mb-3">
            <div className="grid grid-cols-3 gap-1">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9', type === 'btc' ? '.' : '', '0', 'backspace'].map((key, index) => (
                key === '' ? (
                  <div key={`empty-${index}`} className="h-16" />
                ) : (
                  <KeypadButton
                    key={`key-${index}-${key}`}
                    value={key === 'backspace' ? '⌫' : key}
                    onPress={() => handleKeypadPress(key)}
                  />
                )
              ))}
            </div>
          </div>

          {/* Confirm Button */}
          <div className="mb-4 pb-20 flex justify-center">
            <button
              onClick={handleConfirm}
              disabled={isConfirmDisabled}
              className="px-8 h-12 bg-brand text-black text-sm font-semibold rounded-lg transition-all disabled:opacity-50 disabled:bg-gray-800 disabled:text-gray-500 hover:bg-brand/90"
            >
              {isLoading ? 'Processing...' : confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};

export default SingleInputModal;

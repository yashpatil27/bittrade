import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { ChevronLeft, X, SlidersVertical, Infinity, Orbit } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatRupeesForDisplay } from '../utils/formatters';

interface SingleInputModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  confirmText: string;
  onConfirm: (value: string, currency?: 'inr' | 'btc') => void;
  type: 'inr' | 'btc' | 'number';
  sectionTitle?: string;
  sectionAmount?: string | React.ReactNode;
  maxValue?: number;
  maxButtonText?: string;
  sectionDetail?: string | React.ReactNode;
  onSectionClick?: () => void;
  isLoading?: boolean;
  tabSwitcher?: React.ReactNode;
  initialValue?: string;
  showSettingsIcon?: boolean;
  onSettingsClick?: () => void;
  showOrbitIcon?: boolean;
  onOrbitClick?: () => void;
  showInfinityPlaceholder?: boolean;
  onValueChange?: (value: string, currency?: 'inr' | 'btc') => void; // Real-time value updates
  onCurrencyChange?: (currency: 'inr' | 'btc') => void; // Currency change callback
  skipMaxValidation?: boolean; // Skip max value validation but still show max button
  showXIcon?: boolean; // Show X icon instead of ChevronLeft (default: false)
  disableKeyboardHandling?: boolean; // Disable keyboard handling when other modals are on top
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
  initialValue = '',
  showSettingsIcon = false,
  onSettingsClick,
  showOrbitIcon = false,
  onOrbitClick,
  showInfinityPlaceholder = false,
  onValueChange,
  onCurrencyChange,
  skipMaxValidation = false,
  showXIcon = false,
  disableKeyboardHandling = false
}) => {
  const [value, setValue] = useState('');
  const [currentType, setCurrentType] = useState<'inr' | 'btc' | 'number'>(type);
  const [dragStartY, setDragStartY] = useState(0);
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [screenHeight] = useState(window.innerHeight);
  const [previousValue, setPreviousValue] = useState('');
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

  // Initialize currentType when modal opens
  useEffect(() => {
    if (isOpen) {
      setCurrentType(type);
    }
  }, [isOpen, type]);

  // Handle orbit icon click - toggle between INR and BTC
  const handleOrbitIconClick = () => {
    // Only allow toggling between INR and BTC (not number type)
    if (currentType === 'number') return;
    
    const newType = currentType === 'inr' ? 'btc' : 'inr';
    setCurrentType(newType);

    // Clear the current input when switching currency
    setValue('');

    // Notify parent components of currency change
    if (onCurrencyChange) {
      onCurrencyChange(newType);
    }
    
    // Call the original onOrbitClick if provided
    if (onOrbitClick) {
      onOrbitClick();
    }
  };

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

  // Physical keyboard handling
  useEffect(() => {
    if (!isOpen || disableKeyboardHandling) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Prevent default behavior for handled keys
      const handledKeys = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '.', 'Backspace', 'Delete', 'Enter', 'Escape'];
      if (handledKeys.includes(e.key)) {
        e.preventDefault();
      }

      switch (e.key) {
        case '0':
        case '1':
        case '2':
        case '3':
        case '4':
        case '5':
        case '6':
        case '7':
        case '8':
        case '9':
          handleKeypadPress(e.key);
          break;
        case '.':
          if (currentType === 'btc') {
            handleKeypadPress('.');
          }
          break;
        case 'Backspace':
        case 'Delete':
          handleKeypadPress('backspace');
          break;
        case 'Enter':
          handleConfirm();
          break;
        case 'Escape':
          animateClose();
          break;
        default:
          break;
      }
    };

    // Add event listener
    document.addEventListener('keydown', handleKeyDown);

    // Cleanup
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, disableKeyboardHandling, type, value, maxValue, isLoading]); // Functions are stable, dependency warning disabled

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
    const [touchHandled, setTouchHandled] = useState(false);
    
    const handleTouchStart = (e: React.TouchEvent) => {
      e.stopPropagation();
      setTouchHandled(true);
    };
    
    const handleTouchEnd = (e: React.TouchEvent) => {
      e.stopPropagation();
      e.preventDefault(); // Prevent synthetic click event
      onPress();
      // Reset after a short delay to allow for mouse users
      setTimeout(() => setTouchHandled(false), 300);
    };
    
    const handleClick = (e: React.MouseEvent) => {
      e.stopPropagation();
      // Only handle click if not already handled by touch
      if (!touchHandled) {
        onPress();
      }
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
    let newValue = value;
    
    if (keyValue === 'backspace') {
      newValue = value.slice(0, -1);
    } else if (keyValue === 'clear') {
      newValue = '';
    } else if (keyValue === '.') {
      if (currentType === 'btc' && !value.includes('.')) {
        newValue = value === '' ? '0.' : value + keyValue;
      } else {
        return; // Don't update if invalid
      }
    } else {
      // Validate the new value before setting it
      const testValue = value + keyValue;
      const numValue = parseFloat(testValue);
      
      // Don't allow negative values
      if (numValue < 0) {
        return; // Don't update if it would create a negative value
      }
      
      // Allow all positive values - max validation now happens in button disable logic
      newValue = testValue;
    }
    
    // Store previous value for animation
    setPreviousValue(value);
    setValue(newValue);
    
    // Call the real-time value change callback
    if (onValueChange) {
      onValueChange(newValue);
    }
  };

  const handleMaxAmount = () => {
    if (maxValue !== undefined) {
      // For BTC inputs, ensure proper decimal formatting to avoid scientific notation
      let maxValueStr;
      if (currentType === 'btc') {
        // For Bitcoin, format with up to 8 decimal places and remove trailing zeros
        maxValueStr = maxValue.toFixed(8).replace(/\.?0+$/, '');
      } else {
        // For other types, use standard toString
        maxValueStr = maxValue.toString();
      }
      
      // Store previous value for animation
      setPreviousValue(value);
      setValue(maxValueStr);
      
      // Call the real-time value change callback
      if (onValueChange) {
        onValueChange(maxValueStr);
      }
    }
  };

  const handleConfirm = () => {
    if (isLoading) return;
    // For number type with infinity placeholder, allow empty values
    if (type === 'number' && showInfinityPlaceholder) {
      onConfirm(value);
      return;
    }
    if (!value) return;
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

  // Animated Display Component
  const AnimatedDigitDisplay: React.FC<{ value: string; previousValue: string }> = ({ value, previousValue }) => {
    const formattedValue = formatDisplayValue(value);
    const formattedPrevious = formatDisplayValue(previousValue);
    
    // Split the formatted value into characters for individual animation
    const currentChars = formattedValue.split('');
    const previousChars = formattedPrevious.split('');
    
    // Create stable keys for existing characters to maintain their identity
    const getStableKey = (char: string, index: number) => {
      // For existing characters that haven't changed, use a stable key
      if (index < previousChars.length && char === previousChars[index]) {
        return `stable-${index}-${char}`;
      }
      // For new or changed characters, use a unique key
      return `${Date.now()}-${index}-${char}`;
    };
    
    const getCharacterState = (index: number) => {
      const currentChar = currentChars[index];
      const prevChar = previousChars[index];
      
      if (index >= previousChars.length) {
        return 'new'; // New character added
      } else if (currentChar !== prevChar) {
        return 'changed'; // Character changed
      } else {
        return 'same'; // Character unchanged
      }
    };
    
    return (
      <div className="flex items-center justify-center relative" style={{ minHeight: '1.2em' }}>
        <AnimatePresence mode="popLayout">
          {currentChars.map((char, index) => {
            const state = getCharacterState(index);
            const key = getStableKey(char, index);
            
            return (
              <motion.span
                key={key}
                layout
                className="inline-block text-white text-5xl font-normal"
                initial={state === 'new' ? { scale: 0, opacity: 0 } : { scale: 1, opacity: 1 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                transition={{
                  type: "spring",
                  stiffness: 400,
                  damping: 25,
                  duration: 0.3,
                  layout: {
                    type: "spring",
                    stiffness: 300,
                    damping: 30,
                    duration: 0.4
                  }
                }}
                style={{
                  display: 'inline-block',
                  transformOrigin: 'center'
                }}
              >
                {char}
              </motion.span>
            );
          })}
        </AnimatePresence>
      </div>
    );
  };

  // Format display value
  const formatDisplayValue = (val: string) => {
    if (currentType === 'btc') {
      return formatBitcoinForInput(val);
    } else if (currentType === 'number') {
      return val || (showInfinityPlaceholder ? '' : '0');
    } else {
      const numVal = parseFloat(val) || 0;
      return formatRupeesForDisplay(numVal);
    }
  };

  const isConfirmDisabled = isLoading || (
    currentType === 'number' && showInfinityPlaceholder ? false : 
    (!value || parseFloat(value) <= 0 || 
     (maxValue !== undefined && !skipMaxValidation && parseFloat(value) > maxValue))
  );

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
        className="absolute inset-x-0 bottom-0 top-0 bg-black max-w-md mx-auto pb-safe"
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
        <div className="px-2 pt-2 pb-8 relative">
          <div className="flex items-center justify-between h-12">
            {/* Left section */}
            <button
              onClick={animateClose}
              className="text-primary hover:text-primary p-2 w-12 h-12 flex items-center justify-center transition-colors"
            >
              {showXIcon ? <X className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
            </button>
            
            {/* Right section */}
            <div className="flex items-center">
              {showOrbitIcon && (
                <button
                  onClick={handleOrbitIconClick}
                  className="text-primary hover:text-primary p-2 w-12 h-12 flex items-center justify-center transition-colors"
                >
                  <Orbit className="w-5 h-5" />
                </button>
              )}
              {showSettingsIcon && onSettingsClick && (
                <button
                  onClick={onSettingsClick}
                  className="text-primary hover:text-primary p-2 w-12 h-12 flex items-center justify-center transition-colors"
                >
                  <SlidersVertical className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>
          
          {/* Title - absolutely positioned and centered relative to entire header */}
          <div className="px-2 pt-2 pb-8 absolute inset-0 flex items-center justify-center pointer-events-none">
            <h2 className="text-white text-sm font-medium">{title}</h2>
          </div>
        </div>

        {/* Content */}
        <div className="flex flex-col h-full px-2">
          {/* Input Display Area - Animated */}
          <motion.div 
            className="flex flex-col justify-center items-center" 
            style={{ height: `${contentHeight}px` }}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: isAnimating ? 1 : 0, y: isAnimating ? 0 : 30 }}
            transition={{ 
              delay: 0.1,
              type: "spring",
              stiffness: 400,
              damping: 25
            }}
          >
            <div className="text-center w-full">
              {/* Input Display */}
              <motion.div 
                className="flex items-center justify-center gap-2 mb-4"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ 
                  opacity: isAnimating ? 1 : 0, 
                  scale: isAnimating ? 1 : 0.8 
                }}
                transition={{ 
                  delay: 0.2,
                  type: "spring",
                  stiffness: 500,
                  damping: 20
                }}
              >
                {!value && showInfinityPlaceholder ? (
                  <motion.div 
                    className="flex items-center justify-center"
                    initial={{ opacity: 0, rotate: -90 }}
                    animate={{ 
                      opacity: isAnimating ? 1 : 0, 
                      rotate: isAnimating ? 0 : -90 
                    }}
                    transition={{ delay: 0.3, duration: 0.4 }}
                  >
                    <Infinity className="w-16 h-16 text-gray-400" />
                  </motion.div>
                ) : (
                  <AnimatedDigitDisplay value={value} previousValue={previousValue} />
                )}
              </motion.div>
              
            {/* Max Button - Animated */}
            {maxButtonText && (
              <motion.button
                onClick={handleMaxAmount}
                className={`px-3 py-2 text-xs font-normal inline-flex items-center justify-center min-w-fit rounded-xl transition-colors duration-200 focus:outline-none ${
                  maxValue !== undefined && !skipMaxValidation && value && parseFloat(value) > maxValue
                    ? 'bg-black hover:bg-gray-900 text-red-400 border border-red-500/30 focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-black'
                    : 'bg-btn-secondary text-white hover:bg-btn-secondary-hover focus:ring-2 focus:ring-brand focus:ring-offset-2 focus:ring-offset-black'
                }`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ 
                  opacity: isAnimating ? 1 : 0, 
                  y: isAnimating ? 0 : 10 
                }}
                transition={{ delay: 0.3, duration: 0.3 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {maxButtonText}
              </motion.button>
            )}
            </div>
          </motion.div>

          {/* Optional Section - Animated */}
          {sectionTitle && (onSectionClick || sectionAmount || sectionDetail) && (
            <motion.div 
              className="mb-2 flex justify-center"
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ 
                opacity: isAnimating ? 1 : 0, 
                y: isAnimating ? 0 : 20, 
                scale: isAnimating ? 1 : 0.95 
              }}
              transition={{ 
                delay: 0.4,
                type: "spring",
                stiffness: 400,
                damping: 25
              }}
            >
              <motion.div 
                data-clickable-section
                onClick={onSectionClick} 
                className="w-full max-w-xs bg-gray-900 border border-brand/30 rounded-lg p-4 cursor-pointer hover:bg-gray-800 transition-colors"
                whileHover={{ scale: 1.02, backgroundColor: "rgba(31, 41, 55, 1)" }}
                whileTap={{ scale: 0.98 }}
                transition={{ type: "spring", stiffness: 400, damping: 17 }}
              >
                <motion.div 
                  className="flex justify-between items-center"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: isAnimating ? 1 : 0 }}
                  transition={{ delay: 0.5 }}
                >
                  <div>
                    <motion.span 
                      className="text-white text-sm"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ 
                        opacity: isAnimating ? 1 : 0, 
                        x: isAnimating ? 0 : -10 
                      }}
                      transition={{ delay: 0.55 }}
                    >
                      {sectionTitle}
                    </motion.span>
                    {sectionDetail && (
                      <motion.div 
                        className="text-xs text-gray-500 mt-1"
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ 
                          opacity: isAnimating ? 1 : 0, 
                          y: isAnimating ? 0 : 5 
                        }}
                        transition={{ delay: 0.6 }}
                      >
                        {typeof sectionDetail === 'string' ? <p>{sectionDetail}</p> : sectionDetail}
                      </motion.div>
                    )}
                  </div>
                  {sectionAmount && (
                    <motion.span 
                      className="text-sm font-medium text-gray-300"
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ 
                        opacity: isAnimating ? 1 : 0, 
                        x: isAnimating ? 0 : 10 
                      }}
                      transition={{ delay: 0.55 }}
                    >
                      {sectionAmount}
                    </motion.span>
                  )}
                </motion.div>
              </motion.div>
            </motion.div>
          )}

          {/* Optional Tab Switcher - Animated */}
          {tabSwitcher && (
            <motion.div 
              className="mb-3"
              initial={{ opacity: 0, y: 15 }}
              animate={{ 
                opacity: isAnimating ? 1 : 0, 
                y: isAnimating ? 0 : 15 
              }}
              transition={{ delay: 0.5, duration: 0.3 }}
            >
              {tabSwitcher}
            </motion.div>
          )}

          {/* Keypad - No animations to prevent issues */}
          <div className="mb-6 ">
            <div className="grid grid-cols-3 gap-1">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9', currentType === 'btc' ? '.' : (currentType === 'number') ? '' : '', '0', 'backspace'].map((key, index) => (
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

          {/* Confirm Button - Animated */}
          <motion.div 
            className="mb-6 pb-20 flex justify-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ 
              opacity: isAnimating ? 1 : 0, 
              y: isAnimating ? 0 : 20 
            }}
            transition={{ 
              delay: 0.6,
              duration: 0.3
            }}
          >
            <motion.button
              onClick={handleConfirm}
              disabled={isConfirmDisabled}
              className="px-6 h-12 btn-strike-primary text-sm font-medium rounded-xl"
              whileHover={{ scale: !isConfirmDisabled ? 1.02 : 1 }}
              whileTap={{ scale: !isConfirmDisabled ? 0.98 : 1 }}
              transition={{ type: "spring", stiffness: 400, damping: 17 }}
            >
              {isLoading ? 'Processing...' : confirmText}
            </motion.button>
          </motion.div>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};

export default SingleInputModal;

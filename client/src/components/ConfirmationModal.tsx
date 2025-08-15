import React from 'react';
import { ChevronLeft, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { DraggableModal, useModalDragHandling } from './modal/DraggableModal';

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
  icon?: React.ReactNode; // Optional icon for display mode.
  statusBadge?: React.ReactNode; // Optional status badge
  mode?: 'confirm' | 'display'; // Mode selector
  showXIcon?: boolean; // Show X icon instead of ChevronLeft (default: false)
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
  mode = 'confirm',
  showXIcon = false
}) => {
  // Use drag handling hook for animation state
  const { isAnimating } = useModalDragHandling({
    isOpen,
    onClose
  });


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
      onClose();
    }
  };

  // Determine button text based on mode
  const getButtonText = () => {
    if (isLoading) return 'Processing...';
    if (confirmText) return confirmText;
    return mode === 'display' ? 'Close' : 'Confirm';
  };

  if (!isOpen) return null;

  return (
    <DraggableModal isOpen={isOpen} onClose={onClose} fullHeight={true}>
      <div className="absolute inset-x-0 bottom-0 top-0 bg-black max-w-md mx-auto pb-safe">
        {/* Header */}
        <div className="px-2 pt-2 pb-8">
          <div className="flex items-center justify-between">
            <button
              onClick={onClose}
              className="text-primary hover:text-primary p-2 w-12 h-12 flex items-center justify-center transition-colors"
            >
              {showXIcon ? <X className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
            </button>
            <h2 className="text-white text-sm font-medium text-center flex-1">{title}</h2>
            <div className="w-10">
              {icon && <div className="p-2 bg-gray-800 rounded-lg">{icon}</div>}
            </div>
          </div>
        </div>

        {/* Content */}
        <AnimatePresence mode="wait">
          {isAnimating && (
            <motion.div 
              className="flex flex-col h-full px-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              {/* Amount Display Area */}
              <motion.div 
                className="flex flex-col justify-start items-center pt-4"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ 
                  delay: 0.1,
                  type: "spring",
                  stiffness: 400,
                  damping: 25
                }}
              >
                <div className="text-center w-full">
                  {/* Main Amount Display */}
                  {amount && amountType && (
                    <motion.div 
                      className="flex items-center justify-center gap-2 mb-4"
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ 
                        delay: 0.2,
                        type: "spring",
                        stiffness: 500,
                        damping: 20
                      }}
                    >
                      <motion.span 
                        className="text-white text-5xl font-normal"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3, duration: 0.4 }}
                      >
                        {amount}
                      </motion.span>
                    </motion.div>
                  )}
                  
                  {/* Sub Amount Display - always maintain space */}
                  <motion.div 
                    className="flex items-center justify-center gap-2 mb-8"
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4, duration: 0.3 }}
                  >
                    {subAmount && subAmountType ? (
                      <span className="text-white text-sm font-normal">
                        {subAmount}
                      </span>
                    ) : (
                      <span className="text-transparent text-sm font-normal">placeholder</span>
                    )}
                  </motion.div>
                </div>
              </motion.div>

              {/* Details Section - positioned exactly like SingleInputModal section */}
              {details.length > 0 && (
                <motion.div 
                  className="mb-4 bg-black border border-brand/30 rounded-2xl p-4"
                  initial={{ opacity: 0, y: 30, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ 
                    delay: 0.5,
                    type: "spring",
                    stiffness: 400,
                    damping: 25
                  }}
                >
                  <motion.div className="divide-y divide-brand/30">
                    {details.map((detail, index) => (
                      <motion.div 
                        key={index} 
                        className="flex justify-between items-center py-4 first:pt-0 last:pb-0"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ 
                          delay: 0.6 + (index * 0.05),
                          type: "spring",
                          stiffness: 500,
                          damping: 30
                        }}
                      >
                        <motion.span 
                          className="text-zinc-400 text-sm"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 0.65 + (index * 0.05) }}
                        >
                          {detail.label}
                        </motion.span>
                        <motion.span 
                          className={`text-sm font-normal text-white ${detail.highlight ? 'font-bold' : ''}`}
                          initial={{ opacity: 0, x: 10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.7 + (index * 0.05) }}
                        >
                          {detail.value}
                        </motion.span>
                      </motion.div>
                    ))}
                  </motion.div>
                </motion.div>
              )}

              {/* Spacer to maintain button position */}
              <div className="flex-1"></div>

              {/* Confirm/Close Button */}
              <motion.div 
                className="mb-8 pb-20 flex justify-center"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ 
                  delay: 0.8 + (details.length * 0.05),
                  duration: 0.3
                }}
              >
                <motion.button
                  onClick={handleConfirm}
                  disabled={isLoading}
                  className={`px-6 h-12 text-sm font-medium rounded-xl ${
                    mode === 'display' 
                      ? 'btn-strike-secondary' 
                      : 'btn-strike-primary'
                  }`}
                  whileHover={{ scale: !isLoading ? 1.02 : 1 }}
                  whileTap={{ scale: !isLoading ? 0.98 : 1 }}
                  transition={{ type: "spring", stiffness: 400, damping: 17 }}
                >
                  {getButtonText()}
                </motion.button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </DraggableModal>
  );
};

export default ConfirmationModal;

import React from 'react';
import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { DraggableModal, useModalDragHandling } from './modal/DraggableModal';

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
  // Use drag handling hook for animation state
  const { isAnimating, animateClose } = useModalDragHandling({
    isOpen,
    onClose
  });


  if (!isOpen) return null;

  return (
    <DraggableModal isOpen={isOpen} onClose={onClose} fullHeight={true}>
      <div className="absolute inset-x-0 bottom-0 top-0 bg-black max-w-md mx-auto pb-safe">
        {/* Header */}
        <div className="px-2 pt-2 pb-8">
          <div className="flex items-center justify-between">
            <button
              onClick={animateClose}
              className="text-primary hover:text-primary p-2 w-12 h-12 flex items-center justify-center transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-white text-sm font-medium text-center flex-1">{title}</h2>
            <div className="w-10" />
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
              {/* Main Detail Display Area */}
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
                  {mainDetail && (
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
                        {mainDetail}
                      </motion.span>
                    </motion.div>
                  )}
                  
                  {(subDetail || transactionDetails.length > 0) && (
                    <motion.div 
                      className="flex items-center justify-center gap-2 mb-8"
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.4, duration: 0.3 }}
                    >
                      <span className="text-white text-sm font-normal">
                        {subDetail}
                      </span>
                    </motion.div>
                  )}
                </div>
              </motion.div>

              {/* Transaction Details Section */}
              {transactionDetails.length > 0 && (
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
                    {transactionDetails.map((detail, index) => (
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

              {/* DCA Plan Details Section */}
              {dcaPlanDetails.length > 0 && (
                <motion.div 
                  className="mb-4 bg-black border border-brand/30 rounded-2xl p-4"
                  initial={{ opacity: 0, y: 30, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ 
                    delay: 0.6 + (transactionDetails.length * 0.05),
                    type: "spring",
                    stiffness: 400,
                    damping: 25
                  }}
                >
                  <motion.div className="divide-y divide-brand/30">
                    {dcaPlanDetails.map((detail, index) => (
                      <motion.div 
                        key={index} 
                        className="flex justify-between items-center py-4 first:pt-0 last:pb-0"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ 
                          delay: 0.7 + (transactionDetails.length * 0.05) + (index * 0.05),
                          type: "spring",
                          stiffness: 500,
                          damping: 30
                        }}
                      >
                        <motion.span 
                          className="text-zinc-400 text-sm"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 0.75 + (transactionDetails.length * 0.05) + (index * 0.05) }}
                        >
                          {detail.label}
                        </motion.span>
                        <motion.span 
                          className={`text-sm font-normal text-white ${detail.highlight ? 'font-bold' : ''}`}
                          initial={{ opacity: 0, x: 10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.8 + (transactionDetails.length * 0.05) + (index * 0.05) }}
                        >
                          {detail.value}
                        </motion.span>
                      </motion.div>
                    ))}
                  </motion.div>
                </motion.div>
              )}

              {/* Action Buttons - positioned right below details */}
              {actionButtons && actionButtons.length > 0 && (
                <motion.div 
                  className="mb-6"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ 
                    delay: 0.8 + (transactionDetails.length * 0.05) + (dcaPlanDetails.length * 0.05),
                    type: "spring",
                    stiffness: 400,
                    damping: 25
                  }}
                >
                  {actionButtons.length === 1 ? (
                    <div className="flex justify-center">
                      <motion.button
                        onClick={actionButtons[0].onClick}
                        disabled={actionButtons[0].disabled}
                        className={`px-6 h-12 text-sm font-medium rounded-xl ${
                          actionButtons[0].variant === 'danger' 
                            ? 'bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30'
                            : actionButtons[0].variant === 'warning'
                            ? 'bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                            : actionButtons[0].variant === 'success'
                            ? 'bg-green-500/10 hover:bg-green-500/20 text-green-400 border border-green-500/30'
                            : actionButtons[0].variant === 'primary'
                            ? 'btn-strike-primary'
                            : 'btn-strike-secondary'
                        } disabled:opacity-50 disabled:cursor-not-allowed`}
                        whileHover={{ scale: !actionButtons[0].disabled ? 1.02 : 1 }}
                        whileTap={{ scale: !actionButtons[0].disabled ? 0.98 : 1 }}
                        transition={{ type: "spring", stiffness: 400, damping: 17 }}
                      >
                        {actionButtons[0].label}
                      </motion.button>
                    </div>
                  ) : (
                    <div className="flex space-x-3">
                      {actionButtons.map((button, index) => (
                        <motion.button
                          key={index}
                          onClick={button.onClick}
                          disabled={button.disabled}
                          className={`flex-1 h-12 text-sm font-medium rounded-xl ${
                            button.variant === 'danger' 
                              ? 'bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30'
                              : button.variant === 'warning'
                              ? 'bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                              : button.variant === 'success'
                              ? 'bg-green-500/10 hover:bg-green-500/20 text-green-400 border border-green-500/30'
                              : button.variant === 'primary'
                              ? 'btn-strike-primary'
                              : 'btn-strike-secondary'
                          } disabled:opacity-50 disabled:cursor-not-allowed`}
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: 0.85 + (index * 0.1) }}
                          whileHover={{ scale: !button.disabled ? 1.02 : 1 }}
                          whileTap={{ scale: !button.disabled ? 0.98 : 1 }}
                        >
                          {button.label}
                        </motion.button>
                      ))}
                    </div>
                  )}
                </motion.div>
              )}

              {/* Spacer to maintain button position */}
              <div className="flex-1"></div>

              {/* Close Button */}
              <motion.div 
                className="mb-8 pb-20 flex justify-center"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ 
                  delay: 0.9 + (transactionDetails.length * 0.05) + (dcaPlanDetails.length * 0.05),
                  duration: 0.3
                }}
              >
                <motion.button
                  onClick={animateClose}
                  className="px-6 h-12 text-sm font-medium rounded-xl btn-strike-secondary"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  transition={{ type: "spring", stiffness: 400, damping: 17 }}
                >
                  Close
                </motion.button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </DraggableModal>
  );
};

export default DetailsModal;

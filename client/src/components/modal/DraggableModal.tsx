import React from 'react';
import { createPortal } from 'react-dom';
import { useModalDragHandling } from '../../hooks/useModalDragHandling';
import { useBodyScrollPrevention } from '../../hooks/useBodyScrollPrevention';
import { MODAL_CONSTANTS } from './modalConstants';

export interface DraggableModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  className?: string;
  modalClassName?: string;
  backdropClassName?: string;
  excludeAdditionalSelectors?: string[];
  showBackdrop?: boolean;
  maxHeight?: string;
  minHeight?: string;
  fullHeight?: boolean; // For modals that should take full height like SingleInputModal
}

export const DraggableModal: React.FC<DraggableModalProps> = ({
  isOpen,
  onClose,
  children,
  className = '',
  modalClassName = '',
  backdropClassName = '',
  excludeAdditionalSelectors = [],
  showBackdrop = true,
  maxHeight = MODAL_CONSTANTS.MAX_HEIGHT,
  minHeight = MODAL_CONSTANTS.MIN_HEIGHT,
  fullHeight = false,
}) => {
  // Use custom hooks
  const dragHandling = useModalDragHandling({
    isOpen,
    onClose,
    excludeAdditionalSelectors
  });

  useBodyScrollPrevention({ isOpen });

  // Don't render if not open
  if (!isOpen) return null;

  // Default modal styling
  const defaultModalClasses = fullHeight 
    ? "absolute inset-x-0 bottom-0 top-0 bg-black max-w-md mx-auto pb-safe"
    : "absolute inset-x-0 bottom-0 bg-black max-w-md mx-auto rounded-t-3xl flex flex-col pb-safe";

  // Modal style object
  const modalStyle: React.CSSProperties = {
    ...(!fullHeight && {
      maxHeight,
      minHeight,
    }),
    transform: dragHandling.getModalTransform(),
    transition: dragHandling.getModalTransition(),
    touchAction: MODAL_CONSTANTS.TOUCH_ACTION,
  };

  const modalContent = (
    <div className={`fixed inset-0 z-50 ${className}`} style={{ touchAction: MODAL_CONSTANTS.TOUCH_ACTION }}>
      {/* Backdrop */}
      {showBackdrop && (
        <div 
          className={`absolute inset-0 bg-black/50 backdrop-blur-sm ${backdropClassName}`}
          onClick={dragHandling.animateClose}
          onTouchMove={(e) => e.preventDefault()}
          style={{ touchAction: MODAL_CONSTANTS.TOUCH_ACTION }}
        />
      )}
      
      {/* Modal */}
      <div
        ref={dragHandling.modalRef}
        className={`${defaultModalClasses} ${modalClassName}`}
        style={modalStyle}
        onTouchStart={dragHandling.handleTouchStart}
        onTouchMove={dragHandling.handleTouchMove}
        onTouchEnd={dragHandling.handleTouchEnd}
      >
        {children}
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};

// Export hook for advanced use cases
export { useModalDragHandling } from '../../hooks/useModalDragHandling';

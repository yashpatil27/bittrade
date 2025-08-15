import React, { useEffect, useRef } from 'react';
import { ChevronLeft, X } from 'lucide-react';
import { DraggableModal, useModalDragHandling } from './modal/DraggableModal';

interface OptionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  showXIcon?: boolean; // Show X icon instead of ChevronLeft (default: false)
}

const OptionsModal: React.FC<OptionsModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  showXIcon = false
}) => {
  // Use drag handling hook for animation state
  const { isAnimating } = useModalDragHandling({
    isOpen,
    onClose
  });
  
  const contentRef = useRef<HTMLDivElement>(null);

  // Animation control for children - properly timed with modal animation
  useEffect(() => {
    if (contentRef.current) {
      if (isOpen && isAnimating) {
        // Initially hide all content
        hideAllContent();
        
        // Wait for modal animation to start, then animate children
        setTimeout(() => {
          animateChildren();
        }, 200); // Delay to coordinate with modal slide-up
      } else if (!isOpen) {
        // Reset content when modal closes
        resetContent();
      }
    }
  }, [isOpen, isAnimating]);

  // Function to initially hide all content
  const hideAllContent = () => {
    if (!contentRef.current) return;
    
    // Find all child elements that should be animated
    const spaceContainer = contentRef.current.querySelector('.space-y-4, .space-y-3');
    if (!spaceContainer) return;
    
    const childElements = Array.from(spaceContainer.children) as HTMLElement[];
    
    childElements.forEach((child) => {
      const element = child as HTMLElement;
      element.style.opacity = '0';
      element.style.transform = 'translateY(20px) scale(0.95)';
      element.style.transition = 'none';
    });
  };

  // Function to animate children with stagger effect
  const animateChildren = () => {
    if (!contentRef.current) return;
    
    // Find all child elements that should be animated
    const spaceContainer = contentRef.current.querySelector('.space-y-4, .space-y-3');
    if (!spaceContainer) return;
    
    const childElements = Array.from(spaceContainer.children) as HTMLElement[];
    
    childElements.forEach((child, index) => {
      const element = child as HTMLElement;
      
      // Apply staggered animation with proper timing
      setTimeout(() => {
        element.style.transition = 'all 0.4s cubic-bezier(0.25, 0.8, 0.25, 1)';
        element.style.opacity = '1';
        element.style.transform = 'translateY(0px) scale(1)';
      }, index * 80); // Stagger delay for smooth cascade
    });
  };

  // Function to reset content state
  const resetContent = () => {
    if (!contentRef.current) return;
    
    const spaceContainer = contentRef.current.querySelector('.space-y-4, .space-y-3');
    if (!spaceContainer) return;
    
    const childElements = Array.from(spaceContainer.children) as HTMLElement[];
    
    childElements.forEach((child) => {
      const element = child as HTMLElement;
      element.style.opacity = '';
      element.style.transform = '';
      element.style.transition = '';
    });
  };



  if (!isOpen) return null;

  return (
    <DraggableModal isOpen={isOpen} onClose={onClose}>
      <div 
        className="absolute inset-x-0 bottom-0 bg-black max-w-md mx-auto rounded-t-3xl flex flex-col pb-safe"
        style={{
          maxHeight: '70vh',
          minHeight: '40vh'
        }}
      >
        {/* Header */}
        <div className="px-2 pt-2 pb-4">
          <div className="flex items-center justify-between">
            <button
              onClick={onClose}
              className="text-primary hover:text-primary p-2 w-12 h-12 flex items-center justify-center transition-colors"
            >
              {showXIcon ? <X className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
            </button>
            <h2 className="text-white text-sm font-medium text-center flex-1">{title}</h2>
            <div className="w-10"></div> {/* Spacer for centering */}
          </div>
        </div>

        {/* Content Area - Animated */}
        <div className="flex-1 px-6 pb-8 overflow-y-auto">
          <div ref={contentRef}>
            {children}
          </div>
        </div>
      </div>
    </DraggableModal>
  );
};

export default OptionsModal;

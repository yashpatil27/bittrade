import React, { useState, useCallback, useRef } from 'react';
import { MODAL_CONSTANTS } from '../components/modal/modalConstants';

interface UseModalDragHandlingOptions {
  isOpen: boolean;
  onClose: () => void;
  excludeAdditionalSelectors?: string[];
}

interface UseModalDragHandlingReturn {
  // State
  dragOffset: number;
  isDragging: boolean;
  isAnimating: boolean;
  isClosing: boolean;
  modalRef: React.RefObject<HTMLDivElement | null>;
  
  // Handlers
  handleTouchStart: (e: React.TouchEvent) => void;
  handleTouchMove: (e: React.TouchEvent) => void;
  handleTouchEnd: () => void;
  animateClose: () => void;
  
  // Transform styles
  getModalTransform: () => string;
  getModalTransition: () => string;
}

export const useModalDragHandling = ({
  isOpen,
  onClose,
  excludeAdditionalSelectors = []
}: UseModalDragHandlingOptions): UseModalDragHandlingReturn => {
  // State
  const [dragStartY, setDragStartY] = useState(0);
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [screenHeight] = useState(window.innerHeight);
  const modalRef = useRef<HTMLDivElement | null>(null);

  // Check if element should be excluded from drag handling
  const isElementExcluded = useCallback((target: HTMLElement): boolean => {
    // Check tag name
    if ((MODAL_CONSTANTS.DRAG_EXCLUDED_TAGS as readonly string[]).includes(target.tagName)) {
      return true;
    }
    
    // Check standard selectors
    for (const selector of MODAL_CONSTANTS.DRAG_EXCLUDED_SELECTORS) {
      if (target.closest(selector)) {
        return true;
      }
    }
    
    // Check additional selectors
    for (const selector of excludeAdditionalSelectors) {
      if (target.closest(selector)) {
        return true;
      }
    }
    
    return false;
  }, [excludeAdditionalSelectors]);

  // Animation close function
  const animateClose = useCallback(() => {
    setIsClosing(true);
    setIsAnimating(false);
    setTimeout(() => {
      setIsClosing(false);
      onClose();
    }, MODAL_CONSTANTS.CLOSE_ANIMATION_DURATION);
  }, [onClose]);

  // Touch handlers
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const target = e.target as HTMLElement;
    
    if (isElementExcluded(target)) {
      return;
    }
    
    const touch = e.touches[0];
    setDragStartY(touch.clientY);
    setIsDragging(true);
  }, [isElementExcluded]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isDragging) return;
    
    e.preventDefault();
    const touch = e.touches[0];
    const deltaY = touch.clientY - dragStartY;
    
    if (deltaY > 0) {
      setDragOffset(deltaY);
    }
  }, [isDragging, dragStartY]);

  const handleTouchEnd = useCallback(() => {
    setIsDragging(false);
    const closeThreshold = screenHeight * MODAL_CONSTANTS.DRAG_CLOSE_THRESHOLD;
    
    if (dragOffset > closeThreshold) {
      animateClose();
    } else {
      setDragOffset(0);
    }
  }, [dragOffset, screenHeight, animateClose]);

  // Style getters
  const getModalTransform = useCallback((): string => {
    if (isClosing) return 'translateY(100%)';
    if (isAnimating) return `translateY(${dragOffset}px)`;
    return 'translateY(100%)';
  }, [isClosing, isAnimating, dragOffset]);

  const getModalTransition = useCallback((): string => {
    if (isDragging) return 'none';
    if (isAnimating || isClosing) {
      return `transform 0.3s ${MODAL_CONSTANTS.TRANSITION_EASING}`;
    }
    return 'none';
  }, [isDragging, isAnimating, isClosing]);

  // Initialize animation when modal opens
  React.useEffect(() => {
    if (isOpen) {
      setDragOffset(0);
      setIsAnimating(false);
      setTimeout(() => {
        setIsAnimating(true);
      }, MODAL_CONSTANTS.ANIMATION_DELAY);
    } else {
      setIsAnimating(false);
    }
  }, [isOpen]);

  return {
    // State
    dragOffset,
    isDragging,
    isAnimating,
    isClosing,
    modalRef,
    
    // Handlers
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    animateClose,
    
    // Transform styles
    getModalTransform,
    getModalTransition,
  };
};

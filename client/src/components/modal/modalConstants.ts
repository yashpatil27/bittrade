// Modal animation and behavior constants
export const MODAL_CONSTANTS = {
  // Animation timing
  ANIMATION_DELAY: 50, // ms delay before showing modal
  CLOSE_ANIMATION_DURATION: 300, // ms for close animation
  
  // Drag behavior
  DRAG_CLOSE_THRESHOLD: 0.3, // 30% of screen height
  
  // Animation easing
  TRANSITION_EASING: 'cubic-bezier(0.25, 0.8, 0.25, 1)',
  
  // Modal constraints
  MAX_HEIGHT: '90vh',
  MIN_HEIGHT: '40vh',
  
  // Touch action prevention
  TOUCH_ACTION: 'none' as const,
  
  // Excluded elements from drag handling
  DRAG_EXCLUDED_TAGS: ['BUTTON', 'INPUT', 'TEXTAREA', 'SELECT'] as const,
  DRAG_EXCLUDED_SELECTORS: ['button', '[data-clickable]', '[data-clickable-section]'] as const,
} as const;

// Type exports for better TypeScript support
export type ModalTransition = typeof MODAL_CONSTANTS.TRANSITION_EASING;
export type TouchAction = typeof MODAL_CONSTANTS.TOUCH_ACTION;

// Utility to manage body scroll locking when multiple modals are open
// This prevents the issue where closing one modal affects others

class ScrollLockManager {
  private lockCount = 0;
  private originalScrollY = 0;

  lock() {
    if (this.lockCount === 0) {
      // Store current scroll position only when first modal opens
      this.originalScrollY = window.scrollY;
      
      // Prevent scrolling
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.top = `-${this.originalScrollY}px`;
      document.body.style.width = '100%';
    }
    
    this.lockCount++;
  }

  unlock() {
    this.lockCount = Math.max(0, this.lockCount - 1);
    
    if (this.lockCount === 0) {
      // Only restore scroll when all modals are closed
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
      
      // Restore scroll position
      window.scrollTo(0, this.originalScrollY);
    }
  }

  // Force unlock (cleanup)
  forceUnlock() {
    this.lockCount = 0;
    document.body.style.overflow = '';
    document.body.style.position = '';
    document.body.style.top = '';
    document.body.style.width = '';
  }
}

// Single instance to be shared across all modals
export const scrollLockManager = new ScrollLockManager();

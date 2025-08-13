import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { ChevronLeft, X } from 'lucide-react';

interface NotificationItem {
  id: string;
  title: string;
  description: string;
  timestamp: string;
  type: 'success' | 'warning' | 'info' | 'error';
  clickable?: boolean;
  onClick?: () => void;
}

interface OptionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  type?: 'notifications' | 'custom';
  notifications?: NotificationItem[];
  children?: React.ReactNode;
  showXIcon?: boolean; // Show X icon instead of ChevronLeft (default: false)
}

const OptionsModal: React.FC<OptionsModalProps> = ({
  isOpen,
  onClose,
  title,
  type = 'custom',
  notifications = [],
  children,
  showXIcon = false
}) => {
  const [dragStartY, setDragStartY] = useState(0);
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [screenHeight] = useState(window.innerHeight);
  const modalRef = useRef<HTMLDivElement>(null);

  // Animation control
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
    if (target.tagName === 'BUTTON' || target.closest('button') || target.closest('[data-clickable]')) {
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

  // Get notification dot color based on type
  const getNotificationColor = (notificationType: string) => {
    switch (notificationType) {
      case 'success': return 'bg-green-500';
      case 'warning': return 'bg-orange-500';
      case 'error': return 'bg-red-500';
      case 'info': return 'bg-brand';
      default: return 'bg-gray-500';
    }
  };

  // Render notifications content
  const renderNotifications = () => {
    if (notifications.length === 0) {
      return (
        <div className="flex items-center justify-center py-8">
          <p className="text-gray-400 text-sm">No notifications</p>
        </div>
      );
    }

    return (
      <div className="bg-gray-900 rounded-lg">
        {notifications.map((notification, index) => (
          <div key={notification.id}>
            <div 
              className={`p-3 ${notification.clickable ? 'cursor-pointer hover:bg-gray-800 transition-colors' : ''}`}
              onClick={notification.clickable ? notification.onClick : undefined}
              data-clickable={notification.clickable ? 'true' : undefined}
            >
              <div className="flex items-start space-x-2">
                <div className={`w-1.5 h-1.5 ${getNotificationColor(notification.type)} rounded-full mt-1.5 flex-shrink-0`}></div>
                <div className="flex-1 min-w-0">
                  <p className="text-white text-xs font-medium leading-tight">{notification.title}</p>
                  <p className="text-gray-400 text-xs mt-0.5 leading-tight">{notification.description} • {notification.timestamp}</p>
                </div>
              </div>
            </div>
            {index < notifications.length - 1 && (
              <div className="border-b border-gray-800 mx-3"></div>
            )}
          </div>
        ))}
      </div>
    );
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
        className="absolute inset-x-0 bottom-0 bg-black max-w-md mx-auto rounded-t-3xl flex flex-col pb-safe"
        style={{
          maxHeight: '70vh',
          minHeight: '40vh',
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
              className="text-primary hover:text-primary p-2 w-12 h-12 flex items-center justify-center transition-colors"
            >
              {showXIcon ? <X className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
            </button>
            <h2 className="text-white text-sm font-medium text-center flex-1">{title}</h2>
            <div className="w-10"></div> {/* Spacer for centering */}
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 px-6 pb-8 overflow-y-auto">
          {type === 'notifications' ? renderNotifications() : children}
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};

export default OptionsModal;

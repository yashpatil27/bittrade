import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  variant?: 'default' | 'gradient' | 'outline';
  padding?: 'sm' | 'md' | 'lg' | 'none';
}

const Card: React.FC<CardProps> = ({ 
  children, 
  className = '', 
  onClick,
  variant = 'default',
  padding = 'md'
}) => {
  const baseClasses = 'transition-all duration-200';
  
  const variantClasses = {
    default: 'bg-gray-900 border border-gray-800',
    gradient: 'bg-gradient-to-r from-gray-900 to-gray-800 border border-gray-700',
    outline: 'border border-gray-700 bg-transparent'
  };
  
  const paddingClasses = {
    none: '',
    sm: 'p-3',
    md: 'p-4',
    lg: 'p-6'
  };
  
  const hoverClasses = onClick ? 'hover:bg-gray-800 cursor-pointer active:scale-[0.98]' : '';
  
  return (
    <div 
      className={`
        ${baseClasses} 
        ${variantClasses[variant]} 
        ${paddingClasses[padding]} 
        ${hoverClasses}
        rounded-xl
        ${className}
      `}
      onClick={onClick}
    >
      {children}
    </div>
  );
};

export default Card;

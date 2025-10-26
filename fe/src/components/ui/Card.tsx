import React from 'react';

interface CardProps {
  children?: React.ReactNode;
  className?: string;
  hover?: boolean;
  border?: 'default' | 'yellow' | 'green' | 'red' | 'gray';
}

const Card: React.FC<CardProps> = ({
  children,
  className = '',
  hover = true,
  border = 'default'
}) => {
  const getBorderStyles = () => {
    switch (border) {
      case 'yellow':
        return 'border-[#ffff00]';
      case 'green':
        return 'border-[#00ff00]';
      case 'red':
        return 'border-red-500';
      case 'gray':
        return 'border-[#333]';
      default:
        return 'border-[#333]';
    }
  };

  const hoverStyles = hover ? 'hover:border-[#ffff00]' : '';

  return (
    <div
      className={`
        bg-[#1a1a1a] rounded-lg shadow-sm border p-6
        ${getBorderStyles()}
        ${hoverStyles}
        transition-colors
        ${className}
      `}
    >
      {children && children}
    </div>
  );
};

export default Card;

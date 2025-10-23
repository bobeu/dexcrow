import React from 'react';
import { LucideIcon } from 'lucide-react';

interface BadgeProps {
  children?: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info';
  icon?: LucideIcon;
  className?: string;
}

const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'default',
  icon: Icon,
  className = ''
}) => {
  const getVariantStyles = () => {
    switch (variant) {
      case 'success':
        return 'bg-[#1a1a1a] border border-[#00ff00] text-[#00ff00]';
      case 'warning':
        return 'bg-[#1a1a1a] border border-[#ffff00] text-[#ffff00]';
      case 'danger':
        return 'bg-[#1a1a1a] border border-red-500 text-red-500';
      case 'info':
        return 'bg-[#1a1a1a] border border-[#ffff00] text-[#ffff00]';
      default:
        return 'bg-[#1a1a1a] border border-[#333] text-[#666]';
    }
  };

  return (
    <div
      className={`
        inline-flex items-center space-x-2 px-3 py-1 rounded-full
        text-sm font-medium font-mono border
        ${getVariantStyles()}
        ${className}
      `}
    >
      {Icon && <Icon className="w-4 h-4" />}
      <span>{children && children}</span>
    </div>
  );
};

export default Badge;

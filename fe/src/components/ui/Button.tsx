import React from 'react';
import { LucideIcon } from 'lucide-react';

interface ButtonProps {
  children?: React.ReactNode;
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
  variant?: 'primary' | 'secondary' | 'success' | 'danger' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  icon?: LucideIcon;
  className?: string;
}

const Button: React.FC<ButtonProps> = ({
  children,
  onClick,
  type = 'button',
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  icon: Icon,
  className = ''
}) => {
  const getVariantStyles = () => {
    switch (variant) {
      case 'primary':
        return 'bg-[#ffff00] text-[#1a1a1a] hover:bg-[#e6e600] disabled:bg-[#333] disabled:text-[#666]';
      case 'secondary':
        return 'bg-[#333] text-white hover:bg-[#444] disabled:bg-[#222] disabled:text-[#666]';
      case 'success':
        return 'bg-[#00ff00] text-[#1a1a1a] hover:bg-[#00e600] disabled:bg-[#333] disabled:text-[#666]';
      case 'danger':
        return 'bg-red-500 text-white hover:bg-red-600 disabled:bg-[#333] disabled:text-[#666]';
      case 'outline':
        return 'border border-[#ffff00] text-[#ffff00] hover:bg-[#ffff00] hover:text-[#1a1a1a] disabled:border-[#333] disabled:text-[#666]';
      default:
        return 'bg-[#ffff00] text-[#1a1a1a] hover:bg-[#e6e600]';
    }
  };

  const getSizeStyles = () => {
    switch (size) {
      case 'sm':
        return 'px-3 py-1.5 text-sm';
      case 'md':
        return 'px-4 py-2 text-base';
      case 'lg':
        return 'px-6 py-3 text-lg';
      default:
        return 'px-4 py-2 text-base';
    }
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`
        ${getVariantStyles()}
        ${getSizeStyles()}
        rounded-lg font-mono font-bold transition-colors
        disabled:cursor-not-allowed
        flex items-center justify-center space-x-2
        ${className}
      `}
    >
      {loading && (
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
      )}
      {Icon && !loading && <Icon className="w-4 h-4" />}
      {children && children}
    </button>
  );
};

export default Button;

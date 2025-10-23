import React from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
  className = ''
}) => {
  const getSizeStyles = () => {
    switch (size) {
      case 'sm':
        return 'max-w-sm';
      case 'md':
        return 'max-w-md';
      case 'lg':
        return 'max-w-lg';
      case 'xl':
        return 'max-w-xl';
      default:
        return 'max-w-md';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className={`
        relative bg-[#1a1a1a] border border-[#333] rounded-2xl shadow-2xl
        w-full ${getSizeStyles()} max-h-[90vh] overflow-hidden flex flex-col
        ${className}
      `}>
        {/* Background Grid Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `
              linear-gradient(rgba(255, 255, 0, 0.1) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255, 255, 0, 0.1) 1px, transparent 1px)
            `,
            backgroundSize: '20px 20px'
          }}></div>
        </div>

        {/* Header */}
        {title && (
          <div className="relative z-10 p-4 sm:p-6 border-b border-[#333] flex-shrink-0">
            <div className="flex items-center justify-between">
              <h2 className="text-lg sm:text-xl font-bold text-white font-mono tracking-wide">
                {title}
              </h2>
              <button
                onClick={onClose}
                className="p-2 text-[#ffff00] hover:text-white hover:bg-[#333] rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

        {/* Content */}
        <div className="relative z-10 p-4 sm:p-6 flex-1 overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  );
};

export default Modal;

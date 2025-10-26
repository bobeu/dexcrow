import React from 'react';
import { CheckCircle, XCircle, Info, AlertTriangle } from 'lucide-react';

interface MessageDisplayProps {
  message: string;
  type?: 'success' | 'error' | 'info' | 'warning';
}

const MessageDisplay: React.FC<MessageDisplayProps> = ({ message, type = 'info' }) => {
  if (!message) return null;

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-[#00ff00]" />;
      case 'error':
        return <XCircle className="w-5 h-5 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-[#ffff00]" />;
      default:
        return <Info className="w-5 h-5 text-[#ffff00]" />;
    }
  };

  const getStyles = () => {
    switch (type) {
      case 'success':
        return 'bg-[#1a1a1a] border-[#00ff00] text-[#00ff00]';
      case 'error':
        return 'bg-[#1a1a1a] border-red-500 text-red-500';
      case 'warning':
        return 'bg-[#1a1a1a] border-[#ffff00] text-[#ffff00]';
      default:
        return 'bg-[#1a1a1a] border-[#ffff00] text-[#ffff00]';
    }
  };

  return (
    <div className={`mb-6 p-4 rounded-lg border ${getStyles()}`}>
      <div className="flex items-center space-x-3">
        {getIcon()}
        <p className="text-sm font-medium font-mono">{message}</p>
      </div>
    </div>
  );
};

export default MessageDisplay;

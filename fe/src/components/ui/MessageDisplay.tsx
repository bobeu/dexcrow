import React from 'react';
import { CheckCircle, XCircle, Info, AlertTriangle } from 'lucide-react';
import Card from './Card';

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

  const getBorderVariant = () => {
    switch (type) {
      case 'success':
        return 'green';
      case 'error':
        return 'red';
      case 'warning':
        return 'yellow';
      default:
        return 'yellow';
    }
  };

  const getTextColor = () => {
    switch (type) {
      case 'success':
        return 'text-[#00ff00]';
      case 'error':
        return 'text-red-500';
      case 'warning':
        return 'text-[#ffff00]';
      default:
        return 'text-[#ffff00]';
    }
  };

  return (
    <Card border={getBorderVariant()} hover={false} className="mb-6">
      <div className="flex items-center space-x-3">
        {getIcon()}
        <p className={`text-sm font-medium font-mono ${getTextColor()}`}>
          {message}
        </p>
      </div>
    </Card>
  );
};

export default MessageDisplay;

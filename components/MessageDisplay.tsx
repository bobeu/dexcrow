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
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'error':
        return <XCircle className="w-5 h-5 text-red-600" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-yellow-600" />;
      default:
        return <Info className="w-5 h-5 text-blue-600" />;
    }
  };

  const getStyles = () => {
    switch (type) {
      case 'success':
        return 'bg-green-50 border-green-200 text-green-800';
      case 'error':
        return 'bg-red-50 border-red-200 text-red-800';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      default:
        return 'bg-blue-50 border-blue-200 text-blue-800';
    }
  };

  return (
    <div className={`mb-6 p-4 rounded-lg border ${getStyles()}`}>
      <div className="flex items-center space-x-3">
        {getIcon()}
        <p className="text-sm font-medium">{message}</p>
      </div>
    </div>
  );
};

export default MessageDisplay;

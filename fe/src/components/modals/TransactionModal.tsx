import React from 'react';
import { CheckCircle, XCircle, Loader2, ExternalLink } from 'lucide-react';
import { Modal, Button } from '@/components/ui';
import { TransactionModalProps } from '@/lib/types';

const TransactionModal: React.FC<TransactionModalProps> = ({
  isOpen,
  onClose,
  title,
  description,
  transactionHash,
  status,
  error,
  message
}) => {
  const getStatusIcon = () => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-12 h-12 text-green-500" />;
      case 'error':
        return <XCircle className="w-12 h-12 text-red-500" />;
      case 'pending':
        return <Loader2 className="w-12 h-12 text-[#ffff00] animate-spin" />;
      default:
        return <Loader2 className="w-12 h-12 text-[#ffff00] animate-spin" />;
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'success':
        return 'Transaction Successful';
      case 'error':
        return 'Transaction Failed';
      case 'pending':
        return 'Transaction Pending';
      default:
        return 'Processing Transaction';
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'success':
        return 'text-green-500';
      case 'error':
        return 'text-red-500';
      case 'pending':
        return 'text-[#ffff00]';
      default:
        return 'text-[#ffff00]';
    }
  };

  const openExplorer = () => {
    if (!transactionHash) return;
    
    // Base Sepolia explorer
    const explorerUrl = `https://sepolia.basescan.org/tx/${transactionHash}`;
    window.open(explorerUrl, '_blank');
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size="md"
    >
      <div className="space-y-6">
        {/* Status Icon and Text */}
        <div className="text-center">
          <div className="flex justify-center mb-4">
            {getStatusIcon()}
          </div>
          <h3 className={`text-lg font-bold font-mono ${getStatusColor()}`}>
            {getStatusText()}
          </h3>
          {description && (
            <p className="text-[#ffff00] font-mono text-sm mt-2">
              {description}
            </p>
          )}
        </div>

        {/* Transaction Hash */}
        {transactionHash && (
          <div className="bg-[#333] border border-[#ffff00] rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white font-mono text-sm font-bold mb-1">
                  Transaction Hash:
                </p>
                <p className="text-[#ffff00] font-mono text-xs break-all">
                  {transactionHash}
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={openExplorer}
                icon={ExternalLink}
                className="ml-2"
              >
                View
              </Button>
            </div>
          </div>
        )}

        {/* Message or Error */}
        {message && (
          <div className="bg-blue-900/20 border border-blue-500 rounded-lg p-4">
            <p className="text-blue-400 font-mono text-sm">
              <strong>Info:</strong> {message}
            </p>
          </div>
        )}
        
        {error && !message && (
          <div className="bg-red-900/20 border border-red-500 rounded-lg p-4">
            <p className="text-red-400 font-mono text-sm">
              <strong>Error:</strong> {error}
            </p>
          </div>
        )}

        {/* Loading State */}
        {status === 'pending' && (
          <div className="bg-[#333] border border-[#ffff00] rounded-lg p-4">
            <div className="flex items-center space-x-3">
              <Loader2 className="w-5 h-5 text-[#ffff00] animate-spin" />
              <p className="text-[#ffff00] font-mono text-sm">
                Waiting for transaction confirmation...
              </p>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
          {status === 'success' && (
            <Button
              onClick={onClose}
              variant="primary"
              className="flex-1"
            >
              Continue
            </Button>
          )}
          {status === 'error' && (
            <Button
              onClick={onClose}
              variant="outline"
              className="flex-1"
            >
              Close
            </Button>
          )}
          {status === 'pending' && (
            <Button
              onClick={onClose}
              variant="outline"
              className="flex-1"
              disabled
            >
              Processing...
            </Button>
          )}
        </div>

        {/* Additional Info */}
        {status === 'pending' && (
          <div className="text-center">
            <p className="text-[#ffff00] font-mono text-xs">
              Please don't close this window until the transaction is confirmed
            </p>
          </div>
        )}
      </div>
    </Modal>
  );
};

export default TransactionModal;

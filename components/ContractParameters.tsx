import React from 'react';
import { EscrowContractState, UserRole, EscrowState } from '../lib/types';
import { Copy, Check, Clock, Shield, User, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';

interface ContractParametersProps {
  escrowState: EscrowContractState;
  userRole: UserRole;
  isExpired: boolean;
}

const ContractParameters: React.FC<ContractParametersProps> = ({ 
  escrowState, 
  userRole, 
  isExpired 
}) => {
  const [copiedField, setCopiedField] = React.useState<string | null>(null);

  const handleCopy = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const formatAddress = (address: string) => {
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };

  const formatAmount = (amount: number) => {
    return (amount / 1e18).toFixed(4);
  };

  const getTimeRemaining = () => {
    const now = Math.floor(Date.now() / 1000);
    const remaining = escrowState.deadline - now;
    
    if (remaining <= 0) return 'Expired';
    
    const days = Math.floor(remaining / (24 * 60 * 60));
    const hours = Math.floor((remaining % (24 * 60 * 60)) / (60 * 60));
    const minutes = Math.floor((remaining % (60 * 60)) / 60);
    
    if (days > 0) return `${days}d ${hours}h ${minutes}m`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  const getStateIcon = () => {
    switch (escrowState.currentState) {
      case EscrowState.AWAITING_DEPOSIT:
        return <Clock className="w-5 h-5 text-yellow-600" />;
      case EscrowState.AWAITING_FULFILLMENT:
        return <Shield className="w-5 h-5 text-blue-600" />;
      case EscrowState.DISPUTE_RAISED:
        return <AlertTriangle className="w-5 h-5 text-red-600" />;
      case EscrowState.COMPLETED:
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case EscrowState.CANCELED:
        return <XCircle className="w-5 h-5 text-gray-600" />;
      default:
        return <Clock className="w-5 h-5 text-gray-600" />;
    }
  };

  const getStateColor = () => {
    switch (escrowState.currentState) {
      case EscrowState.AWAITING_DEPOSIT:
        return 'bg-yellow-100 text-yellow-800';
      case EscrowState.AWAITING_FULFILLMENT:
        return 'bg-blue-100 text-blue-800';
      case EscrowState.DISPUTE_RAISED:
        return 'bg-red-100 text-red-800';
      case EscrowState.COMPLETED:
        return 'bg-green-100 text-green-800';
      case EscrowState.CANCELED:
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStateName = () => {
    switch (escrowState.currentState) {
      case EscrowState.AWAITING_DEPOSIT:
        return 'Awaiting Deposit';
      case EscrowState.AWAITING_FULFILLMENT:
        return 'Awaiting Fulfillment';
      case EscrowState.DISPUTE_RAISED:
        return 'Dispute Raised';
      case EscrowState.COMPLETED:
        return 'Completed';
      case EscrowState.CANCELED:
        return 'Canceled';
      default:
        return 'Unknown';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Contract Parameters</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Contract Information */}
        <div className="space-y-4">
          <h4 className="text-sm font-medium text-gray-900">Contract Information</h4>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-sm text-gray-600">Contract Address</span>
              <div className="flex items-center space-x-2">
                <span className="font-mono text-sm text-gray-900">
                  {formatAddress(escrowState.contractAddress!)}
                </span>
                <button
                  onClick={() => handleCopy(escrowState.contractAddress!, 'contract')}
                  className="p-1 hover:bg-gray-200 rounded"
                >
                  {copiedField === 'contract' ? (
                    <Check className="w-4 h-4 text-green-600" />
                  ) : (
                    <Copy className="w-4 h-4 text-gray-400" />
                  )}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-sm text-gray-600">State</span>
              <div className={`flex items-center space-x-2 px-2 py-1 rounded-full text-xs font-medium ${getStateColor()}`}>
                {getStateIcon()}
                <span>{getStateName()}</span>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-sm text-gray-600">Trade Type</span>
              <span className="text-sm text-gray-900 capitalize">
                {escrowState.tradeType.replace('_', ' ')}
              </span>
            </div>

            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-sm text-gray-600">Asset Amount</span>
              <span className="text-sm font-mono text-gray-900">
                {formatAmount(escrowState.assetAmount)} ETH
              </span>
            </div>
          </div>
        </div>

        {/* Parties */}
        <div className="space-y-4">
          <h4 className="text-sm font-medium text-gray-900">Parties</h4>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-2">
                <User className="w-4 h-4 text-indigo-600" />
                <span className="text-sm text-gray-600">Buyer</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="font-mono text-sm text-gray-900">
                  {formatAddress(escrowState.buyer)}
                </span>
                <button
                  onClick={() => handleCopy(escrowState.buyer, 'buyer')}
                  className="p-1 hover:bg-gray-200 rounded"
                >
                  {copiedField === 'buyer' ? (
                    <Check className="w-4 h-4 text-green-600" />
                  ) : (
                    <Copy className="w-4 h-4 text-gray-400" />
                  )}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-2">
                <User className="w-4 h-4 text-pink-600" />
                <span className="text-sm text-gray-600">Seller</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="font-mono text-sm text-gray-900">
                  {formatAddress(escrowState.seller)}
                </span>
                <button
                  onClick={() => handleCopy(escrowState.seller, 'seller')}
                  className="p-1 hover:bg-gray-200 rounded"
                >
                  {copiedField === 'seller' ? (
                    <Check className="w-4 h-4 text-green-600" />
                  ) : (
                    <Copy className="w-4 h-4 text-gray-400" />
                  )}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-2">
                <Shield className="w-4 h-4 text-cyan-600" />
                <span className="text-sm text-gray-600">Arbiter</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="font-mono text-sm text-gray-900">
                  {formatAddress(escrowState.arbiter)}
                </span>
                <button
                  onClick={() => handleCopy(escrowState.arbiter, 'arbiter')}
                  className="p-1 hover:bg-gray-200 rounded"
                >
                  {copiedField === 'arbiter' ? (
                    <Check className="w-4 h-4 text-green-600" />
                  ) : (
                    <Copy className="w-4 h-4 text-gray-400" />
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Deadline */}
      <div className="mt-6 p-4 bg-indigo-50 rounded-lg border border-indigo-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Clock className="w-5 h-5 text-indigo-600" />
            <span className="text-sm font-medium text-indigo-900">Refund Deadline</span>
          </div>
          <div className="text-right">
            <div className="text-sm text-indigo-900">
              {new Date(escrowState.deadline * 1000).toLocaleString()}
            </div>
            <div className={`text-xs font-medium ${
              isExpired ? 'text-red-600' : 'text-indigo-600'
            }`}>
              {isExpired ? 'EXPIRED' : `Time remaining: ${getTimeRemaining()}`}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContractParameters;

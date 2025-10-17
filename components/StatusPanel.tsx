import React from 'react';
import { EscrowContractState, UserRole, EscrowState } from '../lib/types';
import { Clock, Shield, User, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';

interface StatusPanelProps {
  escrowState: EscrowContractState;
  userRole: UserRole;
  isExpired: boolean;
  balance: string;
}

const StatusPanel: React.FC<StatusPanelProps> = ({ 
  escrowState, 
  userRole, 
  isExpired, 
  balance 
}) => {
  const getStateInfo = () => {
    switch (escrowState.currentState) {
      case EscrowState.AWAITING_DEPOSIT:
        return {
          icon: <Clock className="w-5 h-5" />,
          color: 'bg-yellow-100 text-yellow-800',
          label: 'Awaiting Deposit',
          description: 'Waiting for buyer to deposit assets'
        };
      case EscrowState.AWAITING_FULFILLMENT:
        return {
          icon: <Shield className="w-5 h-5" />,
          color: 'bg-blue-100 text-blue-800',
          label: 'Awaiting Fulfillment',
          description: 'Assets locked, waiting for fulfillment'
        };
      case EscrowState.DISPUTE_RAISED:
        return {
          icon: <AlertTriangle className="w-5 h-5" />,
          color: 'bg-red-100 text-red-800',
          label: 'Dispute Raised',
          description: 'Dispute requires arbiter resolution'
        };
      case EscrowState.COMPLETED:
        return {
          icon: <CheckCircle className="w-5 h-5" />,
          color: 'bg-green-100 text-green-800',
          label: 'Completed',
          description: 'Escrow successfully completed'
        };
      case EscrowState.CANCELED:
        return {
          icon: <XCircle className="w-5 h-5" />,
          color: 'bg-gray-100 text-gray-800',
          label: 'Canceled',
          description: 'Escrow was canceled or refunded'
        };
      default:
        return {
          icon: <Clock className="w-5 h-5" />,
          color: 'bg-gray-100 text-gray-800',
          label: 'Unknown',
          description: 'Unknown state'
        };
    }
  };

  const getRoleInfo = () => {
    switch (userRole) {
      case 'Buyer':
        return {
          icon: <User className="w-4 h-4" />,
          color: 'bg-indigo-100 text-indigo-800',
          label: 'Buyer'
        };
      case 'Seller':
        return {
          icon: <User className="w-4 h-4" />,
          color: 'bg-pink-100 text-pink-800',
          label: 'Seller'
        };
      case 'Arbiter':
        return {
          icon: <Shield className="w-4 h-4" />,
          color: 'bg-cyan-100 text-cyan-800',
          label: 'Arbiter'
        };
      default:
        return {
          icon: <User className="w-4 h-4" />,
          color: 'bg-gray-100 text-gray-800',
          label: 'Viewer'
        };
    }
  };

  const stateInfo = getStateInfo();
  const roleInfo = getRoleInfo();

  const formatAddress = (address: string) => {
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };

  const formatAmount = (amount: number) => {
    return (amount / 1e18).toFixed(4);
  };

  return (
    <div className="space-y-4">
      {/* Status and Role */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className={`flex items-center space-x-2 px-3 py-1 rounded-full ${stateInfo.color}`}>
            {stateInfo.icon}
            <span className="text-sm font-medium">{stateInfo.label}</span>
          </div>
          <div className={`flex items-center space-x-2 px-3 py-1 rounded-full ${roleInfo.color}`}>
            {roleInfo.icon}
            <span className="text-sm font-medium">{roleInfo.label}</span>
          </div>
        </div>
        
        {isExpired && (
          <div className="flex items-center space-x-2 px-3 py-1 rounded-full bg-red-100 text-red-800">
            <Clock className="w-4 h-4" />
            <span className="text-sm font-medium">Expired</span>
          </div>
        )}
      </div>

      {/* Description */}
      <p className="text-sm text-gray-600">{stateInfo.description}</p>

      {/* Key Information */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="text-sm font-medium text-gray-900 mb-2">Contract Details</h4>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Address:</span>
              <span className="font-mono text-gray-900">{formatAddress(escrowState.contractAddress!)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Balance:</span>
              <span className="font-mono text-gray-900">{balance} ETH</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Trade Type:</span>
              <span className="text-gray-900 capitalize">{escrowState.tradeType.replace('_', ' ')}</span>
            </div>
          </div>
        </div>

        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="text-sm font-medium text-gray-900 mb-2">Parties</h4>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Buyer:</span>
              <span className="font-mono text-gray-900">{formatAddress(escrowState.buyer)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Seller:</span>
              <span className="font-mono text-gray-900">{formatAddress(escrowState.seller)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Arbiter:</span>
              <span className="font-mono text-gray-900">{formatAddress(escrowState.arbiter)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Asset Information */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h4 className="text-sm font-medium text-gray-900 mb-2">Asset Information</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <div className="text-sm text-gray-600 mb-1">Escrowed Asset</div>
            <div className="font-mono text-gray-900">
              {formatAmount(escrowState.assetAmount)} ETH
            </div>
          </div>
          <div>
            <div className="text-sm text-gray-600 mb-1">Deadline</div>
            <div className="text-gray-900">
              {new Date(escrowState.deadline * 1000).toLocaleString()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StatusPanel;

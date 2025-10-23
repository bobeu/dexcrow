import React from 'react';
import { EscrowContractState, UserRole, EscrowState } from '@/lib/types';
import { 
  Clock, 
  Shield, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  User,
  Coins,
  FileText
} from 'lucide-react';
import { Card, Badge } from '@/components/ui';

interface StatusPanelProps {
  escrowState: EscrowContractState;
  userRole: UserRole;
  isExpired: boolean;
}

const StatusPanel: React.FC<StatusPanelProps> = ({ 
  escrowState, 
  userRole, 
  isExpired 
}) => {
  const getStateIcon = () => {
    switch (escrowState.currentState) {
      case EscrowState.AWAITING_DEPOSIT:
        return <Clock className="w-5 h-5 text-[#ffff00]" />;
      case EscrowState.AWAITING_FULFILLMENT:
        return <Shield className="w-5 h-5 text-[#00ff00]" />;
      case EscrowState.DISPUTE_RAISED:
        return <AlertTriangle className="w-5 h-5 text-red-500" />;
      case EscrowState.COMPLETED:
        return <CheckCircle className="w-5 h-5 text-[#00ff00]" />;
      case EscrowState.CANCELED:
        return <XCircle className="w-5 h-5 text-[#666]" />;
      default:
        return <Clock className="w-5 h-5 text-[#666]" />;
    }
  };

  const getStateVariant = () => {
    switch (escrowState.currentState) {
      case EscrowState.AWAITING_DEPOSIT:
        return 'warning';
      case EscrowState.AWAITING_FULFILLMENT:
        return 'success';
      case EscrowState.DISPUTE_RAISED:
        return 'danger';
      case EscrowState.COMPLETED:
        return 'success';
      case EscrowState.CANCELED:
        return 'default';
      default:
        return 'default';
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

  const getRoleVariant = () => {
    switch (userRole) {
      case 'Buyer':
        return 'info';
      case 'Seller':
        return 'success';
      case 'Arbiter':
        return 'warning';
      default:
        return 'default';
    }
  };

  const formatAmount = (amount: number) => {
    return (amount / 1e18).toFixed(4);
  };

  const formatAddress = (address: string) => {
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
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

  const InfoCard = ({ 
    title, 
    children, 
    icon: Icon, 
    borderColor = 'default' 
  }: {
    title: string;
    children: React.ReactNode;
    icon: React.ComponentType<{ className?: string }>;
    borderColor?: 'default' | 'yellow' | 'green' | 'red';
  }) => (
    <Card border={borderColor}>
      <div className="flex items-center space-x-3 mb-3">
        <Icon className={`w-5 h-5 ${
          borderColor === 'green' ? 'text-[#00ff00]' : 
          borderColor === 'red' ? 'text-red-500' : 
          'text-[#ffff00]'
        }`} />
        <h4 className="font-medium text-white font-mono">{title}</h4>
      </div>
      {children}
    </Card>
  );

  return (
    <div className="space-y-6">
      {/* Status Overview */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white font-mono tracking-wide">
            Escrow Status
          </h3>
          <Badge variant={getStateVariant()} icon={getStateIcon}>
            {getStateName()}
          </Badge>
        </div>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <User className="w-4 h-4 text-[#ffff00]" />
            <span className="text-sm text-[#ffff00] font-mono">Your Role:</span>
            <Badge variant={getRoleVariant()}>
              {userRole}
            </Badge>
          </div>
          {isExpired && (
            <Badge variant="danger">
              EXPIRED
            </Badge>
          )}
        </div>
      </Card>

      {/* Contract Details */}
      <InfoCard title="Contract Details" icon={FileText}>
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-sm text-[#ffff00] font-mono">Contract Address:</span>
            <span className="text-sm text-white font-mono">
              {formatAddress(escrowState.contractAddress!)}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-[#ffff00] font-mono">Trade Type:</span>
            <span className="text-sm text-white font-mono">
              {escrowState.tradeType.replace('_', ' ').toUpperCase()}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-[#ffff00] font-mono">Deadline:</span>
            <span className="text-sm text-white font-mono">
              {new Date(escrowState.deadline * 1000).toLocaleString()}
            </span>
          </div>
        </div>
      </InfoCard>

      {/* Parties */}
      <InfoCard title="Parties" icon={User} borderColor="yellow">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-[#ffff00] font-mono">Buyer:</span>
            <span className="text-sm text-white font-mono">
              {formatAddress(escrowState.buyer)}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-[#ffff00] font-mono">Seller:</span>
            <span className="text-sm text-white font-mono">
              {formatAddress(escrowState.seller)}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-[#ffff00] font-mono">Arbiter:</span>
            <span className="text-sm text-white font-mono">
              {formatAddress(escrowState.arbiter)}
            </span>
          </div>
        </div>
      </InfoCard>

      {/* Asset Information */}
      <InfoCard title="Asset Information" icon={Coins} borderColor="green">
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-sm text-[#ffff00] font-mono">Asset Amount:</span>
            <span className="text-sm text-white font-mono">
              {formatAmount(escrowState.assetAmount)} ETH
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-[#ffff00] font-mono">Counter Asset:</span>
            <span className="text-sm text-white font-mono">
              {escrowState.counterAssetAmount} USDC
            </span>
          </div>
        </div>
      </InfoCard>

      {/* Time Information */}
      <InfoCard 
        title="Time Information" 
        icon={Clock} 
        borderColor={isExpired ? 'red' : 'yellow'}
      >
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-sm text-[#ffff00] font-mono">Time Remaining:</span>
            <span className={`text-sm font-mono ${
              isExpired ? 'text-red-500' : 'text-white'
            }`}>
              {isExpired ? 'EXPIRED' : getTimeRemaining()}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-[#ffff00] font-mono">Dispute Window:</span>
            <span className="text-sm text-white font-mono">
              {escrowState.disputeWindowHours} hours
            </span>
          </div>
        </div>
      </InfoCard>

      {/* Description */}
      {escrowState.description && (
        <InfoCard title="Description" icon={FileText}>
          <p className="text-sm text-[#ffff00] font-mono">
            {escrowState.description}
          </p>
        </InfoCard>
      )}
    </div>
  );
};

export default StatusPanel;
import React from 'react';
import { EscrowContractState, UserRole, EscrowState } from '@/lib/types';
import { Copy, Check, Clock, Shield, User, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import { Card, Badge } from '@/components/ui';

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

  const InfoRow = ({ label, value, copyable = false, valueToCopy = '' }: {
    label: string;
    value: string;
    copyable?: boolean;
    valueToCopy?: string;
  }) => (
    <div className="flex items-center justify-between p-3 bg-[#333] rounded-lg border border-[#333] hover:border-[#ffff00] transition-colors">
      <span className="text-sm text-[#ffff00] font-mono">{label}</span>
      <div className="flex items-center space-x-2">
        <span className="font-mono text-sm text-white">{value}</span>
        {copyable && (
          <button
            onClick={() => handleCopy(valueToCopy || value, label)}
            className="p-1 hover:bg-[#ffff00] hover:text-[#1a1a1a] rounded transition-colors"
          >
            {copiedField === label ? (
              <Check className="w-4 h-4 text-[#00ff00]" />
            ) : (
              <Copy className="w-4 h-4 text-[#ffff00]" />
            )}
          </button>
        )}
      </div>
    </div>
  );

  const PartyRow = ({ label, address, icon: Icon, fieldName }: {
    label: string;
    address: string;
    icon: React.ComponentType<{ className?: string }>;
    fieldName: string;
  }) => (
    <div className="flex items-center justify-between p-3 bg-[#333] rounded-lg border border-[#333] hover:border-[#ffff00] transition-colors">
      <div className="flex items-center space-x-2">
        <Icon className="w-4 h-4 text-[#ffff00]" />
        <span className="text-sm text-[#ffff00] font-mono">{label}</span>
      </div>
      <div className="flex items-center space-x-2">
        <span className="font-mono text-sm text-white">{formatAddress(address)}</span>
        <button
          onClick={() => handleCopy(address, fieldName)}
          className="p-1 hover:bg-[#ffff00] hover:text-[#1a1a1a] rounded transition-colors"
        >
          {copiedField === fieldName ? (
            <Check className="w-4 h-4 text-[#00ff00]" />
          ) : (
            <Copy className="w-4 h-4 text-[#ffff00]" />
          )}
        </button>
      </div>
    </div>
  );

  return (
    <Card>
      <h3 className="text-lg font-semibold text-white mb-4 font-mono tracking-wide">
        Contract Parameters
      </h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Contract Information */}
        <div className="space-y-4">
          <h4 className="text-sm font-medium text-white font-mono">Contract Information</h4>
          
          <div className="space-y-3">
            <InfoRow
              label="Contract Address"
              value={formatAddress(escrowState.contractAddress!)}
              copyable
              valueToCopy={escrowState.contractAddress!}
            />

            <div className="flex items-center justify-between p-3 bg-[#333] rounded-lg border border-[#333] hover:border-[#ffff00] transition-colors">
              <span className="text-sm text-[#ffff00] font-mono">State</span>
              <Badge variant={getStateVariant()} icon={getStateIcon}>
                {getStateName()}
              </Badge>
            </div>

            <InfoRow
              label="Trade Type"
              value={escrowState.tradeType.replace('_', ' ').toUpperCase()}
            />

            <InfoRow
              label="Asset Amount"
              value={`${formatAmount(escrowState.assetAmount)} ETH`}
            />
          </div>
        </div>

        {/* Parties */}
        <div className="space-y-4">
          <h4 className="text-sm font-medium text-white font-mono">Parties</h4>
          
          <div className="space-y-3">
            <PartyRow
              label="Buyer"
              address={escrowState.buyer}
              icon={User}
              fieldName="buyer"
            />
            <PartyRow
              label="Seller"
              address={escrowState.seller}
              icon={User}
              fieldName="seller"
            />
            <PartyRow
              label="Arbiter"
              address={escrowState.arbiter}
              icon={Shield}
              fieldName="arbiter"
            />
          </div>
        </div>
      </div>

      {/* Deadline */}
      <div className="mt-6 p-4 bg-[#333] rounded-lg border border-[#ffff00]">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Clock className="w-5 h-5 text-[#ffff00]" />
            <span className="text-sm font-medium text-[#ffff00] font-mono">Refund Deadline</span>
          </div>
          <div className="text-right">
            <div className="text-sm text-white font-mono">
              {new Date(escrowState.deadline * 1000).toLocaleString()}
            </div>
            <div className={`text-xs font-medium font-mono ${
              isExpired ? 'text-red-500' : 'text-[#ffff00]'
            }`}>
              {isExpired ? 'EXPIRED' : `Time remaining: ${getTimeRemaining()}`}
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default ContractParameters;
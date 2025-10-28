import React from 'react';
import {  EscrowState, Address, EscrowDetails } from '@/lib/types';
import { Copy, Check, Clock, Shield, User } from 'lucide-react';
import { Card, Badge } from '@/components/ui';
import { formatAmount, formatDate, getTimeRemaining, isExpired, toLower, truncateAddress } from '@/utilities';
import { zeroAddress } from 'viem';

interface ContractParametersProps {
  escrowDetails: EscrowDetails; 
  contractAddress: Address;
}

const ContractParameters: React.FC<ContractParametersProps> = ({ 
  escrowDetails, 
  contractAddress
}) => {
  const [copiedField, setCopiedField] = React.useState<string | null>(null);

  const isEscrowExpired = isExpired(escrowDetails.deadline);
  const handleCopy = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const getStateVariant = () => {
    switch (escrowDetails.state) {
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
    switch (escrowDetails.state) {
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
        <span className="font-mono text-sm text-white">{truncateAddress(address)}</span>
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
              value={truncateAddress(contractAddress!)}
              copyable
              valueToCopy={contractAddress!}
            />

            <div className="flex items-center justify-between p-3 bg-[#333] rounded-lg border border-[#333] hover:border-[#ffff00] transition-colors">
              <span className="text-sm text-[#ffff00] font-mono">State</span>
              <Badge variant={getStateVariant()}>
                {getStateName()}
              </Badge>
            </div>

            <InfoRow
              label="Trade Type"
              value={toLower(escrowDetails.assetToken) === zeroAddress? 'ERC20' : 'NATIVE '}
            />

            <InfoRow
              label="Asset Amount"
              value={`${formatAmount(escrowDetails.assetAmount)} ETH`}
            />
          </div>
        </div>

        {/* Parties */}
        <div className="space-y-4">
          <h4 className="text-sm font-medium text-white font-mono">Parties</h4>
          
          <div className="space-y-3">
            <PartyRow
              label="Buyer"
              address={escrowDetails.buyer}
              icon={User}
              fieldName="buyer"
            />
            <PartyRow
              label="Seller"
              address={escrowDetails.seller}
              icon={User}
              fieldName="seller"
            />
            <PartyRow
              label="Arbiter"
              address={escrowDetails.arbiter}
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
              {formatDate(escrowDetails.deadline)}
            </div>
            <div className={`text-xs font-medium font-mono ${
              isEscrowExpired? 'text-red-500' : 'text-[#ffff00]'
            }`}>
              {isEscrowExpired? 'EXPIRED' : `Time remaining: ${getTimeRemaining(escrowDetails.deadline)}`}
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default ContractParameters;
import React from 'react';
import { UserRole, EscrowState, Address, Variant, StateName, EscrowDetails } from '@/lib/types';
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
import { formatAmount, formatDate, getTimeRemaining, isExpired, toLower, toNum } from '@/utilities';
import { Hex, hexToString, zeroAddress } from 'viem';

interface StatusPanelProps {
  escrowDetails: EscrowDetails;
  userRole: UserRole;
  contractAddress: Address;
}

const StatusPanel: React.FC<StatusPanelProps> = ({ 
  escrowDetails, 
  userRole, 
  contractAddress
}) => {
  const { buyer, arbiter, seller, assetType, deadline, isEscrowExpired, stateIcon, escrowAmount, description, timeRemaining, stateName, roleVariant } = React.useMemo(() => {
    const buyer = toLower(escrowDetails.buyer);
    const seller = toLower(escrowDetails.seller);
    const arbiter = toLower(escrowDetails.arbiter);
    const assetType = toLower(escrowDetails.assetToken) === zeroAddress? 'NATIVE' : 'ERC20';
    const deadline = formatDate(escrowDetails.deadline);
    const escrowAmount = formatAmount(escrowDetails.assetAmount);
    const timeRemaining = getTimeRemaining(escrowDetails.deadline);
    const description = hexToString(escrowDetails.description as Hex);
    const state = escrowDetails.state;
    const isEscrowExpired = isExpired(escrowDetails.deadline);
    let stateIcon = <Clock className="w-5 h-5 text-[#666]" />;
    // let stateVariant = 'default';
    let roleVariant : Variant = 'default';
    let stateName : StateName = 'Unknown';

    switch (state) {
      case EscrowState.AWAITING_DEPOSIT:
        stateName = 'Awaiting Deposit';
      case EscrowState.AWAITING_FULFILLMENT:
        stateName = 'Awaiting Fulfillment';
      case EscrowState.DISPUTE_RAISED:
        stateName = 'Dispute Raised';
      case EscrowState.COMPLETED:
        stateName = 'Completed';
      case EscrowState.CANCELED:
        stateName = 'Canceled';
      default:
        stateName = 'Unknown';
    }

    switch (state) {
      case EscrowState.AWAITING_DEPOSIT:
        stateIcon = <Clock className="w-5 h-5 text-[#ffff00]" />;
      case EscrowState.AWAITING_FULFILLMENT:
        stateIcon = <Shield className="w-5 h-5 text-[#00ff00]" />;
      case EscrowState.DISPUTE_RAISED:
        stateIcon = <AlertTriangle className="w-5 h-5 text-red-500" />;
      case EscrowState.COMPLETED:
        stateIcon = <CheckCircle className="w-5 h-5 text-[#00ff00]" />;
      case EscrowState.CANCELED:
        stateIcon = <XCircle className="w-5 h-5 text-[#666]" />;
      default:
        stateIcon = <Clock className="w-5 h-5 text-[#666]" />;
    }

    switch (userRole) {
      case 'Buyer':
        roleVariant = 'info';
      case 'Seller':
        roleVariant = 'success';
      case 'Arbiter':
        roleVariant = 'warning';
      default:
        roleVariant = 'default';
    }

    return {
      state,
      buyer, 
      seller,
      arbiter,
      assetType,
      deadline,
      stateIcon,
      roleVariant,
      stateName,
      description,
      timeRemaining,
      escrowAmount,
      isEscrowExpired
    }
  }, [escrowDetails]);

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
          <Badge variant={roleVariant} icon={stateIcon}>
            {stateName}
          </Badge>
        </div>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <User className="w-4 h-4 text-[#ffff00]" />
            <span className="text-sm text-[#ffff00] font-mono">Your Role:</span>
            <Badge variant={roleVariant}>
              {userRole}
            </Badge>
          </div>
          {isEscrowExpired && (
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
              {contractAddress}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-[#ffff00] font-mono">Trade Type:</span>
            <span className="text-sm text-white font-mono">
              { assetType }
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-[#ffff00] font-mono">Deadline:</span>
            <span className="text-sm text-white font-mono">
              {deadline}
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
              {buyer}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-[#ffff00] font-mono">Seller:</span>
            <span className="text-sm text-white font-mono">
              {seller}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-[#ffff00] font-mono">Arbiter:</span>
            <span className="text-sm text-white font-mono">
              {arbiter}
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
              {escrowAmount} ETH
            </span>
          </div>
          {/* <div className="flex justify-between">
            <span className="text-sm text-[#ffff00] font-mono">Counter Asset:</span>
            <span className="text-sm text-white font-mono">
              {escrowState.counterAssetAmount} USDC
            </span>
          </div> */}
        </div>
      </InfoCard>

      {/* Time Information */}
      <InfoCard 
        title="Time Information" 
        icon={Clock} 
        borderColor={isEscrowExpired ? 'red' : 'yellow'}
      >
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-sm text-[#ffff00] font-mono">Time Remaining:</span>
            <span className={`text-sm font-mono ${
              isEscrowExpired ? 'text-red-500' : 'text-white'
            }`}>
              {isEscrowExpired ? 'EXPIRED' : timeRemaining}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-[#ffff00] font-mono">Dispute Window:</span>
            <span className="text-sm text-white font-mono">
              {toNum(escrowDetails.disputeWindowHours)} hours
            </span>
          </div>
        </div>
      </InfoCard>

      {/* Description */}
      {description && description !== '' && (
        <InfoCard title="Description" icon={FileText}>
          <p className="text-sm text-[#ffff00] font-mono">
            {description}
          </p>
        </InfoCard>
      )}
    </div>
  );
};

export default StatusPanel;
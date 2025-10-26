import React from 'react';
import { EscrowContractState, UserRole } from '@/lib/types';
import { 
  AlertTriangle, 
  Gavel, 
  User, 
  Clock, 
  CheckCircle, 
  XCircle,
  FileText
} from 'lucide-react';
import { Card, Badge } from '@/components/ui';

interface DisputePanelProps {
  escrowState: EscrowContractState;
  userRole: UserRole;
}

const DisputePanel: React.FC<DisputePanelProps> = ({ escrowState, userRole }) => {
  const formatAddress = (address: string) => {
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleString();
  };

  const getDisputeStatusVariant = () => {
    if (escrowState.disputeResolution) {
      return escrowState.disputeResolution.releaseFunds ? 'success' : 'danger';
    }
    return 'warning';
  };

  const getDisputeStatusText = () => {
    if (escrowState.disputeResolution) {
      return escrowState.disputeResolution.releaseFunds ? 'Resolved - Funds Released' : 'Resolved - Funds Refunded';
    }
    return 'Pending Resolution';
  };

  const InfoCard = ({ 
    title, 
    children, 
    icon: Icon, 
    borderColor = 'red' 
  }: {
    title: string;
    children: React.ReactNode;
    icon: React.ComponentType<{ className?: string }>;
    borderColor?: 'red' | 'yellow' | 'green';
  }) => (
    <Card border={borderColor}>
      <div className="flex items-center space-x-3 mb-3">
        <Icon className={`w-5 h-5 ${
          borderColor === 'green' ? 'text-[#00ff00]' : 
          borderColor === 'yellow' ? 'text-[#ffff00]' : 
          'text-red-500'
        }`} />
        <h4 className="font-medium text-white font-mono">{title}</h4>
      </div>
      {children}
    </Card>
  );

  return (
    <div className="space-y-6">
      {/* Dispute Header */}
      <Card border="red">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <AlertTriangle className="w-6 h-6 text-red-500" />
            <h3 className="text-lg font-semibold text-white font-mono tracking-wide">
              Dispute Information
            </h3>
          </div>
          <Badge variant={getDisputeStatusVariant()}>
            {getDisputeStatusText()}
          </Badge>
        </div>
        
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-sm text-[#ffff00] font-mono">Dispute ID:</span>
            <span className="text-sm text-white font-mono">
              #{escrowState.disputeId || 'N/A'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-[#ffff00] font-mono">Raised By:</span>
            <span className="text-sm text-white font-mono">
              {escrowState.disputer ? formatAddress(escrowState.disputer) : 'N/A'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-[#ffff00] font-mono">Reason:</span>
            <span className="text-sm text-white font-mono">
              {escrowState.disputeReason || 'N/A'}
            </span>
          </div>
        </div>
      </Card>

      {/* Arbiter Assignment */}
      <InfoCard title="Arbiter Assignment" icon={Gavel} borderColor="yellow">
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-sm text-[#ffff00] font-mono">Assigned Arbiter:</span>
            <span className="text-sm text-white font-mono">
              {formatAddress(escrowState.arbiter)}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-[#ffff00] font-mono">Assignment Time:</span>
            <span className="text-sm text-white font-mono">
              {escrowState.disputeTimestamp ? formatDate(escrowState.disputeTimestamp) : 'N/A'}
            </span>
          </div>
        </div>
      </InfoCard>

      {/* Resolution (if resolved) */}
      {escrowState.disputeResolution && (
        <InfoCard title="Resolution Decision" icon={FileText} borderColor="green">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-[#ffff00] font-mono">Decision:</span>
              <div className="flex items-center space-x-2">
                {escrowState.disputeResolution.releaseFunds ? (
                  <CheckCircle className="w-4 h-4 text-[#00ff00]" />
                ) : (
                  <XCircle className="w-4 h-4 text-red-500" />
                )}
                <span className={`text-sm font-mono ${
                  escrowState.disputeResolution.releaseFunds ? 'text-[#00ff00]' : 'text-red-500'
                }`}>
                  {escrowState.disputeResolution.releaseFunds ? 'Release Funds' : 'Refund Funds'}
                </span>
              </div>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-[#ffff00] font-mono">Resolution Time:</span>
              <span className="text-sm text-white font-mono">
                {formatDate(escrowState.disputeResolution.timestamp)}
              </span>
            </div>
            {escrowState.disputeResolution.reasoning && (
              <div>
                <span className="text-sm text-[#ffff00] font-mono block mb-1">Reasoning:</span>
                <p className="text-sm text-white font-mono bg-[#333] p-2 rounded">
                  {escrowState.disputeResolution.reasoning}
                </p>
              </div>
            )}
          </div>
        </InfoCard>
      )}

      {/* Disputer Information */}
      <InfoCard title="Disputer Information" icon={User} borderColor="red">
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-sm text-[#ffff00] font-mono">Address:</span>
            <span className="text-sm text-white font-mono">
              {escrowState.disputer ? formatAddress(escrowState.disputer) : 'N/A'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-[#ffff00] font-mono">Role:</span>
            <span className="text-sm text-white font-mono">
              {escrowState.disputer === escrowState.buyer ? 'Buyer' : 
               escrowState.disputer === escrowState.seller ? 'Seller' : 'Unknown'}
            </span>
          </div>
        </div>
      </InfoCard>

      {/* Other Parties */}
      <InfoCard title="Other Parties" icon={User} borderColor="yellow">
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-sm text-[#ffff00] font-mono">Buyer:</span>
            <span className="text-sm text-white font-mono">
              {formatAddress(escrowState.buyer)}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-[#ffff00] font-mono">Seller:</span>
            <span className="text-sm text-white font-mono">
              {formatAddress(escrowState.seller)}
            </span>
          </div>
        </div>
      </InfoCard>

      {/* Timeline */}
      <InfoCard title="Dispute Timeline" icon={Clock} borderColor="yellow">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-[#ffff00] font-mono">Dispute Raised:</span>
            <span className="text-sm text-white font-mono">
              {escrowState.disputeTimestamp ? formatDate(escrowState.disputeTimestamp) : 'N/A'}
            </span>
          </div>
          {escrowState.disputeResolution && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-[#ffff00] font-mono">Resolution:</span>
              <span className="text-sm text-white font-mono">
                {formatDate(escrowState.disputeResolution.timestamp)}
              </span>
            </div>
          )}
          <div className="flex items-center justify-between">
            <span className="text-sm text-[#ffff00] font-mono">Status:</span>
            <Badge variant={getDisputeStatusVariant()}>
              {getDisputeStatusText()}
            </Badge>
          </div>
        </div>
      </InfoCard>
    </div>
  );
};

export default DisputePanel;
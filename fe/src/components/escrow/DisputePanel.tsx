import React from 'react';
import { Address, DisputeInfo, EscrowDetails, Variant } from '@/lib/types';
import { 
  AlertTriangle, 
  Gavel, 
  User, 
  Clock, 
} from 'lucide-react';
import { Card, Badge } from '@/components/ui';
import { formatDate, toLower, toNum, truncateAddress } from '@/utilities';

interface DisputePanelProps {
  data: DisputeInfo;
  contractAddress: Address;
  escrowDetail: EscrowDetails;
}

const DisputePanel: React.FC<DisputePanelProps> = ({ data, contractAddress, escrowDetail }) => {
  const {  statusText, variant } = React.useMemo(() : {variant: Variant, statusText: string} => {
    // Check if there's dispute info available
    const defaultValue : {variant: Variant, statusText: string} = {variant: 'danger', statusText: 'Dispute Raised - Awaiting Resolution'}; 
    if (data.isActive) {
      return defaultValue;
    }
    return { variant: "warning", statusText: 'Pending Resolution'};
  }, [data]);

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
          <Badge variant={variant}>
            { statusText }
          </Badge>
        </div>
        
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-sm text-[#ffff00] font-mono">Dispute ID:</span>
            <span className="text-sm text-white font-mono">
              #{contractAddress?.slice(-8) || 'N/A'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-[#ffff00] font-mono">Raised By:</span>
            <span className="text-sm text-white font-mono">
              {truncateAddress(escrowDetail.seller)}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-[#ffff00] font-mono">Reason:</span>
            <span className="text-sm text-white font-mono">
              {'Dispute raised - awaiting resolution'}
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
              {truncateAddress(escrowDetail.arbiter)}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-[#ffff00] font-mono">Assignment Time:</span>
            <span className="text-sm text-white font-mono">
              {formatDate(toNum(escrowDetail.deadline))}
            </span>
          </div>
        </div>
      </InfoCard>

      {/* Disputer Information */}
      <InfoCard title="Disputer Information" icon={User} borderColor="red">
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-sm text-[#ffff00] font-mono">Address:</span>
            <span className="text-sm text-white font-mono">
              {truncateAddress(data.disputer)}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-[#ffff00] font-mono">Role:</span>
            <span className="text-sm text-white font-mono">
              {toLower(data.disputer) === toLower(escrowDetail.buyer) ? 'Buyer' : 
               toLower(data.disputer) === toLower(escrowDetail.seller) ? 'Seller' : 'Unknown'}
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
              {truncateAddress(escrowDetail.buyer)}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-[#ffff00] font-mono">Seller:</span>
            <span className="text-sm text-white font-mono">
              {truncateAddress(escrowDetail.seller)}
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
              {formatDate(data.raisedAt)}
            </span>
          </div>
          {data.resolvedAt > 0n && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-[#ffff00] font-mono">Resolution:</span>
              <span className="text-sm text-white font-mono">
                {formatDate(data.resolvedAt)}
              </span>
            </div>
          )}
          <div className="flex items-center justify-between">
            <span className="text-sm text-[#ffff00] font-mono">Status:</span>
            <Badge variant={variant}>
              {statusText}
            </Badge>
          </div>
        </div>
      </InfoCard>
    </div>
  );
};

export default DisputePanel;
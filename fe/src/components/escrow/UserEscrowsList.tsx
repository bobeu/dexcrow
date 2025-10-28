import React from 'react';
import { useAccount } from 'wagmi';
import { Card, Badge, Button } from '@/components/ui';
import { Clock, Users, DollarSign, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { Address, EscrowState, UserEscrowReadData, Variant } from '@/lib/types';
import { useDataContext } from '@/contexts/StorageContextProvider/useDataContext';
import { formatAmount, formatTime, isExpired, toLower, truncateAddress } from '@/utilities';
import { zeroAddress } from 'viem';

const UserEscrowsList: React.FC = () => {
  const { userEscrows, isLoading } = useDataContext();
  const account = toLower(useAccount().address);

  // Filter escrows where user is buyer or seller
  const userParticipatingEscrows = React.useMemo(() => {
    if (!account || account === '' || account === zeroAddress) return [];
    
    const participating: Array<{ address: Address; data: UserEscrowReadData; role: 'buyer' | 'seller' }> = [];
    
    userEscrows.forEach((escrowData) => {
      const {contractAddress, escrowDetails: { buyer, seller } } = escrowData;
      const isBuyer = toLower(buyer) === account;
      const isSeller =toLower(seller) === account;
      if (isBuyer || isSeller) {
        participating.push({
          address: contractAddress,
          data: escrowData,
          role: isBuyer ? 'buyer' : 'seller'
        });
      }
    });
    
    return participating;
  }, [userEscrows, account]);

  const getStateIcon = (state: EscrowState) => {
    switch (state) {
      case EscrowState.AWAITING_DEPOSIT:
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case EscrowState.AWAITING_FULFILLMENT:
        return <Clock className="w-4 h-4 text-blue-500" />;
      case EscrowState.DISPUTE_RAISED:
        return <AlertTriangle className="w-4 h-4 text-red-500" />;
      case EscrowState.COMPLETED:
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case EscrowState.CANCELED:
        return <XCircle className="w-4 h-4 text-gray-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStateText = (state: EscrowState) => {
    switch (state) {
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

  const getStateVariant = (state: EscrowState) : Variant => {
    switch (state) {
      case EscrowState.AWAITING_DEPOSIT:
        return 'warning';
      case EscrowState.AWAITING_FULFILLMENT:
        return 'info';
      case EscrowState.DISPUTE_RAISED:
        return 'danger';
      case EscrowState.COMPLETED:
        return 'success';
      case EscrowState.CANCELED:
        return 'danger';
      default:
        return 'default';
    }
  };

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#ffff00]"></div>
          <span className="ml-2 text-[#ffff00] font-mono">Loading your escrows...</span>
        </div>
      </Card>
    );
  }

  if (userParticipatingEscrows.length === 0) {
    return (
      <Card className="p-6">
        <div className="text-center">
          <Users className="w-12 h-12 text-[#ffff00] mx-auto mb-4" />
          <h3 className="text-lg font-bold text-white font-mono mb-2">
            No Escrows Found
          </h3>
          <p className="text-[#ffff00] font-mono text-sm">
            You don't have any active escrows as a buyer or seller.
          </p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-white font-mono">
          Your Escrows ({userParticipatingEscrows.length})
        </h2>
        <Badge variant="info" className="font-mono">
          Private View
        </Badge>
      </div>

      <div className="grid gap-4">
        {userParticipatingEscrows.map(({ address, data, role }) => (
          <Card key={address} className="p-6">
            <div className="space-y-4">
              {/* Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  {getStateIcon(data.escrowDetails.state)}
                  <span className="text-white font-mono font-bold">
                    Escrow #{address.slice(0, 8)}...
                  </span>
                  <Badge variant={getStateVariant(data.escrowDetails.state)}>
                    {getStateText(data.escrowDetails.state)}
                  </Badge>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge variant="info" className="font-mono">
                    You are {role}
                  </Badge>
                  {isExpired(data.escrowDetails.deadline) && (
                    <Badge variant="danger">Expired</Badge>
                  )}
                </div>
              </div>

              {/* Escrow Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Users className="w-4 h-4 text-[#ffff00]" />
                    <span className="text-white font-mono text-sm">
                      <strong>Buyer:</strong> {truncateAddress(data.escrowDetails.buyer)}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Users className="w-4 h-4 text-[#ffff00]" />
                    <span className="text-white font-mono text-sm">
                      <strong>Seller:</strong> {truncateAddress(data.escrowDetails.buyer)}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <DollarSign className="w-4 h-4 text-[#ffff00]" />
                    <span className="text-white font-mono text-sm">
                      <strong>Amount:</strong> {formatAmount(data.escrowDetails.assetAmount)} tokens
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Clock className="w-4 h-4 text-[#ffff00]" />
                    <span className="text-white font-mono text-sm">
                      <strong>Created:</strong> {formatTime(data.escrowDetails.createdAt)}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Clock className="w-4 h-4 text-[#ffff00]" />
                    <span className="text-white font-mono text-sm">
                      <strong>Deadline:</strong> {formatTime(data.escrowDetails.deadline)}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Clock className="w-4 h-4 text-[#ffff00]" />
                    <span className="text-white font-mono text-sm">
                      <strong>Dispute Window:</strong> {Number(data.escrowDetails.disputeWindowHours)} hours
                    </span>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div className="bg-[#333] border border-[#ffff00] rounded-lg p-3">
                <p className="text-white font-mono text-sm">
                  <strong>Description:</strong> {data.escrowDetails.description}
                </p>
              </div>

              {/* Dispute Info */}
              {data.disputeInfo.isActive && (
                <div className="bg-red-900/20 border border-red-500 rounded-lg p-3">
                  <p className="text-red-400 font-mono text-sm">
                    <strong>Dispute Reason:</strong> {data.disputeInfo.reason}
                  </p>
                  <p className="text-red-400 font-mono text-sm mt-1">
                    <strong>Raised by:</strong> {data.disputeInfo.disputer.slice(0, 6)}...{data.disputeInfo.disputer.slice(-4)}
                  </p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex space-x-3">
                {role === 'buyer' && data.escrowDetails.state === EscrowState.AWAITING_DEPOSIT && (
                  <Button
                    variant="primary"
                    className="flex-1"
                    onClick={() => {
                      // TODO: Implement deposit functionality
                      console.log('Deposit for:', address);
                    }}
                  >
                    Deposit Funds
                  </Button>
                )}
                
                {role === 'seller' && data.escrowDetails.state === EscrowState.AWAITING_FULFILLMENT && (
                  <Button
                    variant="primary"
                    className="flex-1"
                    onClick={() => {
                      // TODO: Implement fulfill functionality
                      console.log('Fulfill for:', address);
                    }}
                  >
                    Mark as Fulfilled
                  </Button>
                )}

                {data.escrowDetails.state === EscrowState.DISPUTE_RAISED && (
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => {
                      // TODO: Implement view dispute functionality
                      console.log('View dispute for:', address);
                    }}
                  >
                    View Dispute
                  </Button>
                )}

                <Button
                  variant="outline"
                  onClick={() => {
                    // TODO: Implement view details functionality
                    console.log('View details for:', address);
                  }}
                >
                  View Details
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default UserEscrowsList;

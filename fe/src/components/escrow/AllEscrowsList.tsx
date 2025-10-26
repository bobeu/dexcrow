import React, { useState } from 'react';
import { useAccount } from 'wagmi';
import { useDataContext } from '@/contexts/StorageContextProvider/useDataContext';
import { Card, Badge, Button } from '@/components/ui';
import { Clock, Users, DollarSign, CheckCircle, XCircle, AlertTriangle, Eye } from 'lucide-react';
import { EscrowState, EscrowReadData } from '@/lib/types';

const AllEscrowsList: React.FC = () => {
  const { address } = useAccount();
  const { allEscrows } = useDataContext();
  const [selectedEscrow, setSelectedEscrow] = useState<EscrowReadData | null>(null);

  const formatTime = (timestamp: bigint) => {
    const date = new Date(Number(timestamp) * 1000);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  const formatAmount = (amount: bigint, decimals: number = 18) => {
    const formatted = Number(amount) / Math.pow(10, decimals);
    return formatted.toFixed(4);
  };

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

  const getStateVariant = (state: EscrowState) => {
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
        return 'default';
      default:
        return 'default';
    }
  };

  const getUserRole = (escrow: EscrowReadData) => {
    if (!address) return 'Viewer';
    const userAddress = address.toLowerCase();
    if (escrow.escrowDetails.buyer.toLowerCase() === userAddress) return 'Buyer';
    if (escrow.escrowDetails.seller.toLowerCase() === userAddress) return 'Seller';
    if (escrow.escrowDetails.arbiter.toLowerCase() === userAddress) return 'Arbiter';
    return 'Viewer';
  };

  const canTakeAction = (escrow: EscrowReadData, action: string) => {
    const role = getUserRole(escrow);
    const state = escrow.escrowDetails.state;
    
    switch (action) {
      case 'deposit':
        return role === 'Buyer' && state === EscrowState.AWAITING_DEPOSIT;
      case 'fulfill':
        return role === 'Seller' && state === EscrowState.AWAITING_FULFILLMENT;
      case 'release':
        return role === 'Buyer' && state === EscrowState.AWAITING_FULFILLMENT;
      case 'dispute':
        return (role === 'Buyer' || role === 'Seller') && state !== EscrowState.DISPUTE_RAISED && state !== EscrowState.COMPLETED;
      case 'arbitrate':
        return role === 'Arbiter' && state === EscrowState.DISPUTE_RAISED;
      default:
        return false;
    }
  };

  const isExpired = (deadline: bigint) => {
    return Number(deadline) < Math.floor(Date.now() / 1000);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-white font-mono">
          All Escrows ({allEscrows.length})
        </h2>
        <Badge variant="info" className="font-mono">
          Public View
        </Badge>
      </div>

      <div className="grid gap-4">
        {allEscrows.map((escrow, index) => {
          const userRole = getUserRole(escrow);
          const isUserInvolved = userRole !== 'Viewer';
          
          return (
            <Card key={index} className={`p-6 ${isUserInvolved ? 'border-[#ffff00]' : ''}`}>
              <div className="space-y-4">
                {/* Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    {getStateIcon(escrow.escrowDetails.state)}
                    <span className="text-white font-mono font-bold">
                      Escrow #{index + 1}
                    </span>
                    <Badge variant={getStateVariant(escrow.escrowDetails.state)}>
                      {getStateText(escrow.escrowDetails.state)}
                    </Badge>
                  </div>
                  <div className="flex items-center space-x-2">
                    {isUserInvolved && (
                      <Badge variant="warning" className="font-mono">
                        You are {userRole}
                      </Badge>
                    )}
                    {isExpired(escrow.escrowDetails.deadline) && (
                      <Badge variant="danger">Expired</Badge>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedEscrow(selectedEscrow === escrow ? null : escrow)}
                      icon={Eye}
                    >
                      {selectedEscrow === escrow ? 'Hide' : 'View'}
                    </Button>
                  </div>
                </div>

                {/* Basic Info */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Users className="w-4 h-4 text-[#ffff00]" />
                      <span className="text-white font-mono text-sm">
                        <strong>Buyer:</strong> {escrow.escrowDetails.buyer.slice(0, 6)}...{escrow.escrowDetails.buyer.slice(-4)}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Users className="w-4 h-4 text-[#ffff00]" />
                      <span className="text-white font-mono text-sm">
                        <strong>Seller:</strong> {escrow.escrowDetails.seller.slice(0, 6)}...{escrow.escrowDetails.seller.slice(-4)}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <DollarSign className="w-4 h-4 text-[#ffff00]" />
                      <span className="text-white font-mono text-sm">
                        <strong>Amount:</strong> {formatAmount(escrow.escrowDetails.assetAmount)} tokens
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Clock className="w-4 h-4 text-[#ffff00]" />
                      <span className="text-white font-mono text-sm">
                        <strong>Deadline:</strong> {formatTime(escrow.escrowDetails.deadline)}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Clock className="w-4 h-4 text-[#ffff00]" />
                      <span className="text-white font-mono text-sm">
                        <strong>Created:</strong> {formatTime(escrow.escrowDetails.createdAt)}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Clock className="w-4 h-4 text-[#ffff00]" />
                      <span className="text-white font-mono text-sm">
                        <strong>Dispute Window:</strong> {Number(escrow.escrowDetails.disputeWindowHours)} hours
                      </span>
                    </div>
                  </div>
                </div>

                {/* Expanded Details */}
                {selectedEscrow === escrow && (
                  <div className="space-y-4">
                    {/* Description */}
                    <div className="bg-[#333] border border-[#ffff00] rounded-lg p-3">
                      <p className="text-white font-mono text-sm">
                        <strong>Description:</strong> {escrow.escrowDetails.description}
                      </p>
                    </div>

                    {/* Dispute Info */}
                    {escrow.disputeInfo.isActive && (
                      <div className="bg-red-900/20 border border-red-500 rounded-lg p-3">
                        <p className="text-red-400 font-mono text-sm">
                          <strong>Dispute Reason:</strong> {escrow.disputeInfo.reason}
                        </p>
                        <p className="text-red-400 font-mono text-sm mt-1">
                          <strong>Raised by:</strong> {escrow.disputeInfo.disputer.slice(0, 6)}...{escrow.disputeInfo.disputer.slice(-4)}
                        </p>
                      </div>
                    )}

                    {/* Action Buttons - Only show if user is involved */}
                    {isUserInvolved && (
                      <div className="flex flex-wrap gap-3">
                        {canTakeAction(escrow, 'deposit') && (
                          <Button
                            variant="primary"
                            onClick={() => {
                              console.log('Deposit for escrow:', index);
                            }}
                          >
                            Deposit Funds
                          </Button>
                        )}
                        
                        {canTakeAction(escrow, 'fulfill') && (
                          <Button
                            variant="primary"
                            onClick={() => {
                              console.log('Fulfill escrow:', index);
                            }}
                          >
                            Mark as Fulfilled
                          </Button>
                        )}

                        {canTakeAction(escrow, 'release') && (
                          <Button
                            variant="success"
                            onClick={() => {
                              console.log('Release funds for escrow:', index);
                            }}
                          >
                            Release Funds
                          </Button>
                        )}

                        {canTakeAction(escrow, 'dispute') && (
                          <Button
                            variant="secondary"
                            onClick={() => {
                              console.log('Raise dispute for escrow:', index);
                            }}
                          >
                            Raise Dispute
                          </Button>
                        )}

                        {canTakeAction(escrow, 'arbitrate') && (
                          <Button
                            variant="primary"
                            onClick={() => {
                              console.log('Arbitrate dispute for escrow:', index);
                            }}
                          >
                            Arbitrate Dispute
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </Card>
          );
        })}
      </div>

      {allEscrows.length === 0 && (
        <Card className="p-6">
          <div className="text-center">
            <Users className="w-12 h-12 text-[#ffff00] mx-auto mb-4" />
            <h3 className="text-lg font-bold text-white font-mono mb-2">
              No Escrows Found
            </h3>
            <p className="text-[#ffff00] font-mono text-sm">
              No escrows have been created yet.
            </p>
          </div>
        </Card>
      )}
    </div>
  );
};

export default AllEscrowsList;

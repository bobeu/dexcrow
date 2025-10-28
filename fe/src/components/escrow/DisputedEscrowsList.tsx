import React, { useState } from 'react';
import { useAccount } from 'wagmi';
import { useDataContext } from '@/contexts/StorageContextProvider/useDataContext';
import { Card, Badge, Button } from '@/components/ui';
import { AlertTriangle, Users, DollarSign, Clock, Eye, Gavel } from 'lucide-react';
import { EscrowState } from '@/lib/types';

const DisputedEscrowsList: React.FC = () => {
  const { address } = useAccount();
  const { allEscrows, arbitratorsData } = useDataContext();
  const [selectedEscrow, setSelectedEscrow] = useState<any>(null);

  const formatTime = (timestamp: bigint) => {
    const date = new Date(Number(timestamp) * 1000);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  const formatAmount = (amount: bigint, decimals: number = 18) => {
    const formatted = Number(amount) / Math.pow(10, decimals);
    return formatted.toFixed(4);
  };

  // Filter only disputed escrows
  const disputedEscrows = allEscrows.filter(escrow => 
    escrow.escrowDetails.state === EscrowState.DISPUTE_RAISED
  );

  // Check if user is an approved arbiter
  const isApprovedArbiter = address && arbitratorsData.arbiters.some((arbiter) => 
    arbiter.identifier.toLowerCase() === address.toLowerCase() && arbiter.isApproved
  );

  const canArbitrate = (escrow: any) => {
    if (!isApprovedArbiter) return false;
    // Check if arbiter is not already assigned to this escrow
    return escrow.escrowDetails.arbiter.toLowerCase() !== address?.toLowerCase();
  };

  const handleArbitrate = (escrow: any) => {
    console.log('Start arbitration for escrow:', escrow);
    // TODO: Implement arbitration logic
  };

  if (!address) {
    return (
      <Card className="p-6">
        <div className="text-center">
          <Gavel className="w-12 h-12 text-[#ffff00] mx-auto mb-4" />
          <h3 className="text-lg font-bold text-white font-mono mb-2">
            Connect Wallet
          </h3>
          <p className="text-[#ffff00] font-mono text-sm">
            Please connect your wallet to view disputed escrows.
          </p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-white font-mono">
          Disputed Escrows ({disputedEscrows.length})
        </h2>
        <div className="flex items-center space-x-2">
          <Badge variant="danger" className="font-mono">
            Requires Arbitration
          </Badge>
          {isApprovedArbiter && (
            <Badge variant="success" className="font-mono">
              You are an Arbiter
            </Badge>
          )}
        </div>
      </div>

      {disputedEscrows.length === 0 ? (
        <Card className="p-6">
          <div className="text-center">
            <AlertTriangle className="w-12 h-12 text-[#ffff00] mx-auto mb-4" />
            <h3 className="text-lg font-bold text-white font-mono mb-2">
              No Disputed Escrows
            </h3>
            <p className="text-[#ffff00] font-mono text-sm">
              All escrows are currently in good standing.
            </p>
          </div>
        </Card>
      ) : (
        <div className="grid gap-4">
          {disputedEscrows.map((escrow, index) => (
            <Card key={index} className="p-6 border-red-500">
              <div className="space-y-4">
                {/* Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <AlertTriangle className="w-5 h-5 text-red-500" />
                    <span className="text-white font-mono font-bold">
                      Disputed Escrow #{index + 1}
                    </span>
                    <Badge variant="danger">
                      Dispute Raised
                    </Badge>
                  </div>
                  <div className="flex items-center space-x-2">
                    {canArbitrate(escrow) && (
                      <Badge variant="success" className="font-mono">
                        Available for Arbitration
                      </Badge>
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
                        <strong>Created:</strong> {formatTime(escrow.escrowDetails.createdAt)}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Clock className="w-4 h-4 text-[#ffff00]" />
                      <span className="text-white font-mono text-sm">
                        <strong>Deadline:</strong> {formatTime(escrow.escrowDetails.deadline)}
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

                {/* Dispute Information */}
                <div className="bg-red-900/20 border border-red-500 rounded-lg p-4">
                  <h4 className="text-red-400 font-mono font-bold mb-2">
                    Dispute Details
                  </h4>
                  <div className="space-y-2">
                    <p className="text-red-400 font-mono text-sm">
                      <strong>Reason:</strong> {escrow.disputeInfo.reason}
                    </p>
                    <p className="text-red-400 font-mono text-sm">
                      <strong>Raised by:</strong> {escrow.disputeInfo.disputer.slice(0, 6)}...{escrow.disputeInfo.disputer.slice(-4)}
                    </p>
                    <p className="text-red-400 font-mono text-sm">
                      <strong>Raised at:</strong> {formatTime(escrow.disputeInfo.raisedAt)}
                    </p>
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

                    {/* Arbitration Actions */}
                    {canArbitrate(escrow) && (
                      <div className="bg-green-900/20 border border-green-500 rounded-lg p-4">
                        <h4 className="text-green-400 font-mono font-bold mb-2">
                          Arbitration Actions
                        </h4>
                        <p className="text-green-400 font-mono text-sm mb-3">
                          As an approved arbiter, you can resolve this dispute.
                        </p>
                        <div className="flex flex-wrap gap-3">
                          <Button
                            variant="primary"
                            onClick={() => handleArbitrate(escrow)}
                            icon={Gavel}
                          >
                            Start Arbitration
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => {
                              console.log('View dispute evidence for escrow:', index);
                            }}
                          >
                            View Evidence
                          </Button>
                        </div>
                      </div>
                    )}

                    {/* Current Arbiter Info */}
                    {escrow.escrowDetails.arbiter && escrow.escrowDetails.arbiter !== '0x0000000000000000000000000000000000000000' && (
                      <div className="bg-blue-900/20 border border-blue-500 rounded-lg p-3">
                        <p className="text-blue-400 font-mono text-sm">
                          <strong>Assigned Arbiter:</strong> {escrow.escrowDetails.arbiter.slice(0, 6)}...{escrow.escrowDetails.arbiter.slice(-4)}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Arbiter Status Info */}
      {!isApprovedArbiter && (
        <Card className="p-6 border-yellow-500">
          <div className="text-center">
            <Gavel className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-white font-mono mb-2">
              Become an Arbiter
            </h3>
            <p className="text-[#ffff00] font-mono text-sm mb-4">
              To arbitrate disputes, you need to be an approved arbiter.
            </p>
            <p className="text-[#ffff00] font-mono text-sm">
              Minimum holding required: {arbitratorsData.minimumAbiterHolding.toString()} ETH
            </p>
          </div>
        </Card>
      )}
    </div>
  );
};

export default DisputedEscrowsList;
import React, { useState } from 'react';
import { EscrowContractState, UserRole, EscrowState } from '../lib/types';
import { 
  ArrowDown, 
  ArrowUp, 
  Shield, 
  AlertTriangle, 
  CheckCircle, 
  XCircle,
  Clock,
  Gavel
} from 'lucide-react';

interface InteractionPanelProps {
  escrowState: EscrowContractState;
  userRole: UserRole;
  isExpired: boolean;
  onContractAction: (action: string, ...args: any[]) => void;
  isLoading: boolean;
}

const InteractionPanel: React.FC<InteractionPanelProps> = ({
  escrowState,
  userRole,
  isExpired,
  onContractAction,
  isLoading
}) => {
  const [disputeReason, setDisputeReason] = useState('');
  const [arbiterReasoning, setArbiterReasoning] = useState('');

  const isFinalState = escrowState.currentState >= EscrowState.COMPLETED;
  const isDisputeState = escrowState.currentState === EscrowState.DISPUTE_RAISED;
  const isAwaitingFulfillment = escrowState.currentState === EscrowState.AWAITING_FULFILLMENT;
  const isAwaitingDeposit = escrowState.currentState === EscrowState.AWAITING_DEPOSIT;

  const canDeposit = userRole === 'Buyer' && isAwaitingDeposit;
  const canConfirmFulfillment = userRole === 'Buyer' && isAwaitingFulfillment;
  const canRelease = (userRole === 'Buyer' || userRole === 'Arbiter') && isAwaitingFulfillment;
  const canRefund = (userRole === 'Buyer' && isExpired) || (userRole === 'Arbiter' && isAwaitingFulfillment);
  const canRaiseDispute = (userRole === 'Buyer' || userRole === 'Seller') && isAwaitingFulfillment;
  const canResolveDispute = userRole === 'Arbiter' && isDisputeState;

  const handleDeposit = () => {
    const amount = (escrowState.assetAmount / 1e18).toString();
    onContractAction('deposit', amount);
  };

  const handleConfirmFulfillment = () => {
    onContractAction('confirmFulfillment');
  };

  const handleRelease = () => {
    onContractAction('releaseFunds');
  };

  const handleRefund = () => {
    onContractAction('refundFunds');
  };

  const handleRaiseDispute = () => {
    if (!disputeReason.trim()) return;
    onContractAction('raiseDispute', disputeReason);
    setDisputeReason('');
  };

  const handleResolveDispute = (releaseFunds: boolean) => {
    if (!arbiterReasoning.trim()) return;
    onContractAction('resolveDispute', releaseFunds, arbiterReasoning);
    setArbiterReasoning('');
  };

  if (isFinalState) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="text-center">
          <div className="flex items-center justify-center mb-4">
            {escrowState.currentState === EscrowState.COMPLETED ? (
              <CheckCircle className="w-12 h-12 text-green-600" />
            ) : (
              <XCircle className="w-12 h-12 text-gray-600" />
            )}
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {escrowState.currentState === EscrowState.COMPLETED ? 'Escrow Completed' : 'Escrow Canceled'}
          </h3>
          <p className="text-gray-600">
            {escrowState.currentState === EscrowState.COMPLETED 
              ? 'The escrow has been successfully completed and funds have been released.'
              : 'The escrow has been canceled and funds have been refunded.'
            }
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Contract Actions</h3>
      
      <div className="space-y-4">
        {/* Deposit Action */}
        {canDeposit && (
          <div className="p-4 border border-indigo-200 rounded-lg bg-indigo-50">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <ArrowDown className="w-5 h-5 text-indigo-600" />
                <div>
                  <h4 className="font-medium text-indigo-900">Deposit Assets</h4>
                  <p className="text-sm text-indigo-700">
                    Deposit {((escrowState.assetAmount / 1e18).toFixed(4))} ETH into escrow
                  </p>
                </div>
              </div>
              <button
                onClick={handleDeposit}
                disabled={isLoading}
                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Processing...' : 'Deposit'}
              </button>
            </div>
          </div>
        )}

        {/* Confirm Fulfillment Action */}
        {canConfirmFulfillment && (
          <div className="p-4 border border-green-200 rounded-lg bg-green-50">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <div>
                  <h4 className="font-medium text-green-900">Confirm Fulfillment</h4>
                  <p className="text-sm text-green-700">
                    Confirm that the seller has fulfilled their obligations
                  </p>
                </div>
              </div>
              <button
                onClick={handleConfirmFulfillment}
                disabled={isLoading}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Processing...' : 'Confirm'}
              </button>
            </div>
          </div>
        )}

        {/* Release Funds Action */}
        {canRelease && (
          <div className="p-4 border border-blue-200 rounded-lg bg-blue-50">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <ArrowUp className="w-5 h-5 text-blue-600" />
                <div>
                  <h4 className="font-medium text-blue-900">Release Funds</h4>
                  <p className="text-sm text-blue-700">
                    Release escrowed funds to the seller
                  </p>
                </div>
              </div>
              <button
                onClick={handleRelease}
                disabled={isLoading}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Processing...' : 'Release'}
              </button>
            </div>
          </div>
        )}

        {/* Refund Funds Action */}
        {canRefund && (
          <div className="p-4 border border-yellow-200 rounded-lg bg-yellow-50">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <ArrowDown className="w-5 h-5 text-yellow-600" />
                <div>
                  <h4 className="font-medium text-yellow-900">Refund Funds</h4>
                  <p className="text-sm text-yellow-700">
                    {isExpired 
                      ? 'Refund escrowed funds to buyer (deadline expired)'
                      : 'Refund escrowed funds to buyer (arbiter decision)'
                    }
                  </p>
                </div>
              </div>
              <button
                onClick={handleRefund}
                disabled={isLoading}
                className="px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Processing...' : 'Refund'}
              </button>
            </div>
          </div>
        )}

        {/* Raise Dispute Action */}
        {canRaiseDispute && (
          <div className="p-4 border border-red-200 rounded-lg bg-red-50">
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <AlertTriangle className="w-5 h-5 text-red-600" />
                <div>
                  <h4 className="font-medium text-red-900">Raise Dispute</h4>
                  <p className="text-sm text-red-700">
                    Raise a dispute if there are issues with the transaction
                  </p>
                </div>
              </div>
              <div className="space-y-2">
                <textarea
                  value={disputeReason}
                  onChange={(e) => setDisputeReason(e.target.value)}
                  placeholder="Describe the issue..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-red-500 focus:border-red-500"
                  rows={3}
                />
                <button
                  onClick={handleRaiseDispute}
                  disabled={isLoading || !disputeReason.trim()}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? 'Processing...' : 'Raise Dispute'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Resolve Dispute Action */}
        {canResolveDispute && (
          <div className="p-4 border border-cyan-200 rounded-lg bg-cyan-50">
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <Gavel className="w-5 h-5 text-cyan-600" />
                <div>
                  <h4 className="font-medium text-cyan-900">Resolve Dispute</h4>
                  <p className="text-sm text-cyan-700">
                    As an arbiter, make a decision on the dispute
                  </p>
                </div>
              </div>
              <div className="space-y-2">
                <textarea
                  value={arbiterReasoning}
                  onChange={(e) => setArbiterReasoning(e.target.value)}
                  placeholder="Explain your decision..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-cyan-500 focus:border-cyan-500"
                  rows={3}
                />
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleResolveDispute(true)}
                    disabled={isLoading || !arbiterReasoning.trim()}
                    className="flex-1 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? 'Processing...' : 'Release Funds'}
                  </button>
                  <button
                    onClick={() => handleResolveDispute(false)}
                    disabled={isLoading || !arbiterReasoning.trim()}
                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? 'Processing...' : 'Refund Funds'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* No Actions Available */}
        {!canDeposit && !canConfirmFulfillment && !canRelease && !canRefund && !canRaiseDispute && !canResolveDispute && (
          <div className="text-center py-8">
            <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h4 className="text-lg font-medium text-gray-900 mb-2">No Actions Available</h4>
            <p className="text-gray-600">
              There are no actions available for your role in the current state.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default InteractionPanel;

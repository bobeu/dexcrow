/**eslint-disable */
import React, { useState } from 'react';
import { UserRole, EscrowState, EscrowReadData } from '@/lib/types';
import { 
  ArrowDown, 
  ArrowUp, 
  AlertTriangle, 
  CheckCircle, 
  XCircle,
  Clock,
  Gavel
} from 'lucide-react';
import { Card, Button, Textarea } from '@/components/ui';
import { formatAmount, isExpired } from '@/utilities';

interface InteractionPanelProps {
  escrowState: EscrowReadData;
  userRole: UserRole;
  // onContractAction: (action: string, ...args: any[]) => void;
  isLoading: boolean;
}

const InteractionPanel: React.FC<InteractionPanelProps> = ({
  escrowState,
  userRole,
  // onContractAction,
  isLoading
}) => {
  const { escrowDetails: { arbiter, state, deadline, assetAmount }, disputeInfo: { isActive } } = escrowState;
  const [disputeReason, setDisputeReason] = useState('');
  const [arbiterReasoning, setArbiterReasoning] = useState('');

  const { 
    amount,
    isFinalState,
    canDeposit,
    canConfirmFulfillment,
    canRelease,
    canRaiseDispute,
    canRefund,
    canResolveDispute,
    isEscrowExpired
  } = React.useMemo(() => {
    const isFinalState = state >= EscrowState.COMPLETED;
    const isDisputeState = state === EscrowState.DISPUTE_RAISED;
    const isAwaitingFulfillment = state === EscrowState.AWAITING_FULFILLMENT;
    const isAwaitingDeposit = state === EscrowState.AWAITING_DEPOSIT;
  
    const isEscrowExpired = isExpired(deadline);
    const canDeposit = userRole === 'Buyer' && isAwaitingDeposit;
    const canConfirmFulfillment = userRole === 'Buyer' && isAwaitingFulfillment;
    const canRelease = (userRole === 'Buyer' || userRole === 'Arbiter') && isAwaitingFulfillment;
    const canRefund = (userRole === 'Buyer' && isEscrowExpired) || (userRole === 'Arbiter' && isAwaitingFulfillment);
    const canRaiseDispute = (userRole === 'Buyer' || userRole === 'Seller') && isAwaitingFulfillment;
    const canResolveDispute = userRole === 'Arbiter' && isDisputeState;
    const amount = formatAmount(assetAmount);

    return {
      amount,
      isFinalState,
      canDeposit,
      canConfirmFulfillment,
      canRelease,
      canRaiseDispute,
      canRefund,
      canResolveDispute,
      isEscrowExpired
    }
  }, [state, deadline, userRole]);


  const handleDeposit = () => {
    // const amount = (escrowState.assetAmount / 1e18).toString();
    // onContractAction('deposit', amount);
  };

  const handleConfirmFulfillment = () => {
    // onContractAction('confirmFulfillment');
  };

  const handleRelease = () => {
    // onContractAction('releaseFunds');
  };

  const handleRefund = () => {
    // onContractAction('refundFunds');
  };

  const handleRaiseDispute = () => {
    // if (!disputeReason.trim()) return;
    // onContractAction('raiseDispute', disputeReason);
    // setDisputeReason('');
  };

  const handleResolveDispute = (releaseFunds: boolean) => {
    // if (!arbiterReasoning.trim()) return;
    // onContractAction('resolveDispute', releaseFunds, arbiterReasoning);
    // setArbiterReasoning('');
  };

  const ActionCard = ({ 
    title, 
    description, 
    icon: Icon, 
    onAction, 
    variant = 'primary',
    borderColor = 'yellow',
    disabled = false
  }: {
    title: string;
    description: string;
    icon: React.ComponentType<{ className?: string }>;
    onAction: () => void;
    variant?: 'primary' | 'success' | 'danger' | 'outline';
    borderColor?: 'yellow' | 'green' | 'red';
    disabled?: boolean;
  }) => (
    <Card border={borderColor}>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Icon className={`w-5 h-5 ${
            borderColor === 'green' ? 'text-[#00ff00]' : 
            borderColor === 'red' ? 'text-red-500' : 
            'text-[#ffff00]'
          }`} />
          <div>
            <h4 className="font-medium text-white font-mono">{title}</h4>
            <p className={`text-sm font-mono ${
              borderColor === 'green' ? 'text-[#ffff00]' : 
              borderColor === 'red' ? 'text-[#ffff00]' : 
              'text-[#ffff00]'
            }`}>
              {description}
            </p>
          </div>
        </div>
        <Button
          onClick={onAction}
          disabled={isLoading || disabled}
          loading={isLoading}
          variant={variant}
        >
          {isLoading ? 'Processing...' : title.split(' ')[0]}
        </Button>
      </div>
    </Card>
  );

  if(isFinalState) {
    return (
      <Card>
        <div className="text-center">
          <div className="flex items-center justify-center mb-4">
            {state === EscrowState.COMPLETED ? (
              <CheckCircle className="w-12 h-12 text-[#00ff00]" />
            ) : (
              <XCircle className="w-12 h-12 text-[#666]" />
            )}
          </div>
          <h3 className="text-lg font-medium text-white mb-2 font-mono tracking-wide">
            {state === EscrowState.COMPLETED ? 'Escrow Completed' : 'Escrow Canceled'}
          </h3>
          <p className="text-[#ffff00] font-mono">
            {state === EscrowState.COMPLETED 
              ? 'The escrow has been successfully completed and funds have been released.'
              : 'The escrow has been canceled and funds have been refunded.'
            }
          </p>
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <h3 className="text-lg font-semibold text-white mb-4 font-mono tracking-wide">
        Contract Actions
      </h3>
      
      <div className="space-y-4">
        {/* Deposit Action */}
        {canDeposit && (
          <ActionCard
            title="Deposit Assets"
            description={`Deposit ${amount} ETH into escrow`}
            icon={ArrowDown}
            onAction={handleDeposit}
            borderColor="yellow"
          />
        )}

        {/* Confirm Fulfillment Action */}
        {canConfirmFulfillment && (
          <ActionCard
            title="Confirm Fulfillment"
            description="Confirm that the seller has fulfilled their obligations"
            icon={CheckCircle}
            onAction={handleConfirmFulfillment}
            variant="success"
            borderColor="green"
          />
        )}

        {/* Release Funds Action */}
        {canRelease && (
          <ActionCard
            title="Release Funds"
            description="Release escrowed funds to the seller"
            icon={ArrowUp}
            onAction={handleRelease}
            variant="success"
            borderColor="green"
          />
        )}

        {/* Refund Funds Action */}
        {canRefund && (
          <ActionCard
            title="Refund Funds"
            description={isEscrowExpired 
              ? 'Refund escrowed funds to buyer (deadline expired)'
              : 'Refund escrowed funds to buyer (arbiter decision)'
            }
            icon={ArrowDown}
            onAction={handleRefund}
            borderColor="yellow"
          />
        )}

        {/* Raise Dispute Action */}
        {canRaiseDispute && (
          <Card border="red">
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <AlertTriangle className="w-5 h-5 text-red-500" />
                <div>
                  <h4 className="font-medium text-white font-mono">Raise Dispute</h4>
                  <p className="text-sm text-[#ffff00] font-mono">
                    Raise a dispute if there are issues with the transaction
                  </p>
                </div>
              </div>
              <div className="space-y-2">
                <Textarea
                  value={disputeReason}
                  onChange={setDisputeReason}
                  placeholder="Describe the issue..."
                />
                <Button
                  onClick={handleRaiseDispute}
                  disabled={isLoading || !disputeReason.trim()}
                  loading={isLoading}
                  variant="danger"
                >
                  {isLoading ? 'Processing...' : 'Raise Dispute'}
                </Button>
              </div>
            </div>
          </Card>
        )}

        {/* Resolve Dispute Action */}
        {canResolveDispute && (
          <Card border="yellow">
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <Gavel className="w-5 h-5 text-[#ffff00]" />
                <div>
                  <h4 className="font-medium text-white font-mono">Resolve Dispute</h4>
                  <p className="text-sm text-[#ffff00] font-mono">
                    As an arbiter, make a decision on the dispute
                  </p>
                </div>
              </div>
              <div className="space-y-2">
                <Textarea
                  value={arbiterReasoning}
                  onChange={setArbiterReasoning}
                  placeholder="Explain your decision..."
                />
                <div className="flex space-x-2">
                  <Button
                    onClick={() => handleResolveDispute(true)}
                    disabled={isLoading || !arbiterReasoning.trim()}
                    loading={isLoading}
                    variant="success"
                    className="flex-1"
                  >
                    {isLoading ? 'Processing...' : 'Release Funds'}
                  </Button>
                  <Button
                    onClick={() => handleResolveDispute(false)}
                    disabled={isLoading || !arbiterReasoning.trim()}
                    loading={isLoading}
                    variant="danger"
                    className="flex-1"
                  >
                    {isLoading ? 'Processing...' : 'Refund Funds'}
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* No Actions Available */}
        {!canDeposit && !canConfirmFulfillment && !canRelease && !canRefund && !canRaiseDispute && !canResolveDispute && (
          <div className="text-center py-8">
            <Clock className="w-12 h-12 text-[#666] mx-auto mb-4" />
            <h4 className="text-lg font-medium text-white mb-2 font-mono tracking-wide">
              No Actions Available
            </h4>
            <p className="text-[#ffff00] font-mono">
              There are no actions available for your role in the current state.
            </p>
          </div>
        )}
      </div>
    </Card>
  );
};

export default InteractionPanel;
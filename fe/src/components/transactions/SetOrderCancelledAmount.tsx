import React, { useState } from 'react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseUnits } from 'viem';
import { Button } from '@/components/ui';
import { useChainId } from 'wagmi';
import TransactionModal from '@/components/modals/TransactionModal';
import { filterTransactionData } from '@/utilities';
import { Address, FunctionName } from '@/lib/types';

interface SetOrderCancelledAmountProps {
  tradingAccountAddress: string;
  orderId: string;
  newCancelledAmount: string;
  tokenDecimals?: number;
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

const SetOrderCancelledAmount: React.FC<SetOrderCancelledAmountProps> = ({
  tradingAccountAddress,
  orderId,
  newCancelledAmount,
  tokenDecimals = 18,
  onSuccess,
  onError,
}) => {
  const chainId = useChainId();
  const { address, isConnected } = useAccount();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const trxnData = React.useMemo(() => {
    const { transactionData } = filterTransactionData({
      chainId,
      filter: true,
      functionNames: ['setOrderCancelledAmount']
    });
    const td = transactionData[0];
    return {
      abi: td.abi as any,
      address: tradingAccountAddress as Address,
      functionName: td.functionName,
      args: [BigInt(orderId), parseUnits(newCancelledAmount, tokenDecimals)]
    }
  }, [chainId, tradingAccountAddress, orderId, newCancelledAmount, tokenDecimals]);
  
  const { writeContract, data: hash, isPending, error: writeError } = useWriteContract();
  
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash,
  });

  const handleSetOrderCancelledAmount = async () => {
    if(!address || !isConnected) {
      setError('Wallet not connected');
      return;
    }
    if(!tradingAccountAddress) {
      setError('Trading account address is required');
      return;
    }
    if(!orderId) {
      setError('Order ID is required');
      return;
    }
    if(!newCancelledAmount || newCancelledAmount === '0') {
      setError('Cancelled amount must be greater than 0');
      return;
    }

    try {
      setError(null);
      setIsModalOpen(true);

      writeContract({...trxnData});
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      onError?.(errorMessage);
    }
  };

  // Update transaction hash when available
  React.useEffect(() => {
    if (hash) {
      setTxHash(hash);
    }
  }, [hash]);

  // Handle transaction success
  React.useEffect(() => {
    if(isConfirmed && txHash) {
      onSuccess?.();
    }
  }, [isConfirmed, txHash, onSuccess]);

  // Handle write error
  React.useEffect(() => {
    if(writeError) {
      const errorMessage = writeError.message || 'Transaction failed';
      setError(errorMessage);
      onError?.(errorMessage);
    }
  }, [writeError, onError]);

  const getModalStatus = () => {
    if (error || writeError) return 'error';
    if (isConfirmed) return 'success';
    if (isPending || isConfirming) return 'pending';
    return 'idle';
  };

  return (
    <>
      <Button
        onClick={handleSetOrderCancelledAmount}
        disabled={isPending || isConfirming || !orderId || !newCancelledAmount || newCancelledAmount === '0'}
        variant="primary"
        className="w-full"
      >
        {isPending || isConfirming ? 'Setting Cancelled Amount...' : 'Set Order Cancelled Amount'}
      </Button>

      <TransactionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Set Order Cancelled Amount"
        description={`Setting order ${orderId} cancelled amount to ${newCancelledAmount}`}
        transactionHash={txHash || undefined}
        status={getModalStatus()}
        error={error || undefined}
      />
    </>
  );
};

export default SetOrderCancelledAmount;

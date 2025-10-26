import React, { useState } from 'react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { Button } from '@/components/ui';
import { useChainId } from 'wagmi';
import TransactionModal from '@/components/modals/TransactionModal';
import { filterTransactionData } from '@/utilities';
import { Address, FunctionName } from '@/lib/types';

interface SetOrderCancelledByProps {
  tradingAccountAddress: string;
  orderId: string;
  newCancelledBy: string;
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

const SetOrderCancelledBy: React.FC<SetOrderCancelledByProps> = ({
  tradingAccountAddress,
  orderId,
  newCancelledBy,
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
      functionNames: ['setOrderCancelledBy']
    });
    const td = transactionData[0];
    return {
      abi: td.abi as any,
      address: tradingAccountAddress as Address,
      functionName: td.functionName,
      args: [BigInt(orderId), newCancelledBy as `0x${string}`]
    }
  }, [chainId, tradingAccountAddress, orderId, newCancelledBy]);
  
  const { writeContract, data: hash, isPending, error: writeError } = useWriteContract();
  
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash,
  });

  const handleSetOrderCancelledBy = async () => {
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
    if(!newCancelledBy) {
      setError('Cancelled by address is required');
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
        onClick={handleSetOrderCancelledBy}
        disabled={isPending || isConfirming || !orderId || !newCancelledBy}
        variant="primary"
        className="w-full"
      >
        {isPending || isConfirming ? 'Setting Cancelled By...' : 'Set Order Cancelled By'}
      </Button>

      <TransactionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Set Order Cancelled By"
        description={`Setting order ${orderId} cancelled by: ${newCancelledBy}`}
        transactionHash={txHash || undefined}
        status={getModalStatus()}
        error={error || undefined}
      />
    </>
  );
};

export default SetOrderCancelledBy;

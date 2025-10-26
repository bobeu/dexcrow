import React, { useState } from 'react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { Button } from '@/components/ui';
import { useChainId } from 'wagmi';
import TransactionModal from '@/components/modals/TransactionModal';
import { filterTransactionData } from '@/utilities';
import { Address, FunctionName } from '@/lib/types';

interface SetBuyerProps {
  escrowAddress: string;
  newBuyer: string;
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

const SetBuyer: React.FC<SetBuyerProps> = ({
  escrowAddress,
  newBuyer,
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
      functionNames: ['setBuyer']
    });
    const td = transactionData[0];
    return {
      abi: td.abi as any,
      address: escrowAddress as Address,
      functionName: td.functionName,
      args: [newBuyer as `0x${string}`]
    }
  }, [chainId, escrowAddress, newBuyer]);
  
  const { writeContract, data: hash, isPending, error: writeError } = useWriteContract();
  
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash,
  });

  const handleSetBuyer = async () => {
    if(!address || !isConnected) {
      setError('Wallet not connected');
      return;
    }
    if(!escrowAddress) {
      setError('Escrow address is required');
      return;
    }
    if(!newBuyer) {
      setError('Buyer address is required');
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
        onClick={handleSetBuyer}
        disabled={isPending || isConfirming || !newBuyer}
        variant="primary"
        className="w-full"
      >
        {isPending || isConfirming ? 'Setting Buyer...' : 'Set Buyer'}
      </Button>

      <TransactionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Set Buyer"
        description={`Setting buyer to: ${newBuyer}`}
        transactionHash={txHash || undefined}
        status={getModalStatus()}
        error={error || undefined}
      />
    </>
  );
};

export default SetBuyer;

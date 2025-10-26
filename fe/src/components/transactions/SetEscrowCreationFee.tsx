import React, { useState } from 'react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseEther } from 'viem';
import { Button } from '@/components/ui';
import { useChainId } from 'wagmi';
import TransactionModal from '@/components/modals/TransactionModal';
import { filterTransactionData } from '@/utilities';
import { Address, FunctionName } from '@/lib/types';

interface SetEscrowCreationFeeProps {
  newFee: string; // Fee in ETH
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

const SetEscrowCreationFee: React.FC<SetEscrowCreationFeeProps> = ({
  newFee,
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
      functionNames: ['setEscrowCreationFee']
    });
    const td = transactionData[0];
    return {
      abi: td.abi as any,
      address: td.contractAddress as Address,
      functionName: td.functionName,
      args: [parseEther(newFee)]
    }
  }, [chainId, newFee]);
  
  const { writeContract, data: hash, isPending, error: writeError } = useWriteContract();
  
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash,
  });

  const handleSetEscrowCreationFee = async () => {
    if(!address || !isConnected) {
      setError('Wallet not connected');
      return;
    }
    if(!newFee || parseFloat(newFee) < 0) {
      setError('Fee must be a valid positive number');
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
        onClick={handleSetEscrowCreationFee}
        disabled={isPending || isConfirming || !newFee || parseFloat(newFee) < 0}
        variant="primary"
        className="w-full"
      >
        {isPending || isConfirming ? 'Setting Fee...' : 'Set Escrow Creation Fee'}
      </Button>

      <TransactionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Set Escrow Creation Fee"
        description={`Setting escrow creation fee to ${newFee} ETH`}
        transactionHash={txHash || undefined}
        status={getModalStatus()}
        error={error || undefined}
      />
    </>
  );
};

export default SetEscrowCreationFee;

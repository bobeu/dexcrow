import React, { useState } from 'react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseUnits } from 'viem';
import { Button } from '@/components/ui';
import { useChainId } from 'wagmi';
import TransactionModal from '@/components/modals/TransactionModal';
import { filterTransactionData } from '@/utilities';
import { Address, FunctionName } from '@/lib/types';

interface SetMinimumArbiterHoldingProps {
  newMinimum: string; // Amount in tokens
  tokenDecimals?: number;
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

const SetMinimumArbiterHolding: React.FC<SetMinimumArbiterHoldingProps> = ({
  newMinimum,
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
      functionNames: ['setMinimumArbiterHolding']
    });
    const td = transactionData[0];
    return {
      abi: td.abi as any,
      address: td.contractAddress as Address,
      functionName: td.functionName,
      args: [parseUnits(newMinimum, tokenDecimals)]
    }
  }, [chainId, newMinimum, tokenDecimals]);
  
  const { writeContract, data: hash, isPending, error: writeError } = useWriteContract();
  
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash,
  });

  const handleSetMinimumArbiterHolding = async () => {
    if(!address || !isConnected) {
      setError('Wallet not connected');
      return;
    }
    if(!newMinimum || parseFloat(newMinimum) < 0) {
      setError('Minimum holding must be a valid positive number');
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
        onClick={handleSetMinimumArbiterHolding}
        disabled={isPending || isConfirming || !newMinimum || parseFloat(newMinimum) < 0}
        variant="primary"
        className="w-full"
      >
        {isPending || isConfirming ? 'Setting Minimum...' : 'Set Minimum Arbiter Holding'}
      </Button>

      <TransactionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Set Minimum Arbiter Holding"
        description={`Setting minimum arbiter holding to ${newMinimum} tokens`}
        transactionHash={txHash || undefined}
        status={getModalStatus()}
        error={error || undefined}
      />
    </>
  );
};

export default SetMinimumArbiterHolding;

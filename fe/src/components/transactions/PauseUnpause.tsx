import React, { useState } from 'react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { Button } from '@/components/ui';
import { useChainId } from 'wagmi';
import TransactionModal from '@/components/modals/TransactionModal';
import { filterTransactionData } from '@/utilities';
import { Address, FunctionName } from '@/lib/types';
import { useDataContext } from '@/contexts/StorageContextProvider/useDataContext';

interface PauseUnpauseProps {
  action: 'pause' | 'unpause';
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

const PauseUnpause: React.FC<PauseUnpauseProps> = ({
  action,
  onSuccess,
  onError,
}) => {
  const chainId = useChainId();
  const { address, isConnected } = useAccount();
  const { tradeFactoryData } = useDataContext();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const trxnData = React.useMemo(() => {
    const { transactionData } = filterTransactionData({
      chainId,
      filter: true,
      functionNames: [action]
    });
    const td = transactionData[0];
    return {
      abi: td.abi as any,
      address: td.contractAddress as Address,
      functionName: td.functionName,
      args: []
    }
  }, [chainId, action]);
  
  const { writeContract, data: hash, isPending, error: writeError } = useWriteContract();
  
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash,
  });

  const handleAction = async () => {
    if(!address || !isConnected) {
      setError('Wallet not connected');
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

  const isDisabled = (action === 'pause' && tradeFactoryData.isPaused) || 
                    (action === 'unpause' && !tradeFactoryData.isPaused);

  return (
    <>
      <Button
        onClick={handleAction}
        disabled={isPending || isConfirming || isDisabled}
        variant={action === 'pause' ? 'destructive' : 'primary'}
        className="w-full"
      >
        {isPending || isConfirming ? 
          `${action === 'pause' ? 'Pausing' : 'Unpausing'}...` : 
          `${action === 'pause' ? 'Pause' : 'Unpause'} Platform`
        }
      </Button>

      <TransactionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={`${action === 'pause' ? 'Pause' : 'Unpause'} Platform`}
        description={`${action === 'pause' ? 'Pausing' : 'Unpausing'} the trading platform`}
        transactionHash={txHash || undefined}
        status={getModalStatus()}
        error={error || undefined}
      />
    </>
  );
};

export default PauseUnpause;

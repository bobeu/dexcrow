import React, { useState } from 'react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseUnits } from 'viem';
import { Button } from '@/components/ui';
import { useChainId } from 'wagmi';
import TransactionModal from '@/components/modals/TransactionModal';
import { filterTransactionData } from '@/utilities';
import { Address, FunctionName } from '@/lib/types';

interface SetFactoryVariablesProps {
  minTradeAmount: string;
  maxTradeAmount: string;
  defaultDisputeWindow: number;
  supportedPaymentAssets: string[];
  isPythSupportedNetwork: boolean;
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

const SetFactoryVariables: React.FC<SetFactoryVariablesProps> = ({
  minTradeAmount,
  maxTradeAmount,
  defaultDisputeWindow,
  supportedPaymentAssets,
  isPythSupportedNetwork,
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
      functionNames: ['setFactoryVariables']
    });
    const td = transactionData[0];
    return {
      abi: td.abi as any,
      address: td.contractAddress as Address,
      functionName: td.functionName,
      args: [
        parseUnits(minTradeAmount, 18),
        parseUnits(maxTradeAmount, 18),
        defaultDisputeWindow,
        supportedPaymentAssets as `0x${string}`[],
        isPythSupportedNetwork
      ]
    }
  }, [chainId, minTradeAmount, maxTradeAmount, defaultDisputeWindow, supportedPaymentAssets, isPythSupportedNetwork]);
  
  const { writeContract, data: hash, isPending, error: writeError } = useWriteContract();
  
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash,
  });

  const handleSetFactoryVariables = async () => {
    if(!address || !isConnected) {
      setError('Wallet not connected');
      return;
    }
    if(!minTradeAmount || minTradeAmount === '0') {
      setError('Min trade amount must be greater than 0');
      return;
    }
    if(!maxTradeAmount || maxTradeAmount === '0') {
      setError('Max trade amount must be greater than 0');
      return;
    }
    if(parseFloat(minTradeAmount) >= parseFloat(maxTradeAmount)) {
      setError('Min trade amount must be less than max trade amount');
      return;
    }
    if(defaultDisputeWindow <= 0) {
      setError('Default dispute window must be greater than 0');
      return;
    }
    if(supportedPaymentAssets.length === 0) {
      setError('At least one supported payment asset is required');
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
        onClick={handleSetFactoryVariables}
        disabled={isPending || isConfirming || !minTradeAmount || !maxTradeAmount || defaultDisputeWindow <= 0}
        variant="primary"
        className="w-full"
      >
        {isPending || isConfirming ? 'Setting Variables...' : 'Set Factory Variables'}
      </Button>

      <TransactionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Set Factory Variables"
        description="Updating factory configuration variables"
        transactionHash={txHash || undefined}
        status={getModalStatus()}
        error={error || undefined}
      />
    </>
  );
};

export default SetFactoryVariables;

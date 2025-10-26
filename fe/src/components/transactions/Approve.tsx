import React, { useState } from 'react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseUnits } from 'viem';
import { Button } from '@/components/ui';
import { useChainId } from 'wagmi';
import TransactionModal from '@/components/modals/TransactionModal';
import { filterTransactionData } from '@/utilities';
import { Address, FunctionName } from '@/lib/types';

interface ApproveProps {
  tokenAddress: string;
  spenderAddress: string;
  amount: string;
  tokenDecimals?: number;
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

const Approve: React.FC<ApproveProps> = ({
  tokenAddress,
  spenderAddress,
  amount,
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
      functionNames: ['approve']
    });
    const td = transactionData[0];
    return {
      abi: td.abi as any,
      address: tokenAddress as Address,
      functionName: td.functionName,
      args: [spenderAddress as `0x${string}`, parseUnits(amount, tokenDecimals)]
    }
  }, [chainId, tokenAddress, spenderAddress, amount, tokenDecimals]);
  
  const { writeContract, data: hash, isPending, error: writeError } = useWriteContract();
  
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash,
  });

  const handleApprove = async () => {
    if(!address || !isConnected) {
      setError('Wallet not connected');
      return;
    }
    if(!tokenAddress) {
      setError('Token address is required');
      return;
    }
    if(!spenderAddress) {
      setError('Spender address is required');
      return;
    }
    if(!amount || amount === '0') {
      setError('Amount must be greater than 0');
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
        onClick={handleApprove}
        disabled={isPending || isConfirming || !amount || amount === '0'}
        variant="primary"
        className="w-full"
      >
        {isPending || isConfirming ? 'Approving...' : 'Approve'}
      </Button>

      <TransactionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Approve Token"
        description={`Approving ${amount} tokens for spender`}
        transactionHash={txHash || undefined}
        status={getModalStatus()}
        error={error || undefined}
      />
    </>
  );
};

export default Approve;

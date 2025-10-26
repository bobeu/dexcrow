import React, { useState } from 'react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseUnits } from 'viem';
import { Button } from '@/components/ui';
import { useChainId } from 'wagmi';
import TransactionModal from '@/components/modals/TransactionModal';
import { filterTransactionData } from '@/utilities';
import { Address, FunctionName } from '@/lib/types';

interface SetAssetTokenProps {
  escrowAddress: string;
  newAssetToken: string;
  newAssetAmount: string;
  tokenDecimals?: number;
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

const SetAssetToken: React.FC<SetAssetTokenProps> = ({
  escrowAddress,
  newAssetToken,
  newAssetAmount,
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
      functionNames: ['setAssetToken']
    });
    const td = transactionData[0];
    return {
      abi: td.abi as any,
      address: escrowAddress as Address,
      functionName: td.functionName,
      args: [
        newAssetToken as `0x${string}`,
        parseUnits(newAssetAmount, tokenDecimals)
      ]
    }
  }, [chainId, escrowAddress, newAssetToken, newAssetAmount, tokenDecimals]);
  
  const { writeContract, data: hash, isPending, error: writeError } = useWriteContract();
  
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash,
  });

  const handleSetAssetToken = async () => {
    if(!address || !isConnected) {
      setError('Wallet not connected');
      return;
    }
    if(!escrowAddress) {
      setError('Escrow address is required');
      return;
    }
    if(!newAssetToken) {
      setError('Asset token address is required');
      return;
    }
    if(!newAssetAmount || newAssetAmount === '0') {
      setError('Asset amount must be greater than 0');
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
        onClick={handleSetAssetToken}
        disabled={isPending || isConfirming || !newAssetToken || !newAssetAmount || newAssetAmount === '0'}
        variant="primary"
        className="w-full"
      >
        {isPending || isConfirming ? 'Setting Asset...' : 'Set Asset Token'}
      </Button>

      <TransactionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Set Asset Token"
        description={`Setting asset token to ${newAssetToken} with amount ${newAssetAmount}`}
        transactionHash={txHash || undefined}
        status={getModalStatus()}
        error={error || undefined}
      />
    </>
  );
};

export default SetAssetToken;

import React, { useState } from 'react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseUnits } from 'viem';
import { Button } from '@/components/ui';
import { useChainId } from 'wagmi';
import TransactionModal from '@/components/modals/TransactionModal';
import { filterTransactionData } from '@/utilities';
import { Address, FunctionName } from '@/lib/types';

interface DepositToEscrowProps {
  escrowAddress: string;
  amount: string;
  tokenDecimals?: number;
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

const DepositToEscrow: React.FC<DepositToEscrowProps> = ({
  escrowAddress,
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
      functionNames: ['deposit']
    });
    const td = transactionData[0];
    return {
      abi: td.abi as any,
      address: escrowAddress as Address,
      functionName: td.functionName,
      args: [parseUnits(amount, tokenDecimals)]
    }
  }, [chainId, escrowAddress, amount, tokenDecimals]);
  
  const { writeContract, data: hash, isPending, error: writeError } = useWriteContract();
  
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash,
  });

  const handleDepositToEscrow = async () => {
    if(!address || !isConnected) {
      setError('Wallet not connected');
      return;
    }
    if(!escrowAddress) {
      setError('Escrow address is required');
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
        onClick={handleDepositToEscrow}
        disabled={isPending || isConfirming || !amount || amount === '0'}
        variant="primary"
        className="w-full"
      >
        {isPending || isConfirming ? 'Depositing...' : 'Deposit to Escrow'}
      </Button>

      <TransactionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Deposit to Escrow"
        description={`Depositing ${amount} tokens to escrow`}
        transactionHash={txHash || undefined}
        status={getModalStatus()}
        error={error || undefined}
      />
    </>
  );
};

export default DepositToEscrow;

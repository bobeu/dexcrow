import React, { useState } from 'react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { Button } from '@/components/ui';
import { useChainId } from 'wagmi';
import TransactionModal from '@/components/modals/TransactionModal';
import { filterTransactionData } from '@/utilities';
import { Address, FunctionName } from '@/lib/types';
import { useDataContext } from '@/contexts/StorageContextProvider/useDataContext';

interface RequestToBeArbiterProps {
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

const RequestToBeArbiter: React.FC<RequestToBeArbiterProps> = ({
  onSuccess,
  onError,
}) => {
  const chainId = useChainId();
  const { arbitratorsData : { minimumAbiterHolding }, allowanceToArbiter, verseTokenBalance } = useDataContext();
  const { address, isConnected } = useAccount();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
    
  const runApproval = minimumAbiterHolding > 0n && allowanceToArbiter < minimumAbiterHolding && verseTokenBalance >= minimumAbiterHolding;

  const { writeContract, data: hash, isPending, error: writeError } = useWriteContract();
  
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash,
  });

  const handleRequest = async () => {
    if(!address || !isConnected) {
      setError('Wallet not connected or contract not found');
      return;
    }
    if(allowanceToArbiter < minimumAbiterHolding) {
      setError('Not enough allowance');
      return;
    }

    try {
      setError(null);
      setIsModalOpen(true);
      let functionName : FunctionName = 'requestToBeAnArbiter';
      let rawData = filterTransactionData({ chainId, filter: true, functionNames: [functionName] });
      
      // First, approve the token transfer if minimum holding is required
      if(minimumAbiterHolding > 0 && allowanceToArbiter < minimumAbiterHolding) {
        if(verseTokenBalance < minimumAbiterHolding) {
          setError("Your Verse Token Balance is insufficient");
          return;
        }
        functionName = 'approve';
        rawData = filterTransactionData({ chainId, filter: true, functionNames: [functionName] });
        writeContract({
          address: rawData.contractAddresses.VerseToken as Address,
          abi: rawData.transactionData[0].abi as any,
          functionName,
          args: [rawData.contractAddresses.Arbitrators, minimumAbiterHolding],
        });
      }

      writeContract({
        address: rawData.contractAddresses.Arbitrators as `0x${string}`,
        abi: rawData.transactionData[0].abi,
        functionName,
        args: [],
      });
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
    if (isConfirmed && txHash) {
      onSuccess?.();
    }
  }, [isConfirmed, txHash, onSuccess]);

  // Handle write error
  React.useEffect(() => {
    if (writeError) {
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

  const getModalDescription = () => {
    if(runApproval) {
      return `Requesting to become an arbiter with ${minimumAbiterHolding} tokens locked as collateral`;
    }
    return 'Requesting to become an arbiter';
  };

  return (
    <>
      <Button
        onClick={handleRequest}
        disabled={isPending || isConfirming}
        variant="primary"
        className="w-full"
      >
        {isPending || isConfirming ? 'Processing...' : 'Request to be Arbiter'}
      </Button>

      <TransactionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={runApproval? "Creating approval request" : "Request to be Arbiter"}
        description={getModalDescription()}
        transactionHash={txHash || undefined}
        status={getModalStatus()}
        error={error || undefined}
      />
    </>
  );
};

export default RequestToBeArbiter;

import React, { useState } from 'react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseUnits, zeroAddress } from 'viem';
import { Button } from '@/components/ui';
import { useChainId } from 'wagmi';
import TransactionModal from '@/components/modals/TransactionModal';
import { 
  bridgeAndCreateEscrow, 
  simulateBridgeAndCreateEscrow,
  // getUnifiedBalances,
} from '@/lib/nexus';
import { Address, BridgeAndCreateEscrowParams, FunctionName } from '@/lib/types';
import { filterTransactionData, formatAddr } from '@/utilities';
import { useDataContext } from '@/contexts/StorageContextProvider/useDataContext';
import { useNexus } from '@/contexts/NexusProvider';

interface CreateEscrowProps {
  buyerAddress: string;
  sellerAddress: string;
  assetToken: string;
  assetAmount: string;
  deadline: number;
  description: string;
  disputeWindowHours: number;
  tokenSymbol?: string;
  sourceChains?: number[];
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

const FUNCTIONANE : FunctionName = 'createEscrow';
function isZero(address: Address | string) {
  return formatAddr(address).toLowerCase() === zeroAddress;
}

const CreateEscrow: React.FC<CreateEscrowProps> = ({
  buyerAddress,
  sellerAddress,
  assetToken,
  assetAmount,
  deadline,
  description,
  disputeWindowHours,
  tokenSymbol = 'ETH',
  sourceChains,
  onSuccess,
  onError,
}) => {
  const chainId = useChainId();
  const { address, isConnected } = useAccount();
  const account = formatAddr(address);
  const { nexusManager, nexusSDK } = useNexus();
  const { escrowFactoryData: { creationFee } } = useDataContext();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);

  const trxnData = React.useMemo(() => {
    const { transactionData: td, contractAddresses: ca} = filterTransactionData({ chainId, filter: true, functionNames: [FUNCTIONANE] });
    return {
      address: td[0].contractAddress as Address,
      abi: td[0].abi as any,
      functionName: FUNCTIONANE,
      args: [
        buyerAddress, 
        account, 
        assetToken, 
        parseUnits(assetAmount, 18), 
        BigInt(deadline), 
        description, 
        BigInt(disputeWindowHours)
      ],
      value: creationFee
    }
  }, [buyerAddress, account, chainId, assetToken, assetAmount, deadline, description, disputeWindowHours]);
  const { writeContract, data: hash, isPending, error: writeError } = useWriteContract();
  
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash,
  });

  const handleCreateEscrow = async () => {
    if (!address || !isConnected || !nexusManager || !nexusSDK) {
      setError('Wallet not connected');
      return;
    }
    if (!isConfirmed) {
      setError('Execution failed');
      return;
    }
    if(isZero(buyerAddress)) {
      setError('Invalid buyer address');
      return;
    }
    if(isZero(assetToken)) {
      setError('Invalid asset address');
      return;
    }
    if(assetAmount === '0') {
      setError('Asset amount not provided');
      return;
    }

    try {
      setError(null);
      setIsModalOpen(true);

      // Check if we need to bridge tokens
      const needsBridging = sourceChains && sourceChains.length > 0;
      
      if (needsBridging) {
        // Use Avail Nexus to bridge and execute
        const bridgeParams: BridgeAndCreateEscrowParams = {
          token: tokenSymbol,
          amount: assetAmount,
          toChainId: chainId,
          sourceChains,
          buyerAddress,
          sellerAddress,
          assetToken,
          assetAmount,
          deadline,
          description,
          disputeWindowHours,
          userAddress: address,
        };

        // Simulate first
        setIsSimulating(true);
        const simulation = await simulateBridgeAndCreateEscrow(bridgeParams, nexusManager, nexusSDK);
        setMessage(`This transaction will cost ${simulation?.totalEstimatedCost?.total}`);
        setIsSimulating(false);

        // Execute bridge and create escrow
        const result = await bridgeAndCreateEscrow(bridgeParams, nexusManager, nexusSDK);
        setTxHash(result?.bridgeTransactionHash || '0x');
      } else {
        // Direct contract call for same-chain tokens
        writeContract({...trxnData});
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      onError?.(errorMessage);
      setIsSimulating(false);
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
    if (isPending || isConfirming || isSimulating) return 'pending';
    return 'idle';
  };

  const getModalDescription = () => {
    if (sourceChains && sourceChains.length > 0) {
      return `Creating escrow and bridging ${assetAmount} ${tokenSymbol} from multiple chains`;
    }
    return `Creating escrow for ${assetAmount} ${tokenSymbol}`;
  };

  return (
    <>
      <Button
        onClick={handleCreateEscrow}
        disabled={isPending || isConfirming || isSimulating}
        variant="primary"
        className="w-full"
      >
        {isSimulating ? 'Simulating...' : 
         isPending || isConfirming ? 'Processing...' : 
         'Create Escrow'}
      </Button>

      <TransactionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Create Escrow"
        description={getModalDescription()}
        transactionHash={txHash || undefined}
        status={getModalStatus()}
        error={error || undefined}
        message={message || undefined}
      />
    </>
  );
};

export default CreateEscrow;

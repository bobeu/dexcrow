import React, { useState, useEffect } from 'react';
import { EscrowContractState, UserRole, EscrowState } from '../lib/types';
import { ContractService } from '../lib/services/ContractService';
import ContractParameters from './ContractParameters';
import InteractionPanel from './InteractionPanel';
import DisputePanel from './DisputePanel';
import StatusPanel from './StatusPanel';
import LoadEscrowForm from './LoadEscrowForm';
import { ArrowLeft, RefreshCw } from 'lucide-react';

interface EscrowInteractionProps {
  escrowState: EscrowContractState | null;
  onLoadEscrow: (contractAddress: string) => void;
  onContractAction: (action: string, ...args: any[]) => void;
  isLoading: boolean;
  walletAddress: string;
  contractService: ContractService | null;
}

const EscrowInteraction: React.FC<EscrowInteractionProps> = ({
  escrowState,
  onLoadEscrow,
  onContractAction,
  isLoading,
  walletAddress,
  contractService
}) => {
  const [userRole, setUserRole] = useState<UserRole>('None');
  const [disputeInfo, setDisputeInfo] = useState<any>(null);
  const [isExpired, setIsExpired] = useState(false);
  const [balance, setBalance] = useState('0');

  // Determine user role
  useEffect(() => {
    if (!escrowState || !walletAddress) {
      setUserRole('None');
      return;
    }

    if (walletAddress.toLowerCase() === escrowState.buyer.toLowerCase()) {
      setUserRole('Buyer');
    } else if (walletAddress.toLowerCase() === escrowState.seller.toLowerCase()) {
      setUserRole('Seller');
    } else if (walletAddress.toLowerCase() === escrowState.arbiter.toLowerCase()) {
      setUserRole('Arbiter');
    } else {
      setUserRole('Viewer');
    }
  }, [escrowState, walletAddress]);

  // Load additional escrow data
  useEffect(() => {
    if (!escrowState || !contractService) return;

    const loadEscrowData = async () => {
      try {
        // Check if expired
        const expired = await contractService.isEscrowExpired(escrowState.contractAddress!);
        setIsExpired(expired);

        // Get balance
        const escrowBalance = await contractService.getEscrowBalance(escrowState.contractAddress!);
        setBalance(escrowBalance);

        // Get dispute info if in dispute state
        if (escrowState.currentState === EscrowState.DISPUTE_RAISED) {
          const dispute = await contractService.getDisputeInfo(escrowState.contractAddress!);
          setDisputeInfo(dispute);
        }
      } catch (error) {
        console.error('Failed to load escrow data:', error);
      }
    };

    loadEscrowData();
  }, [escrowState, contractService]);

  const handleRefresh = async () => {
    if (!escrowState || !contractService) return;

    try {
      const newState = await contractService.getEscrowState(escrowState.contractAddress!);
      // Update parent state
      onLoadEscrow(escrowState.contractAddress!);
    } catch (error) {
      console.error('Failed to refresh escrow state:', error);
    }
  };

  const handleBackToCreate = () => {
    onLoadEscrow(''); // Clear current escrow
  };

  if (!escrowState) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <LoadEscrowForm onLoadEscrow={onLoadEscrow} isLoading={isLoading} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <button
              onClick={handleBackToCreate}
              className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h2 className="text-xl font-semibold text-gray-900">Escrow Interaction</h2>
          </div>
          
          <div className="flex items-center space-x-3">
            <button
              onClick={handleRefresh}
              disabled={isLoading}
              className="flex items-center space-x-2 px-3 py-2 text-sm text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        <StatusPanel 
          escrowState={escrowState}
          userRole={userRole}
          isExpired={isExpired}
          balance={balance}
        />
      </div>

      {/* Contract Parameters */}
      <ContractParameters 
        escrowState={escrowState}
        userRole={userRole}
        isExpired={isExpired}
      />

      {/* Dispute Panel */}
      {escrowState.currentState === EscrowState.DISPUTE_RAISED && (
        <DisputePanel 
          disputeInfo={disputeInfo}
          userRole={userRole}
          onResolveDispute={(releaseFunds, reasoning) => 
            onContractAction('resolveDispute', releaseFunds, reasoning)
          }
          isLoading={isLoading}
        />
      )}

      {/* Interaction Panel */}
      <InteractionPanel 
        escrowState={escrowState}
        userRole={userRole}
        isExpired={isExpired}
        onContractAction={onContractAction}
        isLoading={isLoading}
      />
    </div>
  );
};

export default EscrowInteraction;

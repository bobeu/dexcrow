import React, { useState, useEffect } from 'react';
import { UserRole, EscrowState, EscrowReadData, Address } from '@/lib/types';
import ContractParameters from './ContractParameters';
import InteractionPanel from './InteractionPanel';
import DisputePanel from './DisputePanel';
import StatusPanel from './StatusPanel';
import { LoadEscrowForm } from '../forms';
import { ArrowLeft } from 'lucide-react';
import { formatAddr, toLower } from '@/utilities';
import { useAccount } from 'wagmi';
import { mockEscrowReadData } from '@/lib/types/mockdata';

interface EscrowInteractionProps {
  escrowData: EscrowReadData | null;
  onLoadEscrow: (contractAddress: string) => void;
  onContractAction: (action: string, ...args: any[]) => void;
  isLoading: boolean;
  contractAddress: Address;
}

const EscrowInteraction: React.FC<EscrowInteractionProps> = ({
  escrowData,
  onLoadEscrow,
  // onContractAction,
  contractAddress,
  isLoading,
}) => {
  const { isConnected, address } = useAccount();
  const account = formatAddr(address).toLowerCase();
  const [userRole, setUserRole] = useState<UserRole>('None');

  const appReady = React.useMemo(() => {
    return isConnected && address !== undefined && escrowData;
  }, [isConnected, address, escrowData]);

  // Determine user role
  useEffect(() => {
    let role : UserRole = 'None';
    if(escrowData && isConnected) {
      switch (account) {
        case toLower(escrowData.escrowDetails.buyer):
          role = 'Buyer';
          break;
        case toLower(escrowData.escrowDetails.seller):
          role = 'Seller';
          break;
        case toLower(escrowData.escrowDetails.arbiter):
          role = 'Arbiter';
          break;
        default:
          role = 'Viewer';
          break;
      }
    } 
    setUserRole(role);
  }, [escrowData, isConnected, account]);

  const handleBackToCreate = () => {
    onLoadEscrow(''); // Clear current escrow
  };

  if(!appReady) {
    return (
      <div className="bg-[#1a1a1a] rounded-lg shadow-sm border border-[#333] p-6 hover:border-[#ffff00] transition-colors">
        <LoadEscrowForm onLoadEscrow={onLoadEscrow} isLoading={isLoading} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-[#1a1a1a] rounded-lg shadow-sm border border-[#333] p-6 transition-colors">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <button
              onClick={handleBackToCreate}
              className="p-2 text-[#ffff00] hover:text-[#e6e600] transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h2 className="text-xl font-semibold text-white font-mono tracking-wide">Escrow Interaction</h2>
          </div>
          
          {/* <div className="flex items-center space-x-3">
            <button
              onClick={handleRefresh}
              disabled={isLoading}
              className="flex items-center space-x-2 px-3 py-2 text-sm text-[#ffff00] border border-[#ffff00] rounded-md hover:bg-[#ffff00] hover:text-[#1a1a1a] disabled:opacity-50 disabled:hover:bg-transparent disabled:hover:text-[#ffff00] transition-colors font-mono"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
          </div> */}
        </div>

        <StatusPanel 
          escrowDetails={escrowData?.escrowDetails || mockEscrowReadData.escrowDetails}
          userRole={userRole}
          contractAddress={contractAddress}
        />
      </div>

      {/* Contract Parameters */}
      <ContractParameters 
        escrowDetails={escrowData?.escrowDetails || mockEscrowReadData.escrowDetails}
        contractAddress={contractAddress}
      />

      {/* Dispute Panel */}
      {escrowData?.escrowDetails.state === EscrowState.DISPUTE_RAISED && (
        <DisputePanel 
          contractAddress={contractAddress}
          data={escrowData.disputeInfo}
          escrowDetail={escrowData.escrowDetails}
          // onResolveDispute={(releaseFunds, reasoning) => 
          //   onContractAction('resolveDispute', releaseFunds, reasoning)
          // }
          // isLoading={isLoading}
        />
      )}

      {/* Interaction Panel */}
      <InteractionPanel 
        escrowState={escrowData || mockEscrowReadData}
        userRole={userRole}
        // onContractAction={onContractAction}
        isLoading={isLoading}
      />
    </div>
  );
};

export default EscrowInteraction;

'use client';

import { useState, useEffect, useMemo } from 'react';
import { useAccount } from 'wagmi';
import { ContractService } from '../lib/services/ContractService';
// import { AgentClient } from '../lib/agents/AgentClient';
import { EscrowContractState, UserRole, AppMode, TradeType } from '../lib/types';
import { Header, ModeSelector } from '../components/layout';
import { CreateEscrowForm } from '../components/forms';
import { EscrowInteraction } from '../components/escrow';
import { MessageDisplay } from '../components/ui';
import TradingInterface from '../components/trading/TradingInterface';
import { WelcomeModal } from '../components/modals';
// WalletConnector removed - now using ConnectButton in Header

export default function Home() {
  // Wagmi hooks
  const { address, isConnected } = useAccount();
  // const chainId = useChainId();
  
  // State
  const [contractService, setContractService] = useState<ContractService | null>(null);
  // const [agentClient, setAgentClient] = useState<AgentClient | null>(null);
  const [mode, setMode] = useState<AppMode>('create');
  const [escrowState, setEscrowState] = useState<EscrowContractState | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);

  // Configuration
  // const RPC_URL = process.env.NEXT_PUBLIC_RPC_URL || 'http://localhost:8545';
  // const ESCROW_FACTORY_ADDRESS = process.env.NEXT_PUBLIC_ESCROW_FACTORY_ADDRESS || '';
  // const AGENT_ADDRESSES = {
  //   buyer: process.env.NEXT_PUBLIC_BUYER_AGENT_ADDRESS || '',
  //   seller: process.env.NEXT_PUBLIC_SELLER_AGENT_ADDRESS || '',
  //   oracle: process.env.NEXT_PUBLIC_ORACLE_AGENT_ADDRESS || '',
  //   arbiter: process.env.NEXT_PUBLIC_ARBITER_AGENT_ADDRESS || ''
  // };

  // Show welcome modal on first visit
  useEffect(() => {
    // const hasSeenWelcome = localStorage.getItem('hasSeenWelcome');
    // if (!hasSeenWelcome) {
      setShowWelcomeModal(true);
    // }
  }, []);

  // Initialize services when wallet connects
  // useEffect(() => {
  //   const initializeServices = async () => {
  //     if (!isConnected || !address) return;
      
  //     try {
  //       // Initialize contract service
  //       const contractSvc = new ContractService(RPC_URL, undefined, ESCROW_FACTORY_ADDRESS);
  //       setContractService(contractSvc);

  //       // Initialize agent client
  //       const agentCli = new AgentClient(AGENT_ADDRESSES);
  //       await agentCli.connect();
  //       setAgentClient(agentCli);

  //       // Set up message handlers
  //       agentCli.onMessage('escrow_created', handleEscrowCreated);
  //       agentCli.onMessage('escrow_updated', handleEscrowUpdated);
  //       agentCli.onMessage('transaction_confirmed', handleTransactionConfirmed);
  //       agentCli.onMessage('dispute_raised', handleDisputeRaised);
  //       agentCli.onMessage('dispute_resolved', handleDisputeResolved);

  //       setMessage('Services initialized successfully');
  //     } catch (error) {
  //       console.error('Failed to initialize services:', error);
  //       setMessage('Failed to initialize services. Please check your configuration.');
  //     }
  //   };

  //   initializeServices();

  //   // Cleanup on unmount
  //   return () => {
  //     if (agentClient) {
  //       agentClient.disconnect();
  //     }
  //   };
  // }, [isConnected, address]);

  // Event handlers
  // const handleEscrowCreated = (data: any) => {
  //   setMessage(`Escrow created: ${data.escrowId}`);
  //   if (data.contractAddress) {
  //     setEscrowState({
  //       contractAddress: data.contractAddress,
  //       currentState: 0,
  //       buyer: data.buyerAddress,
  //       seller: data.sellerAddress,
  //       arbiter: data.arbiterAddress,
  //       assetAddress: data.assetA.address || '0x0000000000000000000000000000000000000000',
  //       assetAmount: parseFloat(data.assetA.amount),
  //       deadline: data.terms.deadline,
  //       tradeType: data.tradeType,
  //       counterChainId: data.assetB.chain,
  //       counterAssetAmount: parseFloat(data.assetB.amount),
  //       counterAssetTicker: data.assetB.symbol || ''
  //     });
  //     setMode('interact');
  //   }
  // };

  // const handleEscrowUpdated = (data: any) => {
  //   setMessage(`Escrow updated: ${data.escrowId} - State: ${data.newStatus}`);
  //   if (escrowState && escrowState.contractAddress === data.contractAddress) {
  //     setEscrowState(prev => prev ? { ...prev, currentState: data.newStatus } : null);
  //   }
  // };

  // const handleTransactionConfirmed = (data: any) => {
  //   setMessage(`Transaction confirmed: ${data.transactionHash}`);
  // };

  // const handleDisputeRaised = (data: any) => {
  //   setMessage(`Dispute raised for escrow: ${data.escrowId} - Reason: ${data.reason}`);
  // };

  // const handleDisputeResolved = (data: any) => {
  //   setMessage(`Dispute resolved for escrow: ${data.escrowId} - Decision: ${data.decision}`);
  // };

  // Wallet connection is now handled by Wagmi/RainbowKit

  // Mode switching
  const handleModeChange = (newMode: AppMode) => {
    setMode(newMode);
    if (newMode === 'create') {
      setEscrowState(null);
    }
  };

  // Escrow creation
  const handleEscrowCreate = async (escrowData: any) => {
    // if (!contractService || !agentClient) return;
    if (!contractService) return;

    try {
      setIsLoading(true);
      setMessage('Creating escrow...');

      // Create escrow via agent
      // const escrowId = await agentClient.createEscrow(escrowData);
      setMessage(`Escrow creation initiated: ${"escrowId"}`);
    } catch (error) {
      console.error('Failed to create escrow:', error);
      setMessage('Failed to create escrow. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Welcome modal handlers
  const handleCloseWelcomeModal = () => {
    setShowWelcomeModal(false);
    // localStorage.setItem('hasSeenWelcome', 'true');
  };

  // Contract interaction
  const handleContractAction = async (action: string, ...args: any[]) => {
    if (!contractService || !escrowState) return;

    try {
      setIsLoading(true);
      setMessage(`Executing ${action}...`);

      let txHash: string;
      const escrow = contractService.getEscrowContract(escrowState.contractAddress!);

      switch (action) {
        case 'deposit':
          txHash = await contractService.depositAssets(escrowState.contractAddress!, args[0], true);
          break;
        case 'confirmFulfillment':
          txHash = await contractService.confirmFulfillment(escrowState.contractAddress!);
          break;
        case 'releaseFunds':
          txHash = await contractService.releaseFunds(escrowState.contractAddress!);
          break;
        case 'refundFunds':
          txHash = await contractService.refundFunds(escrowState.contractAddress!);
          break;
        case 'raiseDispute':
          txHash = await contractService.raiseDispute(escrowState.contractAddress!, args[0]);
          break;
        case 'resolveDispute':
          txHash = await contractService.resolveDispute(escrowState.contractAddress!, args[0], args[1]);
          break;
        default:
          throw new Error(`Unknown action: ${action}`);
      }

      setMessage(`Transaction sent: ${txHash}`);
      
      // Wait for confirmation
      const receipt = await contractService.waitForTransaction(txHash);
      setMessage(`Transaction confirmed in block ${receipt.blockNumber}`);

      // Update escrow state
      const newState = await contractService.getEscrowState(escrowState.contractAddress!);
      setEscrowState(newState);

    } catch (error) {
      console.error(`Failed to execute ${action}:`, error);
      setMessage(`Failed to execute ${action}. Please try again.`);
    } finally {
      setIsLoading(false);
    }
  };

  // Load existing escrow
  const handleLoadEscrow = async (contractAddress: string) => {
    if (!contractService) return;

    try {
      setIsLoading(true);
      setMessage('Loading escrow...');

      const state = await contractService.getEscrowState(contractAddress);
      setEscrowState(state);
      setMode('interact');
      setMessage(`Escrow loaded: ${contractAddress}`);
    } catch (error) {
      console.error('Failed to load escrow:', error);
      setMessage('Failed to load escrow. Please check the contract address.');
    } finally {
      setIsLoading(false);
    }
  };

    // Prepare component to display
  const app = useMemo(() => {
    let app = <></>;
    switch (mode) {
      case "create":
        app = <CreateEscrowForm 
                onSubmit={handleEscrowCreate}
                isLoading={isLoading}
                walletAddress={address || ''}
            />;
        break;
      case "interact":
        app = <EscrowInteraction 
                  escrowState={escrowState}
                  onLoadEscrow={handleLoadEscrow}
                  onContractAction={handleContractAction}
                  isLoading={isLoading}
                  walletAddress={address || ''}
                  contractService={contractService}
                />;
        break;
      case "trading":
        app = <TradingInterface />;
        break;
      default:
        break;
    }
    return app;
  }, [mode]);

  // if (!isConnected) {
  //   return (
  //     <div className="min-h-screen bg-[#1a1a1a] flex items-center justify-center relative overflow-hidden">
  //       {/* Background Grid Pattern */}
  //       <div className="absolute inset-0 opacity-10">
  //         <div className="absolute inset-0" style={{
  //           backgroundImage: `
  //             linear-gradient(rgba(255, 255, 0, 0.1) 1px, transparent 1px),
  //             linear-gradient(90deg, rgba(255, 255, 0, 0.1) 1px, transparent 1px)
  //           `,
  //           backgroundSize: '20px 20px'
  //         }}></div>
  //       </div>
        
  //       <div className="text-center relative z-10">
  //         <div className="rounded-full h-32 w-32 border-b-2 border-[#ffff00] mx-auto"></div>
  //         <p className="mt-4 text-[#ffff00] font-mono">Please connect your wallet to continue...</p>
  //       </div>
  //     </div>
  //   );
  // }

  return (
    <div className="min-h-screen bg-[#1a1a1a] relative overflow-hidden">
      {/* Background Grid Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: `
            linear-gradient(rgba(255, 255, 0, 0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255, 255, 0, 0.1) 1px, transparent 1px)
          `,
          backgroundSize: '20px 20px'
        }}></div>
      </div>
      
      <Header />
      
      {/* Welcome Modal */}
      <WelcomeModal 
        isOpen={showWelcomeModal} 
        onClose={handleCloseWelcomeModal} 
      />
      
      <div className="max-w-6xl mx-auto px-4 py-8 relative z-10">
        <MessageDisplay message={message} />
        <ModeSelector 
          mode={mode}
          onModeChange={handleModeChange}
          disabled={isLoading}
        />
        { app }
      </div>
    </div>
  );
}

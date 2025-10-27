'use client';

import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { Header, ModeSelector } from '@/components/layout';
import { MessageDisplay } from '@/components/ui';
import { WelcomeModal } from '@/components/modals';
import CreateEscrowForm from '@/components/escrow/CreateEscrowForm';
import UserProfile from '@/components/escrow/UserProfile';
import AllEscrowsList from '@/components/escrow/AllEscrowsList';
import DisputedEscrowsList from '@/components/escrow/DisputedEscrowsList';
import TradingDashboard from '@/components/trading/TradingDashboard';
import AdminDashboard from '@/components/admin/AdminDashboard';
import RequestToBeArbiter from '@/components/transactions/RequestToBeArbiter';
import UnlockArbiterPosition from '@/components/transactions/UnlockArbiterPosition';
import { useDataContext } from '@/contexts/StorageContextProvider/useDataContext';
import { AppMode } from '@/lib/types';

export default function Home() {
  // Wagmi hooks
  const { address, isConnected } = useAccount();
  const { arbitratorsData } = useDataContext();
  
  // State
  const [mode, setMode] = useState<AppMode>('create');
  const [message, setMessage] = useState('');
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);

  // Show welcome modal on first visit
  useEffect(() => {
    setShowWelcomeModal(true);
  }, []);

  // Mode switching
  const handleModeChange = (newMode: AppMode) => {
    setMode(newMode);
  };

  // Welcome modal handlers
  const handleCloseWelcomeModal = () => {
    setShowWelcomeModal(false);
  };

  // Check if user is an approved arbiter
  const isApprovedArbiter = address && arbitratorsData.arbiters.some((arbiter) => 
    arbiter.identifier.toLowerCase() === address.toLowerCase() && arbiter.isApproved
  );

  // Check if user is admin/owner
  // const isAdmin = address && (
  //   tradeFactoryData.owner.toLowerCase() === address.toLowerCase() ||
  //   arbitratorsData.arbiters.some(arbiter => 
  //     arbiter.identifier.toLowerCase() === address.toLowerCase() && arbiter.isApproved
  //   )
  // );

  // Render content based on mode
  const renderContent = () => {
    switch (mode) {
      case 'create':
        return (
          <div className="space-y-6">
            <CreateEscrowForm 
              onSuccess={() => setMessage('Escrow created successfully!')}
              onError={(error) => setMessage(`Error: ${error}`)}
            />
            <UserProfile />
          </div>
        );
      case 'interact':
        return (
          <div className="space-y-6">
            <AllEscrowsList />
            {isApprovedArbiter && <DisputedEscrowsList />}
          </div>
        );
      case 'trading':
        return (
          <div className="space-y-6">
            <TradingDashboard />
          </div>
        );
      case 'admin':
        return (
          <div className="space-y-6">
            <AdminDashboard />
          </div>
        );
      default:
        return null;
    }
  };

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
        
        {/* Arbiter Actions */}
        {isConnected && (
          <div className="mb-6 p-4 bg-[#333] border border-[#ffff00] rounded-lg">
            <h3 className="text-lg font-bold text-white font-mono mb-4">
              Arbiter Actions
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <RequestToBeArbiter 
                onSuccess={() => setMessage('Arbiter request submitted successfully!')}
                onError={(error) => setMessage(`Error: ${error}`)}
              />
              <UnlockArbiterPosition
                onSuccess={() => setMessage('Arbiter position unlocked successfully!')}
                onError={(error) => setMessage(`Error: ${error}`)}
              />
            </div>
          </div>
        )}
        
        <ModeSelector 
          mode={mode}
          onModeChange={handleModeChange}
          // isAdmin={isAdmin}
          isAdmin={true}
        />
        
        {renderContent()}
      </div>
    </div>
  );
}

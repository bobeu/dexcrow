import React, { useState } from 'react';
import { useAccount } from 'wagmi';
import { Card, Input, Badge } from '@/components/ui';
import { useDataContext } from '@/contexts/StorageContextProvider/useDataContext';
import { formatAddr } from '@/utilities';
import { Shield, Settings, Users, DollarSign } from 'lucide-react';

// Import all admin transaction components
import SetPlatformFee from '@/components/transactions/SetPlatformFee';
import Pause from '@/components/transactions/Pause';
import Unpause from '@/components/transactions/Unpause';
import SetEscrowCreationFee from '@/components/transactions/SetEscrowCreationFee';
import SetMinimumArbiterHolding from '@/components/transactions/SetMinimumArbiterHolding';
import ApproveArbiter from '@/components/transactions/ApproveArbiter';
import RejectArbiter from '@/components/transactions/RejectArbiter';
import TransferOwnership from '@/components/transactions/TransferOwnership';
import RenounceOwnership from '@/components/transactions/RenounceOwnership';

const AdminDashboard: React.FC = () => {
  const { address } = useAccount();
  const { tradeFactoryData, arbitratorsData, escrowFactoryData } = useDataContext();
  const [message, setMessage] = useState('');

  // Form states for various admin functions
  const [platformFee, setPlatformFee] = useState('');
  const [escrowCreationFee, setEscrowCreationFee] = useState('');
  const [minArbiterHolding, setMinArbiterHolding] = useState('');
  const [arbiterAddress, setArbiterAddress] = useState('');
  const [newOwner, setNewOwner] = useState('');
  const [factoryVars, setFactoryVars] = useState({
    minTradeAmount: '',
    maxTradeAmount: '',
    defaultDisputeWindow: '',
    supportedPaymentAssets: '',
    isPythSupportedNetwork: false
  });

  const handleSuccess = (action: string) => {
    setMessage(`${action} completed successfully!`);
    setTimeout(() => setMessage(''), 5000);
  };

  const handleError = (action: string, error: string) => {
    setMessage(`Error in ${action}: ${error}`);
    setTimeout(() => setMessage(''), 5000);
  };

  // Check if current user is admin/owner
  const isAdmin = address && (
    tradeFactoryData.owner.toLowerCase() === address.toLowerCase() ||
    arbitratorsData.arbiters.some(arbiter => 
      arbiter.identifier.toLowerCase() === address.toLowerCase() && arbiter.isApproved
    )
  );

  if (!address) {
    return <p className="text-[#ffff00] font-mono text-center">Connect your wallet to access admin dashboard.</p>;
  }

  if (!isAdmin) {
    return <p className="text-red-500 font-mono text-center">Access denied. Admin privileges required.</p>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white font-mono">Admin Dashboard</h2>
        <Badge variant="success" className="flex items-center gap-2">
          <Shield className="w-4 h-4" />
          Admin Access
        </Badge>
      </div>

      {message && (
        <div className={`p-4 rounded-lg ${message.includes('Error') ? 'bg-red-900/20 border border-red-500' : 'bg-green-900/20 border border-green-500'}`}>
          <p className={`font-mono text-sm ${message.includes('Error') ? 'text-red-400' : 'text-green-400'}`}>
            {message}
          </p>
        </div>
      )}

      {/* Trade Factory Admin */}
      <Card className="p-6 border border-[#ffff00] bg-[#1a1a1a]">
        <h3 className="text-xl font-bold text-white font-mono mb-4 flex items-center gap-2">
          <Settings className="w-5 h-5" />
          Trade Factory Administration
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="space-y-2">
            <label className="text-white font-mono text-sm">Platform Fee (%)</label>
            <Input
              type="number"
              value={platformFee}
              onChange={(e) => setPlatformFee(e)}
              placeholder="Enter new platform fee"
              className="bg-[#333] border-gray-600"
            />
            <SetPlatformFee
              newFee={parseFloat(platformFee) || 0}
              onSuccess={() => handleSuccess('Platform fee update')}
              onError={(error) => handleError('Platform fee update', error)}
            />
          </div>
        </div>

        <div className="space-y-4">
          <h4 className="text-lg font-bold text-white font-mono">Factory Variables</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              type="number"
              value={factoryVars.minTradeAmount}
              onChange={(e) => setFactoryVars(prev => ({ ...prev, minTradeAmount: e }))}
              placeholder="Min Trade Amount"
              className="bg-[#333] border-gray-600"
            />
            <Input
              type="number"
              value={factoryVars.maxTradeAmount}
              onChange={(e) => setFactoryVars(prev => ({ ...prev, maxTradeAmount: e }))}
              placeholder="Max Trade Amount"
              className="bg-[#333] border-gray-600"
            />
            <Input
              type="number"
              value={factoryVars.defaultDisputeWindow}
              onChange={(e) => setFactoryVars(prev => ({ ...prev, defaultDisputeWindow: e }))}
              placeholder="Default Dispute Window (hours)"
              className="bg-[#333] border-gray-600"
            />
            <Input
              value={factoryVars.supportedPaymentAssets}
              onChange={(e) => setFactoryVars(prev => ({ ...prev, supportedPaymentAssets: e }))}
              placeholder="Supported Payment Assets (comma separated)"
              className="bg-[#333] border-gray-600"
            />
          </div>
          {/* <SetFactoryVariables
            minTradeAmount={factoryVars.minTradeAmount}
            maxTradeAmount={factoryVars.maxTradeAmount}
            defaultDisputeWindow={parseInt(factoryVars.defaultDisputeWindow) || 0}
            supportedPaymentAssets={factoryVars.supportedPaymentAssets.split(',').map(addr => addr.trim()).filter(Boolean)}
            isPythSupportedNetwork={factoryVars.isPythSupportedNetwork}
            onSuccess={() => handleSuccess('Factory variables update')}
            onError={(error) => handleError('Factory variables update', error)}
          /> */}
        </div>

        <div className="flex gap-4 mt-6">
          <Pause
            onSuccess={() => handleSuccess('Contract pause')}
            onError={(error) => handleError('Contract pause', error)}
          />
          <Unpause
            onSuccess={() => handleSuccess('Contract unpause')}
            onError={(error) => handleError('Contract unpause', error)}
          />
        </div>
      </Card>

      {/* Escrow Factory Admin */}
      <Card className="p-6 border border-[#ffff00] bg-[#1a1a1a]">
        <h3 className="text-xl font-bold text-white font-mono mb-4 flex items-center gap-2">
          <DollarSign className="w-5 h-5" />
          Escrow Factory Administration
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-white font-mono text-sm">Escrow Creation Fee (ETH)</label>
            <Input
              type="number"
              // step="0.001"

              value={escrowCreationFee}
              onChange={(e) => setEscrowCreationFee(e)}
              placeholder="Enter creation fee in ETH"
              className="bg-[#333] border-gray-600"
            />
            <SetEscrowCreationFee
              newFee={escrowCreationFee}
              onSuccess={() => handleSuccess('Escrow creation fee update')}
              onError={(error) => handleError('Escrow creation fee update', error)}
            />
          </div>
        </div>
      </Card>

      {/* Arbitrators Admin */}
      <Card className="p-6 border border-[#ffff00] bg-[#1a1a1a]">
        <h3 className="text-xl font-bold text-white font-mono mb-4 flex items-center gap-2">
          <Users className="w-5 h-5" />
          Arbitrators Administration
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="space-y-2">
            <label className="text-white font-mono text-sm">Minimum Arbiter Holding</label>
            <Input
              type="number"
              value={minArbiterHolding}
              onChange={(e) => setMinArbiterHolding(e)}
              placeholder="Enter minimum holding amount"
              className="bg-[#333] border-gray-600"
            />
            <SetMinimumArbiterHolding
              newMinimum={minArbiterHolding}
              onSuccess={() => handleSuccess('Minimum arbiter holding update')}
              onError={(error) => handleError('Minimum arbiter holding update', error)}
            />
          </div>
        </div>

        <div className="space-y-4">
          <h4 className="text-lg font-bold text-white font-mono">Arbiter Management</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-white font-mono text-sm">Arbiter Address</label>
              <Input
                value={arbiterAddress}
                onChange={(e) => setArbiterAddress(e)}
                placeholder="0x..."
                className="bg-[#333] border-gray-600"
              />
              <div className="flex gap-2">
                <ApproveArbiter
                  arbiterAddress={arbiterAddress}
                  onSuccess={() => handleSuccess('Arbiter approval')}
                  onError={(error) => handleError('Arbiter approval', error)}
                />
                <RejectArbiter
                  arbiterAddress={arbiterAddress}
                  onSuccess={() => handleSuccess('Arbiter rejection')}
                  onError={(error) => handleError('Arbiter rejection', error)}
                />
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Ownership Management */}
      <Card className="p-6 border border-[#ffff00] bg-[#1a1a1a]">
        <h3 className="text-xl font-bold text-white font-mono mb-4 flex items-center gap-2">
          <Shield className="w-5 h-5" />
          Ownership Management
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-white font-mono text-sm">New Owner Address</label>
            <Input
              value={newOwner}
              onChange={(e) => setNewOwner(e)}
              placeholder="0x..."
              className="bg-[#333] border-gray-600"
            />
            <div className="flex ">
              <TransferOwnership
                newOwner={newOwner}
                onSuccess={() => handleSuccess('Ownership transfer')}
                onError={(error) => handleError('Ownership transfer', error)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-white font-mono text-sm">Danger Zone</label>
            <RenounceOwnership
              onSuccess={() => handleSuccess('Ownership renunciation')}
              onError={(error) => handleError('Ownership renunciation', error)}
            />
          </div>
        </div>
      </Card>

      {/* Current Status Display */}
      <Card className="p-6 border border-[#ffff00] bg-[#1a1a1a]">
        <h3 className="text-xl font-bold text-white font-mono mb-4">Current Status</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-[#333] p-4 rounded-lg">
            <p className="text-white font-mono text-sm">Trade Factory Owner:</p>
            <p className="text-[#ffff00] font-mono text-sm break-all">{formatAddr(tradeFactoryData.owner)}</p>
            <p className="text-white font-mono text-sm mt-2">Platform Fee:</p>
            <p className="text-[#ffff00] font-mono text-sm">{tradeFactoryData.platformFee.toString()}%</p>
            <p className="text-white font-mono text-sm mt-2">Status:</p>
            <Badge variant={tradeFactoryData.isPaused ? "danger" : "success"}>
              {tradeFactoryData.isPaused ? "Paused" : "Active"}
            </Badge>
          </div>
          
          <div className="bg-[#333] p-4 rounded-lg">
            <p className="text-white font-mono text-sm">Escrow Creation Fee:</p>
            <p className="text-[#ffff00] font-mono text-sm">{escrowFactoryData.creationFee.toString()} ETH</p>
            <p className="text-white font-mono text-sm mt-2">Total Escrows:</p>
            <p className="text-[#ffff00] font-mono text-sm">{escrowFactoryData.totalEscrows.toString()}</p>
          </div>
          
          <div className="bg-[#333] p-4 rounded-lg">
            <p className="text-white font-mono text-sm">Min Arbiter Holding:</p>
            <p className="text-[#ffff00] font-mono text-sm">{arbitratorsData.minimumAbiterHolding.toString()}</p>
            <p className="text-white font-mono text-sm mt-2">Total Arbiters:</p>
            <p className="text-[#ffff00] font-mono text-sm">{arbitratorsData.arbiters.length}</p>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default AdminDashboard;

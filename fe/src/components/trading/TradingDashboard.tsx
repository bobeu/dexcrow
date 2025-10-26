import React, { useState } from 'react';
import { useAccount } from 'wagmi';
import { useDataContext } from '@/contexts/StorageContextProvider/useDataContext';
import { Card, Badge, Button } from '@/components/ui';
import { TrendingUp, Users, DollarSign, Settings, Play, Pause } from 'lucide-react';

const TradingDashboard: React.FC = () => {
  const { address } = useAccount();
  const { tradeFactoryData } = useDataContext();
  const [selectedTab, setSelectedTab] = useState<'overview' | 'accounts' | 'settings'>('overview');

  const formatAmount = (amount: bigint, decimals: number = 18) => {
    const formatted = Number(amount) / Math.pow(10, decimals);
    return formatted.toFixed(4);
  };

  const formatTime = (timestamp: bigint) => {
    const date = new Date(Number(timestamp) * 1000);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  if (!address) {
    return (
      <Card className="p-6">
        <div className="text-center">
          <TrendingUp className="w-12 h-12 text-[#ffff00] mx-auto mb-4" />
          <h3 className="text-lg font-bold text-white font-mono mb-2">
            Connect Wallet
          </h3>
          <p className="text-[#ffff00] font-mono text-sm">
            Please connect your wallet to access the trading dashboard.
          </p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Trading Dashboard Header */}
      <Card className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white font-mono mb-2">
              Trading Dashboard
            </h2>
            <p className="text-[#ffff00] font-mono text-sm">
              Manage your trading accounts and platform settings
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Badge variant={tradeFactoryData.isPaused ? 'error' : 'success'} className="font-mono">
              {tradeFactoryData.isPaused ? 'Paused' : 'Active'}
            </Badge>
            {tradeFactoryData.isPaused ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          </div>
        </div>
      </Card>

      {/* Trading Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-6">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-[#333] border border-[#ffff00] rounded-full flex items-center justify-center">
              <Users className="w-6 h-6 text-[#ffff00]" />
            </div>
            <div>
              <p className="text-white font-mono font-bold text-lg">
                {Number(tradeFactoryData.totalAccounts)}
              </p>
              <p className="text-[#ffff00] font-mono text-sm">
                Total Accounts
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-[#333] border border-[#ffff00] rounded-full flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-[#ffff00]" />
            </div>
            <div>
              <p className="text-white font-mono font-bold text-lg">
                {formatAmount(tradeFactoryData.totalFees)}
              </p>
              <p className="text-[#ffff00] font-mono text-sm">
                Total Fees
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-[#333] border border-[#ffff00] rounded-full flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-[#ffff00]" />
            </div>
            <div>
              <p className="text-white font-mono font-bold text-lg">
                {formatAmount(tradeFactoryData.platformFee)}%
              </p>
              <p className="text-[#ffff00] font-mono text-sm">
                Platform Fee
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Tab Navigation */}
      <div className="flex space-x-4 border-b border-[#333]">
        {[
          { id: 'overview', label: 'Overview', icon: TrendingUp },
          { id: 'accounts', label: 'Accounts', icon: Users },
          { id: 'settings', label: 'Settings', icon: Settings },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setSelectedTab(tab.id as any)}
            className={`flex items-center space-x-2 px-4 py-2 font-mono text-sm transition-colors ${
              selectedTab === tab.id
                ? 'text-[#ffff00] border-b-2 border-[#ffff00]'
                : 'text-white hover:text-[#ffff00]'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {selectedTab === 'overview' && (
        <div className="space-y-4">
          <Card className="p-6">
            <h3 className="text-lg font-bold text-white font-mono mb-4">
              Platform Overview
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-white font-mono text-sm">Owner:</span>
                  <span className="text-[#ffff00] font-mono text-sm">
                    {tradeFactoryData.owner.slice(0, 6)}...{tradeFactoryData.owner.slice(-4)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white font-mono text-sm">Platform Fee:</span>
                  <span className="text-[#ffff00] font-mono text-sm">
                    {formatAmount(tradeFactoryData.platformFee)}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white font-mono text-sm">Creation Fee:</span>
                  <span className="text-[#ffff00] font-mono text-sm">
                    {formatAmount(tradeFactoryData.variables.creationFee)} ETH
                  </span>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-white font-mono text-sm">Pyth Supported:</span>
                  <Badge variant={tradeFactoryData.variables.isPythSupported ? 'success' : 'error'}>
                    {tradeFactoryData.variables.isPythSupported ? 'Yes' : 'No'}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-white font-mono text-sm">Status:</span>
                  <Badge variant={tradeFactoryData.isPaused ? 'error' : 'success'}>
                    {tradeFactoryData.isPaused ? 'Paused' : 'Active'}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-white font-mono text-sm">Total Accounts:</span>
                  <span className="text-[#ffff00] font-mono text-sm">
                    {Number(tradeFactoryData.totalAccounts)}
                  </span>
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}

      {selectedTab === 'accounts' && (
        <div className="space-y-4">
          <Card className="p-6">
            <h3 className="text-lg font-bold text-white font-mono mb-4">
              Trading Accounts
            </h3>
            {tradeFactoryData.accounts.length > 0 ? (
              <div className="space-y-3">
                {tradeFactoryData.accounts.map((account, index) => (
                  <div key={index} className="bg-[#333] border border-[#ffff00] rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-white font-mono font-bold">
                          Account #{index + 1}
                        </p>
                        <p className="text-[#ffff00] font-mono text-sm">
                          User: {account.user.slice(0, 6)}...{account.user.slice(-4)}
                        </p>
                        <p className="text-[#ffff00] font-mono text-sm">
                          Created: {formatTime(account.createdAt)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-white font-mono text-sm">
                          Address: {account.tradingAccount.slice(0, 6)}...{account.tradingAccount.slice(-4)}
                        </p>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            console.log('View account details:', account.tradingAccount);
                          }}
                        >
                          View Details
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Users className="w-12 h-12 text-[#ffff00] mx-auto mb-4" />
                <p className="text-[#ffff00] font-mono text-sm">
                  No trading accounts found.
                </p>
              </div>
            )}
          </Card>
        </div>
      )}

      {selectedTab === 'settings' && (
        <div className="space-y-4">
          <Card className="p-6">
            <h3 className="text-lg font-bold text-white font-mono mb-4">
              Platform Settings
            </h3>
            <div className="space-y-4">
              <div className="bg-[#333] border border-[#ffff00] rounded-lg p-4">
                <h4 className="text-white font-mono font-bold mb-2">Supported Payment Asset</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-white font-mono text-sm">
                      <strong>Token:</strong> {tradeFactoryData.variables.supportedPaymentAsset.token.slice(0, 6)}...{tradeFactoryData.variables.supportedPaymentAsset.token.slice(-4)}
                    </p>
                    <p className="text-white font-mono text-sm">
                      <strong>Decimals:</strong> {tradeFactoryData.variables.supportedPaymentAsset.decimals}
                    </p>
                  </div>
                  <div>
                    <p className="text-white font-mono text-sm">
                      <strong>Name:</strong> {String.fromCharCode(...tradeFactoryData.variables.supportedPaymentAsset.name)}
                    </p>
                    <p className="text-white font-mono text-sm">
                      <strong>Symbol:</strong> {String.fromCharCode(...tradeFactoryData.variables.supportedPaymentAsset.symbol)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-[#333] border border-[#ffff00] rounded-lg p-4">
                <h4 className="text-white font-mono font-bold mb-2">Fee Structure</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-white font-mono text-sm">
                      <strong>Platform Fee:</strong> {formatAmount(tradeFactoryData.platformFee)}%
                    </p>
                    <p className="text-white font-mono text-sm">
                      <strong>Creation Fee:</strong> {formatAmount(tradeFactoryData.variables.creationFee)} ETH
                    </p>
                  </div>
                  <div>
                    <p className="text-white font-mono text-sm">
                      <strong>Fee Denominator:</strong> {formatAmount(tradeFactoryData.variables.feeDenom)}
                    </p>
                    <p className="text-white font-mono text-sm">
                      <strong>Total Fees Collected:</strong> {formatAmount(tradeFactoryData.totalFees)} ETH
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

export default TradingDashboard;

import React, { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { Card, Button, Badge } from '@/components/ui';
import { ChevronDown, Wallet, ExternalLink } from 'lucide-react';
import { getUnifiedBalances, getTokenMetadata } from '@/lib/nexus';
import type { UserAssetDatum } from '@avail-project/nexus-core';

interface TokenSelectorProps {
  selectedToken: string | null;
  onTokenSelect: (token: string, tokenAddress: string, decimals: number) => void;
  onCustomTokenSelect: (tokenAddress: string) => void;
  className?: string;
}

const TokenSelector: React.FC<TokenSelectorProps> = ({
  selectedToken,
  onTokenSelect,
  onCustomTokenSelect,
  className = ''
}) => {
  const { address } = useAccount();
  const [unifiedBalances, setUnifiedBalances] = useState<UserAssetDatum[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [customTokenAddress, setCustomTokenAddress] = useState('');
  const [showCustomInput, setShowCustomInput] = useState(false);

  // Fetch unified balances when component mounts or address changes
  useEffect(() => {
    const fetchBalances = async () => {
      if (!address) {
        setUnifiedBalances([]);
        return;
      }

      setIsLoading(true);
      try {
        const balances = await getUnifiedBalances();
        setUnifiedBalances(balances);
      } catch (error) {
        console.error('Error fetching unified balances:', error);
        setUnifiedBalances([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchBalances();
  }, [address]);

  const formatBalance = (balance: UserAssetDatum) => {
    const formatted = Number(balance.balance) / Math.pow(10, balance.decimals);
    return formatted.toFixed(6);
  };

  const getTokenDisplayName = (balance: UserAssetDatum) => {
    const metadata = getTokenMetadata(balance.symbol);
    return metadata?.name || balance.symbol;
  };

  const handleTokenSelect = (balance: UserAssetDatum) => {
    // Get the first available chain's contract address
    const contractAddress = balance.breakdown[0]?.contractAddress || '';
    onTokenSelect(balance.symbol, contractAddress, balance.decimals);
    setIsOpen(false);
  };

  const handleCustomTokenSubmit = () => {
    if (customTokenAddress.trim()) {
      onCustomTokenSelect(customTokenAddress.trim());
      setShowCustomInput(false);
      setCustomTokenAddress('');
    }
  };

  const selectedBalance = unifiedBalances.find(b => b.symbol === selectedToken);

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-white font-mono">Select Token</h3>
        <Badge variant="info" className="font-mono">
          Multi-Chain
        </Badge>
      </div>

      {/* Token Selection Dropdown */}
      <div className="relative">
        <Button
          variant="outline"
          onClick={() => setIsOpen(!isOpen)}
          className="w-full justify-between p-4 h-auto"
          disabled={!address || isLoading}
        >
          <div className="flex items-center space-x-3">
            <Wallet className="w-5 h-5 text-[#ffff00]" />
            <div className="text-left">
              {selectedBalance ? (
                <div>
                  <div className="font-mono text-white">
                    {getTokenDisplayName(selectedBalance)} ({selectedBalance.symbol})
                  </div>
                  <div className="text-sm text-gray-400">
                    Balance: {formatBalance(selectedBalance)} {selectedBalance.symbol}
                  </div>
                </div>
              ) : (
                <div className="font-mono text-white">
                  {isLoading ? 'Loading tokens...' : 'Select a token'}
                </div>
              )}
            </div>
          </div>
          <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </Button>

        {/* Dropdown Menu */}
        {isOpen && (
          <Card className="absolute top-full left-0 right-0 z-50 mt-2 max-h-80 overflow-y-auto">
            <div className="p-2 space-y-2">
              {/* Available Tokens */}
              {unifiedBalances.length > 0 ? (
                unifiedBalances.map((balance, index) => (
                  <Button
                    key={`${balance.symbol}-${index}`}
                    variant="primary"
                    onClick={() => handleTokenSelect(balance)}
                    className="w-full justify-start p-3 h-auto"
                  >
                    <div className="flex items-center justify-between w-full">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-[#ffff00] rounded-full flex items-center justify-center">
                          <span className="text-black font-bold text-xs">
                            {balance.icon || balance.symbol.charAt(0)}
                          </span>
                        </div>
                        <div className="text-left">
                          <div className="font-mono text-white">
                            {getTokenDisplayName(balance)} ({balance.symbol})
                          </div>
                          <div className="text-sm text-gray-400">
                            Balance: {formatBalance(balance)} {balance.symbol}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge variant="warning" className="text-xs">
                          {balance.breakdown[0]?.chain.name || 'Unknown'}
                        </Badge>
                        <div className="text-xs text-gray-400 mt-1">
                          {balance.breakdown[0]?.contractAddress?.slice(0, 6)}...{balance.breakdown[0]?.contractAddress?.slice(-4)}
                        </div>
                      </div>
                    </div>
                  </Button>
                ))
              ) : (
                <div className="text-center py-4">
                  <Wallet className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-400 font-mono text-sm">
                    {isLoading ? 'Loading tokens...' : 'No tokens found'}
                  </p>
                </div>
              )}

              {/* Custom Token Input */}
              <div className="border-t border-gray-600 pt-2">
                {!showCustomInput ? (
                  <Button
                    variant="outline"
                    onClick={() => setShowCustomInput(true)}
                    className="w-full"
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Use Custom Token Address
                  </Button>
                ) : (
                  <div className="space-y-2">
                    <input
                      type="text"
                      placeholder="Enter token contract address (0x...)"
                      value={customTokenAddress}
                      onChange={(e) => setCustomTokenAddress(e.target.value)}
                      className="w-full p-2 bg-gray-800 border border-gray-600 rounded text-white font-mono text-sm"
                    />
                    <div className="flex space-x-2">
                      <Button
                        variant="primary"
                        onClick={handleCustomTokenSubmit}
                        disabled={!customTokenAddress.trim()}
                        className="flex-1"
                      >
                        Use Token
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setShowCustomInput(false);
                          setCustomTokenAddress('');
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </Card>
        )}
      </div>

      {/* Selected Token Info */}
      {selectedBalance && (
        <Card className="p-4 bg-gray-800/50">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-white font-mono font-bold">Selected Token</span>
              <Badge variant="success">Active</Badge>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-400">Symbol:</span>
                <span className="text-white font-mono ml-2">{selectedBalance.symbol}</span>
              </div>
              <div>
                <span className="text-gray-400">Chain:</span>
                <span className="text-white font-mono ml-2">{selectedBalance.breakdown[0]?.chain.name || 'Unknown'}</span>
              </div>
              <div>
                <span className="text-gray-400">Balance:</span>
                <span className="text-white font-mono ml-2">{formatBalance(selectedBalance)}</span>
              </div>
              <div>
                <span className="text-gray-400">Address:</span>
                <span className="text-white font-mono ml-2 text-xs">
                  {selectedBalance.breakdown[0]?.contractAddress?.slice(0, 8)}...{selectedBalance.breakdown[0]?.contractAddress?.slice(-6)}
                </span>
              </div>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};

export default TokenSelector;

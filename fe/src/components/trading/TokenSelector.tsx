"use client";

import React, { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { 
  getUnifiedBalances, 
  // getUnifiedBalance, 
  isTokenSupported,
  // getTokenMetadata,
  // isChainSupported,
  TRADEVERSE_SUPPORTED_CHAINS,
  // SUPPORTED_TOKENS,
} from '@/lib/nexus';
import { type UserAssetDatum } from '@avail-project/nexus-core';
import { useNexus } from '@/contexts/NexusProvider';
// import { parseUnits } from 'viem';

interface TokenSelectorProps {
  onTokenSelect: (token: UserAssetDatum) => void;
  onClose: () => void;
  isOpen: boolean;
  selectedToken?: UserAssetDatum | null;
}

// interface TokenBreakdown {
//   chain: {
//     id: number;
//     logo: string;
//     name: string;
//   };
//   balance: string;
//   balanceInFiat: number;
//   contractAddress: `0x${string}`;
//   decimals: number;
//   isNative?: boolean;
//   universe: string;
// }

const TokenSelector: React.FC<TokenSelectorProps> = ({
  onTokenSelect,
  onClose,
  isOpen,
  selectedToken
}) => {
  const { address, isConnected } = useAccount();
  const { nexusManager, nexusSDK } = useNexus();
  const [tokens, setTokens] = useState<UserAssetDatum[]>([]);
  const [filteredTokens, setFilteredTokens] = useState<UserAssetDatum[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedChain, setSelectedChain] = useState<number | 'all'>('all');
  const [error, setError] = useState<string | null>(null);

  // Load tokens when component mounts or address changes
  useEffect(() => {
    if (isOpen && isConnected && address) {
      loadTokens();
    }
  }, [isOpen, isConnected, address]);

  // Filter tokens based on search and chain
  useEffect(() => {
    let filtered = tokens;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(token => 
        token.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
        token.breakdown.some(b => 
          b.chain.name.toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    }

    // Filter by chain
    if (selectedChain !== 'all') {
      filtered = filtered.map(token => ({
        ...token,
        breakdown: token.breakdown.filter(b => b.chain.id === selectedChain)
      })).filter(token => token.breakdown.length > 0);
    }

    setFilteredTokens(filtered);
  }, [tokens, searchTerm, selectedChain]);

  const loadTokens = async () => {
    if(nexusManager && nexusSDK){
      try {
        setIsLoading(true);
        setError(null);
        
        const balances = await getUnifiedBalances(nexusManager, nexusSDK);
        
        // Filter only supported tokens
        const supportedTokens = balances.filter(token => 
          isTokenSupported(token.symbol, nexusManager)
        );
        
        setTokens(supportedTokens);
      } catch (err) {
        console.error('Error loading tokens:', err);
        setError('Failed to load token balances. Please try again.');
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleTokenClick = (token: UserAssetDatum) => {
    onTokenSelect(token);
    onClose();
  };

  const formatBalance = (balance: string, decimals: number) => {
    const num = parseFloat(balance);
    if (num === 0) return '0';
    if (num < 0.0001) return '< 0.0001';
    return num.toLocaleString('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 4
    });
  };

  const formatFiatValue = (value: number) => {
    if (value === 0) return '$0';
    if (value < 0.01) return '< $0.01';
    return `$${value.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })}`;
  };

  const getChainEmojiColor = (chainId: number) => {
    const logos: Record<number, string> = {
      1: '🔷', // Ethereum
      8453: '🔵', // Base
      137: '🟣', // Polygon
      56: '🟡', // BSC
      42161: '🔴', // Arbitrum
      10: '🟠', // Optimism
      43114: '🔺', // Avalanche
    };
    return logos[chainId] || '⛓️';
  };

  const getChainName = (chainId: number) => {
    const names: Record<number, string> = {
      1: 'Ethereum',
      8453: 'Base',
      137: 'Polygon',
      56: 'BSC',
      42161: 'Arbitrum',
      10: 'Optimism',
      43114: 'Avalanche',
    };
    return names[chainId] || `Chain ${chainId}`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-full max-w-4xl shadow-lg rounded-md bg-white">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-semibold text-gray-900">Select Token to Trade</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
          >
            ×
          </button>
        </div>

        {/* Search and Filter Controls */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search by token symbol or chain..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="sm:w-48">
            <select
              value={selectedChain}
              onChange={(e) => setSelectedChain(e.target.value === 'all' ? 'all' : Number(e.target.value))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Chains</option>
              <option value={TRADEVERSE_SUPPORTED_CHAINS[0]}>Ethereum</option>
              <option value={TRADEVERSE_SUPPORTED_CHAINS[1]}>Base</option>
            </select>
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
            {error}
            <button
              onClick={loadTokens}
              className="ml-2 text-red-600 hover:text-red-800 underline"
            >
              Retry
            </button>
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        )}

        {/* Tokens Grid */}
        {!isLoading && !error && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-96 overflow-y-auto">
            {filteredTokens.map((token, index) => (
              <div
                key={`${token.symbol}-${index}`}
                onClick={() => handleTokenClick(token)}
                className={`p-4 border rounded-lg cursor-pointer transition-all hover:shadow-md ${
                  selectedToken?.symbol === token.symbol ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <span className="text-2xl">{token.icon || '🪙'}</span>
                    <div>
                      <h4 className="font-semibold text-gray-900">{token.symbol}</h4>
                      <p className="text-sm text-gray-600">{token.breakdown[0]?.chain.name || 'Unknown'}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900">
                      {formatBalance(token.balance, token.decimals)}
                    </p>
                    <p className="text-sm text-gray-600">
                      {formatFiatValue(token.balanceInFiat)}
                    </p>
                  </div>
                </div>

                {/* Chain Breakdown */}
                <div className="space-y-1">
                  {token.breakdown.map((breakdown, breakdownIndex) => (
                    <div key={breakdownIndex} className="flex items-center justify-between text-xs text-gray-600">
                      <div className="flex items-center space-x-1">
                        <span>{getChainEmojiColor(breakdown.chain.id)}</span>
                        <span>{getChainName(breakdown.chain.id)}</span>
                        {breakdown.isNative && <span className="text-blue-600">(Native)</span>}
                      </div>
                      <div className="text-right">
                        <div>{formatBalance(breakdown.balance, breakdown.decimals)}</div>
                        <div>{formatFiatValue(breakdown.balanceInFiat)}</div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Contract Address */}
                {token.breakdown[0]?.contractAddress && (
                  <div className="mt-2 text-xs text-gray-500 font-mono">
                    {token.breakdown[0].contractAddress.slice(0, 6)}...{token.breakdown[0].contractAddress.slice(-4)}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !error && filteredTokens.length === 0 && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No tokens found</h3>
            <p className="text-gray-600 mb-4">
              {searchTerm || selectedChain !== 'all' 
                ? 'Try adjusting your search or filter criteria.'
                : 'You don\'t have any supported tokens in your wallet.'
              }
            </p>
            {!searchTerm && selectedChain === 'all' && (
              <div className="text-sm text-gray-500">
                <p>Supported tokens: ETH, USDC, USDT</p>
                <p>Supported chains: Ethereum, Base</p>
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="mt-6 pt-4 border-t border-gray-200">
          <div className="flex justify-between items-center text-sm text-gray-600">
            <div>
              <p>💡 Tip: Select a token to see if bridging is needed</p>
            </div>
            <div className="text-right">
              <p>Total tokens: {filteredTokens.length}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TokenSelector;

"use client";

import React, { useState, useEffect } from 'react';
import { useAccount, useConnect, useDisconnect, useChainId, useSwitchChain } from 'wagmi';
import { 
  initializeWithProvider, 
  // isInitialized, 
  getUnifiedBalances,
  TRADEVERSE_SUPPORTED_CHAINS 
} from '@/lib/nexus';

/**
 * @fileoverview Main trading interface component for TradeVerse
 * @author TradeVerse Team
 */

interface Order {
  id: string;
  tokenAddress: string;
  chainId: number;
  amount: string;
  price: string;
  useLivePrice: boolean;
  nickname: string;
  createdAt: number;
  expiresAt: number;
  orderType: 'BUY' | 'SELL';
  status: 'ACTIVE' | 'EXECUTED' | 'CANCELLED' | 'EXPIRED' | 'BLACKLISTED';
  reputation: number;
  sellerAddress: string;
}

// interface CreateOrderModalProps {
//   isOpen: boolean;
//   onClose: () => void;
//   onSubmit: (orderData: Partial<Order>) => void;
// }

// interface OrderDetailsModalProps {
//   isOpen: boolean;
//   orderId: string | null;
//   onClose: () => void;
//   order?: Order;
// }

interface SupportedChain {
  chainId: number;
  chainName: string;
  isActive: boolean;
  factoryAddress: string;
}

const TradingInterface: React.FC = () => {
  // Wagmi hooks
  const { address, isConnected } = useAccount();
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();

  // State
  const [orders, setOrders] = useState<Order[]>([]);
  const [supportedChains, setSupportedChains] = useState<SupportedChain[]>([]);
  const [selectedChain, setSelectedChain] = useState<number>(1);
  const [isLoading, setIsLoading] = useState(false);
  const [showCreateOrder, setShowCreateOrder] = useState(false);
  const [showOrderDetails, setShowOrderDetails] = useState<string | null>(null);
  const [nexusInitialized, setNexusInitialized] = useState(false);
  const [userBalances, setUserBalances] = useState<any[]>([]);

  // Initialize Nexus SDK and load data
  useEffect(() => {
    const initializeNexus = async () => {
      if (isConnected && address && !nexusInitialized) {
        try {
          // Get the provider from the connected wallet
          const provider = (window as any).ethereum;
          if (provider) {
            await initializeWithProvider(provider);
            setNexusInitialized(true);
            console.log('Nexus SDK initialized successfully');
          }
        } catch (error) {
          console.error('Failed to initialize Nexus SDK:', error);
        }
      }
    };

    initializeNexus();
  }, [isConnected, address, nexusInitialized]);

  // Load user balances and data
  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        
        // Set supported chains for TradeVerse
        setSupportedChains([
          { chainId: TRADEVERSE_SUPPORTED_CHAINS[0], chainName: 'Ethereum', isActive: true, factoryAddress: '0x...' },
          { chainId: TRADEVERSE_SUPPORTED_CHAINS[1], chainName: 'Base', isActive: true, factoryAddress: '0x...' },
        ]);

        // Load user balances if Nexus is initialized
        if (nexusInitialized) {
          try {
            const balances = await getUnifiedBalances();
            setUserBalances(balances);
            console.log('User balances loaded:', balances);
          } catch (error) {
            console.error('Failed to load user balances:', error);
          }
        }

        // Simulate loading orders (in production, this would come from the smart contracts)
        setOrders([
          {
            id: '0x123...',
            tokenAddress: '0x1234567890123456789012345678901234567890',
            chainId: TRADEVERSE_SUPPORTED_CHAINS[1],
            amount: '100.0',
            price: '0.01',
            useLivePrice: false,
            nickname: 'CryptoTrader',
            createdAt: Date.now() - 3600000,
            expiresAt: Date.now() + 86400000,
            orderType: 'SELL',
            status: 'ACTIVE',
            reputation: 150,
            sellerAddress: '0x456...'
          },
          {
            id: '0x789...',
            tokenAddress: '0x9876543210987654321098765432109876543210',
            chainId: TRADEVERSE_SUPPORTED_CHAINS[1],
            amount: '50.0',
            price: '0.02',
            useLivePrice: true,
            nickname: 'DeFiMaster',
            createdAt: Date.now() - 7200000,
            expiresAt: Date.now() + 172800000,
            orderType: 'BUY',
            status: 'ACTIVE',
            reputation: 89,
            sellerAddress: '0x789...'
          },
        ]);
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [nexusInitialized]);

  const handleChainSwitch = async (newChainId: number) => {
    if (chainId !== newChainId) {
      try {
        if (switchChain) {
          await switchChain({ chainId: newChainId });
          setSelectedChain(newChainId);
        }
      } catch (error) {
        console.error('Failed to switch network:', error);
      }
    }
  };

  const handleCreateOrder = () => {
    if (!isConnected) {
      if (connectors.length > 0) {
        connect({ connector: connectors[0] });
      }
      return;
    }
    if (!nexusInitialized) {
      console.warn('Nexus SDK not initialized yet');
      return;
    }
    setShowCreateOrder(true);
  };

  const handleOrderSubmit = (orderData: any) => {
    console.log('Order submitted:', orderData);
    // In production, this would handle the order creation
    // For now, we'll just close the modal
    setShowCreateOrder(false);
  };

  const handleSubmitOrder = () => {
    // TODO: Implement order submission logic
    console.log('Submitting order...');
    setShowCreateOrder(false);
  };

  const handleOrderClick = (orderId: string) => {
    setShowOrderDetails(orderId);
  };

  const formatTimeRemaining = (expiresAt: number) => {
    const now = Date.now();
    const remaining = expiresAt - now;
    
    if (remaining <= 0) return 'Expired';
    
    const hours = Math.floor(remaining / (1000 * 60 * 60));
    const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
    
    return `${hours}h ${minutes}m`;
  };

  const getReputationColor = (reputation: number) => {
    if (reputation >= 100) return 'text-[#00ff00]';
    if (reputation >= 50) return 'text-[#ffff00]';
    return 'text-[#ff0000]';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'bg-[#00ff00] text-[#1a1a1a]';
      case 'EXECUTED': return 'bg-[#ffff00] text-[#1a1a1a]';
      case 'CANCELLED': return 'bg-[#666] text-white';
      case 'EXPIRED': return 'bg-[#ff0000] text-white';
      case 'BLACKLISTED': return 'bg-[#ff0000] text-white';
      default: return 'bg-[#666] text-white';
    }
  };

  return (
    <div className="min-h-screen bg-[#1a1a1a] relative overflow-hidden">
      {/* Background Grid Pattern */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute inset-0" style={{
          backgroundImage: `
            linear-gradient(rgba(0, 255, 0, 0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0, 255, 0, 0.1) 1px, transparent 1px)
          `,
          backgroundSize: '20px 20px'
        }}></div>
      </div>

      {/* Header */}
      <header className="relative z-10 bg-[#1a1a1a] border-b border-[#333]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold text-white tracking-wide">TradeVerse</h1>
              <span className="px-3 py-1 text-xs font-medium bg-[#ffff00] text-[#1a1a1a] rounded-full font-mono">
                TRADING
              </span>
              {nexusInitialized && (
                <div className="flex items-center text-sm text-[#ffff00] bg-[#1a1a1a] border border-[#ffff00] px-3 py-1 rounded-full">
                  <span className="w-2 h-2 bg-[#ffff00] rounded-full mr-2 animate-pulse"></span>
                  Cross-chain Ready
                </div>
              )}
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Chain Selector */}
              <select
                value={selectedChain}
                onChange={(e) => handleChainSwitch(Number(e.target.value))}
                className="px-4 py-2 bg-[#1a1a1a] border border-[#ffff00] text-white rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#ffff00] font-mono"
              >
                {supportedChains.map((chain) => (
                  <option key={chain.chainId} value={chain.chainId} className="bg-[#1a1a1a] text-white">
                    {chain.chainName}
                  </option>
                ))}
              </select>

              {/* Wallet Connection */}
              {isConnected ? (
                <div className="flex items-center space-x-3">
                  <span className="text-sm text-white font-mono">
                    {address?.slice(0, 6)}...{address?.slice(-4)}
                  </span>
                  <button
                    onClick={() => disconnect()}
                    className="px-3 py-1 text-sm bg-[#1a1a1a] text-[#ffff00] border border-[#ffff00] rounded-lg hover:bg-[#ffff00] hover:text-[#1a1a1a] transition-colors font-mono"
                  >
                    DISCONNECT
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => {
                    if (connectors.length > 0) {
                      connect({ connector: connectors[0] });
                    }
                  }}
                  className="px-6 py-3 bg-[#ffff00] text-[#1a1a1a] rounded-lg hover:bg-[#e6e600] transition-colors font-bold font-mono tracking-wide"
                >
                  CONNECT WALLET
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-[#1a1a1a] border border-[#333] rounded-lg p-6 hover:border-[#ffff00] transition-colors">
            <div className="flex items-center">
              <div className="p-2 bg-[#ffff00] rounded-lg">
                <svg className="w-6 h-6 text-[#1a1a1a]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-white font-mono">TOTAL ORDERS</p>
                <p className="text-2xl font-bold text-[#ffff00] font-mono">{orders.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-[#1a1a1a] border border-[#333] rounded-lg p-6 hover:border-[#ffff00] transition-colors">
            <div className="flex items-center">
              <div className="p-2 bg-[#00ff00] rounded-lg">
                <svg className="w-6 h-6 text-[#1a1a1a]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-white font-mono">ACTIVE ORDERS</p>
                <p className="text-2xl font-bold text-[#ffff00] font-mono">
                  {orders.filter(order => order.status === 'ACTIVE').length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-[#1a1a1a] border border-[#333] rounded-lg p-6 hover:border-[#ffff00] transition-colors">
            <div className="flex items-center">
              <div className="p-2 bg-[#ffff00] rounded-lg">
                <svg className="w-6 h-6 text-[#1a1a1a]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-white font-mono">TOTAL VOLUME</p>
                <p className="text-2xl font-bold text-[#ffff00] font-mono">$12.5K</p>
              </div>
            </div>
          </div>

          <div className="bg-[#1a1a1a] border border-[#333] rounded-lg p-6 hover:border-[#ffff00] transition-colors">
            <div className="flex items-center">
              <div className="p-2 bg-[#ffff00] rounded-lg">
                <svg className="w-6 h-6 text-[#1a1a1a]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-white font-mono">AVG. REPUTATION</p>
                <p className="text-2xl font-bold text-[#ffff00] font-mono">
                  {Math.round(orders.reduce((acc, order) => acc + order.reputation, 0) / orders.length) || 0}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Cross-chain Status Banner */}
        {nexusInitialized && (
          <div className="bg-gradient-to-r from-[#1a1a1a] to-[#2a2a2a] border border-[#ffff00] rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-[#ffff00] rounded-full flex items-center justify-center">
                  <span className="text-[#1a1a1a] text-lg">🌐</span>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-white font-mono">CROSS-CHAIN TRADING ENABLED</h3>
                  <p className="text-xs text-[#ffff00] font-mono">
                    Access {userBalances.length} tokens across multiple chains • Bridge and trade seamlessly
                  </p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm font-medium text-white font-mono">
                  {userBalances.length} TOKENS AVAILABLE
                </div>
                <div className="text-xs text-[#ffff00] font-mono">
                  Total Balance: {userBalances.reduce((sum, balance) => sum + parseFloat(balance.balance), 0).toFixed(2)}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-bold text-white font-mono tracking-wide">TRADING ORDERS</h2>
            <p className="text-sm text-[#ffff00] mt-1 font-mono">
              {nexusInitialized 
                ? `Manage your cross-chain trading orders • ${orders.length} active orders`
                : 'Connect your wallet to start trading'
              }
            </p>
          </div>
          <button
            onClick={handleCreateOrder}
            disabled={!nexusInitialized}
            className={`px-6 py-3 rounded-lg transition-colors font-bold font-mono tracking-wide ${
              nexusInitialized 
                ? 'bg-[#ffff00] text-[#1a1a1a] hover:bg-[#e6e600]' 
                : 'bg-[#333] text-[#666] cursor-not-allowed'
            }`}
          >
            {nexusInitialized ? 'CREATE ORDER' : 'INITIALIZING...'}
          </button>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#ffff00]"></div>
            <span className="ml-3 text-white font-mono">LOADING ORDERS...</span>
          </div>
        )}

        {/* Orders Grid */}
        {!isLoading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {orders.map((order) => (
            <div
              key={order.id}
              onClick={() => handleOrderClick(order.id)}
              className="bg-[#1a1a1a] border border-[#333] rounded-lg hover:border-[#ffff00] transition-all cursor-pointer transform hover:scale-105 duration-200"
            >
              <div className="p-6">
                {/* Header */}
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(order.status)}`}>
                      {order.status}
                    </span>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full font-mono ${
                      order.orderType === 'BUY' ? 'bg-[#00ff00] text-[#1a1a1a]' : 'bg-[#ff0000] text-white'
                    }`}>
                      {order.orderType}
                    </span>
                  </div>
                  <span className="text-xs text-[#ffff00] font-mono">
                    {formatTimeRemaining(order.expiresAt)}
                  </span>
                </div>

                {/* Order Details */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-white font-mono">AMOUNT</span>
                    <span className="font-medium text-[#ffff00] font-mono">{order.amount} tokens</span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-white font-mono">PRICE</span>
                    <span className="font-medium text-[#ffff00] font-mono">
                      {order.useLivePrice ? 'LIVE PRICE' : `${order.price} ETH`}
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-white font-mono">CHAIN</span>
                    <span className="font-medium text-[#ffff00] font-mono">
                      {supportedChains.find(c => c.chainId === order.chainId)?.chainName || `Chain ${order.chainId}`}
                    </span>
                  </div>
                </div>

                {/* Trader Info */}
                <div className="mt-4 pt-4 border-t border-[#333]">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium text-white font-mono">{order.nickname}</span>
                      <span className={`text-sm font-medium font-mono ${getReputationColor(order.reputation)}`}>
                        ⭐ {order.reputation}
                      </span>
                    </div>
                    <button className="text-[#ffff00] hover:text-[#e6e600] text-sm font-medium font-mono">
                      VIEW DETAILS
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
          </div>
        )}

        {/* Empty State */}
        {orders.length === 0 && (
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-[#ffff00]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-white font-mono">NO ORDERS FOUND</h3>
            <p className="mt-1 text-sm text-[#ffff00] font-mono">Get started by creating your first trading order.</p>
            <div className="mt-6">
              <button
                onClick={handleCreateOrder}
                className="inline-flex items-center px-6 py-3 border border-transparent shadow-sm text-sm font-bold rounded-lg text-[#1a1a1a] bg-[#ffff00] hover:bg-[#e6e600] font-mono tracking-wide"
              >
                CREATE ORDER
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Create Order Modal */}
      {showCreateOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-75 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border border-[#ffff00] w-96 shadow-lg rounded-lg bg-[#1a1a1a]">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-white font-mono tracking-wide">CREATE TRADING ORDER</h3>
                {nexusInitialized && (
                  <div className="flex items-center text-sm text-[#ffff00]">
                    <span className="w-2 h-2 bg-[#ffff00] rounded-full mr-2 animate-pulse"></span>
                    <span className="font-mono">CROSS-CHAIN</span>
                  </div>
                )}
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-white mb-1 font-mono">ORDER TYPE</label>
                  <select className="w-full px-3 py-2 border border-[#ffff00] bg-[#1a1a1a] text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ffff00] font-mono">
                    <option value="BUY" className="bg-[#1a1a1a] text-white">BUY</option>
                    <option value="SELL" className="bg-[#1a1a1a] text-white">SELL</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-white mb-1 font-mono">TOKEN</label>
                  <select className="w-full px-3 py-2 border border-[#ffff00] bg-[#1a1a1a] text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ffff00] font-mono">
                    <option value="" className="bg-[#1a1a1a] text-white">SELECT TOKEN</option>
                    {userBalances.map((balance) => (
                      <option key={balance.symbol} value={balance.symbol} className="bg-[#1a1a1a] text-white">
                        {balance.symbol} - {balance.balance} available
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-white mb-1 font-mono">AMOUNT</label>
                  <input 
                    type="number" 
                    placeholder="100.0" 
                    className="w-full px-3 py-2 border border-[#ffff00] bg-[#1a1a1a] text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ffff00] font-mono placeholder-[#666]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-white mb-1 font-mono">PRICE (USD)</label>
                  <input 
                    type="number" 
                    step="0.001"
                    placeholder="0.01" 
                    className="w-full px-3 py-2 border border-[#ffff00] bg-[#1a1a1a] text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ffff00] font-mono placeholder-[#666]"
                  />
                </div>
                <div className="flex items-center">
                  <input 
                    type="checkbox" 
                    id="useLivePrice" 
                    className="h-4 w-4 text-[#ffff00] focus:ring-[#ffff00] border-[#ffff00] rounded bg-[#1a1a1a]"
                  />
                  <label htmlFor="useLivePrice" className="ml-2 block text-sm text-white font-mono">
                    USE LIVE PRICE FROM PYTH NETWORK
                  </label>
                </div>

                {/* Bridge and Execute Options */}
                {nexusInitialized && (
                  <div className="bg-gradient-to-r from-[#1a1a1a] to-[#2a2a2a] border border-[#ffff00] rounded-lg p-4">
                    <h4 className="text-sm font-medium text-white mb-2 font-mono">CROSS-CHAIN OPTIONS</h4>
                    <div className="space-y-2">
                      <div className="flex items-center text-xs text-[#ffff00]">
                        <span className="mr-2">🚀</span>
                        <span className="font-mono">Bridge tokens and create order in one transaction</span>
                      </div>
                      <div className="flex items-center text-xs text-[#ffff00]">
                        <span className="mr-2">⚡</span>
                        <span className="font-mono">Automatic token approval and order execution</span>
                      </div>
                      <div className="flex items-center text-xs text-[#ffff00]">
                        <span className="mr-2">🔒</span>
                        <span className="font-mono">Secure cross-chain operations via Avail Nexus</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              <div className="flex justify-end space-x-2 mt-6">
                <button
                  onClick={() => setShowCreateOrder(false)}
                  className="px-4 py-2 bg-[#333] text-white border border-[#666] rounded-lg hover:bg-[#444] transition-colors font-mono"
                >
                  CANCEL
                </button>
                <button 
                  onClick={handleSubmitOrder}
                  disabled={!nexusInitialized}
                  className={`px-6 py-2 rounded-lg transition-colors font-bold font-mono tracking-wide ${
                    nexusInitialized 
                      ? 'bg-[#ffff00] text-[#1a1a1a] hover:bg-[#e6e600]' 
                      : 'bg-[#333] text-[#666] cursor-not-allowed'
                  }`}
                >
                  {nexusInitialized ? '🌐 CREATE CROSS-CHAIN ORDER' : 'INITIALIZING...'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Order Details Modal */}
      {showOrderDetails && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Order Details</h3>
              {(() => {
                const order = orders.find(o => o.id === showOrderDetails);
                if (!order) return null;
                
                return (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="text-sm font-medium text-gray-600">Order ID</span>
                        <p className="text-sm text-gray-900 font-mono">{order.id}</p>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-600">Status</span>
                        <p className={`text-sm font-medium ${getStatusColor(order.status)}`}>
                          {order.status}
                        </p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="text-sm font-medium text-gray-600">Type</span>
                        <p className={`text-sm font-medium ${
                          order.orderType === 'BUY' ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {order.orderType}
                        </p>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-600">Amount</span>
                        <p className="text-sm text-gray-900">{order.amount} tokens</p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="text-sm font-medium text-gray-600">Price</span>
                        <p className="text-sm text-gray-900">
                          {order.useLivePrice ? 'Live Price' : `${order.price} ETH`}
                        </p>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-600">Chain</span>
                        <p className="text-sm text-gray-900">
                          {supportedChains.find(c => c.chainId === order.chainId)?.chainName || `Chain ${order.chainId}`}
                        </p>
                      </div>
                    </div>
                    
                    <div>
                      <span className="text-sm font-medium text-gray-600">Trader</span>
                      <div className="flex items-center space-x-2 mt-1">
                        <span className="text-sm text-gray-900">{order.nickname}</span>
                        <span className={`text-sm font-medium ${getReputationColor(order.reputation)}`}>
                          ⭐ {order.reputation}
                        </span>
                      </div>
                    </div>
                    
                    <div>
                      <span className="text-sm font-medium text-gray-600">Expires</span>
                      <p className="text-sm text-gray-900">{formatTimeRemaining(order.expiresAt)}</p>
                    </div>
                  </div>
                );
              })()}
              
              <div className="flex justify-end mt-6">
                <button
                  onClick={() => setShowOrderDetails(null)}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TradingInterface;

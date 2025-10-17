"use client";

import React, { useState, useEffect } from 'react';
import { useAccount, useConnect, useDisconnect, useChainId, useSwitchChain } from 'wagmi';
import { parseEther, formatEther } from 'viem';

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

interface CreateOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (orderData: Partial<Order>) => void;
}

interface OrderDetailsModalProps {
  isOpen: boolean;
  orderId: string | null;
  onClose: () => void;
  order?: Order;
}

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

  // Mock data for demonstration
  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        
        // Simulate loading supported chains
        setSupportedChains([
          { chainId: 1, chainName: 'Ethereum', isActive: true, factoryAddress: '0x...' },
          { chainId: 137, chainName: 'Polygon', isActive: true, factoryAddress: '0x...' },
          { chainId: 56, chainName: 'BSC', isActive: true, factoryAddress: '0x...' },
          { chainId: 42161, chainName: 'Arbitrum', isActive: true, factoryAddress: '0x...' },
          { chainId: 10, chainName: 'Optimism', isActive: true, factoryAddress: '0x...' },
          { chainId: 43114, chainName: 'Avalanche', isActive: true, factoryAddress: '0x...' },
          { chainId: 999999, chainName: 'Solana', isActive: true, factoryAddress: '0x...' },
          { chainId: 999998, chainName: 'Cosmos', isActive: true, factoryAddress: '0x...' },
        ]);

        // Simulate loading orders
        setOrders([
          {
            id: '0x123...',
            tokenAddress: '0x1234567890123456789012345678901234567890',
            chainId: 1,
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
            chainId: 137,
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
  }, []);

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
    setShowCreateOrder(true);
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
    if (reputation >= 100) return 'text-green-500';
    if (reputation >= 50) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'bg-green-100 text-green-800';
      case 'EXECUTED': return 'bg-blue-100 text-blue-800';
      case 'CANCELLED': return 'bg-gray-100 text-gray-800';
      case 'EXPIRED': return 'bg-red-100 text-red-800';
      case 'BLACKLISTED': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">TradeVerse</h1>
              <span className="ml-2 px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                Trading
              </span>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Chain Selector */}
              <select
                value={selectedChain}
                onChange={(e) => handleChainSwitch(Number(e.target.value))}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {supportedChains.map((chain) => (
                  <option key={chain.chainId} value={chain.chainId}>
                    {chain.chainName}
                  </option>
                ))}
              </select>

              {/* Wallet Connection */}
              {isConnected ? (
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-600">
                    {address?.slice(0, 6)}...{address?.slice(-4)}
                  </span>
                  <button
                    onClick={() => disconnect()}
                    className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded-md hover:bg-red-200 transition-colors"
                  >
                    Disconnect
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => {
                    if (connectors.length > 0) {
                      connect({ connector: connectors[0] });
                    }
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  Connect Wallet
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Orders</p>
                <p className="text-2xl font-semibold text-gray-900">{orders.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Active Orders</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {orders.filter(order => order.status === 'ACTIVE').length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Volume</p>
                <p className="text-2xl font-semibold text-gray-900">$12.5K</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Avg. Reputation</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {Math.round(orders.reduce((acc, order) => acc + order.reputation, 0) / orders.length) || 0}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Trading Orders</h2>
          <button
            onClick={handleCreateOrder}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            Create Order
          </button>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        )}

        {/* Orders Grid */}
        {!isLoading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {orders.map((order) => (
            <div
              key={order.id}
              onClick={() => handleOrderClick(order.id)}
              className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow cursor-pointer transform hover:scale-105 duration-200"
            >
              <div className="p-6">
                {/* Header */}
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(order.status)}`}>
                      {order.status}
                    </span>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      order.orderType === 'BUY' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {order.orderType}
                    </span>
                  </div>
                  <span className="text-xs text-gray-500">
                    {formatTimeRemaining(order.expiresAt)}
                  </span>
                </div>

                {/* Order Details */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Amount</span>
                    <span className="font-medium">{order.amount} tokens</span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Price</span>
                    <span className="font-medium">
                      {order.useLivePrice ? 'Live Price' : `${order.price} ETH`}
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Chain</span>
                    <span className="font-medium">
                      {supportedChains.find(c => c.chainId === order.chainId)?.chainName || `Chain ${order.chainId}`}
                    </span>
                  </div>
                </div>

                {/* Trader Info */}
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium text-gray-900">{order.nickname}</span>
                      <span className={`text-sm font-medium ${getReputationColor(order.reputation)}`}>
                        ⭐ {order.reputation}
                      </span>
                    </div>
                    <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                      View Details
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
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No orders found</h3>
            <p className="mt-1 text-sm text-gray-500">Get started by creating your first trading order.</p>
            <div className="mt-6">
              <button
                onClick={handleCreateOrder}
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
              >
                Create Order
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Create Order Modal */}
      {showCreateOrder && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Create Trading Order</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Order Type</label>
                  <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="BUY">Buy</option>
                    <option value="SELL">Sell</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Token Address</label>
                  <input 
                    type="text" 
                    placeholder="0x..." 
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
                  <input 
                    type="number" 
                    placeholder="100.0" 
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Price (ETH)</label>
                  <input 
                    type="number" 
                    step="0.001"
                    placeholder="0.01" 
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="flex items-center">
                  <input 
                    type="checkbox" 
                    id="useLivePrice" 
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="useLivePrice" className="ml-2 block text-sm text-gray-700">
                    Use live price from Pyth Network
                  </label>
                </div>
              </div>
              <div className="flex justify-end space-x-2 mt-6">
                <button
                  onClick={() => setShowCreateOrder(false)}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition-colors"
                >
                  Cancel
                </button>
                <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">
                  Create Order
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

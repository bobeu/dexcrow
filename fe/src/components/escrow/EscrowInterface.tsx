"use client";

import React, { useState, useEffect } from 'react';
import { useAccount, useConnect, useDisconnect } from 'wagmi';
import { parseEther, formatEther } from 'viem';

/**
 * @fileoverview Escrow interface component for TradeVerse
 * @author TradeVerse Team
 */

interface EscrowData {
  id: string;
  buyer: string;
  seller: string;
  arbiter: string;
  amount: string;
  token: string;
  description: string;
  status: 'AWAITING_DEPOSIT' | 'AWAITING_FULFILLMENT' | 'DISPUTE_RAISED' | 'COMPLETED' | 'CANCELED';
  createdAt: number;
  deadline: number;
  disputeWindow: number;
}

const EscrowInterface: React.FC = () => {
  const { address, isConnected } = useAccount();
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();

  // State
  const [escrows, setEscrows] = useState<EscrowData[]>([]);
  const [showCreateEscrow, setShowCreateEscrow] = useState(false);
  const [showEscrowDetails, setShowEscrowDetails] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Mock data for demonstration
  useEffect(() => {
    setEscrows([
      {
        id: '0x123...',
        buyer: '0x456...',
        seller: '0x789...',
        arbiter: '0xabc...',
        amount: '1.0',
        token: 'ETH',
        description: 'Purchase of digital artwork',
        status: 'AWAITING_FULFILLMENT',
        createdAt: Date.now() - 3600000,
        deadline: Date.now() + 86400000,
        disputeWindow: 24
      },
      {
        id: '0x456...',
        buyer: '0xdef...',
        seller: '0xghi...',
        arbiter: '0xjkl...',
        amount: '100.0',
        token: 'USDC',
        description: 'Software development services',
        status: 'COMPLETED',
        createdAt: Date.now() - 172800000,
        deadline: Date.now() - 86400000,
        disputeWindow: 48
      },
      {
        id: '0x789...',
        buyer: '0x123...',
        seller: '0x456...',
        arbiter: '0x789...',
        amount: '0.5',
        token: 'ETH',
        description: 'Consulting services',
        status: 'DISPUTE_RAISED',
        createdAt: Date.now() - 7200000,
        deadline: Date.now() + 43200000,
        disputeWindow: 24
      }
    ]);
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'AWAITING_DEPOSIT': return 'bg-yellow-100 text-yellow-800';
      case 'AWAITING_FULFILLMENT': return 'bg-blue-100 text-blue-800';
      case 'DISPUTE_RAISED': return 'bg-red-100 text-red-800';
      case 'COMPLETED': return 'bg-green-100 text-green-800';
      case 'CANCELED': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatTimeRemaining = (deadline: number) => {
    const now = Date.now();
    const remaining = deadline - now;
    
    if (remaining <= 0) return 'Expired';
    
    const days = Math.floor(remaining / (1000 * 60 * 60 * 24));
    const hours = Math.floor((remaining % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (days > 0) return `${days}d ${hours}h`;
    return `${hours}h`;
  };

  const handleCreateEscrow = () => {
    if (!isConnected) {
      connect({ connector: connectors[0] });
      return;
    }
    setShowCreateEscrow(true);
  };

  const handleEscrowClick = (escrowId: string) => {
    setShowEscrowDetails(escrowId);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'AWAITING_DEPOSIT':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
          </svg>
        );
      case 'AWAITING_FULFILLMENT':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'DISPUTE_RAISED':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        );
      case 'COMPLETED':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'CANCELED':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        );
      default:
        return null;
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
                Escrow
              </span>
            </div>
            
            <div className="flex items-center space-x-4">
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
                  onClick={() => connect({ connector: connectors[0] })}
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
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Escrows</p>
                <p className="text-2xl font-semibold text-gray-900">{escrows.length}</p>
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
                <p className="text-sm font-medium text-gray-600">Completed</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {escrows.filter(escrow => escrow.status === 'COMPLETED').length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Pending</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {escrows.filter(escrow => escrow.status === 'AWAITING_FULFILLMENT').length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-red-100 rounded-lg">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Disputes</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {escrows.filter(escrow => escrow.status === 'DISPUTE_RAISED').length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Escrow Transactions</h2>
          <button
            onClick={handleCreateEscrow}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            Create Escrow
          </button>
        </div>

        {/* Escrows List */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {escrows.map((escrow) => (
            <div
              key={escrow.id}
              onClick={() => handleEscrowClick(escrow.id)}
              className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow cursor-pointer transform hover:scale-105 duration-200"
            >
              <div className="p-6">
                {/* Header */}
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(escrow.status)}`}>
                      {escrow.status.replace('_', ' ')}
                    </span>
                    <div className="flex items-center text-gray-500">
                      {getStatusIcon(escrow.status)}
                    </div>
                  </div>
                  <span className="text-xs text-gray-500">
                    {formatTimeRemaining(escrow.deadline)}
                  </span>
                </div>

                {/* Escrow Details */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Amount</span>
                    <span className="font-medium">{escrow.amount} {escrow.token}</span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Buyer</span>
                    <span className="font-medium text-sm">{escrow.buyer}</span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Seller</span>
                    <span className="font-medium text-sm">{escrow.seller}</span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Arbiter</span>
                    <span className="font-medium text-sm">{escrow.arbiter}</span>
                  </div>
                </div>

                {/* Description */}
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <p className="text-sm text-gray-600 line-clamp-2">{escrow.description}</p>
                  <button className="mt-2 text-blue-600 hover:text-blue-800 text-sm font-medium">
                    View Details
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {escrows.length === 0 && (
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No escrows found</h3>
            <p className="mt-1 text-sm text-gray-500">Get started by creating your first escrow transaction.</p>
            <div className="mt-6">
              <button
                onClick={handleCreateEscrow}
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
              >
                Create Escrow
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Modals would go here */}
      {showCreateEscrow && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Create Escrow Transaction</h3>
              {/* Create escrow form would go here */}
              <div className="flex justify-end space-x-2">
                <button
                  onClick={() => setShowCreateEscrow(false)}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                >
                  Cancel
                </button>
                <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
                  Create
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showEscrowDetails && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Escrow Details</h3>
              {/* Escrow details content would go here */}
              <div className="flex justify-end">
                <button
                  onClick={() => setShowEscrowDetails(null)}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
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

export default EscrowInterface;

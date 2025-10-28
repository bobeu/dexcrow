"use client";

import React, { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import TokenSelector from './TokenSelector';
import BridgeAndExecuteButton from './BridgeAndExecuteButton';
import { 
  // getUnifiedBalance,
  isChainSupported,
  // getContractAddress,
  TRADEVERSE_SUPPORTED_CHAINS
} from '@/lib/nexus';
import type { UserAssetDatum, BridgeAndExecuteResult } from '@avail-project/nexus-core';
import { useNexus } from '@/contexts/NexusProvider';
import { zeroAddress } from 'viem';

interface CreateOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (orderData: any) => void;
}

interface OrderFormData {
  token: UserAssetDatum | null;
  amount: string;
  price: string;
  expirationHours: number;
  useLivePrice: boolean;
  orderType: 'BUY' | 'SELL';
  nickname: string;
}

const CreateOrderModal: React.FC<CreateOrderModalProps> = ({
  isOpen,
  onClose,
  onSubmit
}) => {
  const { address, isConnected } = useAccount();
  const { nexusManager } = useNexus();
  const [formData, setFormData] = useState<OrderFormData>({
    token: null,
    amount: '',
    price: '',
    expirationHours: 24,
    useLivePrice: false,
    orderType: 'SELL',
    nickname: '',
  });
  const [showTokenSelector, setShowTokenSelector] = useState(false);
  // const [isExecuting, setIsExecuting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setFormData({
        token: null,
        amount: '',
        price: '',
        expirationHours: 24,
        useLivePrice: false,
        orderType: 'SELL',
        nickname: '',
      });
      setError(null);
      setSuccess(null);
    }
  }, [isOpen]);

  const handleInputChange = (field: keyof OrderFormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    setError(null);
  };

  const handleTokenSelect = (token: UserAssetDatum) => {
    setFormData(prev => ({
      ...prev,
      token
    }));
    setShowTokenSelector(false);
  };

  const validateForm = (): string | null => {
    if (!formData.token) {
      return 'Please select a token to trade';
    }
    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      return 'Please enter a valid amount';
    }
    if (!formData.useLivePrice && (!formData.price || parseFloat(formData.price) <= 0)) {
      return 'Please enter a valid price or enable live pricing';
    }
    if (formData.expirationHours < 1 || formData.expirationHours > 168) {
      return 'Expiration must be between 1 and 168 hours (1 week)';
    }
    if (!formData.nickname.trim()) {
      return 'Please enter a nickname for your order';
    }
    return null;
  };

  const handleSubmit = async () => {
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    if (!isConnected || !address || !nexusManager) {
      setError('Please connect your wallet first');
      return;
    }

    // Check if token needs bridging
    const needsBridging = !formData.token?.breakdown.some(b => 
      isChainSupported(b.chain.id, nexusManager)
    );

    if (needsBridging) {
      setError('Selected token needs to be bridged to a supported chain (Ethereum or Base)');
      return;
    }

    // Find the best chain for the token
    const supportedBreakdown = formData.token?.breakdown.find(b => 
      isChainSupported(b.chain.id, nexusManager)
    );

    if (!supportedBreakdown) {
      setError('No supported chain found for this token');
      return;
    }

    const toChainId = supportedBreakdown.chain.id;

    // Prepare order data
    const orderData = {
      token: formData.token,
      amount: formData.amount,
      price: formData.useLivePrice ? '0' : formData.price,
      expirationHours: formData.expirationHours,
      useLivePrice: formData.useLivePrice,
      orderType: formData.orderType,
      nickname: formData.nickname,
      toChainId,
      tokenAddress: supportedBreakdown.contractAddress,
    };

    onSubmit(orderData);
  };

  const handleBridgeAndExecute = async (result: BridgeAndExecuteResult) => {
    if (result.success) {
      setSuccess('Order created successfully!');
      setTimeout(() => {
        onClose();
      }, 2000);
    } else {
      setError(result.error || 'Failed to create order');
    }
  };

  const handleBridgeError = (error: string) => {
    setError(error);
  };

  const getChainName = (chainId: number) => {
    const names: Record<number, string> = {
      1: 'Ethereum',
      8453: 'Base',
    };
    return names[chainId] || `Chain ${chainId}`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-semibold text-gray-900">Create Trading Order</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
          >
            ×
          </button>
        </div>

        {/* Error/Success Messages */}
        {error && (
          <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded-lg">
            {success}
          </div>
        )}

        <div className="space-y-6">
          {/* Order Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Order Type</label>
            <div className="flex space-x-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  value="SELL"
                  checked={formData.orderType === 'SELL'}
                  onChange={(e) => handleInputChange('orderType', e.target.value)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                />
                <span className="ml-2 text-sm text-gray-700">Sell</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  value="BUY"
                  checked={formData.orderType === 'BUY'}
                  onChange={(e) => handleInputChange('orderType', e.target.value)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                />
                <span className="ml-2 text-sm text-gray-700">Buy</span>
              </label>
            </div>
          </div>

          {/* Token Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Token to Trade</label>
            <button
              onClick={() => setShowTokenSelector(true)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg text-left hover:border-gray-400 transition-colors"
            >
              {formData.token ? (
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">{formData.token.icon || '🪙'}</span>
                    <div>
                      <p className="font-medium">{formData.token.symbol}</p>
                      <p className="text-sm text-gray-600">
                        Balance: {parseFloat(formData.token.balance).toLocaleString()} 
                        {formData.token.breakdown.length > 1 && ` (${formData.token.breakdown.length} chains)`}
                      </p>
                    </div>
                  </div>
                  <span className="text-gray-400">Change</span>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">Select a token to trade</span>
                  <span className="text-gray-400">→</span>
                </div>
              )}
            </button>
          </div>

          {/* Amount */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Amount</label>
            <div className="relative">
              <input
                type="number"
                step="0.000001"
                placeholder="0.0"
                value={formData.amount}
                onChange={(e) => handleInputChange('amount', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {formData.token && (
                <div className="absolute right-3 top-3 text-sm text-gray-500">
                  {formData.token.symbol}
                </div>
              )}
            </div>
            {formData.token && (
              <p className="mt-1 text-sm text-gray-600">
                Available: {parseFloat(formData.token.balance).toLocaleString()} {formData.token.symbol}
              </p>
            )}
          </div>

          {/* Price */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Price per Token</label>
            <div className="space-y-3">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="useLivePrice"
                  checked={formData.useLivePrice}
                  onChange={(e) => handleInputChange('useLivePrice', e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="useLivePrice" className="ml-2 text-sm text-gray-700">
                  Use live price from Pyth Network
                </label>
              </div>
              {!formData.useLivePrice && (
                <div className="relative">
                  <input
                    type="number"
                    step="0.000001"
                    placeholder="0.0"
                    value={formData.price}
                    onChange={(e) => handleInputChange('price', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <div className="absolute right-3 top-3 text-sm text-gray-500">
                    ETH
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Expiration */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Expiration (hours)</label>
            <input
              type="number"
              min="1"
              max="168"
              value={formData.expirationHours}
              onChange={(e) => handleInputChange('expirationHours', parseInt(e.target.value))}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="mt-1 text-sm text-gray-600">
              Orders expire after {formData.expirationHours} hours (max 168 hours / 1 week)
            </p>
          </div>

          {/* Nickname */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Nickname</label>
            <input
              type="text"
              placeholder="Enter a nickname for your order"
              value={formData.nickname}
              onChange={(e) => handleInputChange('nickname', e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
            <button
              onClick={onClose}
              className="px-6 py-3 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
            >
              Cancel
            </button>
            
            {formData.token && (
              <BridgeAndExecuteButton
                token={formData.token}
                amount={formData.amount}
                toChainId={formData.token.breakdown.find(b => isChainSupported(b.chain.id, nexusManager!))?.chain.id || TRADEVERSE_SUPPORTED_CHAINS[1]}
                action="createOrder"
                orderParams={{
                  tokenAddress: formData.token.breakdown.find(b => isChainSupported(b.chain.id, nexusManager!))?.contractAddress || zeroAddress,
                  price: formData.useLivePrice ? '0' : formData.price,
                  expirationHours: formData.expirationHours,
                }}
                onSuccess={handleBridgeAndExecute}
                onError={handleBridgeError}
                className="px-6 py-3"
              >
                Bridge & Create Order
              </BridgeAndExecuteButton>
            )}
            
            {!formData.token && (
              <button
                onClick={handleSubmit}
                disabled={true}
                className="px-6 py-3 bg-gray-300 text-gray-500 rounded-lg cursor-not-allowed"
              >
                Select Token First
              </button>
            )}
          </div>
        </div>

        {/* Token Selector Modal */}
        <TokenSelector
          isOpen={showTokenSelector}
          onClose={() => setShowTokenSelector(false)}
          onTokenSelect={handleTokenSelect}
          selectedToken={formData.token}
        />
      </div>
    </div>
  );
};

export default CreateOrderModal;

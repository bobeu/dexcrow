import React, { useState } from 'react';
import { TradeType, AssetType, ChainType } from '../lib/types';
import { ArrowRight, Info } from 'lucide-react';

interface CreateEscrowFormProps {
  onSubmit: (data: any) => void;
  isLoading: boolean;
  walletAddress: string;
}

const CreateEscrowForm: React.FC<CreateEscrowFormProps> = ({ onSubmit, isLoading, walletAddress }) => {
  const [formData, setFormData] = useState({
    tradeType: 'crypto' as TradeType,
    buyerAddress: walletAddress,
    sellerAddress: '',
    arbiterAddress: '',
    assetA: {
      type: 'ETH' as AssetType,
      address: '',
      amount: '',
      chain: 'ethereum' as ChainType,
      symbol: 'ETH'
    },
    assetB: {
      type: 'USDC' as AssetType,
      address: '',
      amount: '',
      chain: 'ethereum' as ChainType,
      symbol: 'USDC'
    },
    deadline: 7,
    description: '',
    disputeWindowHours: 24
  });

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleAssetChange = (asset: 'assetA' | 'assetB', field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [asset]: {
        ...prev[asset],
        [field]: value
      }
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const generateRandomAddress = () => {
    return '0x' + Math.random().toString(16).substr(2, 40);
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Create New Escrow</h2>
        <p className="text-gray-600">Set up a secure escrow transaction between parties</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Trade Type Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">Trade Type</label>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {[
              { value: 'crypto', label: 'Crypto Swap', desc: 'Direct crypto exchange' },
              { value: 'fiat_p2p', label: 'Fiat P2P', desc: 'Crypto for fiat payment' },
              { value: 'cross_chain', label: 'Cross-Chain', desc: 'Multi-chain swap' }
            ].map((option) => (
              <label
                key={option.value}
                className={`relative flex flex-col p-4 border rounded-lg cursor-pointer transition-all ${
                  formData.tradeType === option.value
                    ? 'border-indigo-500 bg-indigo-50'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
              >
                <input
                  type="radio"
                  name="tradeType"
                  value={option.value}
                  checked={formData.tradeType === option.value}
                  onChange={(e) => handleInputChange('tradeType', e.target.value)}
                  className="sr-only"
                />
                <div className="flex items-center justify-between">
                  <span className="font-medium text-gray-900">{option.label}</span>
                </div>
                <span className="text-sm text-gray-500 mt-1">{option.desc}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Party Addresses */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="buyerAddress" className="block text-sm font-medium text-gray-700 mb-2">
              Buyer Address (You)
            </label>
            <input
              type="text"
              id="buyerAddress"
              value={formData.buyerAddress}
              onChange={(e) => handleInputChange('buyerAddress', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
              required
            />
          </div>
          
          <div>
            <label htmlFor="sellerAddress" className="block text-sm font-medium text-gray-700 mb-2">
              Seller Address
            </label>
            <div className="flex space-x-2">
              <input
                type="text"
                id="sellerAddress"
                value={formData.sellerAddress}
                onChange={(e) => handleInputChange('sellerAddress', e.target.value)}
                placeholder="0x..."
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                required
              />
              <button
                type="button"
                onClick={() => handleInputChange('sellerAddress', generateRandomAddress())}
                className="px-3 py-2 text-sm text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Random
              </button>
            </div>
          </div>
        </div>

        <div>
          <label htmlFor="arbiterAddress" className="block text-sm font-medium text-gray-700 mb-2">
            Arbiter Address
          </label>
          <div className="flex space-x-2">
            <input
              type="text"
              id="arbiterAddress"
              value={formData.arbiterAddress}
              onChange={(e) => handleInputChange('arbiterAddress', e.target.value)}
              placeholder="0x..."
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
              required
            />
            <button
              type="button"
              onClick={() => handleInputChange('arbiterAddress', generateRandomAddress())}
              className="px-3 py-2 text-sm text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Random
            </button>
          </div>
        </div>

        {/* Asset A (Locked in Escrow) */}
        <div className="border border-gray-200 rounded-lg p-4">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Asset A (Locked in Escrow)</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Asset Type</label>
              <select
                value={formData.assetA.type}
                onChange={(e) => handleAssetChange('assetA', 'type', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="ETH">ETH</option>
                <option value="ERC20">ERC-20 Token</option>
                <option value="ERC721">ERC-721 NFT</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Amount</label>
              <input
                type="number"
                step="0.0001"
                value={formData.assetA.amount}
                onChange={(e) => handleAssetChange('assetA', 'amount', e.target.value)}
                placeholder="1.0"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                required
              />
            </div>
          </div>
          {formData.assetA.type === 'ERC20' && (
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Token Address</label>
              <input
                type="text"
                value={formData.assetA.address}
                onChange={(e) => handleAssetChange('assetA', 'address', e.target.value)}
                placeholder="0x..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
          )}
        </div>

        {/* Asset B (Counter Asset) */}
        <div className="border border-gray-200 rounded-lg p-4">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Asset B (Counter Asset)</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Asset Type</label>
              <select
                value={formData.assetB.type}
                onChange={(e) => handleAssetChange('assetB', 'type', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="USDC">USDC</option>
                <option value="ETH">ETH</option>
                <option value="ERC20">ERC-20 Token</option>
                <option value="FIAT">Fiat Currency</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Amount</label>
              <input
                type="number"
                step="0.0001"
                value={formData.assetB.amount}
                onChange={(e) => handleAssetChange('assetB', 'amount', e.target.value)}
                placeholder="3000.0"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                required
              />
            </div>
          </div>
          {formData.assetB.type === 'ERC20' && (
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Token Address</label>
              <input
                type="text"
                value={formData.assetB.address}
                onChange={(e) => handleAssetChange('assetB', 'address', e.target.value)}
                placeholder="0x..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
          )}
        </div>

        {/* Terms */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="deadline" className="block text-sm font-medium text-gray-700 mb-2">
              Deadline (Days)
            </label>
            <input
              type="number"
              id="deadline"
              value={formData.deadline}
              onChange={(e) => handleInputChange('deadline', parseInt(e.target.value))}
              min="1"
              max="30"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
              required
            />
          </div>
          
          <div>
            <label htmlFor="disputeWindow" className="block text-sm font-medium text-gray-700 mb-2">
              Dispute Window (Hours)
            </label>
            <input
              type="number"
              id="disputeWindow"
              value={formData.disputeWindowHours}
              onChange={(e) => handleInputChange('disputeWindowHours', parseInt(e.target.value))}
              min="1"
              max="168"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
              required
            />
          </div>
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
            Description
          </label>
          <textarea
            id="description"
            value={formData.description}
            onChange={(e) => handleInputChange('description', e.target.value)}
            placeholder="Describe the transaction details..."
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
            required
          />
        </div>

        {/* Submit Button */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-200">
          <div className="flex items-center space-x-2 text-sm text-gray-500">
            <Info className="w-4 h-4" />
            <span>Escrow will be created on the blockchain</span>
          </div>
          
          <button
            type="submit"
            disabled={isLoading}
            className="flex items-center space-x-2 bg-indigo-600 text-white px-6 py-3 rounded-md hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Creating...</span>
              </>
            ) : (
              <>
                <span>Create Escrow</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateEscrowForm;

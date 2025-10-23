import React, { useState } from 'react';
import { TradeType, AssetType, ChainType } from '@/lib/types';
import { ArrowRight, Info } from 'lucide-react';
import { Card, Input, Select, Textarea, Button } from '@/components/ui';

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

  const generateRandomAddress = () => {
    return '0x' + Math.random().toString(16).substr(2, 40);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const tradeTypeOptions = [
    { value: 'crypto', label: 'Crypto to Crypto' },
    { value: 'crypto_fiat', label: 'Crypto to Fiat' },
    { value: 'fiat_crypto', label: 'Fiat to Crypto' }
  ];

  const assetTypeOptions = [
    { value: 'ETH', label: 'ETH' },
    { value: 'ERC20', label: 'ERC-20 Token' },
    { value: 'ERC721', label: 'ERC-721 NFT' }
  ];

  const counterAssetOptions = [
    { value: 'USDC', label: 'USDC' },
    { value: 'ETH', label: 'ETH' },
    { value: 'ERC20', label: 'ERC-20 Token' },
    { value: 'FIAT', label: 'Fiat Currency' }
  ];

  return (
    <Card>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-white mb-2 font-mono tracking-wide">
          Create New Escrow
        </h2>
        <p className="text-[#ffff00] font-mono">
          Set up a secure escrow transaction with smart contract protection
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Trade Type Selection */}
        <div>
          <h3 className="text-lg font-medium text-white mb-4 font-mono tracking-wide">
            Trade Type
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {tradeTypeOptions.map((option) => (
              <label
                key={option.value}
                className={`flex items-center space-x-3 p-4 rounded-lg border cursor-pointer transition-colors ${
                  formData.tradeType === option.value
                    ? 'border-[#ffff00] bg-[#1a1a1a]'
                    : 'border-[#333] hover:border-[#ffff00]'
                }`}
              >
                <input
                  type="radio"
                  name="tradeType"
                  value={option.value}
                  checked={formData.tradeType === option.value}
                  onChange={(e) => handleInputChange('tradeType', e.target.value)}
                  className="text-[#ffff00] focus:ring-[#ffff00]"
                />
                <span className="text-white font-mono">{option.label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Parties */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input
            label="Buyer Address"
            value={formData.buyerAddress}
            onChange={(value) => handleInputChange('buyerAddress', value)}
            placeholder="0x..."
            required
          />
          <Input
            label="Seller Address"
            value={formData.sellerAddress}
            onChange={(value) => handleInputChange('sellerAddress', value)}
            placeholder="0x..."
            required
          />
          <Input
            label="Arbiter Address"
            value={formData.arbiterAddress}
            onChange={(value) => handleInputChange('arbiterAddress', value)}
            placeholder="0x..."
            required
          />
        </div>

        {/* Asset A */}
        <Card border="yellow">
          <h3 className="text-lg font-medium text-white mb-4 font-mono tracking-wide">
            Asset A (Locked in Escrow)
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select
              label="Asset Type"
              value={formData.assetA.type}
              onChange={(value) => handleAssetChange('assetA', 'type', value)}
              options={assetTypeOptions}
            />
            <Input
              label="Amount"
              type="number"
              value={formData.assetA.amount}
              onChange={(value) => handleAssetChange('assetA', 'amount', value)}
              placeholder="1.0"
              required
            />
          </div>
          {formData.assetA.type === 'ERC20' && (
            <Input
              label="Token Address"
              value={formData.assetA.address}
              onChange={(value) => handleAssetChange('assetA', 'address', value)}
              placeholder="0x..."
            />
          )}
        </Card>

        {/* Asset B */}
        <Card border="green">
          <h3 className="text-lg font-medium text-white mb-4 font-mono tracking-wide">
            Asset B (Counter Asset)
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select
              label="Asset Type"
              value={formData.assetB.type}
              onChange={(value) => handleAssetChange('assetB', 'type', value)}
              options={counterAssetOptions}
            />
            <Input
              label="Amount"
              type="number"
              value={formData.assetB.amount}
              onChange={(value) => handleAssetChange('assetB', 'amount', value)}
              placeholder="3000.0"
              required
            />
          </div>
          {formData.assetB.type === 'ERC20' && (
            <Input
              label="Token Address"
              value={formData.assetB.address}
              onChange={(value) => handleAssetChange('assetB', 'address', value)}
              placeholder="0x..."
            />
          )}
        </Card>

        {/* Terms */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Deadline (Days)"
            type="number"
            value={formData.deadline.toString()}
            onChange={(value) => handleInputChange('deadline', parseInt(value))}
            required
          />
          <Input
            label="Dispute Window (Hours)"
            type="number"
            value={formData.disputeWindowHours.toString()}
            onChange={(value) => handleInputChange('disputeWindowHours', parseInt(value))}
            required
          />
        </div>

        <Textarea
          label="Description"
          value={formData.description}
          onChange={(value) => handleInputChange('description', value)}
          placeholder="Describe the transaction details..."
          required
        />

        {/* Submit Button */}
        <div className="flex items-center justify-between pt-4 border-t border-[#333]">
          <div className="flex items-center space-x-2 text-sm text-[#ffff00]">
            <Info className="w-4 h-4" />
            <span className="font-mono">Escrow will be created on the blockchain</span>
          </div>
          
          <Button
            type="submit"
            disabled={isLoading}
            loading={isLoading}
            icon={ArrowRight}
            className="px-6 py-3"
          >
            {isLoading ? 'Creating...' : 'Create Escrow'}
          </Button>
        </div>
      </form>
    </Card>
  );
};

export default CreateEscrowForm;
import React, { useState } from 'react';
import { useAccount } from 'wagmi';
import { Input, Textarea, Card } from '@/components/ui';
import CreateEscrow from '@/components/transactions/CreateEscrow';
import TokenSelector from './TokenSelector';

interface CreateEscrowFormProps {
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

const CreateEscrowForm: React.FC<CreateEscrowFormProps> = ({
  onSuccess,
  onError,
}) => {
  const { address } = useAccount();
  
  // Token selection state
  const [selectedTokenSymbol, setSelectedTokenSymbol] = useState<string | null>(null);
  const [selectedTokenAddress, setSelectedTokenAddress] = useState<string>('');
  
  // Form data
  const [formData, setFormData] = useState({
    buyerAddress: '',
    sellerAddress: '',
    assetAmount: '',
    deadline: '',
    description: '',
    disputeWindowHours: '24',
  });

  // Token selection handlers
  const handleTokenSelect = (tokenSymbol: string, tokenAddress: string, decimals: number) => {
    setSelectedTokenSymbol(tokenSymbol);
    setSelectedTokenAddress(tokenAddress);
  };

  const handleCustomTokenSelect = (tokenAddress: string) => {
    setSelectedTokenSymbol('CUSTOM');
    setSelectedTokenAddress(tokenAddress);
  };

  // Form handlers
  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Calculate deadline timestamp
  const getDeadlineTimestamp = () => {
    const hours = parseInt(formData.deadline) || 24;
    return Math.floor(Date.now() / 1000) + (hours * 3600);
  };

  // Validation
  const isFormValid = () => {
    return (
      formData.buyerAddress.trim() !== '' &&
      formData.sellerAddress.trim() !== '' &&
      formData.assetAmount.trim() !== '' &&
      parseFloat(formData.assetAmount) > 0 &&
      formData.description.trim() !== '' &&
      selectedTokenAddress !== ''
    );
  };

  if (!address) {
    return (
      <Card className="p-6 bg-gray-800/50">
        <div className="text-center py-8">
          <p className="text-gray-400 font-mono">
            Please connect your wallet to create an escrow
          </p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="p-6 bg-gray-800/50">
        <div className="space-y-6">
          {/* Token Selection */}
          <TokenSelector
            selectedToken={selectedTokenSymbol}
            onTokenSelect={handleTokenSelect}
            onCustomTokenSelect={handleCustomTokenSelect}
          />

          {/* Escrow Details */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-white font-mono">Escrow Details</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Buyer Address
                </label>
                <Input
                  type="text"
                  placeholder="0x..."
                  value={formData.buyerAddress}
                  onChange={(e) => handleInputChange('buyerAddress', e)}
                  className="font-mono"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Seller Address
                </label>
                <Input
                  type="text"
                  placeholder="0x..."
                  value={formData.sellerAddress}
                  onChange={(e) => handleInputChange('sellerAddress', e)}
                  className="font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Asset Amount
                </label>
                <Input
                  type="number"
                  // step="0.000001"
                  placeholder="0.0"
                  value={formData.assetAmount}
                  onChange={(e) => handleInputChange('assetAmount', e)}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Deadline (hours)
                </label>
                <Input
                  type="number"
                  placeholder="24"
                  value={formData.deadline}
                  onChange={(e) => handleInputChange('deadline', e)}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Description
              </label>
              <Textarea
                placeholder="Describe the trade..."
                value={formData.description}
                onChange={(e) => handleInputChange('description', e)}
                rows={3}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Dispute Window (hours)
              </label>
              <Input
                type="number"
                placeholder="24"
                value={formData.disputeWindowHours}
                onChange={(e) => handleInputChange('disputeWindowHours', e)}
              />
            </div>
          </div>

          {/* Create Escrow Button */}
          {isFormValid() && (
            <CreateEscrow
              buyerAddress={formData.buyerAddress}
              sellerAddress={formData.sellerAddress}
              assetToken={selectedTokenAddress}
              assetAmount={formData.assetAmount}
              deadline={getDeadlineTimestamp()}
              description={formData.description}
              disputeWindowHours={parseInt(formData.disputeWindowHours)}
              onSuccess={onSuccess}
              onError={onError}
            />
          )}
        </div>
      </Card>
    </div>
  );
};

export default CreateEscrowForm;
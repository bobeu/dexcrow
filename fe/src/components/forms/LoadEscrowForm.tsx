import React, { useState } from 'react';
import { Search, ArrowRight } from 'lucide-react';
import { Card, Input, Button } from '../ui';

interface LoadEscrowFormProps {
  onLoadEscrow: (contractAddress: string) => void;
  isLoading: boolean;
}

const LoadEscrowForm: React.FC<LoadEscrowFormProps> = ({ onLoadEscrow, isLoading }) => {
  const [contractAddress, setContractAddress] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (contractAddress.trim()) {
      onLoadEscrow(contractAddress.trim());
    }
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setContractAddress(text);
    } catch (error) {
      console.error('Failed to paste:', error);
    }
  };

  return (
    <Card className="text-center">
      <div className="mb-6">
        <Search className="w-12 h-12 text-[#ffff00] mx-auto mb-4" />
        <h3 className="text-lg font-medium text-white mb-2 font-mono tracking-wide">
          Load Existing Escrow
        </h3>
        <p className="text-[#ffff00] font-mono">
          Enter the contract address to interact with an existing escrow
        </p>
      </div>

      <form onSubmit={handleSubmit} className="max-w-md mx-auto space-y-4">
        <div className="flex space-x-2">
          <Input
            value={contractAddress}
            onChange={setContractAddress}
            placeholder="0x..."
            required
            className="flex-1"
          />
          <Button
            type="button"
            onClick={handlePaste}
            variant="outline"
            size="md"
          >
            Paste
          </Button>
        </div>

        <Button
          type="submit"
          disabled={isLoading || !contractAddress.trim()}
          loading={isLoading}
          icon={ArrowRight}
          className="w-full"
        >
          {isLoading ? 'Loading...' : 'Load Escrow'}
        </Button>
      </form>

      <div className="mt-6 text-sm text-[#ffff00] font-mono">
        <p>You can find contract addresses in:</p>
        <ul className="mt-2 space-y-1">
          <li>• Transaction receipts</li>
          <li>• Block explorers (Etherscan, Polygonscan)</li>
          <li>• Previous escrow creation confirmations</li>
        </ul>
      </div>
    </Card>
  );
};

export default LoadEscrowForm;

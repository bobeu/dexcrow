import React, { useState } from 'react';
import { Search, ArrowRight } from 'lucide-react';

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
    <div className="text-center">
      <div className="mb-6">
        <Search className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Load Existing Escrow</h3>
        <p className="text-gray-600">Enter the contract address to interact with an existing escrow</p>
      </div>

      <form onSubmit={handleSubmit} className="max-w-md mx-auto">
        <div className="mb-4">
          <label htmlFor="contractAddress" className="block text-sm font-medium text-gray-700 mb-2">
            Contract Address
          </label>
          <div className="flex space-x-2">
            <input
              type="text"
              id="contractAddress"
              value={contractAddress}
              onChange={(e) => setContractAddress(e.target.value)}
              placeholder="0x..."
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 font-mono text-sm"
              required
            />
            <button
              type="button"
              onClick={handlePaste}
              className="px-3 py-2 text-sm text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Paste
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoading || !contractAddress.trim()}
          className="w-full flex items-center justify-center space-x-2 bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
        >
          {isLoading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              <span>Loading...</span>
            </>
          ) : (
            <>
              <span>Load Escrow</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>

      <div className="mt-6 text-sm text-gray-500">
        <p>You can find contract addresses in:</p>
        <ul className="mt-2 space-y-1">
          <li>• Transaction receipts</li>
          <li>• Block explorers (Etherscan, Polygonscan)</li>
          <li>• Previous escrow creation confirmations</li>
        </ul>
      </div>
    </div>
  );
};

export default LoadEscrowForm;

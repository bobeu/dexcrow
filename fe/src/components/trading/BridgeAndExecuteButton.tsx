"use client";

import React, { useState } from 'react';
import { useAccount } from 'wagmi';
import { 
  bridgeAndCreateOrder,
  bridgeAndDeposit,
  simulateBridgeAndCreateOrder,
  isChainSupported,
  // getContractAddress,
  // TRADEVERSE_SUPPORTED_CHAINS,
} from '@/lib/nexus';
import type { UserAssetDatum, BridgeAndExecuteResult } from '@avail-project/nexus-core';
// import { filterTransactionData } from '@/utilities';

interface BridgeAndExecuteButtonProps {
  token: UserAssetDatum;
  amount: string;
  toChainId: number;
  sourceChains?: number[];
  action: 'createOrder' | 'deposit';
  orderParams?: {
    tokenAddress: string;
    price: string;
    expirationHours: number;
  };
  onSuccess?: (result: BridgeAndExecuteResult) => void;
  onError?: (error: string) => void;
  className?: string;
  children?: React.ReactNode;
}

const BridgeAndExecuteButton: React.FC<BridgeAndExecuteButtonProps> = ({
  token,
  amount,
  toChainId,
  sourceChains,
  action,
  orderParams,
  onSuccess,
  onError,
  className = '',
  children
}) => {
  const { address, isConnected } = useAccount();
  const [isLoading, setIsLoading] = useState(false);
  const [simulation, setSimulation] = useState<any>(null);
  const [showSimulation, setShowSimulation] = useState(false);

  const handleClick = async () => {
    if (!isConnected || !address) {
      onError?.('Please connect your wallet first');
      return;
    }

    if (!isChainSupported(toChainId)) {
      onError?.(`Chain ${toChainId} is not supported by TradeVerse`);
      return;
    }

    // const contractAddress = getContractAddress(toChainId, 'TradingAccount');
    // if (!contractAddress || contractAddress === '0x0000000000000000000000000000000000000000') {
    //   onError?.(`TradingAccount contract not deployed on chain ${toChainId}`);
    //   return;
    // }

    try {
      setIsLoading(true);

      // First simulate the transaction
      let simulationResult;
      if (action === 'createOrder' && orderParams) {
        simulationResult = await simulateBridgeAndCreateOrder({
          token: token.symbol,
          amount,
          toChainId,
          sourceChains,
          tokenAddress: orderParams.tokenAddress,
          price: orderParams.price,
          expirationHours: orderParams.expirationHours,
          userAddress: address,
        });
      } else {
        // For deposit simulation, we'll use a simplified approach
        simulationResult = {
          success: true,
          totalEstimatedCost: 0,
          steps: ['Bridge tokens', 'Execute deposit'],
          metadata: {
            approvalRequired: true,
            bridgeReceiveAmount: amount,
          }
        };
      }

      if (!simulationResult.success) {
        onError?.(simulationResult.error || 'Simulation failed');
        return;
      }

      setSimulation(simulationResult);
      setShowSimulation(true);

    } catch (error) {
      console.error('Simulation error:', error);
      onError?.(error instanceof Error ? error.message : 'Simulation failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleExecute = async () => {
    if (!isConnected || !address) {
      onError?.('Please connect your wallet first');
      return;
    }

    try {
      setIsLoading(true);
      setShowSimulation(false);

      let result: BridgeAndExecuteResult;

      if (action === 'createOrder' && orderParams) {
        result = await bridgeAndCreateOrder({
          token: token.symbol,
          amount,
          toChainId,
          sourceChains,
          tokenAddress: orderParams.tokenAddress,
          price: orderParams.price,
          expirationHours: orderParams.expirationHours,
          userAddress: address,
        });
      } else {
        result = await bridgeAndDeposit({
          token: token.symbol,
          amount,
          toChainId,
          sourceChains,
          tokenAddress: orderParams?.tokenAddress || '0x0000000000000000000000000000000000000000',
          _userAddress: address,
        });
      }

      if (result.success) {
        onSuccess?.(result);
      } else {
        onError?.(result.error || 'Transaction failed');
      }

    } catch (error) {
      console.error('Execution error:', error);
      onError?.(error instanceof Error ? error.message : 'Transaction failed');
    } finally {
      setIsLoading(false);
    }
  };

  const getActionText = () => {
    if (action === 'createOrder') {
      return 'Bridge & Create Order';
    }
    return 'Bridge & Deposit';
  };

  const getChainName = (chainId: number) => {
    const names: Record<number, string> = {
      1: 'Ethereum',
      8453: 'Base',
    };
    return names[chainId] || `Chain ${chainId}`;
  };

  return (
    <>
      <button
        onClick={handleClick}
        disabled={isLoading || !isConnected}
        className={`px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
      >
        {isLoading ? (
          <div className="flex items-center space-x-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            <span>Processing...</span>
          </div>
        ) : (
          children || getActionText()
        )}
      </button>

      {/* Simulation Modal */}
      {showSimulation && simulation && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold text-gray-900">Transaction Preview</h3>
              <button
                onClick={() => setShowSimulation(false)}
                className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
              >
                ×
              </button>
            </div>

            <div className="space-y-6">
              {/* Transaction Summary */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-semibold text-gray-900 mb-3">Transaction Summary</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Action:</span>
                    <p className="font-medium">{getActionText()}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Token:</span>
                    <p className="font-medium">{token.symbol}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Amount:</span>
                    <p className="font-medium">{amount}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Destination:</span>
                    <p className="font-medium">{getChainName(toChainId)}</p>
                  </div>
                </div>
              </div>

              {/* Steps */}
              <div>
                <h4 className="font-semibold text-gray-900 mb-3">Transaction Steps</h4>
                <div className="space-y-2">
                  {simulation.steps?.map((step: string, index: number) => (
                    <div key={index} className="flex items-center space-x-3">
                      <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium">
                        {index + 1}
                      </div>
                      <span className="text-gray-700">{step}</span>
                    </div>
                  )) || (
                    <div className="flex items-center space-x-3">
                      <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium">
                        1
                      </div>
                      <span className="text-gray-700">Bridge {token.symbol} to {getChainName(toChainId)}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Cost Estimation */}
              {simulation.totalEstimatedCost !== undefined && (
                <div className="bg-yellow-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-gray-900 mb-2">Estimated Cost</h4>
                  <p className="text-sm text-gray-700">
                    Total estimated cost: {simulation.totalEstimatedCost} ETH
                  </p>
                  {simulation.metadata?.approvalRequired && (
                    <p className="text-sm text-yellow-600 mt-1">
                      ⚠️ Token approval required
                    </p>
                  )}
                </div>
              )}

              {/* Bridge Information */}
              {simulation.metadata?.bridgeReceiveAmount && (
                <div className="bg-green-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-gray-900 mb-2">Bridge Information</h4>
                  <p className="text-sm text-gray-700">
                    You will receive: {simulation.metadata.bridgeReceiveAmount} {token.symbol}
                  </p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                <button
                  onClick={() => setShowSimulation(false)}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleExecute}
                  disabled={isLoading}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? 'Executing...' : 'Execute Transaction'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default BridgeAndExecuteButton;

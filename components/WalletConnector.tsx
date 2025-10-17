'use client';

import React from 'react';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount, useDisconnect } from 'wagmi';
import { Wallet, Copy, Check } from 'lucide-react';

interface WalletConnectorProps {
  onConnect: (address: string) => void;
  walletAddress: string;
}

const WalletConnector: React.FC<WalletConnectorProps> = ({ onConnect, walletAddress }) => {
  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();
  const [copied, setCopied] = React.useState(false);

  // Update parent component when wallet connects/disconnects
  React.useEffect(() => {
    if (isConnected && address) {
      onConnect(address);
    } else if (!isConnected) {
      onConnect('');
    }
  }, [isConnected, address, onConnect]);

  const handleCopy = async () => {
    if (address) {
      try {
        await navigator.clipboard.writeText(address);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (error) {
        console.error('Failed to copy address:', error);
      }
    }
  };

  return (
    <div className="mb-6 p-4 bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="flex items-center space-x-3 mb-4">
        <Wallet className="w-5 h-5 text-gray-600" />
        <h3 className="text-lg font-medium text-gray-900">Connect Wallet</h3>
      </div>
      
      <div className="flex flex-col items-center space-y-4">
        <ConnectButton 
          chainStatus="icon"
          accountStatus={{
            smallScreen: 'avatar',
            largeScreen: 'full',
          }}
          showBalance={{
            smallScreen: false,
            largeScreen: true,
          }}
        />
        
        {isConnected && address && (
          <div className="w-full p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-green-800 font-medium">Wallet Connected</span>
              </div>
              <button
                onClick={() => disconnect()}
                className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded-md hover:bg-red-200 transition-colors"
              >
                Disconnect
              </button>
            </div>
            
            <div className="p-3 bg-white rounded border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Address:</p>
                  <p className="font-mono text-sm break-all">
                    {address.substring(0, 6)}...{address.substring(address.length - 4)}
                  </p>
                </div>
                <button
                  onClick={handleCopy}
                  className="flex items-center space-x-1 px-3 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
                >
                  {copied ? (
                    <>
                      <Check className="w-3 h-3 text-green-600" />
                      <span className="text-green-600">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
        
        {!isConnected && (
          <p className="text-sm text-gray-600 text-center">
            Connect your wallet to start using the escrow system
          </p>
        )}
      </div>
    </div>
  );
};

export default WalletConnector;
import React from 'react';
import { Shield, Users, Gavel, Zap } from 'lucide-react';

const Header: React.FC = () => {
  return (
    <header className="bg-white shadow-lg border-b border-gray-200">
      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Shield className="w-8 h-8 text-indigo-600" />
              <h1 className="text-2xl font-bold text-gray-900">
                Decentralized Escrow
              </h1>
            </div>
            <div className="hidden md:flex items-center space-x-1 text-sm text-gray-500">
              <span>•</span>
              <span>Secure</span>
              <span>•</span>
              <span>Trustless</span>
              <span>•</span>
              <span>Decentralized</span>
            </div>
          </div>
          
          <div className="flex items-center space-x-6">
            <div className="hidden md:flex items-center space-x-4 text-sm text-gray-600">
              <div className="flex items-center space-x-1">
                <Users className="w-4 h-4" />
                <span>Multi-Chain</span>
              </div>
              <div className="flex items-center space-x-1">
                <Gavel className="w-4 h-4" />
                <span>Arbitration</span>
              </div>
              <div className="flex items-center space-x-1">
                <Zap className="w-4 h-4" />
                <span>Fast Settlement</span>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm text-gray-600">Live</span>
            </div>
          </div>
        </div>
        
        <div className="mt-4 text-center">
          <p className="text-gray-600 max-w-2xl mx-auto">
            Secure peer-to-peer transactions with smart contract escrow, 
            multi-chain support, and decentralized arbitration
          </p>
        </div>
      </div>
    </header>
  );
};

export default Header;

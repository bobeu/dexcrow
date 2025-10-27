import React from 'react';
import ConnectWalletButton from '@/components/actions/ConnectButton';

const Header: React.FC = () => {
  return (
    <header className="bg-[#1a1a1a] border-b border-[#333] relative overflow-hidden">
      {/* Background Grid Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: `
            linear-gradient(rgba(255, 255, 0, 0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255, 255, 0, 0.1) 1px, transparent 1px)
          `,
          backgroundSize: '20px 20px'
        }}></div>
      </div>
      
      <div className="max-w-6xl mx-auto px-4 py-6 relative z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              {/* <Shield className="w-8 h-8 text-[#ffff00]" /> */}
              <div className="w-12 h-12 bg-[#ffff00] rounded-lg flex items-center justify-center mx-auto mb-3">
                <span className="text-[#1a1a1a] font-bold text-xl font-mono">T</span>
              </div>
              <h1 className="text-2xl md:text-3xl font-bold text-white font-mono tracking-wide">
                Tradeverse
              </h1>
            </div>
          </div>
          
          <div className="flex items-center space-x-6">
            
            {/* Connect Wallet Button */}
            <ConnectWalletButton className="px-6 py-3 bg-[#ffff00] text-[#1a1a1a] rounded-lg hover:bg-[#e6e600] transition-colors font-bold font-mono tracking-wide" />
          </div>
        </div>
        
        <div className="mt-4 text-center">
          <p className="text-[#ffff00] max-w-2xl mx-auto font-mono">
            Secure peer-to-peer transactions with smart contract escrow, 
            multi-chain support, and decentralized arbitration
          </p>
        </div>
      </div>
    </header>
  );
};

export default Header;

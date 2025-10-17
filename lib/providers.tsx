'use client';

import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WagmiProvider } from 'wagmi';
import { RainbowKitProvider, getDefaultConfig } from '@rainbow-me/rainbowkit';
import { mainnet, polygon, arbitrum, optimism, base, sepolia, hardhat, bsc, avalanche, celo } from 'wagmi/chains';
import { http } from 'viem';

// Import wallet connectors
import {
  metaMaskWallet,
  walletConnectWallet,
  coinbaseWallet,
  injectedWallet,
  rainbowWallet,
  trustWallet,
  ledgerWallet,
} from '@rainbow-me/rainbowkit/wallets';

// Configure chains - TradeVerse supports multiple chains for trading
const chains = [
  mainnet,      // Ethereum Mainnet
  polygon,      // Polygon
  arbitrum,     // Arbitrum One
  optimism,     // Optimism
  base,         // Base
  bsc,          // BNB Smart Chain
  avalanche,    // Avalanche C-Chain
  celo,         // Celo
  sepolia,      // Ethereum Sepolia (testnet)
  hardhat,      // Hardhat (local development)
] as const;

// Configure transports for all supported chains
const transports = {
  [mainnet.id]: http(process.env.NEXT_PUBLIC_MAINNET_RPC_URL || 'https://eth-mainnet.g.alchemy.com/v2/demo'),
  [polygon.id]: http(process.env.NEXT_PUBLIC_POLYGON_RPC_URL || 'https://polygon-mainnet.g.alchemy.com/v2/demo'),
  [arbitrum.id]: http(process.env.NEXT_PUBLIC_ARBITRUM_RPC_URL || 'https://arb-mainnet.g.alchemy.com/v2/demo'),
  [optimism.id]: http(process.env.NEXT_PUBLIC_OPTIMISM_RPC_URL || 'https://opt-mainnet.g.alchemy.com/v2/demo'),
  [base.id]: http(process.env.NEXT_PUBLIC_BASE_RPC_URL || 'https://base-mainnet.g.alchemy.com/v2/demo'),
  [bsc.id]: http(process.env.NEXT_PUBLIC_BSC_RPC_URL || 'https://bsc-dataseed.binance.org'),
  [avalanche.id]: http(process.env.NEXT_PUBLIC_AVALANCHE_RPC_URL || 'https://api.avax.network/ext/bc/C/rpc'),
  [celo.id]: http(process.env.NEXT_PUBLIC_CELO_RPC_URL || 'https://forno.celo.org'),
  [sepolia.id]: http(process.env.NEXT_PUBLIC_SEPOLIA_RPC_URL || 'https://eth-sepolia.g.alchemy.com/v2/demo'),
  [hardhat.id]: http(process.env.NEXT_PUBLIC_RPC_URL || 'http://localhost:8545'),
};

// Configure wallets
const wallets = [
  {
    groupName: 'Popular',
    wallets: [
      metaMaskWallet,
      walletConnectWallet,
      coinbaseWallet,
      rainbowWallet,
    ],
  },
  {
    groupName: 'More',
    wallets: [
      injectedWallet,
      trustWallet,
      ledgerWallet,
    ],
  },
];

// Create Wagmi config for TradeVerse
const config = getDefaultConfig({
  appName: 'TradeVerse - Decentralized Trading Platform',
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || 'your-project-id',
  chains,
  transports,
  wallets,
  ssr: true, // Enable server-side rendering
});

// Create query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 3,
    },
  },
});

// RainbowKit theme - using default theme for now
const rainbowKitTheme = undefined;

interface ProvidersProps {
  children: React.ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider
          theme={rainbowKitTheme}
          appInfo={{
            appName: 'TradeVerse',
            learnMoreUrl: 'https://rainbowkit.com',
            disclaimer: ({ Text, Link }) => (
              <Text>
                By connecting your wallet, you agree to the{' '}
                <Link href="https://rainbowkit.com/terms">Terms of Service</Link> and{' '}
                <Link href="https://rainbowkit.com/privacy">Privacy Policy</Link>
              </Text>
            ),
          }}
          initialChain={mainnet}
        >
          {children}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}

export { config };

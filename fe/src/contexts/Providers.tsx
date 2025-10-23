'use client';

import React, { useEffect, useState } from "react";
import { http, WagmiProvider, useConnect, useAccount } from "wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RainbowKitProvider, getDefaultConfig, lightTheme, } from "@rainbow-me/rainbowkit";
import { 
    celo,
    celoSepolia, 
    base, 
    baseSepolia, 
    sepolia,
    mainnet,
} from "wagmi/chains";
import DataProvider from "./DataProvider";
// import dotenv from "dotenv";

// dotenv.config();
const projectId = process.env.NEXT_PUBLIC_PROJECT_ID as string;
console.log("process.env.NEXT_PUBLIC_PROJECT_ID", process.env.NEXT_PUBLIC_PROJECT_ID);

// Provide a fallback project ID for development
const fallbackProjectId = "your_walletconnect_project_id_here";
const finalProjectId = projectId || fallbackProjectId;

if (!finalProjectId || finalProjectId === fallbackProjectId) {
  console.warn('⚠️  NEXT_PUBLIC_PROJECT_ID is not set. Please create a .env.local file with your WalletConnect Project ID from https://cloud.walletconnect.com/');
}

export default function Providers({ children }: { children: React.ReactNode }) {
  // Load the default config from RainbowKit
  const config = getDefaultConfig({
    appName: 'Decentralized Escrow',
    projectId: finalProjectId,
    appIcon: 'https://learna.vercel.app/learna-logo.png',
    appDescription: "Decentralized trading universe",
    appUrl: "https://tradeverse.vercel.app",
    chains: [celoSepolia, celo, sepolia, mainnet, baseSepolia, base],
    ssr: true,
    multiInjectedProviderDiscovery: true,
    pollingInterval: 10_000,
    syncConnectedChain: true,
    transports: {
      [celoSepolia.id]: http(),
      [celo.id]: http(),
      [baseSepolia.id]: http(),
      [base.id]: http(),
      [sepolia.id]: http(),
      [mainnet.id]: http(),
    },
  });

  // Dark theme configuration for RainbowKit wallet set up
  const theme = lightTheme(
    {
      ...lightTheme.accentColors.purple,
      accentColorForeground: '#1a1a1a',
      borderRadius: 'large',
      fontStack: 'system',
      overlayBlur: 'small',
      accentColor: '#ffff00'
    }
  );
  
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={new QueryClient()}>
        <RainbowKitProvider 
          coolMode={true}
          modalSize="compact" 
          theme={theme} 
          initialChain={celo.id} 
          showRecentTransactions={true}
          appInfo={{
            appName: "TradeVerse",
            learnMoreUrl: 'https://tradever.vercel.app'
          }}
        >
          <DataProvider>
            { children }
          </DataProvider>
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}

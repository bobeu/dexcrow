// 'use client';

// import React from "react";
// import { http, WagmiProvider } from "wagmi";
// import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
// import { RainbowKitProvider, getDefaultConfig, lightTheme, } from "@rainbow-me/rainbowkit";
// import { base, baseSepolia } from "wagmi/chains";
// import DataProvider from "./DataProvider";
// import { NexusProvider } from "@avail-project/nexus-widgets";
// // import dotenv from "dotenv";

// // dotenv.config();
// const projectId = process.env.NEXT_PUBLIC_PROJECT_ID as string;
// console.log("process.env.NEXT_PUBLIC_PROJECT_ID", process.env.NEXT_PUBLIC_PROJECT_ID);

// // Provide a fallback project ID for development
// const fallbackProjectId = "your_walletconnect_project_id_here";
// const finalProjectId = projectId || fallbackProjectId;

// if (!finalProjectId || finalProjectId === fallbackProjectId) {
//   console.warn('⚠️  NEXT_PUBLIC_PROJECT_ID is not set. Please create a .env.local file with your WalletConnect Project ID from https://cloud.walletconnect.com/');
// }

// export default function Providers({ children }: { children: React.ReactNode }) {
//   // Load the default config from RainbowKit
//   const config = getDefaultConfig({
//     appName: 'Tradeverse',
//     projectId: finalProjectId,
//     appIcon: 'https://dexcrow.vercel.app/dexcrow-logo.png',
//     appDescription: "Decentralized trading universe",
//     appUrl: "https://tradeverse.vercel.app",
//     chains: [baseSepolia, base],
//     ssr: true,
//     multiInjectedProviderDiscovery: true,
//     pollingInterval: 10_000,
//     syncConnectedChain: true,
//     transports: {
//       [baseSepolia.id]: http(),
//       [base.id]: http(),
//     },
//   });

//   // Dark theme configuration for RainbowKit wallet set up
//   const theme = lightTheme(
//     {
//       ...lightTheme.accentColors.purple,
//       accentColorForeground: '#1a1a1a',
//       borderRadius: 'large',
//       fontStack: 'system',
//       overlayBlur: 'small',
//       accentColor: '#ffff00'
//     }
//   );
  
//   return (
//     <WagmiProvider config={config}>
//       <QueryClientProvider client={new QueryClient()}>
//         <RainbowKitProvider 
//           coolMode={true}
//           modalSize="compact" 
//           theme={theme} 
//           initialChain={baseSepolia.id} 
//           showRecentTransactions={true}
//           appInfo={{
//             appName: "TradeVerse",
//             learnMoreUrl: 'https://tradever.vercel.app'
//           }}
//         >
//           <DataProvider>
//             { children }
//           </DataProvider>
//         </RainbowKitProvider>
//       </QueryClientProvider>
//     </WagmiProvider>
//   );
// }





















"use client";
import { WagmiProvider, createConfig, http } from "wagmi";
import { mainnet, base, sepolia, baseSepolia } from "wagmi/chains";
// import { ConnectKitProvider, getDefaultConfig } from "connectkit";
import { RainbowKitProvider, getDefaultConfig, lightTheme, } from "@rainbow-me/rainbowkit";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import NexusProvider from "./NexusProvider";
import DataProvider from "./DataProvider";

// const walletConnectProjectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID;

// const config = createConfig(
//   getDefaultConfig({
//     chains: [ mainnet, base, sepolia, baseSepolia ],
//     transports: {
//       [mainnet.id]: http(mainnet.rpcUrls.default.http[0]),
//       [base.id]: http(base.rpcUrls.default.http[0]),
//       [sepolia.id]: http(sepolia.rpcUrls.default.http[0]),
//       [baseSepolia.id]: http(baseSepolia.rpcUrls.default.http[0]),
//     },
//     // walletConnectProjectId: walletConnectProjectId!,
//     /**
//      * Uncomment above and comment below to use env variable for WalletConnect Project ID
//      * Note : Make sure to set NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID in your .env file. We use hardhoded value for demo purposes
//      * because we're having issues with env variable loading in some environments. This hardcoded value is public and safe to use in client-side code.
//      * However, for production, it's recommended to use your own WalletConnect Project ID. We will remove it before going to production.
//      */      
//     walletConnectProjectId: ,
//     appName: "Tradeverse",
//     appDescription: "Decentralized trading universe", 
//     appUrl: "https://tradeverse.vercel.app",
//     appIcon: "https://dexcrow.vercel.app/dexcrow-logo.png",
//   }),
// );
const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID as string;
// console.log("NEXT_PUBLIC_PROJECT_ID", process.env);
// console.log("NEXT_PUBLIC_FAST_REFRESH", process.env.NEXT_PUBLIC_FAST_REFRESH);
// console.log("CELOSCAN_API", process.env.CELOSCAN_API);

// Provide a fallback project ID for development
const fallbackProjectId = "your_walletconnect_project_id_here";
const finalProjectId = projectId || fallbackProjectId;

if (!finalProjectId || finalProjectId === fallbackProjectId) {
  console.warn('⚠️  NEXT_PUBLIC_PROJECT_ID is not set. Please create a .env.local file with your WalletConnect Project ID from https://cloud.walletconnect.com/');
}
const queryClient = new QueryClient();

// projectId: walletConnectProjectId!,
/**
 * Uncomment above and comment below to use env variable for WalletConnect Project ID
 * Note : Make sure to set NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID in your .env file. We use hardhoded value for demo purposes
 * because we're having issues with env variable loading in some environments. This hardcoded value is public and safe to use in client-side code.
 * However, for production, it's recommended to use your own WalletConnect Project ID. We will remove it before going to production.
 */ 
const config = getDefaultConfig({
  appName: 'Tradeverse',
  projectId: finalProjectId,
  appIcon: 'https://dexcrow.vercel.app/dexcrow-logo.png',
  appDescription: "Decentralized trading universe",
  appUrl: "https://dexcrow.vercel.app",
  chains: [mainnet, sepolia, baseSepolia, base],
  ssr: true,
  multiInjectedProviderDiscovery: true,
  pollingInterval: 10_000,
  syncConnectedChain: true,
  transports: {
    [mainnet.id]: http(),
    [sepolia.id]: http(),
    [baseSepolia.id]: http(),
    [base.id]: http(),
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

const Web3Provider = ({ children }: { children: React.ReactNode }) => {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider 
          coolMode={true}
          modalSize="compact" 
          theme={theme} 
          initialChain={baseSepolia.id} 
          showRecentTransactions={true}
          appInfo={{
            appName: "TradeVerse",
            learnMoreUrl: 'https://tradever.vercel.app'
          }}
        >
          <NexusProvider>
            <DataProvider>
              {children}
            </DataProvider>
          </NexusProvider>
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
};

export default Web3Provider;
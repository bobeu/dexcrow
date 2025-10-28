// Re-export from NexusManager for backward compatibility
export { 
  NexusManager,
  TRADEVERSE_SUPPORTED_CHAINS,
  SUPPORTED_TOKENS,
  TOKEN_METADATA,
} from './nexus/NexusManager';

import { type UserAssetDatum, type BridgeParams, type BridgeResult, type BridgeAndExecuteResult, type SimulationResult, type BridgeAndExecuteSimulationResult, NexusSDK } from '@avail-project/nexus-core';
import { NexusManager } from './nexus/NexusManager';
   
// Balance functions
export async function getUnifiedBalances(nexusManager: NexusManager, sdk: NexusSDK): Promise<UserAssetDatum[]> {
  return await nexusManager.getUnifiedBalances(sdk);
}

export async function getUnifiedBalance(symbol: string, nexusManager: NexusManager, sdk: NexusSDK): Promise<UserAssetDatum | undefined> {
  return await nexusManager.getUnifiedBalance(symbol, sdk);
}

// Bridge functions
export async function bridge(params: BridgeParams, nexusManager: NexusManager, sdk: NexusSDK): Promise<BridgeResult | undefined> {
  return await nexusManager.bridge(params, sdk);
}

export async function simulateBridge(params: BridgeParams, nexusManager: NexusManager, sdk: NexusSDK): Promise<SimulationResult | undefined> {
  return await nexusManager.simulateBridge(params, sdk);
}

// Bridge and Execute functions for TradingAccount operations
export async function bridgeAndCreateOrder(params: {
  token: string;
  amount: string;
  toChainId: number;
  sourceChains?: number[];
  tokenAddress: string;
  price: string;
  expirationHours: number;
  userAddress: string;
}, nexusManager: NexusManager, sdk: NexusSDK): Promise<BridgeAndExecuteResult | undefined> {
  return await nexusManager.bridgeAndCreateOrder(params, sdk);
}

export async function bridgeAndDeposit(params: {
  token: string;
  amount: string;
  toChainId: number;
  sourceChains?: number[];
  tokenAddress: string;
  _userAddress: string;
},nexusManager: NexusManager, sdk: NexusSDK): Promise<BridgeAndExecuteResult | undefined> {
  return await nexusManager.bridgeAndDeposit(params, sdk);
}

// Simulation functions
export async function simulateBridgeAndCreateOrder(params: {
  token: string;
  amount: string;
  toChainId: number;
  sourceChains?: number[];
  tokenAddress: string;
  price: string;
  expirationHours: number;
  userAddress: string;
}, nexusManager: NexusManager, sdk: NexusSDK): Promise<BridgeAndExecuteSimulationResult | undefined> {
  return await nexusManager.simulateBridgeAndCreateOrder(params, sdk);
}

// Utility functions
export function isTokenSupported(tokenSymbol: string, nexusManager: NexusManager): boolean {
  return nexusManager.isTokenSupported(tokenSymbol);
}

export function isChainSupported(chainId: number, nexusManager: NexusManager): boolean {
  return nexusManager.isChainSupported(chainId);
}

export function getTokenMetadata(symbol: string, nexusManager: NexusManager) {
  return nexusManager.getTokenMetadata(symbol);
}

// Bridge and Execute functions for EscrowFactory operations
export async function bridgeAndCreateEscrow(params: {
  token: string;
  amount: string;
  toChainId: number;
  sourceChains?: number[];
  buyerAddress: string;
  sellerAddress: string;
  assetToken: string;
  assetAmount: string;
  deadline: number;
  description: string;
  disputeWindowHours: number;
  userAddress: string;
}, nexusManager: NexusManager, sdk: NexusSDK): Promise<BridgeAndExecuteResult | undefined> {
  return await nexusManager.bridgeAndCreateEscrow(params, sdk);
}

export async function simulateBridgeAndCreateEscrow(params: {
  token: string;
  amount: string;
  toChainId: number;
  sourceChains?: number[];
  buyerAddress: string;
  sellerAddress: string;
  assetToken: string;
  assetAmount: string;
  deadline: number;
  description: string;
  disputeWindowHours: number;
  userAddress: string;
}, nexusManager: NexusManager, sdk: NexusSDK): Promise<BridgeAndExecuteSimulationResult | undefined> {
  return await nexusManager.simulateBridgeAndCreateEscrow(params, sdk);
}
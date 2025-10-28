// Re-export from NexusManager for backward compatibility
export { 
  nexusManager,
  NexusManager,
  TRADEVERSE_SUPPORTED_CHAINS,
  SUPPORTED_TOKENS,
  TOKEN_METADATA,
} from './nexus/NexusManager';

import { nexusManager } from './nexus/NexusManager';
import type { UserAssetDatum, BridgeParams, BridgeResult, BridgeAndExecuteResult, SimulationResult, BridgeAndExecuteSimulationResult } from '@avail-project/nexus-core';
import { EIP1193Provider } from 'viem';

// Backward compatibility functions
export const getSdk = (chainId: number = 8453) => {
  return nexusManager;
};

// Backward compatibility functions using the NexusManager

// Core SDK functions
export function isInitialized(chainId?: number): boolean {
    return nexusManager.initialized;
}
   
export async function initializeWithProvider(provider: EIP1193Provider, chainId?: number): Promise<void> {
  if (chainId) {
    await nexusManager.updateChainId(chainId);
  }
  await nexusManager.initialize(provider);
}
   
export async function deinit(): Promise<void> {
  await nexusManager.deinitialize();
}
   
// Balance functions
export async function getUnifiedBalances(): Promise<UserAssetDatum[]> {
  return await nexusManager.getUnifiedBalances();
}

export async function getUnifiedBalance(symbol: string): Promise<UserAssetDatum | undefined> {
  return await nexusManager.getUnifiedBalance(symbol);
}

// Bridge functions
export async function bridge(params: BridgeParams): Promise<BridgeResult> {
  return await nexusManager.bridge(params);
}

export async function simulateBridge(params: BridgeParams): Promise<SimulationResult> {
  return await nexusManager.simulateBridge(params);
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
}): Promise<BridgeAndExecuteResult> {
  return await nexusManager.bridgeAndCreateOrder(params);
}

export async function bridgeAndDeposit(params: {
  token: string;
  amount: string;
  toChainId: number;
  sourceChains?: number[];
  tokenAddress: string;
  _userAddress: string;
}): Promise<BridgeAndExecuteResult> {
  return await nexusManager.bridgeAndDeposit(params);
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
}): Promise<BridgeAndExecuteSimulationResult> {
  return await nexusManager.simulateBridgeAndCreateOrder(params);
}

// Utility functions
export function isTokenSupported(tokenSymbol: string): boolean {
  return nexusManager.isTokenSupported(tokenSymbol);
}

export function isChainSupported(chainId: number): boolean {
  return nexusManager.isChainSupported(chainId);
}

export function getTokenMetadata(symbol: string) {
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
}): Promise<BridgeAndExecuteResult> {
  return await nexusManager.bridgeAndCreateEscrow(params);
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
}): Promise<BridgeAndExecuteSimulationResult> {
  return await nexusManager.simulateBridgeAndCreateEscrow(params);
}
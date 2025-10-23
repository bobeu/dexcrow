import { 
  NexusSDK, 
  type UserAssetDatum,
  type BridgeParams,
  type BridgeResult,
  type BridgeAndExecuteParams,
  type BridgeAndExecuteResult,
  type SimulationResult,
  type BridgeAndExecuteSimulationResult,
  type ExecuteParams,
  type ExecuteResult,
  type ExecuteSimulation,
  SUPPORTED_CHAINS_IDS
} from '@avail-project/nexus-core';
import { parseUnits } from 'viem';

// Initialize SDK with mainnet for production
export const sdk = new NexusSDK({ network: 'mainnet' });

// TradeVerse supported chains
export const TRADEVERSE_SUPPORTED_CHAINS = {
  ETHEREUM: 1,
  BASE: 8453,
} as const;

// Supported tokens as per PROMPT.md
export const SUPPORTED_TOKENS = {
  ETH: 'ETH',
  USDC: 'USDC', 
  USDT: 'USDT',
} as const;

// Token metadata
export const TOKEN_METADATA = {
  [SUPPORTED_TOKENS.ETH]: { decimals: 18, name: 'Ethereum', symbol: 'ETH' },
  [SUPPORTED_TOKENS.USDC]: { decimals: 6, name: 'USD Coin', symbol: 'USDC' },
  [SUPPORTED_TOKENS.USDT]: { decimals: 6, name: 'Tether USD', symbol: 'USDT' },
} as const;

// Contract addresses for TradeFactory and TradingAccount (these would be deployed addresses)
export const CONTRACT_ADDRESSES = {
  [TRADEVERSE_SUPPORTED_CHAINS.ETHEREUM]: {
    TradeFactory: '0x0000000000000000000000000000000000000000', // Replace with actual address
    TradingAccount: '0x0000000000000000000000000000000000000000', // Replace with actual address
  },
  [TRADEVERSE_SUPPORTED_CHAINS.BASE]: {
    TradeFactory: '0x0000000000000000000000000000000000000000', // Replace with actual address
    TradingAccount: '0x0000000000000000000000000000000000000000', // Replace with actual address
  },
} as const;

// Contract ABIs
export const TRADING_ACCOUNT_ABI = [
  {
    inputs: [
      { internalType: 'address', name: 'tokenAddress', type: 'address' },
      { internalType: 'uint256', name: 'amount', type: 'uint256' },
      { internalType: 'uint256', name: 'price', type: 'uint256' },
      { internalType: 'uint256', name: 'expirationHours', type: 'uint256' }
    ],
    name: 'createOrder',
    outputs: [{ internalType: 'bool', name: '', type: 'bool' }],
    stateMutability: 'payable',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'address', name: 'token', type: 'address' }
    ],
    name: 'deposit',
    outputs: [{ internalType: 'bool', name: '', type: 'bool' }],
    stateMutability: 'payable',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'bytes32', name: 'orderId', type: 'bytes32' }
    ],
    name: 'cancelOrder',
    outputs: [{ internalType: 'bool', name: '', type: 'bool' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
] as const;

export const TRADE_FACTORY_ABI = [
  {
    inputs: [
      { internalType: 'address', name: 'agent', type: 'address' },
      { internalType: 'string', name: 'nickName', type: 'string' }
    ],
    name: 'createTradingAccount',
    outputs: [{ internalType: 'address', name: 'account', type: 'address' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
] as const;

// Core SDK functions
export function isInitialized(): boolean {
    return sdk.isInitialized();
  }
   
export async function initializeWithProvider(provider: any): Promise<void> {
    if (!provider) throw new Error('No EIP-1193 provider (e.g., MetaMask) found');
    
    if (sdk.isInitialized()) return;
   
    await sdk.initialize(provider);
  }
   
export async function deinit(): Promise<void> {
    if (!sdk.isInitialized()) return;
   
    await sdk.deinit();
  }
   
// Balance functions
export async function getUnifiedBalances(): Promise<UserAssetDatum[]> {
  if (!sdk.isInitialized()) throw new Error('SDK not initialized');
    return await sdk.getUnifiedBalances();
}

export async function getUnifiedBalance(symbol: string): Promise<UserAssetDatum | undefined> {
  if (!sdk.isInitialized()) throw new Error('SDK not initialized');
  return await sdk.getUnifiedBalance(symbol);
}

// Bridge functions
export async function bridge(params: BridgeParams): Promise<BridgeResult> {
  if (!sdk.isInitialized()) throw new Error('SDK not initialized');
  return await sdk.bridge(params);
}

export async function simulateBridge(params: BridgeParams): Promise<SimulationResult> {
  if (!sdk.isInitialized()) throw new Error('SDK not initialized');
  return await sdk.simulateBridge(params);
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
  if (!sdk.isInitialized()) throw new Error('SDK not initialized');

  const contractAddress = CONTRACT_ADDRESSES[params.toChainId as keyof typeof CONTRACT_ADDRESSES]?.TradingAccount;
  if (!contractAddress) throw new Error(`No contract address found for chain ${params.toChainId}`);

  const bridgeAndExecuteParams: BridgeAndExecuteParams = {
    token: params.token as any,
    amount: params.amount,
    toChainId: params.toChainId as SUPPORTED_CHAINS_IDS,
    sourceChains: params.sourceChains,
    execute: {
      contractAddress,
      contractAbi: TRADING_ACCOUNT_ABI,
      functionName: 'createOrder',
      buildFunctionParams: (token, amount, chainId, userAddress) => {
        const decimals = TOKEN_METADATA[token as keyof typeof TOKEN_METADATA]?.decimals || 18;
        const amountWei = parseUnits(amount, decimals);
        return {
          functionParams: [params.tokenAddress, amountWei, parseUnits(params.price, 18), params.expirationHours],
        };
      },
      tokenApproval: {
        token: params.token as any,
        amount: params.amount,
      },
    },
    waitForReceipt: true,
  };

  return await sdk.bridgeAndExecute(bridgeAndExecuteParams);
}

export async function bridgeAndDeposit(params: {
  token: string;
  amount: string;
  toChainId: number;
  sourceChains?: number[];
  tokenAddress: string;
  userAddress: string;
}): Promise<BridgeAndExecuteResult> {
  if (!sdk.isInitialized()) throw new Error('SDK not initialized');

  const contractAddress = CONTRACT_ADDRESSES[params.toChainId as keyof typeof CONTRACT_ADDRESSES]?.TradingAccount;
  if (!contractAddress) throw new Error(`No contract address found for chain ${params.toChainId}`);

  const bridgeAndExecuteParams: BridgeAndExecuteParams = {
    token: params.token as any,
    amount: params.amount,
    toChainId: params.toChainId as SUPPORTED_CHAINS_IDS,
    sourceChains: params.sourceChains,
    execute: {
      contractAddress,
      contractAbi: TRADING_ACCOUNT_ABI,
      functionName: 'deposit',
      buildFunctionParams: (token, amount, chainId, userAddress) => {
        return {
          functionParams: [params.tokenAddress],
        };
      },
      tokenApproval: {
        token: params.token as any,
        amount: params.amount,
      },
    },
    waitForReceipt: true,
  };

  return await sdk.bridgeAndExecute(bridgeAndExecuteParams);
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
  if (!sdk.isInitialized()) throw new Error('SDK not initialized');

  const contractAddress = CONTRACT_ADDRESSES[params.toChainId as keyof typeof CONTRACT_ADDRESSES]?.TradingAccount;
  if (!contractAddress) throw new Error(`No contract address found for chain ${params.toChainId}`);

  const bridgeAndExecuteParams: BridgeAndExecuteParams = {
    token: params.token as any,
    amount: params.amount,
    toChainId: params.toChainId as SUPPORTED_CHAINS_IDS,
    sourceChains: params.sourceChains,
    execute: {
      contractAddress,
      contractAbi: TRADING_ACCOUNT_ABI,
      functionName: 'createOrder',
      buildFunctionParams: (token, amount, chainId, userAddress) => {
        const decimals = TOKEN_METADATA[token as keyof typeof TOKEN_METADATA]?.decimals || 18;
        const amountWei = parseUnits(amount, decimals);
        return {
          functionParams: [params.tokenAddress, amountWei, parseUnits(params.price, 18), params.expirationHours],
        };
      },
      tokenApproval: {
        token: params.token as any,
        amount: params.amount,
      },
    },
    waitForReceipt: true,
  };

  return await sdk.simulateBridgeAndExecute(bridgeAndExecuteParams);
}

// Utility functions
export function isTokenSupported(tokenSymbol: string): boolean {
  return Object.values(SUPPORTED_TOKENS).includes(tokenSymbol as any);
}

export function isChainSupported(chainId: number): boolean {
  return Object.values(TRADEVERSE_SUPPORTED_CHAINS).includes(chainId as any);
}

export function getTokenMetadata(symbol: string) {
  return TOKEN_METADATA[symbol as keyof typeof TOKEN_METADATA];
}

export function getContractAddress(chainId: number, contractType: 'TradeFactory' | 'TradingAccount'): string | undefined {
  return CONTRACT_ADDRESSES[chainId as keyof typeof CONTRACT_ADDRESSES]?.[contractType];
  }
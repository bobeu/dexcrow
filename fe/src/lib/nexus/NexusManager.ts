/**eslint-disable */
import { filterTransactionData } from '@/utilities';
import { 
  NexusSDK, 
  type UserAssetDatum,
  type BridgeParams,
  type BridgeResult,
  type BridgeAndExecuteParams,
  type BridgeAndExecuteResult,
  type SimulationResult,
  type BridgeAndExecuteSimulationResult,
  SUPPORTED_CHAINS_IDS,
} from '@avail-project/nexus-core';
import { parseUnits } from 'viem';
import { mockUnifiedBalances } from '../types/mockdata';

// TradeVerse supported chains
export const TRADEVERSE_SUPPORTED_CHAINS = [
  1,
  8453,
  84532
];

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

export class NexusManager {
  private chainId: number;

  constructor(chainId: number = 8453) {
    this.chainId = chainId;
  }

  // Get unified balances across all chains
  async getUnifiedBalances(sdk: NexusSDK): Promise<UserAssetDatum[]> {
    let unifiedBalances = [mockUnifiedBalances];
    if (sdk.isInitialized()) {
      unifiedBalances = await sdk.getUnifiedBalances();
    }
    return unifiedBalances;
  }

  // Get unified balance for a specific token
  async getUnifiedBalance(symbol: string, sdk: NexusSDK): Promise<UserAssetDatum | undefined> {
    let unifiedBalance : UserAssetDatum | undefined = mockUnifiedBalances;
    if(sdk.isInitialized()) {
      unifiedBalance = await sdk.getUnifiedBalance(symbol);
    }
    return unifiedBalance;
  }

  // Bridge tokens
  async bridge(params: BridgeParams, sdk: NexusSDK): Promise<BridgeResult | undefined> {
    if(!sdk.isInitialized()) return;
    return await sdk.bridge(params);
  }

  // Simulate bridge
  async simulateBridge(params: BridgeParams, sdk: NexusSDK): Promise<SimulationResult | undefined> {
    if(!sdk.isInitialized()) return;
    return await sdk.simulateBridge(params);
  }

  // Bridge and create order
  async bridgeAndCreateOrder(params: {
    token: string;
    amount: string;
    toChainId: number;
    sourceChains?: number[];
    tokenAddress: string;
    price: string;
    expirationHours: number;
    userAddress: string;
  }, sdk: NexusSDK): Promise<BridgeAndExecuteResult | undefined> {
    if(!sdk.isInitialized()) return;
    const { transactionData: td } = filterTransactionData({chainId: params.toChainId, filter: true, functionNames: ['createOrder']});
    const bridgeAndExecuteParams: BridgeAndExecuteParams = {
      token: params.token as typeof SUPPORTED_TOKENS[keyof typeof SUPPORTED_TOKENS],
      amount: params.amount,
      toChainId: params.toChainId as SUPPORTED_CHAINS_IDS,
      sourceChains: params.sourceChains,
      execute: {
        contractAddress: td[0].contractAddress,
        contractAbi: td[0].abi,
        functionName: td[0].functionName,
        buildFunctionParams: (token, amount, _chainId, _userAddress) => {
          const decimals = TOKEN_METADATA[token as keyof typeof TOKEN_METADATA]?.decimals || 18;
          const amountWei = parseUnits(amount, decimals);
          return {
            functionParams: [params.tokenAddress, amountWei, parseUnits(params.price, 18), params.expirationHours],
          };
        },
        tokenApproval: {
          token: params.token as typeof SUPPORTED_TOKENS[keyof typeof SUPPORTED_TOKENS],
          amount: params.amount,
        },
      },
      waitForReceipt: true,
    };

    return await sdk.bridgeAndExecute(bridgeAndExecuteParams);
  }

  // Bridge and deposit
  async bridgeAndDeposit(params: {
    token: string;
    amount: string;
    toChainId: number;
    sourceChains?: number[];
    tokenAddress: string;
    _userAddress: string;
  }, sdk: NexusSDK): Promise<BridgeAndExecuteResult | undefined> {
    if(!sdk.isInitialized()) return;

    const { transactionData: td } = filterTransactionData({chainId: params.toChainId, filter: true, functionNames: ['deposit']});
    const bridgeAndExecuteParams: BridgeAndExecuteParams = {
      token: params.token as typeof SUPPORTED_TOKENS[keyof typeof SUPPORTED_TOKENS],
      amount: params.amount,
      toChainId: params.toChainId as SUPPORTED_CHAINS_IDS,
      sourceChains: params.sourceChains,
      execute: {
        contractAddress: td[0].contractAddress,
        contractAbi: td[0].abi,
        functionName: td[0].functionName,
        buildFunctionParams: (_,__, _chainId, _userAddress) => {
          return {
            functionParams: [params.tokenAddress],
          };
        },
        tokenApproval: {
          token: params.token as typeof SUPPORTED_TOKENS[keyof typeof SUPPORTED_TOKENS],
          amount: params.amount,
        },
      },
      waitForReceipt: true,
    };

    return await sdk.bridgeAndExecute(bridgeAndExecuteParams);
  }

  // Bridge and create escrow
  async bridgeAndCreateEscrow(params: {
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
  }, sdk: NexusSDK): Promise<BridgeAndExecuteResult | undefined> {
    if(!sdk.isInitialized()) return;

    const { transactionData: td } = filterTransactionData({chainId: params.toChainId, filter: true, functionNames: ['createEscrow']});

    const bridgeAndExecuteParams: BridgeAndExecuteParams = {
      token: params.token as typeof SUPPORTED_TOKENS[keyof typeof SUPPORTED_TOKENS],
      amount: params.amount,
      toChainId: params.toChainId as SUPPORTED_CHAINS_IDS,
      sourceChains: params.sourceChains,
      execute: {
        contractAddress: td[0].contractAddress,
        contractAbi: td[0].abi,
        functionName: td[0].functionName,
        buildFunctionParams: (token, _, _chainId, _userAddress) => {
          const decimals = TOKEN_METADATA[token as keyof typeof TOKEN_METADATA]?.decimals || 18;
          const amountWei = parseUnits(params.assetAmount, decimals);
          return {
            functionParams: [
              params.buyerAddress as `0x${string}`,
              params.sellerAddress as `0x${string}`,
              params.assetToken as `0x${string}`,
              amountWei,
              BigInt(params.deadline),
              params.description,
              BigInt(params.disputeWindowHours),
            ],
          };
        },
        tokenApproval: {
          token: params.token as typeof SUPPORTED_TOKENS[keyof typeof SUPPORTED_TOKENS],
          amount: params.amount,
        },
      },
      waitForReceipt: true,
    };

    return await sdk.bridgeAndExecute(bridgeAndExecuteParams);
  }

  // Simulate bridge and create order
  async simulateBridgeAndCreateOrder(params: {
    token: string;
    amount: string;
    toChainId: number;
    sourceChains?: number[];
    tokenAddress: string;
    price: string;
    expirationHours: number;
    userAddress: string;
  }, sdk: NexusSDK): Promise<BridgeAndExecuteSimulationResult | undefined> {
    if(!sdk.isInitialized()) return;

    const { transactionData: td } = filterTransactionData({chainId: params.toChainId, filter: true, functionNames: ['createOrder']});

    const bridgeAndExecuteParams: BridgeAndExecuteParams = {
      token: params.token as typeof SUPPORTED_TOKENS[keyof typeof SUPPORTED_TOKENS],
      amount: params.amount,
      toChainId: params.toChainId as SUPPORTED_CHAINS_IDS,
      sourceChains: params.sourceChains,
      execute: {
        contractAddress: td[0].contractAddress,
        contractAbi: td[0].abi,
        functionName: td[0].functionName,
        buildFunctionParams: (token, amount, _chainId, _userAddress) => {
          const decimals = TOKEN_METADATA[token as keyof typeof TOKEN_METADATA]?.decimals || 18;
          const amountWei = parseUnits(amount, decimals);
          return {
            functionParams: [params.tokenAddress, amountWei, parseUnits(params.price, 18), params.expirationHours],
          };
        },
        tokenApproval: {
          token: params.token as typeof SUPPORTED_TOKENS[keyof typeof SUPPORTED_TOKENS],
          amount: params.amount,
        },
      },
      waitForReceipt: true,
    };

    return await sdk.simulateBridgeAndExecute(bridgeAndExecuteParams);
  }

  // Simulate bridge and create escrow
  async simulateBridgeAndCreateEscrow(params: {
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
  }, sdk: NexusSDK): Promise<BridgeAndExecuteSimulationResult | undefined> {
    if(!sdk.isInitialized()) return;

    const { transactionData: td } = filterTransactionData({chainId: params.toChainId, filter: true, functionNames: ['createEscrow']});
    const bridgeAndExecuteParams: BridgeAndExecuteParams = {
      token: params.token as typeof SUPPORTED_TOKENS[keyof typeof SUPPORTED_TOKENS],
      amount: params.amount,
      toChainId: params.toChainId as SUPPORTED_CHAINS_IDS,
      sourceChains: params.sourceChains,
      execute: {
        contractAddress: td[0].contractAddress,
        contractAbi: td[0].abi,
        functionName: td[0].functionName,
        buildFunctionParams: (token, _, _chainId, _userAddress) => {
          const decimals = TOKEN_METADATA[token as keyof typeof TOKEN_METADATA]?.decimals || 18;
          const amountWei = parseUnits(params.assetAmount, decimals);
          return {
            functionParams: [
              params.buyerAddress as `0x${string}`,
              params.sellerAddress as `0x${string}`,
              params.assetToken as `0x${string}`,
              amountWei,
              BigInt(params.deadline),
              params.description,
              BigInt(params.disputeWindowHours),
            ],
          };
        },
        tokenApproval: {
          token: params.token as typeof SUPPORTED_TOKENS[keyof typeof SUPPORTED_TOKENS],
          amount: params.amount,
        },
      },
      waitForReceipt: true,
    };

    return await sdk.simulateBridgeAndExecute(bridgeAndExecuteParams);
  }

  // Utility functions
  isTokenSupported(tokenSymbol: string): boolean {
    return Object.values(SUPPORTED_TOKENS).includes(tokenSymbol as any);
  }

  isChainSupported(chainId: keyof typeof TRADEVERSE_SUPPORTED_CHAINS): boolean {
    return Object.values(TRADEVERSE_SUPPORTED_CHAINS).includes(chainId as any);
  }

  getTokenMetadata(symbol: string) {
    return TOKEN_METADATA[symbol as keyof typeof TOKEN_METADATA];
  }

  // Get current chain ID
  get currentChainId(): number {
    return this.chainId;
  }

}


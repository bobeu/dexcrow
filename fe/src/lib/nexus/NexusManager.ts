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
  NexusNetwork
} from '@avail-project/nexus-core';
import { EIP1193Provider, parseUnits } from 'viem';

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
  private sdk: NexusSDK | null = null;
  private chainId: number;
  private isInitialized: boolean = false;

  constructor(chainId: number = 8453) {
    this.chainId = chainId;
  }

  // Set the SDK instance from NexusProvider
  setSDK(sdk: NexusSDK | null): void {
    this.sdk = sdk;
    this.isInitialized = sdk?.isInitialized() === true;
  }

  // Initialize the SDK with a provider (for backward compatibility)
  async initialize(provider: EIP1193Provider): Promise<void> {
    if (!provider) {
      throw new Error('No EIP-1193 provider (e.g., MetaMask) found');
    }
    
    if (this.isInitialized) {
      return;
    }
   
    if (!this.sdk) {
      const network: NexusNetwork = this.chainId === 8453 || this.chainId === 1 ? "mainnet" : "testnet";
      this.sdk = new NexusSDK({ network });
    }
    
    await this.sdk.initialize(provider as unknown as any);
    this.isInitialized = true;
  }

  // Deinitialize the SDK
  async deinitialize(): Promise<void> {
    if (!this.isInitialized || !this.sdk) {
      return;
    }
   
    await this.sdk.deinit();
    this.isInitialized = false;
  }

  // Check if SDK is initialized
  get initialized(): boolean {
    return this.isInitialized && this.sdk?.isInitialized() === true;
  }

  // Get unified balances across all chains
  async getUnifiedBalances(): Promise<UserAssetDatum[]> {
    if (!this.initialized || !this.sdk) {
      throw new Error('SDK not initialized');
    }
    return await this.sdk.getUnifiedBalances();
  }

  // Get unified balance for a specific token
  async getUnifiedBalance(symbol: string): Promise<UserAssetDatum | undefined> {
    if (!this.initialized || !this.sdk) {
      throw new Error('SDK not initialized');
    }
    return await this.sdk.getUnifiedBalance(symbol);
  }

  // Bridge tokens
  async bridge(params: BridgeParams): Promise<BridgeResult> {
    if (!this.initialized || !this.sdk) {
      throw new Error('SDK not initialized');
    }
    return await this.sdk.bridge(params);
  }

  // Simulate bridge
  async simulateBridge(params: BridgeParams): Promise<SimulationResult> {
    if (!this.initialized || !this.sdk) {
      throw new Error('SDK not initialized');
    }
    return await this.sdk.simulateBridge(params);
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
  }): Promise<BridgeAndExecuteResult> {
    if (!this.initialized || !this.sdk) {
      throw new Error('SDK not initialized');
    }
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

    return await this.sdk.bridgeAndExecute(bridgeAndExecuteParams);
  }

  // Bridge and deposit
  async bridgeAndDeposit(params: {
    token: string;
    amount: string;
    toChainId: number;
    sourceChains?: number[];
    tokenAddress: string;
    _userAddress: string;
  }): Promise<BridgeAndExecuteResult> {
    if (!this.initialized || !this.sdk) {
      throw new Error('SDK not initialized');
    }

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

    return await this.sdk.bridgeAndExecute(bridgeAndExecuteParams);
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
  }): Promise<BridgeAndExecuteResult> {
    if (!this.initialized || !this.sdk) {
      throw new Error('SDK not initialized');
    }

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

    return await this.sdk.bridgeAndExecute(bridgeAndExecuteParams);
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
  }): Promise<BridgeAndExecuteSimulationResult> {
    if (!this.initialized || !this.sdk) {
      throw new Error('SDK not initialized');
    }

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

    return await this.sdk.simulateBridgeAndExecute(bridgeAndExecuteParams);
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
  }): Promise<BridgeAndExecuteSimulationResult> {
    if (!this.initialized || !this.sdk) {
      throw new Error('SDK not initialized');
    }

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

    return await this.sdk.simulateBridgeAndExecute(bridgeAndExecuteParams);
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

  // getContractAddress(chainId: number, contractType: 'TradeFactory' | 'TradingAccount' | 'EscrowFactory' | 'Arbitrators'): string | undefined {
  //   return CONTRACT_ADDRESSES[chainId as keyof typeof CONTRACT_ADDRESSES]?.[contractType];
  // }

  // Get current chain ID
  get currentChainId(): number {
    return this.chainId;
  }

  // Update chain ID and reinitialize if needed
  async updateChainId(newChainId: number): Promise<void> {
    if (this.chainId !== newChainId) {
      const wasInitialized = this.isInitialized;
      if (wasInitialized) {
        await this.deinitialize();
      }
      
      this.chainId = newChainId;
      const network: NexusNetwork = newChainId === 8453 || newChainId === 1 ? "mainnet" : "testnet";
      this.sdk = new NexusSDK({ network });
      
      // Note: Re-initialization would need to be done by the caller with a provider
    }
  }
}

// Export singleton instance
export const nexusManager = new NexusManager();

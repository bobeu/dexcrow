/**eslint-disable */
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
import { EIP1193Provider, parseUnits, zeroAddress } from 'viem';

// TradeVerse supported chains
export const TRADEVERSE_SUPPORTED_CHAINS = {
  ETHEREUM: 1,
  BASE: 8453,
  BASESEPOLIA: 84532
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

// Contract addresses for TradeFactory, TradingAccount, EscrowFactory, and Arbitrators
export const CONTRACT_ADDRESSES = {
  [TRADEVERSE_SUPPORTED_CHAINS.ETHEREUM]: {
    TradeFactory: zeroAddress,
    TradingAccount: zeroAddress,
    EscrowFactory: zeroAddress,
    Arbitrators: zeroAddress,
  },
  [TRADEVERSE_SUPPORTED_CHAINS.BASE]: {
    TradeFactory: '0x9f1E3137Eb94C8fc48E515c5d1F59d307c7C6c03',
    TradingAccount: '0x0000000000000000000000000000000000000000',
    EscrowFactory: '0x97e7eE7951589c6Ab0914510A381d496f1749F56',
    Arbitrators: '0x9F9f09832942E8A9030C089A589e4Be8AccC190C',
  },
  [TRADEVERSE_SUPPORTED_CHAINS.BASESEPOLIA]: {
    TradeFactory: '0x9f1E3137Eb94C8fc48E515c5d1F59d307c7C6c03',
    TradingAccount: '0x0000000000000000000000000000000000000000',
    EscrowFactory: '0x97e7eE7951589c6Ab0914510A381d496f1749F56',
    Arbitrators: '0x9F9f09832942E8A9030C089A589e4Be8AccC190C',
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

export const ESCROW_FACTORY_ABI = [
  {
    inputs: [
      { internalType: 'address', name: '_buyer', type: 'address' },
      { internalType: 'address', name: '_seller', type: 'address' },
      { internalType: 'address', name: '_assetToken', type: 'address' },
      { internalType: 'uint256', name: '_assetAmount', type: 'uint256' },
      { internalType: 'uint256', name: '_deadline', type: 'uint256' },
      { internalType: 'string', name: '_description', type: 'string' },
      { internalType: 'uint256', name: '_disputeWindowHours', type: 'uint256' }
    ],
    name: 'createEscrow',
    outputs: [{ internalType: 'bool', name: '', type: 'bool' }],
    stateMutability: 'payable',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'address', name: '_buyer', type: 'address' },
      { internalType: 'address', name: '_seller', type: 'address' },
      { internalType: 'address', name: '_assetToken', type: 'address' },
      { internalType: 'uint256', name: '_assetAmount', type: 'uint256' },
      { internalType: 'uint256', name: '_deadline', type: 'uint256' },
      { internalType: 'string', name: '_description', type: 'string' }
    ],
    name: 'createEscrowWithDefaultWindow',
    outputs: [{ internalType: 'bool', name: '', type: 'bool' }],
    stateMutability: 'payable',
    type: 'function',
  },
] as const;

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

    const contractAddress = CONTRACT_ADDRESSES[params.toChainId as keyof typeof CONTRACT_ADDRESSES]?.TradingAccount;
    if (!contractAddress) {
      throw new Error(`No contract address found for chain ${params.toChainId}`);
    }

    const bridgeAndExecuteParams: BridgeAndExecuteParams = {
      token: params.token as typeof SUPPORTED_TOKENS[keyof typeof SUPPORTED_TOKENS],
      amount: params.amount,
      toChainId: params.toChainId as SUPPORTED_CHAINS_IDS,
      sourceChains: params.sourceChains,
      execute: {
        contractAddress,
        contractAbi: TRADING_ACCOUNT_ABI,
        functionName: 'createOrder',
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

    const contractAddress = CONTRACT_ADDRESSES[params.toChainId as keyof typeof CONTRACT_ADDRESSES]?.TradingAccount;
    if (!contractAddress) {
      throw new Error(`No contract address found for chain ${params.toChainId}`);
    }

    const bridgeAndExecuteParams: BridgeAndExecuteParams = {
      token: params.token as typeof SUPPORTED_TOKENS[keyof typeof SUPPORTED_TOKENS],
      amount: params.amount,
      toChainId: params.toChainId as SUPPORTED_CHAINS_IDS,
      sourceChains: params.sourceChains,
      execute: {
        contractAddress,
        contractAbi: TRADING_ACCOUNT_ABI,
        functionName: 'deposit',
        buildFunctionParams: (token, amount, _chainId, _userAddress) => {
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

    const contractAddress = CONTRACT_ADDRESSES[params.toChainId as keyof typeof CONTRACT_ADDRESSES]?.EscrowFactory;
    if (!contractAddress) {
      throw new Error(`No EscrowFactory address found for chain ${params.toChainId}`);
    }

    const bridgeAndExecuteParams: BridgeAndExecuteParams = {
      token: params.token as typeof SUPPORTED_TOKENS[keyof typeof SUPPORTED_TOKENS],
      amount: params.amount,
      toChainId: params.toChainId as SUPPORTED_CHAINS_IDS,
      sourceChains: params.sourceChains,
      execute: {
        contractAddress,
        contractAbi: ESCROW_FACTORY_ABI,
        functionName: 'createEscrow',
        buildFunctionParams: (token, amount, _chainId, _userAddress) => {
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

    const contractAddress = CONTRACT_ADDRESSES[params.toChainId as keyof typeof CONTRACT_ADDRESSES]?.TradingAccount;
    if (!contractAddress) {
      throw new Error(`No contract address found for chain ${params.toChainId}`);
    }

    const bridgeAndExecuteParams: BridgeAndExecuteParams = {
      token: params.token as typeof SUPPORTED_TOKENS[keyof typeof SUPPORTED_TOKENS],
      amount: params.amount,
      toChainId: params.toChainId as SUPPORTED_CHAINS_IDS,
      sourceChains: params.sourceChains,
      execute: {
        contractAddress,
        contractAbi: TRADING_ACCOUNT_ABI,
        functionName: 'createOrder',
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

    const contractAddress = CONTRACT_ADDRESSES[params.toChainId as keyof typeof CONTRACT_ADDRESSES]?.EscrowFactory;
    if (!contractAddress) {
      throw new Error(`No EscrowFactory address found for chain ${params.toChainId}`);
    }

    const bridgeAndExecuteParams: BridgeAndExecuteParams = {
      token: params.token as typeof SUPPORTED_TOKENS[keyof typeof SUPPORTED_TOKENS],
      amount: params.amount,
      toChainId: params.toChainId as SUPPORTED_CHAINS_IDS,
      sourceChains: params.sourceChains,
      execute: {
        contractAddress,
        contractAbi: ESCROW_FACTORY_ABI,
        functionName: 'createEscrow',
        buildFunctionParams: (token, amount, _chainId, _userAddress) => {
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

  getContractAddress(chainId: number, contractType: 'TradeFactory' | 'TradingAccount' | 'EscrowFactory' | 'Arbitrators'): string | undefined {
    return CONTRACT_ADDRESSES[chainId as keyof typeof CONTRACT_ADDRESSES]?.[contractType];
  }

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

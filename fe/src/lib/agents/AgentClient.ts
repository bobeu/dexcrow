/**
 * Agent Client for React Frontend Integration
 * Handles communication with uAgents on Agentverse
 */

import { ethers } from 'ethers';
import { 
  AgentMessage, 
  EscrowData, 
  AgentCapabilities, 
  CreateEscrowRequest,
  CreateEscrowResponse,
  DepositRequest,
  DepositConfirmation,
  FulfillmentRequest,
  FulfillmentConfirmation,
  ReleaseRequest,
  RefundRequest,
  ReleaseConfirmation,
  DisputeRequest,
  DisputeResponse,
  FrontendNotification,
  FrontendCallback,
  EscrowStatusUpdate
} from '../types';

export class AgentClient {
  private agentAddresses: {
    buyer: string;
    seller: string;
    oracle: string;
    arbiter: string;
  };
  private webSocket: WebSocket | null = null;
  private messageHandlers: Map<string, (data: any) => void> = new Map();
  private isConnected: boolean = false;

  constructor(agentAddresses: {
    buyer: string;
    seller: string;
    oracle: string;
    arbiter: string;
  }) {
    this.agentAddresses = agentAddresses;
  }

  /**
   * Connect to Agentverse WebSocket for real-time communication
   */
  async connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        // In real implementation, this would connect to Agentverse WebSocket
        // For now, we'll simulate the connection
        this.webSocket = new WebSocket('wss://agentverse.ai/ws');
        
        this.webSocket.onopen = () => {
          console.log('Connected to Agentverse');
          this.isConnected = true;
          resolve();
        };
        
        this.webSocket.onmessage = (event) => {
          const message = JSON.parse(event.data);
          this.handleMessage(message);
        };
        
        this.webSocket.onerror = (error) => {
          console.error('WebSocket error:', error);
          this.isConnected = false;
          reject(error);
        };
        
        this.webSocket.onclose = () => {
          console.log('Disconnected from Agentverse');
          this.isConnected = false;
        };
      } catch (error) {
        this.isConnected = false;
        reject(error);
      }
    });
  }

  /**
   * Disconnect from Agentverse
   */
  disconnect(): void {
    if (this.webSocket) {
      this.webSocket.close();
      this.webSocket = null;
    }
    this.isConnected = false;
  }

  /**
   * Check if connected to Agentverse
   */
  getConnectionStatus(): boolean {
    return this.isConnected;
  }

  /**
   * Send message to specific agent
   */
  async sendToAgent(agentType: 'buyer' | 'seller' | 'oracle' | 'arbiter', message: any): Promise<void> {
    const agentAddress = this.agentAddresses[agentType];
    
    if (!this.webSocket || this.webSocket.readyState !== WebSocket.OPEN) {
      throw new Error('Not connected to Agentverse');
    }

    const messageWithAddress = {
      ...message,
      recipient_agent: agentAddress,
      sender_agent: 'frontend',
      timestamp: new Date().toISOString(),
      msg_id: this.generateMessageId()
    };

    this.webSocket.send(JSON.stringify(messageWithAddress));
  }

  /**
   * Create a new escrow
   */
  async createEscrow(escrowData: EscrowData): Promise<string> {
    const message: CreateEscrowRequest = {
      escrowId: escrowData.escrow_id,
      tradeType: escrowData.trade_type,
      buyerAddress: escrowData.buyer_address,
      sellerAddress: escrowData.seller_address,
      arbiterAddress: escrowData.arbiter_address,
      assetA: escrowData.asset_a!,
      assetB: escrowData.asset_b!,
      terms: escrowData.terms!,
      frontendCallbackUrl: escrowData.frontend_callback_url
    };

    await this.sendToAgent('buyer', message);
    return escrowData.escrow_id;
  }

  /**
   * Deposit assets into escrow
   */
  async depositAssets(escrowId: string, transactionHash: string, asset: any): Promise<void> {
    const message: FrontendCallback = {
      action: 'deposit_assets',
      escrowId: escrowId,
      userData: {
        escrow_id: escrowId,
        transaction_hash: transactionHash,
        asset: asset
      },
      frontendSessionId: this.generateMessageId()
    };

    await this.sendToAgent('buyer', message);
  }

  /**
   * Confirm fulfillment (for sellers)
   */
  async confirmFulfillment(escrowId: string, fulfillmentData: any): Promise<void> {
    const message: FrontendCallback = {
      action: 'confirm_fulfillment',
      escrowId: escrowId,
      userData: {
        escrow_id: escrowId,
        fulfillment_data: fulfillmentData
      },
      frontendSessionId: this.generateMessageId()
    };

    await this.sendToAgent('seller', message);
  }

  /**
   * Confirm receipt (for buyers)
   */
  async confirmReceipt(escrowId: string): Promise<void> {
    const message: FrontendCallback = {
      action: 'confirm_fulfillment',
      escrowId: escrowId,
      userData: {
        escrow_id: escrowId
      },
      frontendSessionId: this.generateMessageId()
    };

    await this.sendToAgent('buyer', message);
  }

  /**
   * Raise a dispute
   */
  async raiseDispute(escrowId: string, reason: string, evidence: any[]): Promise<void> {
    const message: FrontendCallback = {
      action: 'raise_dispute',
      escrowId: escrowId,
      userData: {
        escrow_id: escrowId,
        dispute_reason: reason,
        evidence: evidence
      },
      frontendSessionId: this.generateMessageId()
    };

    await this.sendToAgent('buyer', message);
  }

  /**
   * Verify transaction with oracle
   */
  async verifyTransaction(escrowId: string, transactionHash: string, chainId: number, expectedAmount: string, expectedToken: string): Promise<void> {
    const message: FrontendCallback = {
      action: 'verify_transaction',
      escrowId: escrowId,
      userData: {
        escrow_id: escrowId,
        transaction_hash: transactionHash,
        chain_id: chainId,
        expected_amount: expectedAmount,
        expected_token: expectedToken
      },
      frontendSessionId: this.generateMessageId()
    };

    await this.sendToAgent('oracle', message);
  }

  /**
   * Register message handler for specific message type
   */
  onMessage(messageType: string, handler: (data: any) => void): void {
    this.messageHandlers.set(messageType, handler);
  }

  /**
   * Handle incoming messages
   */
  private handleMessage(message: any): void {
    const messageType = message.type || message.content?.[0]?.type;
    
    if (messageType && this.messageHandlers.has(messageType)) {
      const handler = this.messageHandlers.get(messageType);
      if (handler) {
        handler(message);
      }
    }
  }

  /**
   * Generate unique message ID
   */
  private generateMessageId(): string {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get agent capabilities
   */
  async getAgentCapabilities(agentType: 'buyer' | 'seller' | 'oracle' | 'arbiter'): Promise<AgentCapabilities> {
    // In real implementation, this would query the agent
    // For now, return mock data
    const capabilities: Record<string, AgentCapabilities> = {
      buyer: {
        agentAddress: this.agentAddresses.buyer,
        agentType: 'buyer',
        supportedChains: ['ethereum', 'polygon', 'arbitrum'],
        supportedAssets: ['ETH', 'ERC20', 'ERC721'],
        supportedEscrowTypes: ['crypto', 'fiat_p2p'],
        maxEscrowValue: '1000000',
        feeStructure: {},
        isActive: true,
        lastHeartbeat: Date.now()
      },
      seller: {
        agentAddress: this.agentAddresses.seller,
        agentType: 'seller',
        supportedChains: ['ethereum', 'polygon', 'arbitrum'],
        supportedAssets: ['ETH', 'ERC20', 'ERC721'],
        supportedEscrowTypes: ['crypto', 'fiat_p2p'],
        maxEscrowValue: '1000000',
        feeStructure: {},
        isActive: true,
        lastHeartbeat: Date.now()
      },
      oracle: {
        agentAddress: this.agentAddresses.oracle,
        agentType: 'oracle',
        supportedChains: ['ethereum', 'polygon', 'arbitrum', 'optimism', 'bsc'],
        supportedAssets: ['ETH', 'ERC20', 'ERC721', 'ERC1155'],
        supportedEscrowTypes: ['crypto', 'cross_chain'],
        feeStructure: {},
        isActive: true,
        lastHeartbeat: Date.now()
      },
      arbiter: {
        agentAddress: this.agentAddresses.arbiter,
        agentType: 'arbiter',
        supportedChains: [],
        supportedAssets: [],
        supportedEscrowTypes: [],
        feeStructure: {},
        isActive: true,
        lastHeartbeat: Date.now()
      }
    };

    return capabilities[agentType];
  }
}

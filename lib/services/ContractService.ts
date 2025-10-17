/**
 * Smart Contract Integration Service
 * Handles interaction with deployed escrow contracts
 */

import { ethers, Contract, providers, Wallet } from 'ethers';
import { EscrowContractState, EscrowState, Asset, ChainType } from '../types';

export class ContractService {
  private provider: providers.Provider;
  private signer: Wallet | null = null;
  private escrowFactory: Contract | null = null;
  private escrowABI: any;
  private factoryABI: any;

  constructor(
    rpcUrl: string,
    privateKey?: string,
    escrowFactoryAddress?: string
  ) {
    this.provider = new providers.JsonRpcProvider(rpcUrl);
    
    if (privateKey) {
      this.signer = new Wallet(privateKey, this.provider);
    }

    // Load contract ABIs
    this.escrowABI = this.getEscrowABI();
    this.factoryABI = this.getFactoryABI();

    if (escrowFactoryAddress) {
      this.escrowFactory = new Contract(escrowFactoryAddress, this.factoryABI, this.signer || this.provider);
    }
  }

  /**
   * Set the signer for contract interactions
   */
  setSigner(privateKey: string): void {
    this.signer = new Wallet(privateKey, this.provider);
    if (this.escrowFactory) {
      this.escrowFactory = this.escrowFactory.connect(this.signer);
    }
  }

  /**
   * Create a new escrow contract
   */
  async createEscrow(
    buyer: string,
    seller: string,
    arbiter: string,
    assetToken: string,
    assetAmount: string,
    deadline: number,
    description: string,
    disputeWindowHours: number = 24
  ): Promise<string> {
    if (!this.escrowFactory || !this.signer) {
      throw new Error('Factory not initialized or signer not set');
    }

    const assetAmountWei = ethers.utils.parseEther(assetAmount);
    const creationFee = await this.escrowFactory.creationFee();

    const tx = await this.escrowFactory.createEscrow(
      buyer,
      seller,
      arbiter,
      assetToken,
      assetAmountWei,
      deadline,
      description,
      disputeWindowHours,
      { value: creationFee }
    );

    const receipt = await tx.wait();
    const escrowCreatedEvent = receipt.events?.find((e: any) => e.event === 'EscrowCreated');
    
    if (!escrowCreatedEvent) {
      throw new Error('Escrow creation failed');
    }

    return escrowCreatedEvent.args.escrowAddress;
  }

  /**
   * Get escrow contract instance
   */
  getEscrowContract(escrowAddress: string): Contract {
    if (!this.signer) {
      throw new Error('Signer not set');
    }
    return new Contract(escrowAddress, this.escrowABI, this.signer);
  }

  /**
   * Deposit assets into escrow
   */
  async depositAssets(escrowAddress: string, assetAmount: string, isNative: boolean = true): Promise<string> {
    const escrow = this.getEscrowContract(escrowAddress);
    
    if (isNative) {
      const tx = await escrow.deposit({ value: ethers.utils.parseEther(assetAmount) });
      const receipt = await tx.wait();
      return receipt.transactionHash;
    } else {
      // For ERC20 tokens, user needs to approve first
      const tx = await escrow.deposit();
      const receipt = await tx.wait();
      return receipt.transactionHash;
    }
  }

  /**
   * Confirm fulfillment and release funds
   */
  async confirmFulfillment(escrowAddress: string): Promise<string> {
    const escrow = this.getEscrowContract(escrowAddress);
    const tx = await escrow.confirmFulfillment();
    const receipt = await tx.wait();
    return receipt.transactionHash;
  }

  /**
   * Release funds to seller
   */
  async releaseFunds(escrowAddress: string): Promise<string> {
    const escrow = this.getEscrowContract(escrowAddress);
    const tx = await escrow.releaseFunds();
    const receipt = await tx.wait();
    return receipt.transactionHash;
  }

  /**
   * Refund funds to buyer
   */
  async refundFunds(escrowAddress: string): Promise<string> {
    const escrow = this.getEscrowContract(escrowAddress);
    const tx = await escrow.refundFunds();
    const receipt = await tx.wait();
    return receipt.transactionHash;
  }

  /**
   * Raise a dispute
   */
  async raiseDispute(escrowAddress: string, reason: string): Promise<string> {
    const escrow = this.getEscrowContract(escrowAddress);
    const tx = await escrow.raiseDispute(reason);
    const receipt = await tx.wait();
    return receipt.transactionHash;
  }

  /**
   * Resolve dispute (arbiter only)
   */
  async resolveDispute(escrowAddress: string, releaseFunds: boolean, reasoning: string): Promise<string> {
    const escrow = this.getEscrowContract(escrowAddress);
    const tx = await escrow.resolveDispute(releaseFunds, reasoning);
    const receipt = await tx.wait();
    return receipt.transactionHash;
  }

  /**
   * Get escrow state
   */
  async getEscrowState(escrowAddress: string): Promise<EscrowContractState> {
    const escrow = new Contract(escrowAddress, this.escrowABI, this.provider);
    const details = await escrow.getEscrowDetails();
    
    return {
      contractAddress: escrowAddress,
      currentState: details.state,
      buyer: details.buyer,
      seller: details.seller,
      arbiter: details.arbiter,
      assetAddress: details.assetToken,
      assetAmount: details.assetAmount.toString(),
      deadline: details.deadline.toNumber(),
      tradeType: 'crypto', // Default, would be determined by frontend
      counterChainId: null,
      counterAssetAmount: 0,
      counterAssetTicker: ''
    };
  }

  /**
   * Check if escrow is expired
   */
  async isEscrowExpired(escrowAddress: string): Promise<boolean> {
    const escrow = new Contract(escrowAddress, this.escrowABI, this.provider);
    return await escrow.isExpired();
  }

  /**
   * Get escrow balance
   */
  async getEscrowBalance(escrowAddress: string): Promise<string> {
    const escrow = new Contract(escrowAddress, this.escrowABI, this.provider);
    const balance = await escrow.getBalance();
    return ethers.utils.formatEther(balance);
  }

  /**
   * Get dispute information
   */
  async getDisputeInfo(escrowAddress: string): Promise<any> {
    const escrow = new Contract(escrowAddress, this.escrowABI, this.provider);
    return await escrow.getDisputeInfo();
  }

  /**
   * Get all escrows from factory
   */
  async getAllEscrows(): Promise<string[]> {
    if (!this.escrowFactory) {
      throw new Error('Factory not initialized');
    }
    return await this.escrowFactory.getAllEscrows();
  }

  /**
   * Get user escrows
   */
  async getUserEscrows(userAddress: string): Promise<string[]> {
    if (!this.escrowFactory) {
      throw new Error('Factory not initialized');
    }
    return await this.escrowFactory.getUserEscrows(userAddress);
  }

  /**
   * Get escrow details from factory
   */
  async getEscrowDetails(escrowAddress: string): Promise<any> {
    if (!this.escrowFactory) {
      throw new Error('Factory not initialized');
    }
    return await this.escrowFactory.getEscrowDetails(escrowAddress);
  }

  /**
   * Estimate gas for transaction
   */
  async estimateGas(escrowAddress: string, method: string, ...args: any[]): Promise<number> {
    const escrow = this.getEscrowContract(escrowAddress);
    const gasEstimate = await escrow.estimateGas[method](...args);
    return gasEstimate.toNumber();
  }

  /**
   * Get current gas price
   */
  async getGasPrice(): Promise<string> {
    const gasPrice = await this.provider.getGasPrice();
    return ethers.utils.formatUnits(gasPrice, 'gwei');
  }

  /**
   * Wait for transaction confirmation
   */
  async waitForTransaction(txHash: string, confirmations: number = 1): Promise<any> {
    return await this.provider.waitForTransaction(txHash, confirmations);
  }

  /**
   * Get transaction receipt
   */
  async getTransactionReceipt(txHash: string): Promise<any> {
    return await this.provider.getTransactionReceipt(txHash);
  }

  /**
   * Get block number
   */
  async getBlockNumber(): Promise<number> {
    return await this.provider.getBlockNumber();
  }

  /**
   * Get network information
   */
  async getNetwork(): Promise<any> {
    return await this.provider.getNetwork();
  }

  /**
   * Get Escrow ABI
   */
  private getEscrowABI(): any[] {
    return [
      "function deposit() external payable",
      "function confirmFulfillment() external",
      "function releaseFunds() external",
      "function refundFunds() external",
      "function raiseDispute(string memory reason) external",
      "function resolveDispute(bool releaseFunds, string memory reasoning) external",
      "function getEscrowDetails() external view returns (tuple(address buyer, address seller, address arbiter, address assetToken, uint256 assetAmount, uint256 deadline, uint8 state, uint256 createdAt, uint256 updatedAt, string description, uint256 disputeWindowHours))",
      "function getDisputeInfo() external view returns (tuple(bool isActive, address disputer, string reason, uint256 raisedAt, address arbiter, bool arbiterDecision, string arbiterReasoning, uint256 resolvedAt))",
      "function isExpired() external view returns (bool)",
      "function getBalance() external view returns (uint256)",
      "function authorizedAgents(address) external view returns (bool)",
      "function platformFeeRecipient() external view returns (address)",
      "function paused() external view returns (bool)",
      "event EscrowCreated(address indexed buyer, address indexed seller, address indexed arbiter, address assetToken, uint256 assetAmount, uint256 deadline)",
      "event AssetDeposited(address indexed depositor, address indexed assetToken, uint256 amount, uint256 timestamp)",
      "event FulfillmentConfirmed(address indexed confirmer, uint256 timestamp)",
      "event FundsReleased(address indexed recipient, address indexed assetToken, uint256 amount, uint256 timestamp)",
      "event FundsRefunded(address indexed recipient, address indexed assetToken, uint256 amount, uint256 timestamp)",
      "event DisputeRaised(address indexed disputer, string reason, uint256 timestamp)",
      "event DisputeResolved(address indexed arbiter, bool releaseFunds, string reasoning, uint256 timestamp)"
    ];
  }

  /**
   * Get Factory ABI
   */
  private getFactoryABI(): any[] {
    return [
      "function createEscrow(address buyer, address seller, address arbiter, address assetToken, uint256 assetAmount, uint256 deadline, string memory description, uint256 disputeWindowHours) external payable returns (address)",
      "function createEscrowWithDefaultWindow(address buyer, address seller, address arbiter, address assetToken, uint256 assetAmount, uint256 deadline, string memory description) external payable returns (address)",
      "function getAllEscrows() external view returns (address[])",
      "function getUserEscrows(address user) external view returns (address[])",
      "function getTotalEscrows() external view returns (uint256)",
      "function getUserEscrowCount(address user) external view returns (uint256)",
      "function isValidEscrow(address escrowAddress) external view returns (bool)",
      "function getEscrowDetails(address escrowAddress) external view returns (tuple(address buyer, address seller, address arbiter, address assetToken, uint256 assetAmount, uint256 deadline, uint8 state, uint256 createdAt, uint256 updatedAt, string description, uint256 disputeWindowHours))",
      "function getEscrowState(address escrowAddress) external view returns (uint8)",
      "function getEscrowsPaginated(uint256 offset, uint256 limit) external view returns (address[])",
      "function platformFeeRecipient() external view returns (address)",
      "function defaultDisputeWindowHours() external view returns (uint256)",
      "function creationFee() external view returns (uint256)",
      "function paused() external view returns (bool)",
      "event EscrowCreated(address indexed escrowAddress, address indexed buyer, address indexed seller, address arbiter, uint256 timestamp)",
      "event PlatformFeeRecipientUpdated(address indexed oldRecipient, address indexed newRecipient)",
      "event DefaultDisputeWindowUpdated(uint256 oldWindow, uint256 newWindow)"
    ];
  }
}

/**
 * Type definitions for the Decentralized Escrow System
 */

// User Roles
export type UserRole = 'Buyer' | 'Seller' | 'Arbiter' | 'Viewer' | 'None';

// Application Modes
export type AppMode = 'create' | 'interact';

// Trade Types
export type TradeType = 'crypto' | 'fiat_p2p' | 'cross_chain';

// Escrow States
export enum EscrowState {
  AWAITING_DEPOSIT = 0,
  AWAITING_FULFILLMENT = 1,
  DISPUTE_RAISED = 2,
  COMPLETED = 3,
  CANCELED = 4
}

// Asset Types
export type AssetType = 'ETH' | 'ERC20' | 'ERC721' | 'ERC1155' | 'BTC' | 'FIAT';
export type ChainType = 'ethereum' | 'polygon' | 'arbitrum' | 'optimism' | 'bsc' | 'bitcoin';

// Asset Interface
export interface Asset {
  type: AssetType;
  address?: string;
  amount: string;
  chain: ChainType;
  symbol?: string;
  decimals?: number;
  name?: string;
}

// Escrow Terms
export interface EscrowTerms {
  description: string;
  deadline: number;
  auto_release_hours?: number;
  dispute_window_hours?: number;
  arbiter_fee_percentage?: number;
  platform_fee_percentage?: number;
}

// Escrow Data
export interface EscrowData {
  escrow_id: string;
  contract_address?: string;
  status: EscrowState;
  trade_type: TradeType;
  buyer_address: string;
  seller_address: string;
  arbiter_address: string;
  creator_agent?: string;
  asset_a?: Asset;
  asset_b?: Asset;
  terms?: EscrowTerms;
  created_at?: number;
  updated_at?: number;
  deposit_tx_hash?: string;
  fulfillment_tx_hash?: string;
  release_tx_hash?: string;
  refund_tx_hash?: string;
  dispute_id?: string;
  dispute_reason?: string;
  dispute_evidence?: any[];
  frontend_callback_url?: string;
  frontend_session_id?: string;
  metadata?: Record<string, any>;
}

// Agent Capabilities
export interface AgentCapabilities {
  agentAddress: string;
  agentType: string;
  supportedChains: ChainType[];
  supportedAssets: AssetType[];
  supportedEscrowTypes: TradeType[];
  maxEscrowValue?: string;
  feeStructure?: Record<string, number>;
  isActive: boolean;
  lastHeartbeat: number;
}

// Agent Message
export interface AgentMessage {
  timestamp: string;
  msg_id: string;
  content: any[];
  sender?: string;
  recipient?: string;
}

// Request/Response Types
export interface CreateEscrowRequest {
  escrowId: string;
  tradeType: TradeType;
  buyerAddress: string;
  sellerAddress: string;
  arbiterAddress: string;
  assetA: Asset;
  assetB: Asset;
  terms: EscrowTerms;
  frontendCallbackUrl?: string;
}

export interface CreateEscrowResponse {
  success: boolean;
  escrow_id: string;
  contract_address?: string;
  error_message?: string;
}

export interface DepositRequest {
  escrow_id: string;
  asset: Asset;
  transaction_hash?: string;
  confirmation_blocks?: number;
}

export interface DepositConfirmation {
  success: boolean;
  escrow_id: string;
  transaction_hash?: string;
  block_number?: number;
  error_message?: string;
}

export interface FulfillmentRequest {
  escrow_id: string;
  fulfillment_type: string;
  transaction_hash?: string;
  fiat_payment_proof?: string;
  cross_chain_proof?: string;
}

export interface FulfillmentConfirmation {
  success: boolean;
  escrow_id: string;
  verification_data?: Record<string, any>;
  error_message?: string;
}

export interface ReleaseRequest {
  escrow_id: string;
  reason: string;
  arbiter_signature?: string;
}

export interface RefundRequest {
  escrow_id: string;
  reason: string;
  arbiter_signature?: string;
}

export interface ReleaseConfirmation {
  success: boolean;
  escrow_id: string;
  transaction_hash?: string;
  error_message?: string;
}

export interface DisputeRequest {
  escrow_id: string;
  dispute_reason: string;
  evidence: any[];
  requesting_party: string;
}

export interface DisputeResponse {
  success: boolean;
  escrow_id: string;
  dispute_id: string;
  arbiter_assigned: string;
  status: string;
  error_message?: string;
}

export interface ArbiterDecision {
  escrow_id: string;
  dispute_id: string;
  decision: string;
  reasoning: string;
  evidence_required?: string[];
}

export interface OracleVerificationRequest {
  escrow_id: string;
  transaction_hash: string;
  expected_amount: string;
  expected_token: string;
  chain_id: number;
}

export interface OracleVerificationResponse {
  verified: boolean;
  escrow_id: string;
  actual_amount?: string;
  block_number?: number;
  confidence_score?: number;
  error_message?: string;
}

export interface FrontendNotification {
  escrow_id: string;
  status: string;
  message: string;
  action_required?: string;
  frontend_callback_url: string;
}

export interface FrontendCallback {
  action: string;
  escrowId: string;
  userData: Record<string, any>;
  frontendSessionId: string;
}

export interface EscrowStatusUpdate {
  escrow_id: string;
  new_status: EscrowState;
  previous_status: EscrowState;
  update_reason: string;
  metadata?: Record<string, any>;
}

// Escrow Contract State
export interface EscrowContractState {
  contractAddress?: string;
  currentState: EscrowState;
  buyer: string;
  seller: string;
  arbiter: string;
  assetAddress: string;
  assetAmount: number;
  deadline: number;
  tradeType: TradeType;
  counterChainId?: number | null;
  counterAssetAmount: number;
  counterAssetTicker: string;
}
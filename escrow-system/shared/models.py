"""
Shared models and data structures for the Decentralized Escrow System
"""

from dataclasses import dataclass
from typing import Dict, List, Optional, Any
from enum import Enum
from datetime import datetime

class EscrowState(Enum):
    """Escrow contract states"""
    AWAITING_DEPOSIT = 0
    AWAITING_FULFILLMENT = 1
    DISPUTE_RAISED = 2
    COMPLETED = 3
    CANCELED = 4

class TradeType(Enum):
    """Types of trades supported"""
    CRYPTO = "crypto"
    FIAT_P2P = "fiat_p2p"
    CROSS_CHAIN = "cross_chain"

class AssetType(Enum):
    """Types of assets supported"""
    ETH = "ETH"
    ERC20 = "ERC20"
    ERC721 = "ERC721"
    ERC1155 = "ERC1155"
    BTC = "BTC"
    FIAT = "FIAT"

class ChainType(Enum):
    """Supported blockchain networks"""
    ETHEREUM = "ethereum"
    BASE = "base"
    CELO = "celo"
    OPTIMISM = "optimism"
    BSC = "bsc"
    BITCOIN = "bitcoin"

class UserRole(Enum):
    """User roles in the system"""
    BUYER = "Buyer"
    SELLER = "Seller"
    ARBITER = "Arbiter"
    ORACLE = "Oracle"
    VIEWER = "Viewer"

@dataclass
class Asset:
    """Asset information"""
    type: AssetType
    address: Optional[str] = None
    amount: str = "0"
    chain: ChainType = ChainType.ETHEREUM
    symbol: Optional[str] = None
    decimals: int = 18
    name: Optional[str] = None

@dataclass
class EscrowTerms:
    """Escrow terms and conditions"""
    description: str
    deadline: int  # Unix timestamp
    auto_release_hours: Optional[int] = None
    dispute_window_hours: int = 24
    arbiter_fee_percentage: float = 1.0
    platform_fee_percentage: float = 0.5

@dataclass
class EscrowData:
    """Complete escrow data structure"""
    escrow_id: str
    contract_address: Optional[str] = None
    status: EscrowState = EscrowState.AWAITING_DEPOSIT
    trade_type: TradeType = TradeType.CRYPTO
    
    # Parties
    buyer_address: str = ""
    seller_address: str = ""
    arbiter_address: str = ""
    creator_agent: str = ""
    
    # Assets
    asset_a: Optional[Asset] = None
    asset_b: Optional[Asset] = None
    
    # Terms
    terms: Optional[EscrowTerms] = None
    
    # Timestamps
    created_at: int = 0
    updated_at: int = 0
    
    # Transaction hashes
    deposit_tx_hash: Optional[str] = None
    fulfillment_tx_hash: Optional[str] = None
    release_tx_hash: Optional[str] = None
    refund_tx_hash: Optional[str] = None
    
    # Dispute information
    dispute_id: Optional[str] = None
    dispute_reason: Optional[str] = None
    dispute_evidence: List[Dict[str, Any]] = None
    
    # Frontend integration
    frontend_callback_url: Optional[str] = None
    frontend_session_id: Optional[str] = None
    
    # Metadata
    metadata: Dict[str, Any] = None

    def __post_init__(self):
        if self.dispute_evidence is None:
            self.dispute_evidence = []
        if self.metadata is None:
            self.metadata = {}

@dataclass
class DisputeEvidence:
    """Evidence for disputes"""
    type: str  # transaction_proof, communication_log, delivery_proof, etc.
    description: str
    data: str  # Base64 encoded or URL
    timestamp: int
    submitted_by: str

@dataclass
class DisputeRecord:
    """Dispute record"""
    dispute_id: str
    escrow_id: str
    disputing_party: str
    reason: str
    evidence: List[DisputeEvidence]
    status: str = "open"  # open, under_review, resolved
    arbiter_address: str = ""
    created_at: int = 0
    resolved_at: Optional[int] = None
    decision: Optional[str] = None  # release, refund
    arbiter_reasoning: Optional[str] = None

@dataclass
class AgentCapabilities:
    """Agent capabilities and information"""
    agent_address: str
    agent_type: str
    supported_chains: List[ChainType]
    supported_assets: List[AssetType]
    supported_escrow_types: List[TradeType]
    max_escrow_value: Optional[str] = None
    fee_structure: Dict[str, float] = None
    is_active: bool = True
    last_heartbeat: int = 0

    def __post_init__(self):
        if self.fee_structure is None:
            self.fee_structure = {}

@dataclass
class EscrowMetrics:
    """System metrics"""
    total_escrows: int = 0
    active_escrows: int = 0
    completed_escrows: int = 0
    disputed_escrows: int = 0
    total_volume: str = "0"
    success_rate: float = 0.0
    average_settlement_time_hours: float = 0.0

@dataclass
class FrontendSession:
    """Frontend session information"""
    session_id: str
    user_address: str
    role: UserRole
    escrow_id: Optional[str] = None
    created_at: int = 0
    last_activity: int = 0
    metadata: Dict[str, Any] = None

    def __post_init__(self):
        if self.metadata is None:
            self.metadata = {}

@dataclass
class AgentMessage:
    """Standard agent message format"""
    timestamp: str
    msg_id: str
    content: List[Dict[str, Any]]
    sender: Optional[str] = None
    recipient: Optional[str] = None

@dataclass
class CreateEscrowRequest:
    """Request to create a new escrow"""
    escrow_id: str
    trade_type: TradeType
    buyer_address: str
    seller_address: str
    arbiter_address: str
    asset_a: Asset
    asset_b: Asset
    terms: EscrowTerms
    frontend_callback_url: Optional[str] = None

@dataclass
class CreateEscrowResponse:
    """Response from escrow creation"""
    success: bool
    escrow_id: str
    contract_address: Optional[str] = None
    error_message: Optional[str] = None

@dataclass
class DepositRequest:
    """Request to deposit assets"""
    escrow_id: str
    asset: Asset
    transaction_hash: Optional[str] = None
    confirmation_blocks: int = 1

@dataclass
class DepositConfirmation:
    """Confirmation of asset deposit"""
    success: bool
    escrow_id: str
    transaction_hash: Optional[str] = None
    block_number: Optional[int] = None
    error_message: Optional[str] = None

@dataclass
class FulfillmentRequest:
    """Request to fulfill obligations"""
    escrow_id: str
    fulfillment_type: str  # crypto_transfer, fiat_payment, cross_chain_swap
    transaction_hash: Optional[str] = None
    fiat_payment_proof: Optional[str] = None
    cross_chain_proof: Optional[str] = None

@dataclass
class FulfillmentConfirmation:
    """Confirmation of fulfillment"""
    success: bool
    escrow_id: str
    verification_data: Optional[Dict[str, Any]] = None
    error_message: Optional[str] = None

@dataclass
class ReleaseRequest:
    """Request to release funds"""
    escrow_id: str
    reason: str
    arbiter_signature: Optional[str] = None

@dataclass
class RefundRequest:
    """Request to refund funds"""
    escrow_id: str
    reason: str
    arbiter_signature: Optional[str] = None

@dataclass
class ReleaseConfirmation:
    """Confirmation of fund release"""
    success: bool
    escrow_id: str
    transaction_hash: Optional[str] = None
    error_message: Optional[str] = None

@dataclass
class DisputeRequest:
    """Request to raise a dispute"""
    escrow_id: str
    dispute_reason: str
    evidence: List[DisputeEvidence]
    requesting_party: str

@dataclass
class DisputeResponse:
    """Response to dispute request"""
    success: bool
    escrow_id: str
    dispute_id: str
    arbiter_assigned: str
    status: str  # accepted, rejected, under_review
    error_message: Optional[str] = None

@dataclass
class ArbiterDecision:
    """Arbiter's decision on a dispute"""
    escrow_id: str
    dispute_id: str
    decision: str  # release, refund, require_more_evidence
    reasoning: str
    evidence_required: Optional[List[str]] = None

@dataclass
class OracleVerificationRequest:
    """Request for oracle verification"""
    escrow_id: str
    transaction_hash: str
    expected_amount: str
    expected_token: str
    chain_id: int

@dataclass
class OracleVerificationResponse:
    """Response from oracle verification"""
    verified: bool
    escrow_id: str
    actual_amount: Optional[str] = None
    block_number: Optional[int] = None
    confidence_score: Optional[float] = None
    error_message: Optional[str] = None

@dataclass
class FrontendNotification:
    """Notification to frontend"""
    escrow_id: str
    status: str
    message: str
    action_required: Optional[str] = None
    frontend_callback_url: str = ""

@dataclass
class FrontendCallback:
    """Callback from frontend"""
    action: str
    escrow_id: str
    user_data: Dict[str, Any]
    frontend_session_id: str

@dataclass
class EscrowStatusUpdate:
    """Status update for escrow"""
    escrow_id: str
    new_status: EscrowState
    previous_status: EscrowState
    update_reason: str
    metadata: Optional[Dict[str, Any]] = None

    def __post_init__(self):
        if self.metadata is None:
            self.metadata = {}

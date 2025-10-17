"""
Shared utilities for the Decentralized Escrow System
"""

import json
import hashlib
import time
from typing import Dict, Any, Optional, List
from datetime import datetime, timezone
from .models import EscrowData, DisputeRecord, AgentMessage

def generate_escrow_id() -> str:
    """Generate a unique escrow ID."""
    timestamp = int(time.time())
    random_part = hashlib.md5(f"{timestamp}{time.time()}".encode()).hexdigest()[:8]
    return f"escrow_{timestamp}_{random_part}"

def generate_dispute_id() -> str:
    """Generate a unique dispute ID."""
    timestamp = int(time.time())
    random_part = hashlib.md5(f"dispute_{timestamp}{time.time()}".encode()).hexdigest()[:8]
    return f"dispute_{timestamp}_{random_part}"

def generate_session_id() -> str:
    """Generate a unique session ID."""
    timestamp = int(time.time())
    random_part = hashlib.md5(f"session_{timestamp}{time.time()}".encode()).hexdigest()[:12]
    return f"session_{timestamp}_{random_part}"

def validate_address(address: str) -> bool:
    """Validate Ethereum address format."""
    if not address or not isinstance(address, str):
        return False
    
    # Check if it's a valid Ethereum address
    if address.startswith('0x') and len(address) == 42:
        try:
            int(address[2:], 16)
            return True
        except ValueError:
            return False
    
    return False

def validate_escrow_data(escrow_data: EscrowData) -> List[str]:
    """Validate escrow data and return list of errors."""
    errors = []
    
    # Validate addresses
    if not validate_address(escrow_data.buyer_address):
        errors.append("Invalid buyer address")
    
    if not validate_address(escrow_data.seller_address):
        errors.append("Invalid seller address")
    
    if not validate_address(escrow_data.arbiter_address):
        errors.append("Invalid arbiter address")
    
    # Validate escrow ID
    if not escrow_data.escrow_id or len(escrow_data.escrow_id) < 10:
        errors.append("Invalid escrow ID")
    
    # Validate assets
    if not escrow_data.asset_a or not escrow_data.asset_a.amount:
        errors.append("Asset A is required")
    
    if not escrow_data.asset_b or not escrow_data.asset_b.amount:
        errors.append("Asset B is required")
    
    # Validate terms
    if not escrow_data.terms or not escrow_data.terms.description:
        errors.append("Escrow description is required")
    
    if escrow_data.terms and escrow_data.terms.deadline <= int(time.time()):
        errors.append("Deadline must be in the future")
    
    return errors

def format_amount(amount: str, decimals: int = 18) -> str:
    """Format amount with proper decimal places."""
    try:
        amount_float = float(amount)
        return f"{amount_float:.{decimals}f}"
    except (ValueError, TypeError):
        return "0.0"

def format_address(address: str, length: int = 8) -> str:
    """Format address for display."""
    if not address or len(address) < length * 2 + 2:
        return address
    
    return f"{address[:length]}...{address[-length:]}"

def calculate_fees(amount: str, platform_fee_percentage: float = 0.5, arbiter_fee_percentage: float = 1.0) -> Dict[str, str]:
    """Calculate fees for an amount."""
    try:
        amount_float = float(amount)
        platform_fee = amount_float * (platform_fee_percentage / 100)
        arbiter_fee = amount_float * (arbiter_fee_percentage / 100)
        net_amount = amount_float - platform_fee - arbiter_fee
        
        return {
            "total": format_amount(str(amount_float)),
            "platform_fee": format_amount(str(platform_fee)),
            "arbiter_fee": format_amount(str(arbiter_fee)),
            "net_amount": format_amount(str(net_amount))
        }
    except (ValueError, TypeError):
        return {
            "total": "0.0",
            "platform_fee": "0.0",
            "arbiter_fee": "0.0",
            "net_amount": "0.0"
        }

def create_agent_message(content: List[Dict[str, Any]], sender: Optional[str] = None, recipient: Optional[str] = None) -> AgentMessage:
    """Create a standardized agent message."""
    return AgentMessage(
        timestamp=datetime.now(timezone.utc).isoformat(),
        msg_id=generate_session_id(),
        content=content,
        sender=sender,
        recipient=recipient
    )

def create_text_content(text: str) -> Dict[str, Any]:
    """Create text content for agent message."""
    return {
        "type": "text",
        "text": text
    }

def create_metadata_content(metadata: Dict[str, Any]) -> Dict[str, Any]:
    """Create metadata content for agent message."""
    return {
        "type": "metadata",
        "metadata": metadata
    }

def create_escrow_content(escrow_data: EscrowData) -> Dict[str, Any]:
    """Create escrow content for agent message."""
    return {
        "type": "escrow_data",
        "escrow_data": {
            "escrow_id": escrow_data.escrow_id,
            "contract_address": escrow_data.contract_address,
            "status": escrow_data.status.value,
            "trade_type": escrow_data.trade_type.value,
            "buyer_address": escrow_data.buyer_address,
            "seller_address": escrow_data.seller_address,
            "arbiter_address": escrow_data.arbiter_address,
            "created_at": escrow_data.created_at,
            "updated_at": escrow_data.updated_at
        }
    }

def create_dispute_content(dispute_record: DisputeRecord) -> Dict[str, Any]:
    """Create dispute content for agent message."""
    return {
        "type": "dispute_data",
        "dispute_data": {
            "dispute_id": dispute_record.dispute_id,
            "escrow_id": dispute_record.escrow_id,
            "disputing_party": dispute_record.disputing_party,
            "reason": dispute_record.reason,
            "status": dispute_record.status,
            "arbiter_address": dispute_record.arbiter_address,
            "created_at": dispute_record.created_at,
            "resolved_at": dispute_record.resolved_at,
            "decision": dispute_record.decision,
            "arbiter_reasoning": dispute_record.arbiter_reasoning
        }
    }

def parse_agent_message(message: Dict[str, Any]) -> Optional[AgentMessage]:
    """Parse agent message from dictionary."""
    try:
        return AgentMessage(
            timestamp=message.get("timestamp", ""),
            msg_id=message.get("msg_id", ""),
            content=message.get("content", []),
            sender=message.get("sender"),
            recipient=message.get("recipient")
        )
    except (KeyError, TypeError):
        return None

def extract_escrow_data(content: List[Dict[str, Any]]) -> Optional[Dict[str, Any]]:
    """Extract escrow data from message content."""
    for item in content:
        if item.get("type") == "escrow_data":
            return item.get("escrow_data")
    return None

def extract_dispute_data(content: List[Dict[str, Any]]) -> Optional[Dict[str, Any]]:
    """Extract dispute data from message content."""
    for item in content:
        if item.get("type") == "dispute_data":
            return item.get("dispute_data")
    return None

def extract_text_content(content: List[Dict[str, Any]]) -> List[str]:
    """Extract all text content from message content."""
    texts = []
    for item in content:
        if item.get("type") == "text":
            texts.append(item.get("text", ""))
    return texts

def extract_metadata(content: List[Dict[str, Any]]) -> Dict[str, Any]:
    """Extract metadata from message content."""
    for item in content:
        if item.get("type") == "metadata":
            return item.get("metadata", {})
    return {}

def create_error_message(error: str, details: Optional[str] = None) -> Dict[str, Any]:
    """Create error message content."""
    error_data = {
        "type": "error",
        "error": error
    }
    if details:
        error_data["details"] = details
    return error_data

def create_success_message(message: str, data: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
    """Create success message content."""
    success_data = {
        "type": "success",
        "message": message
    }
    if data:
        success_data["data"] = data
    return success_data

def create_status_update(escrow_id: str, old_status: str, new_status: str, reason: str) -> Dict[str, Any]:
    """Create status update message."""
    return {
        "type": "status_update",
        "escrow_id": escrow_id,
        "old_status": old_status,
        "new_status": new_status,
        "reason": reason,
        "timestamp": int(time.time())
    }

def validate_transaction_hash(tx_hash: str) -> bool:
    """Validate transaction hash format."""
    if not tx_hash or not isinstance(tx_hash, str):
        return False
    
    # Check if it's a valid Ethereum transaction hash
    if tx_hash.startswith('0x') and len(tx_hash) == 66:
        try:
            int(tx_hash[2:], 16)
            return True
        except ValueError:
            return False
    
    return False

def calculate_time_remaining(deadline: int) -> Dict[str, int]:
    """Calculate time remaining until deadline."""
    current_time = int(time.time())
    remaining = deadline - current_time
    
    if remaining <= 0:
        return {
            "total_seconds": 0,
            "days": 0,
            "hours": 0,
            "minutes": 0,
            "seconds": 0,
            "expired": True
        }
    
    days = remaining // (24 * 60 * 60)
    hours = (remaining % (24 * 60 * 60)) // (60 * 60)
    minutes = (remaining % (60 * 60)) // 60
    seconds = remaining % 60
    
    return {
        "total_seconds": remaining,
        "days": days,
        "hours": hours,
        "minutes": minutes,
        "seconds": seconds,
        "expired": False
    }

def format_time_remaining(deadline: int) -> str:
    """Format time remaining as human-readable string."""
    time_data = calculate_time_remaining(deadline)
    
    if time_data["expired"]:
        return "Expired"
    
    parts = []
    if time_data["days"] > 0:
        parts.append(f"{time_data['days']}d")
    if time_data["hours"] > 0:
        parts.append(f"{time_data['hours']}h")
    if time_data["minutes"] > 0:
        parts.append(f"{time_data['minutes']}m")
    if time_data["seconds"] > 0:
        parts.append(f"{time_data['seconds']}s")
    
    return " ".join(parts) if parts else "0s"

def create_agent_capabilities(agent_type: str, supported_chains: List[str], supported_assets: List[str]) -> Dict[str, Any]:
    """Create agent capabilities metadata."""
    return {
        "agent_type": agent_type,
        "supported_chains": supported_chains,
        "supported_assets": supported_assets,
        "version": "1.0.0",
        "capabilities": [
            "escrow_management",
            "dispute_resolution",
            "transaction_verification",
            "multi_chain_support"
        ],
        "last_updated": int(time.time())
    }

def log_agent_activity(agent_type: str, action: str, details: Optional[Dict[str, Any]] = None):
    """Log agent activity for debugging and monitoring."""
    log_data = {
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "agent_type": agent_type,
        "action": action,
        "details": details or {}
    }
    
    # In a real implementation, this would write to a log file or database
    print(f"AGENT_ACTIVITY: {json.dumps(log_data)}")

def create_heartbeat_message(agent_type: str, status: str = "active") -> Dict[str, Any]:
    """Create heartbeat message for agent monitoring."""
    return {
        "type": "heartbeat",
        "agent_type": agent_type,
        "status": status,
        "timestamp": int(time.time()),
        "uptime": int(time.time())  # This would be actual uptime in a real implementation
    }

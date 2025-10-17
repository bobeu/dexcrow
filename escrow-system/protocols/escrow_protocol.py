"""
Escrow Protocol for Decentralized Escrow System
Defines communication protocols between agents
"""

from uagents import Protocol
from uagents_core.contrib.protocols.chat import chat_protocol_spec
from typing import Dict, Any, List
from datetime import datetime, timezone
from uuid import uuid4

# Create the escrow protocol
escrow_protocol = Protocol(spec=chat_protocol_spec)

# Protocol message types
class EscrowMessageTypes:
    """Message types for escrow protocol"""
    CREATE_ESCROW = "create_escrow"
    ESCROW_CREATED = "escrow_created"
    DEPOSIT_REQUEST = "deposit_request"
    DEPOSIT_CONFIRMED = "deposit_confirmed"
    FULFILLMENT_REQUEST = "fulfillment_request"
    FULFILLMENT_CONFIRMED = "fulfillment_confirmed"
    RELEASE_REQUEST = "release_request"
    REFUND_REQUEST = "refund_request"
    DISPUTE_RAISED = "dispute_raised"
    DISPUTE_RESOLVED = "dispute_resolved"
    STATUS_UPDATE = "status_update"
    ORACLE_VERIFICATION = "oracle_verification"
    ORACLE_RESPONSE = "oracle_response"
    HEARTBEAT = "heartbeat"
    ERROR = "error"
    SUCCESS = "success"

def create_escrow_message(escrow_data: Dict[str, Any]) -> Dict[str, Any]:
    """Create escrow creation message"""
    return {
        "type": EscrowMessageTypes.CREATE_ESCROW,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "msg_id": str(uuid4()),
        "data": escrow_data
    }

def create_deposit_message(escrow_id: str, asset_data: Dict[str, Any], transaction_hash: str) -> Dict[str, Any]:
    """Create deposit request message"""
    return {
        "type": EscrowMessageTypes.DEPOSIT_REQUEST,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "msg_id": str(uuid4()),
        "data": {
            "escrow_id": escrow_id,
            "asset_data": asset_data,
            "transaction_hash": transaction_hash
        }
    }

def create_fulfillment_message(escrow_id: str, fulfillment_data: Dict[str, Any]) -> Dict[str, Any]:
    """Create fulfillment request message"""
    return {
        "type": EscrowMessageTypes.FULFILLMENT_REQUEST,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "msg_id": str(uuid4()),
        "data": {
            "escrow_id": escrow_id,
            "fulfillment_data": fulfillment_data
        }
    }

def create_dispute_message(escrow_id: str, dispute_data: Dict[str, Any]) -> Dict[str, Any]:
    """Create dispute raised message"""
    return {
        "type": EscrowMessageTypes.DISPUTE_RAISED,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "msg_id": str(uuid4()),
        "data": {
            "escrow_id": escrow_id,
            "dispute_data": dispute_data
        }
    }

def create_oracle_verification_message(escrow_id: str, transaction_data: Dict[str, Any]) -> Dict[str, Any]:
    """Create oracle verification message"""
    return {
        "type": EscrowMessageTypes.ORACLE_VERIFICATION,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "msg_id": str(uuid4()),
        "data": {
            "escrow_id": escrow_id,
            "transaction_data": transaction_data
        }
    }

def create_status_update_message(escrow_id: str, old_status: str, new_status: str, reason: str) -> Dict[str, Any]:
    """Create status update message"""
    return {
        "type": EscrowMessageTypes.STATUS_UPDATE,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "msg_id": str(uuid4()),
        "data": {
            "escrow_id": escrow_id,
            "old_status": old_status,
            "new_status": new_status,
            "reason": reason
        }
    }

def create_error_message(error: str, details: str = None) -> Dict[str, Any]:
    """Create error message"""
    return {
        "type": EscrowMessageTypes.ERROR,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "msg_id": str(uuid4()),
        "data": {
            "error": error,
            "details": details
        }
    }

def create_success_message(message: str, data: Dict[str, Any] = None) -> Dict[str, Any]:
    """Create success message"""
    return {
        "type": EscrowMessageTypes.SUCCESS,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "msg_id": str(uuid4()),
        "data": {
            "message": message,
            "data": data or {}
        }
    }

def create_heartbeat_message(agent_type: str, status: str = "active") -> Dict[str, Any]:
    """Create heartbeat message"""
    return {
        "type": EscrowMessageTypes.HEARTBEAT,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "msg_id": str(uuid4()),
        "data": {
            "agent_type": agent_type,
            "status": status,
            "uptime": int(datetime.now(timezone.utc).timestamp())
        }
    }

# Protocol handlers
@escrow_protocol.on_message(EscrowMessageTypes.CREATE_ESCROW)
async def handle_create_escrow(ctx, sender, msg):
    """Handle escrow creation request"""
    ctx.logger.info(f"Received escrow creation request from {sender}")
    # Implementation would be in the specific agent

@escrow_protocol.on_message(EscrowMessageTypes.DEPOSIT_REQUEST)
async def handle_deposit_request(ctx, sender, msg):
    """Handle deposit request"""
    ctx.logger.info(f"Received deposit request from {sender}")
    # Implementation would be in the specific agent

@escrow_protocol.on_message(EscrowMessageTypes.FULFILLMENT_REQUEST)
async def handle_fulfillment_request(ctx, sender, msg):
    """Handle fulfillment request"""
    ctx.logger.info(f"Received fulfillment request from {sender}")
    # Implementation would be in the specific agent

@escrow_protocol.on_message(EscrowMessageTypes.DISPUTE_RAISED)
async def handle_dispute_raised(ctx, sender, msg):
    """Handle dispute raised"""
    ctx.logger.info(f"Received dispute from {sender}")
    # Implementation would be in the specific agent

@escrow_protocol.on_message(EscrowMessageTypes.ORACLE_VERIFICATION)
async def handle_oracle_verification(ctx, sender, msg):
    """Handle oracle verification request"""
    ctx.logger.info(f"Received oracle verification request from {sender}")
    # Implementation would be in the specific agent

@escrow_protocol.on_message(EscrowMessageTypes.STATUS_UPDATE)
async def handle_status_update(ctx, sender, msg):
    """Handle status update"""
    ctx.logger.info(f"Received status update from {sender}")
    # Implementation would be in the specific agent

@escrow_protocol.on_message(EscrowMessageTypes.HEARTBEAT)
async def handle_heartbeat(ctx, sender, msg):
    """Handle heartbeat"""
    ctx.logger.info(f"Received heartbeat from {sender}")
    # Implementation would be in the specific agent

# Utility functions for protocol
def parse_message_type(message: Dict[str, Any]) -> str:
    """Parse message type from message"""
    return message.get("type", "unknown")

def parse_message_data(message: Dict[str, Any]) -> Dict[str, Any]:
    """Parse message data from message"""
    return message.get("data", {})

def validate_message(message: Dict[str, Any]) -> bool:
    """Validate message format"""
    required_fields = ["type", "timestamp", "msg_id", "data"]
    return all(field in message for field in required_fields)

def create_acknowledgement_message(original_msg_id: str) -> Dict[str, Any]:
    """Create acknowledgement message"""
    return {
        "type": "acknowledgement",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "msg_id": str(uuid4()),
        "data": {
            "acknowledged_msg_id": original_msg_id
        }
    }

def create_response_message(original_msg_id: str, response_type: str, response_data: Dict[str, Any]) -> Dict[str, Any]:
    """Create response message"""
    return {
        "type": response_type,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "msg_id": str(uuid4()),
        "data": {
            "original_msg_id": original_msg_id,
            "response_data": response_data
        }
    }

# Protocol constants
class EscrowProtocolConstants:
    """Constants for escrow protocol"""
    PROTOCOL_VERSION = "1.0.0"
    SUPPORTED_MESSAGE_TYPES = [
        EscrowMessageTypes.CREATE_ESCROW,
        EscrowMessageTypes.ESCROW_CREATED,
        EscrowMessageTypes.DEPOSIT_REQUEST,
        EscrowMessageTypes.DEPOSIT_CONFIRMED,
        EscrowMessageTypes.FULFILLMENT_REQUEST,
        EscrowMessageTypes.FULFILLMENT_CONFIRMED,
        EscrowMessageTypes.RELEASE_REQUEST,
        EscrowMessageTypes.REFUND_REQUEST,
        EscrowMessageTypes.DISPUTE_RAISED,
        EscrowMessageTypes.DISPUTE_RESOLVED,
        EscrowMessageTypes.STATUS_UPDATE,
        EscrowMessageTypes.ORACLE_VERIFICATION,
        EscrowMessageTypes.ORACLE_RESPONSE,
        EscrowMessageTypes.HEARTBEAT,
        EscrowMessageTypes.ERROR,
        EscrowMessageTypes.SUCCESS
    ]
    
    # Timeout constants (in seconds)
    MESSAGE_TIMEOUT = 30
    HEARTBEAT_INTERVAL = 60
    DISPUTE_TIMEOUT = 86400  # 24 hours
    
    # Retry constants
    MAX_RETRIES = 3
    RETRY_DELAY = 5  # seconds

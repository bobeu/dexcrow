"""
Seller Agent for Decentralized Escrow System
Handles seller-side operations and interactions
"""

import os
import json
from datetime import datetime, timezone
from uuid import uuid4
from typing import Dict, Any, Optional

from uagents import Agent, Context, Protocol
from uagents_core.contrib.protocols.chat import (
    chat_protocol_spec,
    ChatMessage, ChatAcknowledgement,
    TextContent, MetadataContent,
    StartSessionContent, EndSessionContent,
)

# Initialize the seller agent
agent = Agent()
chat_proto = Protocol(spec=chat_protocol_spec)

# Agent configuration
AGENT_NAME = "Seller Agent"
AGENT_VERSION = "1.0.0"
AGENT_DESCRIPTION = "Handles seller-side escrow operations and interactions"

def _text(msg: str) -> ChatMessage:
    """Helper function to create a text chat message."""
    return ChatMessage(
        timestamp=datetime.now(timezone.utc),
        msg_id=uuid4(),
        content=[TextContent(type="text", text=msg)]
    )

def _metadata(metadata: dict) -> ChatMessage:
    """Helper function to create a metadata chat message."""
    return ChatMessage(
        timestamp=datetime.now(timezone.utc),
        msg_id=uuid4(),
        content=[MetadataContent(type="metadata", metadata=metadata)]
    )

@chat_proto.on_message(ChatMessage)
async def on_chat(ctx: Context, sender: str, msg: ChatMessage):
    """Handle incoming chat messages."""
    # ACK first - required by protocol
    await ctx.send(sender, ChatAcknowledgement(
        timestamp=datetime.now(timezone.utc),
        acknowledged_msg_id=msg.msg_id,
    ))
    
    for content in msg.content:
        if isinstance(content, StartSessionContent):
            ctx.logger.info("Seller agent session started")
            # Advertise capabilities
            await ctx.send(sender, _metadata({
                "capabilities": "seller-operations",
                "description": "Handles seller-side escrow operations",
                "version": AGENT_VERSION,
                "supported_actions": [
                    "fulfill_obligation",
                    "confirm_delivery",
                    "raise_dispute",
                    "check_status",
                    "provide_evidence"
                ]
            }))
            await ctx.send(sender, _text("🛍️ Seller Agent Ready! I can help you with:\n\n• Fulfilling your obligations\n• Confirming delivery\n• Raising disputes\n• Checking transaction status\n• Providing evidence\n\nWhat would you like to do?"))
            
        elif isinstance(content, TextContent):
            ctx.logger.info(f"Seller agent received: {content.text}")
            await handle_seller_request(ctx, sender, content.text)
            
        elif isinstance(content, EndSessionContent):
            ctx.logger.info("Seller agent session ended")
            await ctx.send(sender, _text("Thank you for using the Seller Agent! Your fulfillment operations are complete."))

async def handle_seller_request(ctx: Context, sender: str, request: str):
    """Handle seller-specific requests."""
    request_lower = request.lower()
    
    if "fulfill" in request_lower or "deliver" in request_lower:
        await handle_fulfill_obligation(ctx, sender)
    elif "confirm" in request_lower and "delivery" in request_lower:
        await handle_confirm_delivery(ctx, sender)
    elif "dispute" in request_lower or "raise dispute" in request_lower:
        await handle_raise_dispute(ctx, sender)
    elif "status" in request_lower or "check" in request_lower:
        await handle_check_status(ctx, sender)
    elif "evidence" in request_lower or "proof" in request_lower:
        await handle_provide_evidence(ctx, sender)
    elif "help" in request_lower:
        await handle_help(ctx, sender)
    else:
        await ctx.send(sender, _text("I'm not sure what you're asking for. Type 'help' to see available commands."))

async def handle_fulfill_obligation(ctx: Context, sender: str):
    """Handle obligation fulfillment request."""
    await ctx.send(sender, _text("To fulfill your obligation, I need:\n\n"
                                "1. Escrow contract address\n"
                                "2. Fulfillment type (crypto_transfer, fiat_payment, cross_chain_swap)\n"
                                "3. Transaction hash or proof\n"
                                "4. Additional details\n\n"
                                "Please provide the details:\n"
                                "FULFILL: {escrow_address}, {fulfillment_type}, {transaction_hash}, {details}"))

async def handle_confirm_delivery(ctx: Context, sender: str):
    """Handle delivery confirmation request."""
    await ctx.send(sender, _text("To confirm delivery, I need:\n\n"
                                "1. Escrow contract address\n"
                                "2. Delivery confirmation\n"
                                "3. Any additional proof\n\n"
                                "Please provide the details:\n"
                                "CONFIRM_DELIVERY: {escrow_address}, {confirmation}, {proof}"))

async def handle_raise_dispute(ctx: Context, sender: str):
    """Handle dispute raising request."""
    await ctx.send(sender, _text("To raise a dispute, I need:\n\n"
                                "1. Escrow contract address\n"
                                "2. Reason for dispute\n"
                                "3. Evidence (if any)\n\n"
                                "Please provide the details:\n"
                                "DISPUTE: {escrow_address}, {reason}"))

async def handle_check_status(ctx: Context, sender: str):
    """Handle status check request."""
    await ctx.send(sender, _text("To check transaction status, I need:\n\n"
                                "1. Escrow contract address\n\n"
                                "Please provide the address:\n"
                                "STATUS: {escrow_address}"))

async def handle_provide_evidence(ctx: Context, sender: str):
    """Handle evidence provision request."""
    await ctx.send(sender, _text("To provide evidence, I need:\n\n"
                                "1. Escrow contract address\n"
                                "2. Evidence type\n"
                                "3. Evidence data\n\n"
                                "Please provide the details:\n"
                                "EVIDENCE: {escrow_address}, {evidence_type}, {evidence_data}"))

async def handle_help(ctx: Context, sender: str):
    """Handle help request."""
    await ctx.send(sender, _text("Available commands:\n\n"
                                "• FULFILL - Fulfill your obligations\n"
                                "• CONFIRM_DELIVERY - Confirm delivery\n"
                                "• DISPUTE - Raise a dispute\n"
                                "• STATUS - Check transaction status\n"
                                "• EVIDENCE - Provide evidence\n"
                                "• HELP - Show this help message\n\n"
                                "Use these commands with the required parameters."))

@chat_proto.on_message(ChatAcknowledgement)
async def on_ack(ctx: Context, sender: str, msg: ChatAcknowledgement):
    """Handle acknowledgements."""
    ctx.logger.info(f"ACK from {sender} for {msg.acknowledged_msg_id}")

# Include the chat protocol and publish manifest
agent.include(chat_proto, publish_manifest=True)

if __name__ == "__main__":
    agent.run()

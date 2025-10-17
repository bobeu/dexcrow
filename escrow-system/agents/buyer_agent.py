"""
Buyer Agent for Decentralized Escrow System
Handles buyer-side operations and interactions
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

# Initialize the buyer agent
agent = Agent()
chat_proto = Protocol(spec=chat_protocol_spec)

# Agent configuration
AGENT_NAME = "Buyer Agent"
AGENT_VERSION = "1.0.0"
AGENT_DESCRIPTION = "Handles buyer-side escrow operations and interactions"

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
            ctx.logger.info("Buyer agent session started")
            # Advertise capabilities
            await ctx.send(sender, _metadata({
                "capabilities": "buyer-operations",
                "description": "Handles buyer-side escrow operations",
                "version": AGENT_VERSION,
                "supported_actions": [
                    "create_escrow",
                    "deposit_assets",
                    "confirm_fulfillment",
                    "raise_dispute",
                    "refund_request"
                ]
            }))
            await ctx.send(sender, _text("🏦 Buyer Agent Ready! I can help you with:\n\n• Creating new escrow transactions\n• Depositing assets into escrow\n• Confirming fulfillment\n• Raising disputes\n• Requesting refunds\n\nWhat would you like to do?"))
            
        elif isinstance(content, TextContent):
            ctx.logger.info(f"Buyer agent received: {content.text}")
            await handle_buyer_request(ctx, sender, content.text)
            
        elif isinstance(content, EndSessionContent):
            ctx.logger.info("Buyer agent session ended")
            await ctx.send(sender, _text("Thank you for using the Buyer Agent! Your escrow operations are complete."))

async def handle_buyer_request(ctx: Context, sender: str, request: str):
    """Handle buyer-specific requests."""
    request_lower = request.lower()
    
    if "create escrow" in request_lower or "new escrow" in request_lower:
        await handle_create_escrow(ctx, sender)
    elif "deposit" in request_lower:
        await handle_deposit_assets(ctx, sender)
    elif "confirm" in request_lower and "fulfillment" in request_lower:
        await handle_confirm_fulfillment(ctx, sender)
    elif "dispute" in request_lower or "raise dispute" in request_lower:
        await handle_raise_dispute(ctx, sender)
    elif "refund" in request_lower:
        await handle_refund_request(ctx, sender)
    elif "help" in request_lower:
        await handle_help(ctx, sender)
    else:
        await ctx.send(sender, _text("I'm not sure what you're asking for. Type 'help' to see available commands."))

async def handle_create_escrow(ctx: Context, sender: str):
    """Handle escrow creation request."""
    await ctx.send(sender, _text("To create a new escrow, I need the following information:\n\n"
                                "1. Seller address\n"
                                "2. Arbiter address\n"
                                "3. Asset type and amount\n"
                                "4. Counter asset details\n"
                                "5. Deadline (in days)\n"
                                "6. Description\n\n"
                                "Please provide these details in the format:\n"
                                "CREATE_ESCROW: {seller_address}, {arbiter_address}, {asset_amount}, {counter_asset}, {deadline_days}, {description}"))

async def handle_deposit_assets(ctx: Context, sender: str):
    """Handle asset deposit request."""
    await ctx.send(sender, _text("To deposit assets into escrow, I need:\n\n"
                                "1. Escrow contract address\n"
                                "2. Asset amount\n"
                                "3. Transaction confirmation\n\n"
                                "Please provide the escrow address and amount:\n"
                                "DEPOSIT: {escrow_address}, {amount}"))

async def handle_confirm_fulfillment(ctx: Context, sender: str):
    """Handle fulfillment confirmation request."""
    await ctx.send(sender, _text("To confirm fulfillment, I need:\n\n"
                                "1. Escrow contract address\n"
                                "2. Confirmation that seller has fulfilled their obligations\n\n"
                                "Please provide the escrow address:\n"
                                "CONFIRM: {escrow_address}"))

async def handle_raise_dispute(ctx: Context, sender: str):
    """Handle dispute raising request."""
    await ctx.send(sender, _text("To raise a dispute, I need:\n\n"
                                "1. Escrow contract address\n"
                                "2. Reason for dispute\n"
                                "3. Evidence (if any)\n\n"
                                "Please provide the details:\n"
                                "DISPUTE: {escrow_address}, {reason}"))

async def handle_refund_request(ctx: Context, sender: str):
    """Handle refund request."""
    await ctx.send(sender, _text("To request a refund, I need:\n\n"
                                "1. Escrow contract address\n"
                                "2. Reason for refund\n\n"
                                "Please provide the details:\n"
                                "REFUND: {escrow_address}, {reason}"))

async def handle_help(ctx: Context, sender: str):
    """Handle help request."""
    await ctx.send(sender, _text("Available commands:\n\n"
                                "• CREATE_ESCROW - Create a new escrow transaction\n"
                                "• DEPOSIT - Deposit assets into escrow\n"
                                "• CONFIRM - Confirm seller fulfillment\n"
                                "• DISPUTE - Raise a dispute\n"
                                "• REFUND - Request a refund\n"
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

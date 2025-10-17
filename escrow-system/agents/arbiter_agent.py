"""
Arbiter Agent for Decentralized Escrow System
Handles dispute resolution and arbitration
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

# Initialize the arbiter agent
agent = Agent()
chat_proto = Protocol(spec=chat_protocol_spec)

# Agent configuration
AGENT_NAME = "Arbiter Agent"
AGENT_VERSION = "1.0.0"
AGENT_DESCRIPTION = "Handles dispute resolution and arbitration"

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

async def analyze_dispute(dispute_data: dict) -> dict:
    """Analyze dispute and provide recommendation."""
    # This would typically involve:
    # 1. Reviewing evidence from both parties
    # 2. Checking transaction history
    # 3. Analyzing communication logs
    # 4. Making a fair decision
    
    analysis = {
        "dispute_id": dispute_data.get("dispute_id"),
        "parties": {
            "buyer": dispute_data.get("buyer_address"),
            "seller": dispute_data.get("seller_address")
        },
        "evidence": dispute_data.get("evidence", []),
        "recommendation": "REQUIRES_MORE_EVIDENCE",
        "confidence": 0.5,
        "reasoning": "Insufficient evidence to make a decision",
        "required_evidence": [
            "Transaction proof",
            "Communication logs",
            "Delivery confirmation"
        ]
    }
    
    # Simple analysis based on evidence count
    evidence_count = len(dispute_data.get("evidence", []))
    if evidence_count >= 3:
        analysis["recommendation"] = "RELEASE_FUNDS"
        analysis["confidence"] = 0.8
        analysis["reasoning"] = "Sufficient evidence supports seller's claim"
    elif evidence_count >= 1:
        analysis["recommendation"] = "REFUND_FUNDS"
        analysis["confidence"] = 0.6
        analysis["reasoning"] = "Evidence supports buyer's claim"
    
    return analysis

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
            ctx.logger.info("Arbiter agent session started")
            # Advertise capabilities
            await ctx.send(sender, _metadata({
                "capabilities": "dispute-resolution",
                "description": "Handles dispute resolution and arbitration",
                "version": AGENT_VERSION,
                "supported_actions": [
                    "analyze_dispute",
                    "resolve_dispute",
                    "request_evidence",
                    "make_decision",
                    "provide_reasoning"
                ]
            }))
            await ctx.send(sender, _text("⚖️ Arbiter Agent Ready! I can help you with:\n\n• Analyzing disputes\n• Resolving conflicts\n• Requesting evidence\n• Making fair decisions\n• Providing detailed reasoning\n\nWhat dispute would you like me to review?"))
            
        elif isinstance(content, TextContent):
            ctx.logger.info(f"Arbiter agent received: {content.text}")
            await handle_arbiter_request(ctx, sender, content.text)
            
        elif isinstance(content, EndSessionContent):
            ctx.logger.info("Arbiter agent session ended")
            await ctx.send(sender, _text("Thank you for using the Arbiter Agent! Dispute resolution complete."))

async def handle_arbiter_request(ctx: Context, sender: str, request: str):
    """Handle arbiter-specific requests."""
    request_lower = request.lower()
    
    if "analyze" in request_lower or "review" in request_lower:
        await handle_analyze_dispute(ctx, sender)
    elif "resolve" in request_lower or "decision" in request_lower:
        await handle_resolve_dispute(ctx, sender)
    elif "evidence" in request_lower:
        await handle_request_evidence(ctx, sender)
    elif "help" in request_lower:
        await handle_help(ctx, sender)
    else:
        await ctx.send(sender, _text("I'm not sure what you're asking for. Type 'help' to see available commands."))

async def handle_analyze_dispute(ctx: Context, sender: str):
    """Handle dispute analysis request."""
    await ctx.send(sender, _text("To analyze a dispute, I need:\n\n"
                                "1. Dispute ID\n"
                                "2. Buyer address\n"
                                "3. Seller address\n"
                                "4. Evidence (if any)\n"
                                "5. Dispute reason\n\n"
                                "Please provide the details:\n"
                                "ANALYZE: {dispute_id}, {buyer_address}, {seller_address}, {evidence}, {reason}"))

async def handle_resolve_dispute(ctx: Context, sender: str):
    """Handle dispute resolution request."""
    await ctx.send(sender, _text("To resolve a dispute, I need:\n\n"
                                "1. Dispute ID\n"
                                "2. Decision (RELEASE_FUNDS or REFUND_FUNDS)\n"
                                "3. Reasoning\n"
                                "4. Evidence analysis\n\n"
                                "Please provide the details:\n"
                                "RESOLVE: {dispute_id}, {decision}, {reasoning}"))

async def handle_request_evidence(ctx: Context, sender: str):
    """Handle evidence request."""
    await ctx.send(sender, _text("To request evidence, I need:\n\n"
                                "1. Dispute ID\n"
                                "2. Required evidence types\n"
                                "3. Deadline\n\n"
                                "Please provide the details:\n"
                                "EVIDENCE: {dispute_id}, {evidence_types}, {deadline}"))

async def handle_help(ctx: Context, sender: str):
    """Handle help request."""
    await ctx.send(sender, _text("Available commands:\n\n"
                                "• ANALYZE - Analyze a dispute\n"
                                "• RESOLVE - Resolve a dispute\n"
                                "• EVIDENCE - Request evidence\n"
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

"""
Oracle Agent for Decentralized Escrow System
Handles transaction verification and validation
"""

import os
import json
import requests
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

# Initialize the oracle agent
agent = Agent()
chat_proto = Protocol(spec=chat_protocol_spec)

# Agent configuration
AGENT_NAME = "Oracle Agent"
AGENT_VERSION = "1.0.0"
AGENT_DESCRIPTION = "Handles transaction verification and validation"

# External API configuration
ASI_ONE_API_KEY = os.getenv('ASI_ONE_API_KEY')
ASI_ONE_URL = "https://api.asi1.ai/v1/chat/completions"

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

async def verify_transaction_with_ai(transaction_data: dict) -> dict:
    """Verify transaction using AI service."""
    if not ASI_ONE_API_KEY:
        return {
            "verified": False,
            "confidence": 0.0,
            "error": "AI service not configured"
        }
    
    try:
        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {ASI_ONE_API_KEY}"
        }
        
        prompt = f"""Analyze this transaction for verification:
        
        Transaction Hash: {transaction_data.get('transaction_hash', 'N/A')}
        Amount: {transaction_data.get('amount', 'N/A')}
        Token: {transaction_data.get('token', 'N/A')}
        Chain ID: {transaction_data.get('chain_id', 'N/A')}
        From: {transaction_data.get('from_address', 'N/A')}
        To: {transaction_data.get('to_address', 'N/A')}
        
        Please verify:
        1. Transaction exists on blockchain
        2. Amount matches expected value
        3. Token address is correct
        4. Addresses are valid
        5. Transaction is confirmed
        
        Respond with JSON:
        {{
            "verified": true/false,
            "confidence": 0.0-1.0,
            "details": "explanation",
            "block_number": 12345,
            "gas_used": 21000
        }}"""

        data = {
            "model": "asi1-mini",
            "messages": [
                {"role": "system", "content": "You are a blockchain transaction verification expert."},
                {"role": "user", "content": prompt}
            ],
            "max_tokens": 500,
            "temperature": 0.1
        }
        
        response = requests.post(ASI_ONE_URL, headers=headers, json=data, timeout=30)
        response.raise_for_status()
        
        result = response.json()
        ai_response = result['choices'][0]['message']['content']
        
        # Parse AI response
        try:
            verification_result = json.loads(ai_response)
            return verification_result
        except json.JSONDecodeError:
            return {
                "verified": False,
                "confidence": 0.0,
                "error": "Failed to parse AI response"
            }
            
    except Exception as e:
        return {
            "verified": False,
            "confidence": 0.0,
            "error": str(e)
        }

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
            ctx.logger.info("Oracle agent session started")
            # Advertise capabilities
            await ctx.send(sender, _metadata({
                "capabilities": "transaction-verification",
                "description": "Handles transaction verification and validation",
                "version": AGENT_VERSION,
                "supported_chains": ["ethereum", "polygon", "arbitrum", "optimism", "bsc"],
                "supported_assets": ["ETH", "ERC20", "ERC721", "ERC1155"]
            }))
            await ctx.send(sender, _text("🔍 Oracle Agent Ready! I can help you with:\n\n• Verifying blockchain transactions\n• Validating token transfers\n• Checking transaction confirmations\n• Cross-chain verification\n• AI-powered analysis\n\nWhat would you like to verify?"))
            
        elif isinstance(content, TextContent):
            ctx.logger.info(f"Oracle agent received: {content.text}")
            await handle_oracle_request(ctx, sender, content.text)
            
        elif isinstance(content, EndSessionContent):
            ctx.logger.info("Oracle agent session ended")
            await ctx.send(sender, _text("Thank you for using the Oracle Agent! Verification complete."))

async def handle_oracle_request(ctx: Context, sender: str, request: str):
    """Handle oracle-specific requests."""
    request_lower = request.lower()
    
    if "verify" in request_lower or "check" in request_lower:
        await handle_verify_transaction(ctx, sender)
    elif "status" in request_lower:
        await handle_check_status(ctx, sender)
    elif "help" in request_lower:
        await handle_help(ctx, sender)
    else:
        await ctx.send(sender, _text("I'm not sure what you're asking for. Type 'help' to see available commands."))

async def handle_verify_transaction(ctx: Context, sender: str):
    """Handle transaction verification request."""
    await ctx.send(sender, _text("To verify a transaction, I need:\n\n"
                                "1. Transaction hash\n"
                                "2. Expected amount\n"
                                "3. Token address\n"
                                "4. Chain ID\n"
                                "5. From/To addresses\n\n"
                                "Please provide the details:\n"
                                "VERIFY: {transaction_hash}, {amount}, {token}, {chain_id}, {from_address}, {to_address}"))

async def handle_check_status(ctx: Context, sender: str):
    """Handle status check request."""
    await ctx.send(sender, _text("To check verification status, I need:\n\n"
                                "1. Escrow contract address\n"
                                "2. Transaction hash\n\n"
                                "Please provide the details:\n"
                                "STATUS: {escrow_address}, {transaction_hash}"))

async def handle_help(ctx: Context, sender: str):
    """Handle help request."""
    await ctx.send(sender, _text("Available commands:\n\n"
                                "• VERIFY - Verify a blockchain transaction\n"
                                "• STATUS - Check verification status\n"
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

import os
import requests
from datetime import datetime, timezone
from uuid import uuid4
from uagents import Agent, Context, Protocol
from uagents_core.contrib.protocols.chat import (
    chat_protocol_spec,
    ChatMessage, ChatAcknowledgement,
    TextContent, MetadataContent,
    StartSessionContent, EndSessionContent,
)

# Initialize the agent
agent = Agent()  # Hosted: identity & manifest handled by Agentverse
chat_proto = Protocol(spec=chat_protocol_spec)

# ASI1 API configuration
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

async def get_supercar_expert_response(user_query: str) -> str:
    """Get expert supercar response from ASI1 API."""
    if not ASI_ONE_API_KEY:
        return "I'm sorry, but I'm not properly configured to access my supercar knowledge base. Please ensure the ASI_ONE_API_KEY is set."
    
    try:
        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {ASI_ONE_API_KEY}"
        }
        
        # Enhance the prompt to make it supercar-specific
        enhanced_prompt = f"""You are an expert automotive journalist and supercar specialist with deep knowledge of:
- High-performance supercars, hypercars, and exotic vehicles
- Technical specifications, performance metrics, and engineering details
- Racing heritage, track performance, and lap times
- Design philosophy, aerodynamics, and cutting-edge technology
- Market values, production numbers, and collector information
- Brand history, iconic models, and future concepts

User question: {user_query}

Provide a comprehensive, expert-level response about supercars. Include specific details, technical specifications, and interesting facts. If the question isn't directly about supercars, try to relate it to the supercar world or explain how it applies to high-performance vehicles."""

        data = {
            "model": "asi1-mini",
            "messages": [
                {"role": "system", "content": "You are a world-renowned supercar expert and automotive journalist with decades of experience covering exotic and high-performance vehicles."},
                {"role": "user", "content": enhanced_prompt}
            ],
            "max_tokens": 1000,
            "temperature": 0.7
        }
        
        response = requests.post(ASI_ONE_URL, headers=headers, json=data, timeout=30)
        response.raise_for_status()
        
        result = response.json()
        return result['choices'][0]['message']['content']
        
    except requests.exceptions.RequestException as e:
        return f"I encountered an issue accessing my supercar knowledge base: {str(e)}"
    except KeyError as e:
        return f"I received an unexpected response format from my knowledge base: {str(e)}"
    except Exception as e:
        return f"An unexpected error occurred: {str(e)}"

@chat_proto.on_message(ChatMessage)
async def on_chat(ctx: Context, sender: str, msg: ChatMessage):
    """Handle incoming chat messages."""
    # ACK first - this is required by the protocol
    await ctx.send(sender, ChatAcknowledgement(
        timestamp=datetime.now(timezone.utc),
        acknowledged_msg_id=msg.msg_id,
    ))
    
    for content in msg.content:
        if isinstance(content, StartSessionContent):
            ctx.logger.info("Supercar expert session started")
            # Advertise capabilities
            await ctx.send(sender, _metadata({
                "capabilities": "supercar-expert",
                "description": "Expert assistant specializing in supercars, hypercars, and exotic vehicles",
                "version": "1.0"
            }))
            await ctx.send(sender, _text("🏎️ Welcome! I'm your supercar expert assistant. I can help you with:\n\n• Technical specifications and performance data\n• Racing heritage and track records\n• Design philosophy and aerodynamics\n• Market values and collector information\n• Brand history and iconic models\n• Future concepts and cutting-edge technology\n\nWhat would you like to know about supercars?"))
            
        elif isinstance(content, TextContent):
            ctx.logger.info(f"User asked: {content.text}")
            
            # Get expert response from ASI1
            expert_response = await get_supercar_expert_response(content.text)
            
            # Send the response
            await ctx.send(sender, _text(expert_response))
            
        elif isinstance(content, EndSessionContent):
            ctx.logger.info("Supercar expert session ended")
            await ctx.send(sender, _text("Thank you for consulting with the supercar expert! Feel free to return anytime for more automotive insights. 🏁"))

@chat_proto.on_message(ChatAcknowledgement)
async def on_ack(ctx: Context, sender: str, msg: ChatAcknowledgement):
    """Handle acknowledgements."""
    ctx.logger.info(f"ACK from {sender} for {msg.acknowledged_msg_id}")

# Include the chat protocol and publish manifest
agent.include(chat_proto, publish_manifest=True)

if __name__ == "__main__":
    agent.run()

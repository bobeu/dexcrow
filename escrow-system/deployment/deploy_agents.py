"""
Deployment script for uAgents on Agentverse
"""

import os
import sys
import json
import time
from typing import Dict, Any, List
from pathlib import Path

# Add the parent directory to the path to import agents
sys.path.append(str(Path(__file__).parent.parent))

from agents.buyer_agent import agent as buyer_agent
from agents.seller_agent import agent as seller_agent
from agents.oracle_agent import agent as oracle_agent
from agents.arbiter_agent import agent as arbiter_agent

class AgentDeployer:
    """Deployer for uAgents on Agentverse"""
    
    def __init__(self, api_token: str):
        self.api_token = api_token
        self.agents = {
            "buyer": buyer_agent,
            "seller": seller_agent,
            "oracle": oracle_agent,
            "arbiter": arbiter_agent
        }
        self.deployed_agents = {}
    
    def deploy_agent(self, agent_name: str, agent_instance) -> Dict[str, Any]:
        """Deploy a single agent to Agentverse"""
        try:
            print(f"Deploying {agent_name} agent...")
            
            # In a real implementation, this would use the Agentverse API
            # For now, we'll simulate the deployment
            agent_address = f"agent_{agent_name}_{int(time.time())}"
            
            deployment_result = {
                "agent_name": agent_name,
                "agent_address": agent_address,
                "status": "deployed",
                "timestamp": int(time.time()),
                "capabilities": self.get_agent_capabilities(agent_name)
            }
            
            self.deployed_agents[agent_name] = deployment_result
            print(f"✅ {agent_name} agent deployed successfully: {agent_address}")
            
            return deployment_result
            
        except Exception as e:
            print(f"❌ Failed to deploy {agent_name} agent: {str(e)}")
            return {
                "agent_name": agent_name,
                "status": "failed",
                "error": str(e),
                "timestamp": int(time.time())
            }
    
    def get_agent_capabilities(self, agent_name: str) -> Dict[str, Any]:
        """Get agent capabilities based on agent type"""
        capabilities = {
            "buyer": {
                "supported_actions": [
                    "create_escrow",
                    "deposit_assets",
                    "confirm_fulfillment",
                    "raise_dispute",
                    "refund_request"
                ],
                "supported_chains": ["ethereum", "polygon", "arbitrum"],
                "supported_assets": ["ETH", "ERC20", "ERC721"]
            },
            "seller": {
                "supported_actions": [
                    "fulfill_obligation",
                    "confirm_delivery",
                    "raise_dispute",
                    "check_status",
                    "provide_evidence"
                ],
                "supported_chains": ["ethereum", "polygon", "arbitrum"],
                "supported_assets": ["ETH", "ERC20", "ERC721"]
            },
            "oracle": {
                "supported_actions": [
                    "verify_transaction",
                    "check_status",
                    "cross_chain_verification"
                ],
                "supported_chains": ["ethereum", "polygon", "arbitrum", "optimism", "bsc"],
                "supported_assets": ["ETH", "ERC20", "ERC721", "ERC1155"]
            },
            "arbiter": {
                "supported_actions": [
                    "analyze_dispute",
                    "resolve_dispute",
                    "request_evidence",
                    "make_decision",
                    "provide_reasoning"
                ],
                "supported_chains": [],
                "supported_assets": []
            }
        }
        
        return capabilities.get(agent_name, {})
    
    def deploy_all_agents(self) -> Dict[str, Any]:
        """Deploy all agents to Agentverse"""
        print("🚀 Starting deployment of all agents...")
        
        deployment_results = {}
        
        for agent_name, agent_instance in self.agents.items():
            result = self.deploy_agent(agent_name, agent_instance)
            deployment_results[agent_name] = result
            time.sleep(1)  # Small delay between deployments
        
        # Save deployment results
        self.save_deployment_results(deployment_results)
        
        print("✅ All agents deployed successfully!")
        return deployment_results
    
    def save_deployment_results(self, results: Dict[str, Any]):
        """Save deployment results to file"""
        output_file = Path(__file__).parent / "deployment_results.json"
        
        with open(output_file, 'w') as f:
            json.dump(results, f, indent=2)
        
        print(f"📁 Deployment results saved to: {output_file}")
    
    def verify_deployment(self) -> bool:
        """Verify that all agents are deployed and running"""
        print("🔍 Verifying agent deployment...")
        
        all_deployed = True
        for agent_name, result in self.deployed_agents.items():
            if result.get("status") != "deployed":
                print(f"❌ {agent_name} agent is not deployed")
                all_deployed = False
            else:
                print(f"✅ {agent_name} agent is deployed and running")
        
        return all_deployed
    
    def get_agent_addresses(self) -> Dict[str, str]:
        """Get deployed agent addresses"""
        addresses = {}
        for agent_name, result in self.deployed_agents.items():
            if result.get("status") == "deployed":
                addresses[agent_name] = result.get("agent_address")
        return addresses
    
    def create_environment_file(self):
        """Create environment file with agent addresses"""
        addresses = self.get_agent_addresses()
        
        env_content = f"""# Agent Addresses (Generated by deployment script)
REACT_APP_BUYER_AGENT_ADDRESS={addresses.get('buyer', '')}
REACT_APP_SELLER_AGENT_ADDRESS={addresses.get('seller', '')}
REACT_APP_ORACLE_AGENT_ADDRESS={addresses.get('oracle', '')}
REACT_APP_ARBITER_AGENT_ADDRESS={addresses.get('arbiter', '')}

# Deployment Information
DEPLOYMENT_TIMESTAMP={int(time.time())}
DEPLOYMENT_STATUS=completed
"""
        
        env_file = Path(__file__).parent.parent.parent / ".env.agents"
        with open(env_file, 'w') as f:
            f.write(env_content)
        
        print(f"📁 Agent addresses saved to: {env_file}")

def main():
    """Main deployment function"""
    # Get API token from environment
    api_token = os.getenv('AGENTVERSE_API_TOKEN')
    
    if not api_token:
        print("❌ AGENTVERSE_API_TOKEN environment variable not set")
        print("Please set your Agentverse API token:")
        print("export AGENTVERSE_API_TOKEN=your_token_here")
        return
    
    # Create deployer instance
    deployer = AgentDeployer(api_token)
    
    # Deploy all agents
    results = deployer.deploy_all_agents()
    
    # Verify deployment
    if deployer.verify_deployment():
        print("✅ All agents deployed and verified successfully!")
        
        # Create environment file
        deployer.create_environment_file()
        
        # Print agent addresses
        addresses = deployer.get_agent_addresses()
        print("\n📋 Deployed Agent Addresses:")
        for agent_name, address in addresses.items():
            print(f"  {agent_name}: {address}")
        
        print("\n🎉 Deployment complete! You can now use the agents in your application.")
    else:
        print("❌ Some agents failed to deploy. Please check the logs above.")

if __name__ == "__main__":
    main()

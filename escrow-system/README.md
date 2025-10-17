![tag:avmcp](https://img.shields.io/badge/avmcp-6C63FF)

# Supercar Expert Agent 🏎️

A specialized uAgent hosted on Agentverse that serves as an expert assistant for supercars, hypercars, and exotic vehicles. The agent uses the Agent Chat Protocol for ASI1 compatibility and integrates with the ASI1 API to provide comprehensive automotive expertise.

## Features

- **Expert Knowledge**: Deep expertise in supercars, hypercars, and exotic vehicles
- **Technical Specifications**: Detailed performance metrics, engineering details, and specifications
- **Racing Heritage**: Track performance, lap times, and racing history
- **Design & Technology**: Aerodynamics, design philosophy, and cutting-edge technology
- **Market Intelligence**: Values, production numbers, and collector information
- **Brand Expertise**: History, iconic models, and future concepts
- **ASI1 Compatible**: Uses Agent Chat Protocol for seamless integration

## Capabilities

The agent can provide expert insights on:

- 🏁 **Performance Data**: 0-60 times, top speeds, lap records, power-to-weight ratios
- 🔧 **Technical Specs**: Engine configurations, transmission systems, suspension setups
- 🏆 **Racing Heritage**: Le Mans victories, F1 connections, track day performance
- 💨 **Aerodynamics**: Downforce, drag coefficients, active aero systems
- 💰 **Market Values**: Current prices, appreciation trends, investment potential
- 🏭 **Production Info**: Limited editions, production numbers, exclusivity
- 🎨 **Design Philosophy**: Styling evolution, brand DNA, iconic elements
- 🚀 **Future Tech**: Hybrid systems, electric hypercars, autonomous features

## Environment Variables

Create a `.env` file in the agent directory with the following variables:

```env
# ASI1 API Key for supercar knowledge and responses
ASI_ONE_API_KEY=your_actual_api_key_here

# Agentverse URL (default for hosted agents)
AGENTVERSE_URL=https://agentverse.ai
```

## Installation & Setup

1. **Get ASI1 API Key**: Obtain your API key from [ASI1](https://asi1.ai)
2. **Set Environment Variables**: Update the `.env` file with your actual API key
3. **Deploy to Agentverse**: The agent is ready for deployment to Agentverse

## Usage

### Starting a Session

When you start a chat session with the agent, it will:
1. Send a welcome message with available capabilities
2. Advertise its supercar expertise
3. Wait for your questions about supercars

### Asking Questions

You can ask about:
- Specific supercar models (e.g., "Tell me about the McLaren P1")
- Performance comparisons (e.g., "How does the LaFerrari compare to the P1?")
- Technical details (e.g., "What's the difference between active and passive aerodynamics?")
- Market information (e.g., "What's the current value of a 1990s McLaren F1?")
- Racing history (e.g., "Which supercars have won Le Mans?")

### Example Interactions

**User**: "What makes the Bugatti Chiron special?"

**Agent**: "The Bugatti Chiron represents the pinnacle of automotive engineering with several groundbreaking features:

**Power & Performance:**
- 8.0L quad-turbocharged W16 engine producing 1,500 HP
- 0-60 mph in 2.4 seconds, top speed of 261 mph (electronically limited)
- 1,180 lb-ft of torque from just 2,000 RPM

**Engineering Excellence:**
- Advanced carbon fiber monocoque construction
- Sophisticated all-wheel-drive system with torque vectoring
- Active aerodynamics with deployable rear wing
- 7-speed dual-clutch transmission with lightning-fast shifts

**Exclusivity & Heritage:**
- Limited to 500 units, each hand-built in Molsheim, France
- Direct successor to the legendary Veyron
- Named after Louis Chiron, Bugatti's most successful racing driver
- Starting price of $2.7 million, with most selling for significantly more

The Chiron isn't just fast—it's a rolling testament to what's possible when unlimited resources meet uncompromising engineering standards."

## Technical Details

### Architecture

- **Framework**: uAgents v0.22.9 with uAgents-core v0.3.9
- **Protocol**: Agent Chat Protocol for ASI1 compatibility
- **API Integration**: ASI1 API for enhanced supercar knowledge
- **Deployment**: Agentverse Hosted Agent

### Dependencies

The agent uses only allowlisted libraries for Agentverse Hosted deployment:
- `uagents` - Core agent framework
- `uagents-core` - Core functionality
- `requests` - HTTP client for API calls

### Error Handling

The agent includes comprehensive error handling for:
- Missing API keys
- Network timeouts
- API rate limits
- Malformed responses
- Connection issues

## Testing

### Local Testing

1. Set up your environment variables
2. Run the agent locally:
   ```bash
   python agent.py
   ```

### Agentverse Testing

1. Deploy the agent to Agentverse
2. Open the Agent Chat interface
3. Start a session with the agent
4. Test various supercar-related queries

### Test Queries

Try these sample questions:
- "Compare the Ferrari SF90 Stradale to the McLaren Artura"
- "What's the most expensive supercar ever sold?"
- "Explain the difference between a supercar and a hypercar"
- "Which supercar has the best power-to-weight ratio?"
- "Tell me about the Pagani Huayra's active aerodynamics"

## Limitations

- Requires valid ASI1 API key for full functionality
- Responses are limited by ASI1 API rate limits
- Knowledge is current as of the ASI1 model training date
- Focuses specifically on supercars and high-performance vehicles

## Support

For issues or questions:
1. Check that your ASI1 API key is valid and active
2. Verify network connectivity to ASI1 API
3. Review the agent logs for error messages
4. Ensure you're asking supercar-related questions

## License

This agent is provided as-is for educational and demonstration purposes. Please respect the terms of service for both Agentverse and ASI1 API.

---

*Built with ❤️ using uAgents and Agentverse*

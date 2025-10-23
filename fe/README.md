# Decentralized Escrow System

A secure, trustless, and decentralized escrow system built with Next.js, Wagmi, and RainbowKit.

## Features

- 🔒 **Secure Escrow**: Smart contract-based escrow system
- 🌐 **Multi-Chain Support**: Works across multiple blockchain networks
- ⚖️ **Decentralized Arbitration**: Built-in dispute resolution
- 🚀 **Fast Settlement**: Quick transaction processing
- 💰 **Trading Interface**: Cross-chain trading capabilities

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- A WalletConnect Project ID

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd dexcrow/fe
```

2. Install dependencies:
```bash
npm install
# or
yarn install
```

3. Set up environment variables:
Create a `.env.local` file in the root directory with the following variables:

```env
# WalletConnect Project ID - Get from https://cloud.walletconnect.com/
NEXT_PUBLIC_PROJECT_ID=your_walletconnect_project_id_here

# Contract Addresses
NEXT_PUBLIC_ESCROW_FACTORY_ADDRESS=0x0000000000000000000000000000000000000000

# RPC URLs
NEXT_PUBLIC_RPC_URL=https://forno.celo.org

# Agent Addresses
NEXT_PUBLIC_BUYER_AGENT_ADDRESS=agent1q...
NEXT_PUBLIC_SELLER_AGENT_ADDRESS=agent1q...
NEXT_PUBLIC_ORACLE_AGENT_ADDRESS=agent1q...
NEXT_PUBLIC_ARBITER_AGENT_ADDRESS=agent1q...

# App Configuration
NEXT_PUBLIC_URL=http://localhost:3000
NEXT_PUBLIC_MINI_APP_NAME=Decentralized Escrow
NEXT_PUBLIC_MINI_APP_DESCRIPTION=Secure peer-to-peer transactions with smart contract escrow
```

4. Get a WalletConnect Project ID:
   - Visit [WalletConnect Cloud](https://cloud.walletconnect.com/)
   - Create a new project
   - Copy the Project ID and add it to your `.env.local` file

5. Run the development server:
```bash
npm run dev
# or
yarn dev
```

6. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Usage

### Creating an Escrow

1. Connect your wallet using the Connect Wallet button in the header
2. Select "Create Escrow" mode
3. Fill in the escrow details:
   - Choose trade type (Crypto Swap, Fiat P2P, or Cross-Chain)
   - Enter buyer, seller, and arbiter addresses
   - Specify assets and amounts
   - Set deadline and dispute window
4. Click "Create Escrow" to deploy the smart contract

### Interacting with Escrow

1. Select "Interact with Escrow" mode
2. Enter the escrow contract address
3. Perform actions based on your role:
   - **Buyer**: Deposit assets, confirm fulfillment
   - **Seller**: Confirm fulfillment, release funds
   - **Arbiter**: Resolve disputes

### Trading Interface

1. Select "Trading Interface" mode
2. Connect your wallet to access cross-chain trading
3. Create trading orders or browse existing ones
4. Execute trades with built-in bridging capabilities

## Tech Stack

- **Frontend**: Next.js 15, React 18, TypeScript
- **Styling**: Tailwind CSS with custom dark/yellow theme
- **Web3**: Wagmi v2, RainbowKit, Viem
- **Chains**: Ethereum, Base, Celo, Sepolia testnets
- **State Management**: React Query (TanStack Query)

## Theme

The application uses a custom dark theme with yellow accents inspired by modern trading interfaces:
- **Background**: Dark (#1a1a1a)
- **Primary Accent**: Bright Yellow (#ffff00)
- **Success**: Neon Green (#00ff00)
- **Typography**: Monospace fonts for technical feel
- **Grid Pattern**: Subtle yellow grid overlay

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support and questions, please open an issue in the repository.

# Copilot Instructions for DexCrow Project

## Project Overview
DexCrow is a decentralized escrow and cross-chain trading platform that combines secure escrow services with Avail Nexus SDK for cross-chain operations. The project consists of two main components:

1. Smart contract system (`hardhat-ex/`) - Escrow and trading contracts
2. Frontend application (`ui/`) - React/TypeScript interface with Avail Nexus integration

## Key Architecture Patterns

### Smart Contracts Architecture
- Main contracts in `hardhat-ex/contracts/`:
  - `Escrow.sol` - Core escrow logic with state management
  - `EscrowFactory.sol` - Factory pattern for escrow instance creation
  - `TradeFactory.sol` - Manages trading accounts and orders
  - Always inherit from OpenZeppelin contracts for security patterns
  - Use access control modifiers: `onlyBuyer`, `onlySeller`, `onlyArbiter`

### Cross-Chain Integration
- Avail Nexus SDK integration in `ui/lib/nexus.ts`
- Use `getUnifiedBalances()` for cross-chain balance queries
- Implement `bridgeAndCreateOrder()` for one-click operations
- Chain IDs: ETH(1), Base(8453), Polygon(137), Arbitrum(42161)

## Development Workflow

### Smart Contract Development
```bash
cd hardhat-ex
npm install
npx hardhat compile
npx hardhat test        # Run all tests
npx hardhat test solidity  # Run Solidity tests only
npx hardhat test nodejs    # Run TypeScript tests only
```

### Frontend Development
```bash
cd ui
npm install
npm run dev
```

## Testing Patterns
- Write unit tests for all state transitions
- Test boundary conditions (deadlines, amounts)
- Verify access control restrictions
- Include cross-chain operation tests
- Use `node:test` for TypeScript and Foundry for Solidity

## Project Conventions

### Smart Contract Patterns
- Use OpenZeppelin contracts as base classes
- Implement EIP standards where applicable
- Follow factory pattern for contract deployment
- Use events for off-chain tracking

### Frontend Patterns
- React components in `ui/src/components/`
- Cross-chain logic in `ui/lib/nexus.ts`
- Use TypeScript for type safety
- Implement Wagmi hooks for blockchain interactions

## Common Operations

### Escrow Creation
```typescript
// Example escrow creation pattern
const escrow = await escrowFactory.createEscrow({
  buyer,
  seller,
  arbiter,
  amount,
  deadline
});
```

### Cross-Chain Trading
```typescript
// Example unified balance check
const balances = await getUnifiedBalances();

// Example bridge and create order
const result = await bridgeAndCreateOrder({
  token: 'ETH',
  amount: '1.0',
  toChainId: 8453,
  price: '2000'
});
```

## Important Files
- `hardhat-ex/contracts/Escrow.sol` - Core escrow logic
- `ui/lib/nexus.ts` - Cross-chain integration
- `ui/src/components/TradingInterface.tsx` - Main trading UI
- `BLUEPRINT.md` - Detailed architecture overview

## Common Pitfalls
- Always verify chain IDs before cross-chain operations
- Use proper access control modifiers in contracts
- Handle cross-chain transaction failures gracefully
- Maintain state consistency across chains

## Configuration
Environment variables required:
- `SEPOLIA_PRIVATE_KEY` - For testnet deployment
- `AVAIL_NEXUS_API_KEY` - For cross-chain operations
- Configure supported chains in `hardhat.config.ts`
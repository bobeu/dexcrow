# 🌉 Cross-Chain Escrow Infrastructure

This document describes the cross-chain escrow implementation that enables secure transactions across multiple blockchains including EVM chains (Ethereum, Polygon, BSC, Arbitrum, Optimism, Avalanche), Solana, and Cosmos.

## 🏗️ Architecture Overview

The cross-chain infrastructure consists of several key components:

### Core Contracts

1. **`CrossChainEscrow.sol`** - Main escrow contract supporting multi-chain operations
2. **`TokenRegistry.sol`** - Universal token registry for cross-chain token management
3. **`WormholeMessenger.sol`** - Cross-chain message passing via Wormhole protocol
4. **`MerkleProofVerifier.sol`** - Merkle proof verification for state validation

### Interfaces

- **`ICrossChainEscrow.sol`** - Cross-chain escrow interface
- **`ITokenRegistry.sol`** - Token registry interface
- **`IWormholeMessenger.sol`** - Wormhole messaging interface

## 🔧 Key Features

### Multi-Chain Support
- **EVM Chains**: Ethereum, Polygon, BSC, Arbitrum, Optimism, Avalanche
- **Solana**: Native Solana token support
- **Cosmos**: Cosmos ecosystem integration

### Token Management
- Universal token identifiers across chains
- Automatic token mapping and verification
- Support for native tokens and ERC20/SPL/Cosmos tokens
- Token metadata management

### Cross-Chain Messaging
- Wormhole protocol integration
- Secure message verification
- Guardian set management
- Message fee optimization

### Security Features
- Merkle proof verification for state consistency
- Reentrancy protection
- Pausable operations
- Access control and verification

## 📋 Contract Details

### CrossChainEscrow

The main contract that handles cross-chain escrow operations.

**Key Functions:**
- `createCrossChainEscrow()` - Create escrow across chains
- `processCrossChainMessage()` - Process incoming cross-chain messages
- `registerToken()` - Register tokens for cross-chain use
- `getCrossChainToken()` - Get token information

**State Variables:**
- `tokenRegistry` - Token registry contract
- `wormholeMessenger` - Wormhole messaging contract
- `crossChainEscrows` - Escrow storage
- `supportedChains` - Supported blockchain IDs

### TokenRegistry

Manages universal token mappings across chains.

**Key Functions:**
- `registerToken()` - Register new token
- `updateTokenMapping()` - Update token address on specific chain
- `deactivateToken()` - Deactivate token on specific chain
- `getTokenAddress()` - Get token address for specific chain

**Features:**
- Token metadata management
- Search functionality
- Verification system
- Multi-chain support

### WormholeMessenger

Handles cross-chain message passing via Wormhole.

**Key Functions:**
- `sendMessage()` - Send cross-chain message
- `receiveMessage()` - Receive and process message
- `verifyMessage()` - Verify message signature
- `getMessageFee()` - Get required fee for target chain

**Features:**
- Guardian set management
- Message fee optimization
- Chain support management
- Message tracking

### MerkleProofVerifier

Provides Merkle proof verification for cross-chain state validation.

**Key Functions:**
- `updateMerkleRoot()` - Update Merkle root for chain
- `verifyCrossChainMessage()` - Verify cross-chain message
- `verifyMerkleProof()` - Verify Merkle proof
- `getMerkleRoot()` - Get Merkle root for chain

## 🚀 Deployment

### Prerequisites

```bash
npm install
```

### Deploy Cross-Chain Infrastructure

```bash
npx hardhat run scripts/deploy-crosschain.ts --network <network>
```

### Supported Networks

- **Ethereum Mainnet**: `mainnet`
- **Polygon**: `polygon`
- **BSC**: `bsc`
- **Arbitrum**: `arbitrum`
- **Optimism**: `optimism`
- **Avalanche**: `avalanche`
- **Local Development**: `hardhat`

## 🧪 Testing

### Run All Tests

```bash
npx hardhat test
```

### Run Cross-Chain Tests

```bash
npx hardhat test test/CrossChain.NodeTest.ts
```

### Test Coverage

```bash
npx hardhat test --coverage
```

## 📊 Usage Examples

### 1. Register Cross-Chain Token

```solidity
// Register USDC across multiple chains
bytes32 usdcTokenId = keccak256("USDC");

// On Ethereum
crossChainEscrow.registerToken(
    usdcTokenId,
    0xA0b86a33E6441c8C06DdD5C8c4c7B4c8B4c8B4c8, // USDC address
    1, // Ethereum
    ChainType.EVM,
    false // ERC20
);

// On Polygon
crossChainEscrow.registerToken(
    usdcTokenId,
    0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174, // USDC address
    137, // Polygon
    ChainType.EVM,
    false // ERC20
);
```

### 2. Create Cross-Chain Escrow

```solidity
// Create escrow from Ethereum to Polygon
bytes32 escrowId = crossChainEscrow.createCrossChainEscrow{value: 1 ether}(
    seller,
    arbiter,
    ethTokenId,
    1 ether,
    block.timestamp + 86400, // 24 hours
    137 // Polygon
);
```

### 3. Process Cross-Chain Message

```solidity
// Process incoming message from another chain
CrossChainMessage memory message = CrossChainMessage({
    escrowId: escrowId,
    buyer: buyer,
    seller: seller,
    arbiter: arbiter,
    token: token,
    amount: amount,
    deadline: deadline,
    sourceChainId: 1,
    targetChainId: 137,
    nonce: nonce,
    signature: signature
});

crossChainEscrow.processCrossChainMessage(message, proof);
```

## 🔒 Security Considerations

### Cross-Chain Security

1. **Message Verification**: All cross-chain messages are verified using Wormhole's guardian signatures
2. **Merkle Proofs**: State changes are verified using Merkle proofs
3. **Reentrancy Protection**: All functions are protected against reentrancy attacks
4. **Access Control**: Proper access control for administrative functions

### Token Security

1. **Token Verification**: Tokens must be verified before cross-chain use
2. **Address Validation**: All token addresses are validated
3. **Chain Validation**: Only supported chains are allowed
4. **Metadata Integrity**: Token metadata is immutable once set

### Operational Security

1. **Pausable Operations**: Critical functions can be paused in emergencies
2. **Fee Management**: Platform and arbiter fees are configurable
3. **Emergency Withdraw**: Stuck funds can be recovered by owner
4. **Guardian Management**: Guardian sets can be updated securely

## 🌐 Supported Chains

### EVM Chains
- **Ethereum** (Chain ID: 1)
- **Polygon** (Chain ID: 137)
- **BSC** (Chain ID: 56)
- **Arbitrum** (Chain ID: 42161)
- **Optimism** (Chain ID: 10)
- **Avalanche** (Chain ID: 43114)

### Non-EVM Chains
- **Solana** (Chain ID: 1399811149)
- **Cosmos** (Chain ID: 1)

## 💰 Fee Structure

### Platform Fees
- **Default**: 0.5% (50 basis points)
- **Maximum**: 5% (500 basis points)
- **Configurable**: Yes, by owner

### Arbiter Fees
- **Default**: 0.25% (25 basis points)
- **Maximum**: 2.5% (250 basis points)
- **Configurable**: Yes, by owner

### Cross-Chain Fees
- **Wormhole**: Variable based on target chain
- **Gas**: Standard gas fees for each chain
- **Optimization**: Automatic fee calculation

## 🔧 Configuration

### Environment Variables

```bash
# Network configuration
NETWORK_URL_ETHEREUM=https://mainnet.infura.io/v3/YOUR_KEY
NETWORK_URL_POLYGON=https://polygon-rpc.com
NETWORK_URL_BSC=https://bsc-dataseed.binance.org

# Wormhole configuration
WORMHOLE_CORE_ADDRESS=0x1234567890123456789012345678901234567890
GUARDIAN_SET_INDEX=1

# Token registry
TOKEN_REGISTRY_ADDRESS=0x1234567890123456789012345678901234567890
```

### Hardhat Configuration

```typescript
// hardhat.config.ts
export default {
  networks: {
    ethereum: {
      url: process.env.NETWORK_URL_ETHEREUM,
      accounts: [process.env.PRIVATE_KEY]
    },
    polygon: {
      url: process.env.NETWORK_URL_POLYGON,
      accounts: [process.env.PRIVATE_KEY]
    }
  }
};
```

## 📈 Performance Optimization

### Gas Optimization
- **viaIR**: Enabled for complex contracts
- **Optimizer**: Enabled with 200 runs
- **EVM Version**: Paris for latest optimizations

### Cross-Chain Optimization
- **Batch Operations**: Multiple operations in single transaction
- **Fee Optimization**: Automatic fee calculation
- **Message Batching**: Multiple messages in single Wormhole transaction

## 🐛 Troubleshooting

### Common Issues

1. **"Unsupported chain" error**
   - Solution: Add chain to supported chains list

2. **"Token not registered" error**
   - Solution: Register token before use

3. **"Invalid proof" error**
   - Solution: Verify Merkle proof generation

4. **"Message already processed" error**
   - Solution: Use unique message nonces

### Debug Mode

```bash
# Enable debug logging
DEBUG=hardhat:*,crosschain:* npx hardhat test
```

## 📚 Additional Resources

- [Wormhole Documentation](https://docs.wormhole.com/)
- [OpenZeppelin Contracts](https://docs.openzeppelin.com/contracts/)
- [Hardhat Documentation](https://hardhat.org/docs)
- [Viem Documentation](https://viem.sh/)

## 🤝 Contributing

1. Fork the repository
2. Create feature branch
3. Add tests for new functionality
4. Ensure all tests pass
5. Submit pull request

## 📄 License

MIT License - see LICENSE file for details.

---

**TradeVerse Cross-Chain Infrastructure** - Enabling secure, multi-chain escrow operations across the decentralized ecosystem.

// SPDX-License-Identifier: MIT

pragma solidity 0.8.30;

/**
 * @title ICrossChainEscrow
 * @dev Interface for cross-chain escrow operations
 * @notice Enables escrow transactions across multiple blockchains
 */
interface ICrossChainEscrow {
    /// @notice Supported blockchain networks
    enum ChainType {
        EVM,        // Ethereum, Polygon, Celo, Base, BSC, Arbitrum, Optimism, Avalanche, etc
        SOLANA,     // Solana blockchain
        COSMOS      // Cosmos ecosystem
    }

    /// @notice Cross-chain token information
    struct CrossChainToken {
        bytes32 tokenId;           // Universal token identifier
        address localAddress;      // Local token contract address
        uint256 chainId;          // Source chain ID
        ChainType chainType;      // Type of blockchain
        bool isNative;            // Whether it's the native token
        bool isActive;            // Whether token is active for trading
    }

    /// @notice Cross-chain escrow data
    struct CrossChainEscrowData {
        bytes32 escrowId;         // Unique cross-chain escrow ID
        address buyer;            // Buyer address on local chain
        address seller;           // Seller address on local chain
        address arbiter;          // Arbiter address on local chain
        CrossChainToken token;    // Token being escrowed
        uint256 amount;           // Amount being escrowed
        uint256 deadline;         // Escrow deadline
        uint256 platformFee;      // Platform fee percentage
        uint256 arbiterFee;       // Arbiter fee percentage
        uint256 feeDenominator;   // Fee denominator for calculations
        bool isCrossChain;        // Whether this is a cross-chain escrow
        uint256 sourceChainId;    // Source chain ID
        uint256 targetChainId;    // Target chain ID
        bytes32 merkleRoot;       // Merkle root for state verification
    }

    /// @notice Cross-chain message for Wormhole
    struct CrossChainMessage {
        bytes32 escrowId;
        address buyer;
        address seller;
        address arbiter;
        CrossChainToken token;
        uint256 amount;
        uint256 deadline;
        uint256 sourceChainId;
        uint256 targetChainId;
        uint256 nonce;
        bytes signature;
    }

    /// @notice Events
    event CrossChainEscrowCreated(
        bytes32 indexed escrowId,
        address indexed buyer,
        address indexed seller,
        uint256 sourceChainId,
        uint256 targetChainId,
        bytes32 tokenId,
        uint256 amount
    );

    event CrossChainMessageSent(
        bytes32 indexed escrowId,
        uint256 indexed sourceChainId,
        uint256 indexed targetChainId,
        uint256 nonce
    );

    event CrossChainMessageReceived(
        bytes32 indexed escrowId,
        uint256 indexed sourceChainId,
        uint256 indexed targetChainId,
        bool success
    );

    event TokenRegistered(
        bytes32 indexed tokenId,
        address indexed localAddress,
        uint256 indexed chainId,
        ChainType chainType
    );

    event TokenUnregistered(
        bytes32 indexed tokenId,
        address indexed localAddress,
        uint256 indexed chainId
    );

    /// @notice Functions
    function registerToken(
        bytes32 tokenId,
        address localAddress,
        uint256 chainId,
        ChainType chainType,
        bool isNative
    ) external;

    function unregisterToken(bytes32 tokenId, uint256 chainId) external;

    function createCrossChainEscrow(
        address seller,
        address arbiter,
        bytes32 tokenId,
        uint256 amount,
        uint256 deadline,
        uint256 targetChainId
    ) external payable returns (bytes32);

    function processCrossChainMessage(
        CrossChainMessage calldata message,
        bytes calldata proof
    ) external;

    function getCrossChainToken(bytes32 tokenId, uint256 chainId) 
        external view returns (CrossChainToken memory);

    function isTokenSupported(bytes32 tokenId, uint256 chainId) 
        external view returns (bool);

    function getSupportedChains() external view returns (uint256[] memory);

    function getSupportedTokens(uint256 chainId) 
        external view returns (bytes32[] memory);
}

// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

import { ICrossChainEscrow } from "./ICrossChainEscrow.sol";

/**
 * @title ITokenRegistry
 * @dev Interface for universal token registry across chains
 * @notice Manages token mappings and cross-chain token information
 */
interface ITokenRegistry {
    /// @notice Token metadata for cross-chain operations
    struct TokenMetadata {
        string name;
        string symbol;
        uint8 decimals;
        string description;
        string logoURI;
        bool isVerified;
        uint256 totalSupply;
        address creator;
    }

    /// @notice Cross-chain token mapping
    struct TokenMapping {
        bytes32 universalTokenId;     // Universal token identifier
        mapping(uint256 => address) chainAddresses; // chainId => tokenAddress
        mapping(uint256 => bool) isActive;          // chainId => isActive
        TokenMetadata metadata;
        ICrossChainEscrow.ChainType primaryChain;
        uint256 primaryChainId;
    }

    /// @notice Events
    event TokenRegistered(
        bytes32 indexed universalTokenId,
        address indexed tokenAddress,
        uint256 indexed chainId,
        string name,
        string symbol
    );

    event TokenMappingUpdated(
        bytes32 indexed universalTokenId,
        uint256 indexed chainId,
        address indexed newAddress
    );

    event TokenDeactivated(
        bytes32 indexed universalTokenId,
        uint256 indexed chainId
    );

    event TokenVerified(
        bytes32 indexed universalTokenId,
        bool verified
    );

    /// @notice Functions
    function registerToken(
        bytes32 universalTokenId,
        address tokenAddress,
        uint256 chainId,
        TokenMetadata calldata metadata,
        ICrossChainEscrow.ChainType primaryChain,
        uint256 primaryChainId
    ) external;

    function updateTokenMapping(
        bytes32 universalTokenId,
        uint256 chainId,
        address tokenAddress
    ) external;

    function deactivateToken(
        bytes32 universalTokenId,
        uint256 chainId
    ) external;

    function getTokenAddress(
        bytes32 universalTokenId,
        uint256 chainId
    ) external view returns (address);

    function getTokenMetadata(bytes32 universalTokenId)
        external view returns (TokenMetadata memory);

    function isTokenActive(
        bytes32 universalTokenId,
        uint256 chainId
    ) external view returns (bool);

    function getSupportedChains(bytes32 universalTokenId)
        external view returns (uint256[] memory);

    function getAllTokens()
        external view returns (bytes32[] memory);

    function searchTokens(string calldata query)
        external view returns (bytes32[] memory);
}

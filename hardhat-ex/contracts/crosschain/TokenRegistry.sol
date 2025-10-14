// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import { ITokenRegistry } from "./interfaces/ITokenRegistry.sol";
import { ICrossChainEscrow } from "./interfaces/ICrossChainEscrow.sol";
import { ReentrancyGuard } from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";
import { Pausable } from "@openzeppelin/contracts/utils/Pausable.sol";

/**
 * @title TokenRegistry
 * @dev Universal token registry for cross-chain operations
 * @notice Manages token mappings and metadata across multiple blockchains
 */
contract TokenRegistry is ITokenRegistry, ReentrancyGuard, Ownable, Pausable {
    /// @notice Token mappings storage
    mapping(bytes32 => TokenMapping) private _tokenMappings;
    
    /// @notice All registered tokens
    bytes32[] private _allTokens;
    
    /// @notice Token search index
    mapping(string => bytes32[]) private _searchIndex;
    
    /// @notice Supported chains
    uint256[] private _supportedChains;
    mapping(uint256 => bool) private _isChainSupported;
    
    /// @notice Verification requirements
    mapping(address => bool) public verifiers;
    
    /// @notice Constants
    uint256 public constant MAX_CHAINS = 50;
    uint256 public constant MAX_TOKENS_PER_CHAIN = 1000;
    
    /// @notice Modifiers
    modifier onlyVerifier() {
        require(verifiers[msg.sender] || msg.sender == owner(), "TokenRegistry: Not authorized verifier");
        _;
    }
    
    modifier validChain(uint256 chainId) {
        require(_isChainSupported[chainId], "TokenRegistry: Unsupported chain");
        _;
    }
    
    modifier validTokenId(bytes32 tokenId) {
        require(tokenId != bytes32(0), "TokenRegistry: Invalid token ID");
        _;
    }

    /**
     * @dev Constructor
     * @param _initialChains Initial supported chains
     */
    constructor(uint256[] memory _initialChains) Ownable(msg.sender) {
        for (uint256 i = 0; i < _initialChains.length; i++) {
            _supportedChains.push(_initialChains[i]);
            _isChainSupported[_initialChains[i]] = true;
        }
        
        // Add owner as verifier
        verifiers[msg.sender] = true;
    }

    /**
     * @notice Register a new token across chains
     * @param universalTokenId Universal token identifier
     * @param tokenAddress Token address on the specified chain
     * @param chainId Chain ID where token is deployed
     * @param metadata Token metadata
     * @param primaryChain Primary chain type
     * @param primaryChainId Primary chain ID
     */
    function registerToken(
        bytes32 universalTokenId,
        address tokenAddress,
        uint256 chainId,
        TokenMetadata calldata metadata,
        ICrossChainEscrow.ChainType primaryChain,
        uint256 primaryChainId
    ) external override validTokenId(universalTokenId) validChain(chainId) whenNotPaused {
        require(tokenAddress != address(0), "TokenRegistry: Invalid token address");
        require(bytes(metadata.name).length > 0, "TokenRegistry: Token name required");
        require(bytes(metadata.symbol).length > 0, "TokenRegistry: Token symbol required");
        require(_tokenMappings[universalTokenId].chainAddresses[chainId] == address(0), "TokenRegistry: Token already registered on this chain");
        
        // Initialize token mapping if new
        if (_tokenMappings[universalTokenId].universalTokenId == bytes32(0)) {
            _tokenMappings[universalTokenId].universalTokenId = universalTokenId;
            _tokenMappings[universalTokenId].metadata = metadata;
            _tokenMappings[universalTokenId].primaryChain = primaryChain;
            _tokenMappings[universalTokenId].primaryChainId = primaryChainId;
            _allTokens.push(universalTokenId);
        }
        
        // Add chain mapping
        _tokenMappings[universalTokenId].chainAddresses[chainId] = tokenAddress;
        _tokenMappings[universalTokenId].isActive[chainId] = true;
        
        // Update search index
        _addToSearchIndex(universalTokenId, metadata.name);
        _addToSearchIndex(universalTokenId, metadata.symbol);
        
        emit TokenRegistered(universalTokenId, tokenAddress, chainId, metadata.name, metadata.symbol);
    }

    /**
     * @notice Update token mapping for a specific chain
     * @param universalTokenId Universal token identifier
     * @param chainId Chain ID
     * @param tokenAddress New token address
     */
    function updateTokenMapping(
        bytes32 universalTokenId,
        uint256 chainId,
        address tokenAddress
    ) external override validTokenId(universalTokenId) validChain(chainId) onlyVerifier whenNotPaused {
        require(tokenAddress != address(0), "TokenRegistry: Invalid token address");
        require(_tokenMappings[universalTokenId].universalTokenId != bytes32(0), "TokenRegistry: Token not registered");
        
        _tokenMappings[universalTokenId].chainAddresses[chainId] = tokenAddress;
        
        emit TokenMappingUpdated(universalTokenId, chainId, tokenAddress);
    }

    /**
     * @notice Deactivate token on a specific chain
     * @param universalTokenId Universal token identifier
     * @param chainId Chain ID
     */
    function deactivateToken(
        bytes32 universalTokenId,
        uint256 chainId
    ) external override validTokenId(universalTokenId) validChain(chainId) onlyVerifier whenNotPaused {
        require(_tokenMappings[universalTokenId].universalTokenId != bytes32(0), "TokenRegistry: Token not registered");
        require(_tokenMappings[universalTokenId].isActive[chainId], "TokenRegistry: Token already inactive");
        
        _tokenMappings[universalTokenId].isActive[chainId] = false;
        
        emit TokenDeactivated(universalTokenId, chainId);
    }

    /**
     * @notice Get token address for a specific chain
     * @param universalTokenId Universal token identifier
     * @param chainId Chain ID
     * @return tokenAddress Token address on the specified chain
     */
    function getTokenAddress(
        bytes32 universalTokenId,
        uint256 chainId
    ) external view override validTokenId(universalTokenId) returns (address) {
        return _tokenMappings[universalTokenId].chainAddresses[chainId];
    }

    /**
     * @notice Get token metadata
     * @param universalTokenId Universal token identifier
     * @return metadata Token metadata
     */
    function getTokenMetadata(bytes32 universalTokenId) 
        external view override validTokenId(universalTokenId) returns (TokenMetadata memory) {
        require(_tokenMappings[universalTokenId].universalTokenId != bytes32(0), "TokenRegistry: Token not registered");
        return _tokenMappings[universalTokenId].metadata;
    }

    /**
     * @notice Check if token is active on a specific chain
     * @param universalTokenId Universal token identifier
     * @param chainId Chain ID
     * @return active Whether token is active
     */
    function isTokenActive(
        bytes32 universalTokenId,
        uint256 chainId
    ) external view override validTokenId(universalTokenId) returns (bool) {
        return _tokenMappings[universalTokenId].isActive[chainId];
    }

    /**
     * @notice Get all supported chains for a token
     * @param universalTokenId Universal token identifier
     * @return chains Array of supported chain IDs
     */
    function getSupportedChains(bytes32 universalTokenId) 
        external view override validTokenId(universalTokenId) returns (uint256[] memory) {
        require(_tokenMappings[universalTokenId].universalTokenId != bytes32(0), "TokenRegistry: Token not registered");
        
        uint256[] memory activeChains = new uint256[](_supportedChains.length);
        uint256 count = 0;
        
        for (uint256 i = 0; i < _supportedChains.length; i++) {
            if (_tokenMappings[universalTokenId].isActive[_supportedChains[i]]) {
                activeChains[count] = _supportedChains[i];
                count++;
            }
        }
        
        // Resize array to actual count
        uint256[] memory result = new uint256[](count);
        for (uint256 i = 0; i < count; i++) {
            result[i] = activeChains[i];
        }
        
        return result;
    }

    /**
     * @notice Get all registered tokens
     * @return tokens Array of all token IDs
     */
    function getAllTokens() external view override returns (bytes32[] memory) {
        return _allTokens;
    }

    /**
     * @notice Search tokens by name or symbol
     * @param query Search query
     * @return tokens Array of matching token IDs
     */
    function searchTokens(string calldata query) external view override returns (bytes32[] memory) {
        require(bytes(query).length > 0, "TokenRegistry: Empty search query");
        
        string memory lowerQuery = _toLowerCase(query);
        return _searchIndex[lowerQuery];
    }

    /**
     * @notice Add verifier address
     * @param verifier Verifier address
     */
    function addVerifier(address verifier) external onlyOwner {
        require(verifier != address(0), "TokenRegistry: Invalid verifier address");
        verifiers[verifier] = true;
    }

    /**
     * @notice Remove verifier address
     * @param verifier Verifier address
     */
    function removeVerifier(address verifier) external onlyOwner {
        verifiers[verifier] = false;
    }

    /**
     * @notice Add supported chain
     * @param chainId Chain ID to add
     */
    function addSupportedChain(uint256 chainId) external onlyOwner {
        require(!_isChainSupported[chainId], "TokenRegistry: Chain already supported");
        require(_supportedChains.length < MAX_CHAINS, "TokenRegistry: Too many chains");
        
        _supportedChains.push(chainId);
        _isChainSupported[chainId] = true;
    }

    /**
     * @notice Remove supported chain
     * @param chainId Chain ID to remove
     */
    function removeSupportedChain(uint256 chainId) external onlyOwner {
        require(_isChainSupported[chainId], "TokenRegistry: Chain not supported");
        
        _isChainSupported[chainId] = false;
        
        // Remove from supportedChains array
        for (uint256 i = 0; i < _supportedChains.length; i++) {
            if (_supportedChains[i] == chainId) {
                _supportedChains[i] = _supportedChains[_supportedChains.length - 1];
                _supportedChains.pop();
                break;
            }
        }
    }

    /**
     * @notice Verify a token
     * @param universalTokenId Universal token identifier
     * @param verified Whether token is verified
     */
    function verifyToken(bytes32 universalTokenId, bool verified) external onlyVerifier {
        require(_tokenMappings[universalTokenId].universalTokenId != bytes32(0), "TokenRegistry: Token not registered");
        
        _tokenMappings[universalTokenId].metadata.isVerified = verified;
        
        emit TokenVerified(universalTokenId, verified);
    }

    /**
     * @notice Pause the contract
     */
    function pause() external onlyOwner {
        _pause();
    }

    /**
     * @notice Unpause the contract
     */
    function unpause() external onlyOwner {
        _unpause();
    }

    /**
     * @notice Add token to search index
     * @param universalTokenId Universal token identifier
     * @param searchTerm Search term to index
     */
    function _addToSearchIndex(bytes32 universalTokenId, string memory searchTerm) internal {
        string memory lowerTerm = _toLowerCase(searchTerm);
        _searchIndex[lowerTerm].push(universalTokenId);
    }

    /**
     * @notice Convert string to lowercase
     * @param str Input string
     * @return result Lowercase string
     */
    function _toLowerCase(string memory str) internal pure returns (string memory) {
        bytes memory bStr = bytes(str);
        bytes memory bLower = new bytes(bStr.length);
        
        for (uint256 i = 0; i < bStr.length; i++) {
            if ((uint8(bStr[i]) >= 65) && (uint8(bStr[i]) <= 90)) {
                bLower[i] = bytes1(uint8(bStr[i]) + 32);
            } else {
                bLower[i] = bStr[i];
            }
        }
        
        return string(bLower);
    }
}

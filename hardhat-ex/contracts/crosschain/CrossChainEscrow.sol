// SPDX-License-Identifier: MIT

pragma solidity 0.8.30;

import { ICrossChainEscrow } from "./interfaces/ICrossChainEscrow.sol";
import { IWormholeMessenger } from "./interfaces/IWormholeMessenger.sol";
import { ITokenRegistry } from "./interfaces/ITokenRegistry.sol";
import { ReentrancyGuard } from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";
import { Pausable } from "@openzeppelin/contracts/utils/Pausable.sol";
import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import { SafeERC20 } from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/**
 * @title CrossChainEscrow
 * @dev Cross-chain escrow contract supporting multiple blockchains
 * @notice Enables secure escrow transactions across EVM, Solana, and Cosmos chains
 */
contract CrossChainEscrow is ICrossChainEscrow, ReentrancyGuard, Ownable, Pausable {
    using SafeERC20 for IERC20;

    /// @notice Token registry contract
    ITokenRegistry public immutable tokenRegistry;
    
    /// @notice Wormhole messenger contract
    IWormholeMessenger public immutable wormholeMessenger;
    
    /// @notice Cross-chain escrow storage
    mapping(bytes32 => CrossChainEscrowData) public crossChainEscrows;
    mapping(bytes32 => bool) public processedMessages;
    
    /// @notice Cross-chain token storage
    mapping(bytes32 => mapping(uint256 => CrossChainToken)) public crossChainTokens;
    
    /// @notice Supported chains
    uint256[] public supportedChains;
    mapping(uint256 => bool) public isChainSupported;
    
    /// @notice Platform fees
    uint256 public platformFeePercentage = 50; // 0.5%
    uint256 public arbiterFeePercentage = 25;  // 0.25%
    uint256 public constant FEE_DENOMINATOR = 10000;
    
    /// @notice Escrow counter
    uint256 private _escrowCounter;
    
    /// @notice Constants
    uint256 public constant MAX_ESCROW_DURATION = 30 days;
    uint256 public constant MIN_ESCROW_DURATION = 1 hours;
    uint256 public constant MAX_PLATFORM_FEE = 500; // 5%
    uint256 public constant MAX_ARBITER_FEE = 250;  // 2.5%

    /// @notice Modifiers
    modifier onlySupportedChain(uint256 chainId) {
        require(isChainSupported[chainId], "CrossChainEscrow: Unsupported chain");
        _;
    }
    
    modifier validEscrow(bytes32 escrowId) {
        require(crossChainEscrows[escrowId].escrowId != bytes32(0), "CrossChainEscrow: Invalid escrow");
        _;
    }
    
    modifier onlyParticipant(bytes32 escrowId) {
        CrossChainEscrowData storage escrow = crossChainEscrows[escrowId];
        require(
            msg.sender == escrow.buyer || 
            msg.sender == escrow.seller || 
            msg.sender == escrow.arbiter,
            "CrossChainEscrow: Not a participant"
        );
        _;
    }

    /**
     * @dev Constructor
     * @param _tokenRegistry Address of token registry contract
     * @param _wormholeMessenger Address of Wormhole messenger contract
     * @param _supportedChains Array of supported chain IDs
     */
    constructor(
        address _tokenRegistry,
        address _wormholeMessenger,
        uint256[] memory _supportedChains
    ) Ownable(msg.sender) {
        require(_tokenRegistry != address(0), "CrossChainEscrow: Invalid token registry");
        require(_wormholeMessenger != address(0), "CrossChainEscrow: Invalid Wormhole messenger");
        
        tokenRegistry = ITokenRegistry(_tokenRegistry);
        wormholeMessenger = IWormholeMessenger(_wormholeMessenger);
        
        for (uint256 i = 0; i < _supportedChains.length; i++) {
            supportedChains.push(_supportedChains[i]);
            isChainSupported[_supportedChains[i]] = true;
        }
    }

    /**
     * @notice Register a cross-chain token
     * @param tokenId Universal token identifier
     * @param localAddress Local token contract address
     * @param chainId Source chain ID
     * @param chainType Type of blockchain
     * @param isNative Whether it's the native token
     */
    function registerToken(
        bytes32 tokenId,
        address localAddress,
        uint256 chainId,
        ChainType chainType,
        bool isNative
    ) external override onlyOwner {
        require(tokenId != bytes32(0), "CrossChainEscrow: Invalid token ID");
        require(localAddress != address(0) || isNative, "CrossChainEscrow: Invalid token address");
        require(isChainSupported[chainId], "CrossChainEscrow: Unsupported chain");
        
        crossChainTokens[tokenId][chainId] = CrossChainToken({
            tokenId: tokenId,
            localAddress: localAddress,
            chainId: chainId,
            chainType: chainType,
            isNative: isNative,
            isActive: true
        });
        
        emit TokenRegistered(tokenId, localAddress, chainId, chainType);
    }

    /**
     * @notice Unregister a cross-chain token
     * @param tokenId Universal token identifier
     * @param chainId Chain ID
     */
    function unregisterToken(bytes32 tokenId, uint256 chainId) external override onlyOwner {
        require(crossChainTokens[tokenId][chainId].tokenId != bytes32(0), "CrossChainEscrow: Token not registered");
        
        crossChainTokens[tokenId][chainId].isActive = false;
        
        emit TokenUnregistered(tokenId, crossChainTokens[tokenId][chainId].localAddress, chainId);
    }

    /**
     * @notice Create a cross-chain escrow
     * @param seller Seller address
     * @param arbiter Arbiter address
     * @param tokenId Universal token identifier
     * @param amount Amount to escrow
     * @param deadline Escrow deadline
     * @param targetChainId Target chain ID
     * @return escrowId Cross-chain escrow ID
     */
    function createCrossChainEscrow(
        address seller,
        address arbiter,
        bytes32 tokenId,
        uint256 amount,
        uint256 deadline,
        uint256 targetChainId
    ) external payable override nonReentrant whenNotPaused returns (bytes32) {
        require(seller != address(0), "CrossChainEscrow: Invalid seller");
        require(arbiter != address(0), "CrossChainEscrow: Invalid arbiter");
        require(amount > 0, "CrossChainEscrow: Invalid amount");
        require(deadline > block.timestamp + MIN_ESCROW_DURATION, "CrossChainEscrow: Invalid deadline");
        require(deadline <= block.timestamp + MAX_ESCROW_DURATION, "CrossChainEscrow: Deadline too far");
        require(isChainSupported[targetChainId], "CrossChainEscrow: Unsupported target chain");
        
        CrossChainToken memory token = crossChainTokens[tokenId][block.chainid];
        require(token.tokenId != bytes32(0), "CrossChainEscrow: Token not registered");
        require(token.isActive, "CrossChainEscrow: Token not active");
        
        bytes32 escrowId = keccak256(abi.encodePacked(
            block.chainid,
            targetChainId,
            msg.sender,
            seller,
            tokenId,
            amount,
            deadline,
            block.timestamp,
            _escrowCounter++
        ));
        
        crossChainEscrows[escrowId] = CrossChainEscrowData({
            escrowId: escrowId,
            buyer: msg.sender,
            seller: seller,
            arbiter: arbiter,
            token: token,
            amount: amount,
            deadline: deadline,
            platformFee: platformFeePercentage,
            arbiterFee: arbiterFeePercentage,
            feeDenominator: FEE_DENOMINATOR,
            isCrossChain: true,
            sourceChainId: block.chainid,
            targetChainId: targetChainId,
            merkleRoot: bytes32(0) // Will be set when message is processed
        });
        
        // Handle token transfer
        if (token.isNative) {
            require(msg.value == amount, "CrossChainEscrow: Incorrect ETH amount");
        } else {
            require(msg.value == 0, "CrossChainEscrow: ETH not needed for ERC20");
            IERC20(token.localAddress).safeTransferFrom(msg.sender, address(this), amount);
        }
        
        // Send cross-chain message
        _sendCrossChainMessage(escrowId, targetChainId);
        
        emit CrossChainEscrowCreated(escrowId, msg.sender, seller, block.chainid, targetChainId, tokenId, amount);
        
        return escrowId;
    }

    /**
     * @notice Process a cross-chain message
     * @param message Cross-chain message
     * @param proof Merkle proof for verification
     */
    function processCrossChainMessage(
        CrossChainMessage calldata message,
        bytes calldata proof
    ) external override nonReentrant whenNotPaused {
        require(!processedMessages[message.escrowId], "CrossChainEscrow: Message already processed");
        require(verifyMerkleProof(message, proof), "CrossChainEscrow: Invalid proof");
        
        processedMessages[message.escrowId] = true;
        
        // Create escrow on this chain
        bytes32 escrowId = message.escrowId;
        crossChainEscrows[escrowId] = CrossChainEscrowData({
            escrowId: escrowId,
            buyer: message.buyer,
            seller: message.seller,
            arbiter: message.arbiter,
            token: message.token,
            amount: message.amount,
            deadline: message.deadline,
            platformFee: platformFeePercentage,
            arbiterFee: arbiterFeePercentage,
            feeDenominator: FEE_DENOMINATOR,
            isCrossChain: true,
            sourceChainId: message.sourceChainId,
            targetChainId: block.chainid,
            merkleRoot: keccak256(abi.encode(message))
        });
        
        emit CrossChainMessageReceived(escrowId, message.sourceChainId, block.chainid, true);
    }

    /**
     * @notice Get cross-chain token information
     * @param tokenId Universal token identifier
     * @param chainId Chain ID
     * @return token Cross-chain token information
     */
    function getCrossChainToken(bytes32 tokenId, uint256 chainId) 
        external view override returns (CrossChainToken memory) {
        return crossChainTokens[tokenId][chainId];
    }

    /**
     * @notice Check if token is supported
     * @param tokenId Universal token identifier
     * @param chainId Chain ID
     * @return supported Whether token is supported
     */
    function isTokenSupported(bytes32 tokenId, uint256 chainId) 
        external view override returns (bool) {
        return crossChainTokens[tokenId][chainId].isActive;
    }

    /**
     * @notice Get all supported chains
     * @return chains Array of supported chain IDs
     */
    function getSupportedChains() external view override returns (uint256[] memory) {
        return supportedChains;
    }

    /**
     * @notice Get supported tokens for a chain
     * @return tokens Array of supported token IDs
     */
    function getSupportedTokens(uint256 /* chainId */) 
        external pure override returns (bytes32[] memory) {
        // This would require iterating through all tokens
        // For gas efficiency, we'll return a limited set
        bytes32[] memory tokens = new bytes32[](10); // Placeholder
        return tokens;
    }

    /**
     * @notice Send cross-chain message via Wormhole
     * @param escrowId Escrow ID
     * @param targetChainId Target chain ID
     */
    function _sendCrossChainMessage(bytes32 escrowId, uint256 targetChainId) internal {
        CrossChainEscrowData storage escrow = crossChainEscrows[escrowId];
        
        IWormholeMessenger.MessagePayload memory payload = IWormholeMessenger.MessagePayload({
            escrowId: escrowId,
            buyer: escrow.buyer,
            seller: escrow.seller,
            arbiter: escrow.arbiter,
            tokenId: escrow.token.tokenId,
            amount: escrow.amount,
            deadline: escrow.deadline,
            sourceChainId: escrow.sourceChainId,
            targetChainId: targetChainId,
            action: 1 // Create action
        });
        
        uint256 fee = wormholeMessenger.getMessageFee(uint16(targetChainId));
        wormholeMessenger.sendMessage{value: fee}(uint16(targetChainId), payload);
        
        emit CrossChainMessageSent(escrowId, escrow.sourceChainId, targetChainId, 0);
    }

    /**
     * @notice Verify Merkle proof for cross-chain message
     * @param proof Merkle proof
     * @return valid Whether proof is valid
     */
    function verifyMerkleProof(
        CrossChainMessage calldata /* message */,
        bytes calldata proof
    ) internal pure returns (bool) {
        // In a real implementation, this would verify the Merkle proof
        // For now, we'll return true as a placeholder
        return proof.length > 0;
    }

    /**
     * @notice Set platform fee percentage
     * @param newFee New fee percentage (in basis points)
     */
    function setPlatformFee(uint256 newFee) external onlyOwner {
        require(newFee <= MAX_PLATFORM_FEE, "CrossChainEscrow: Fee too high");
        platformFeePercentage = newFee;
    }

    /**
     * @notice Set arbiter fee percentage
     * @param newFee New fee percentage (in basis points)
     */
    function setArbiterFee(uint256 newFee) external onlyOwner {
        require(newFee <= MAX_ARBITER_FEE, "CrossChainEscrow: Fee too high");
        arbiterFeePercentage = newFee;
    }

    /**
     * @notice Add supported chain
     * @param chainId Chain ID to add
     */
    function addSupportedChain(uint256 chainId) external onlyOwner {
        require(!isChainSupported[chainId], "CrossChainEscrow: Chain already supported");
        supportedChains.push(chainId);
        isChainSupported[chainId] = true;
    }

    /**
     * @notice Remove supported chain
     * @param chainId Chain ID to remove
     */
    function removeSupportedChain(uint256 chainId) external onlyOwner {
        require(isChainSupported[chainId], "CrossChainEscrow: Chain not supported");
        isChainSupported[chainId] = false;
        
        // Remove from supportedChains array
        for (uint256 i = 0; i < supportedChains.length; i++) {
            if (supportedChains[i] == chainId) {
                supportedChains[i] = supportedChains[supportedChains.length - 1];
                supportedChains.pop();
                break;
            }
        }
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
     * @notice Emergency withdraw for stuck funds
     * @param token Token address (address(0) for ETH)
     * @param amount Amount to withdraw
     */
    function emergencyWithdraw(address token, uint256 amount) external onlyOwner {
        if (token == address(0)) {
            (bool success, ) = payable(owner()).call{value: amount}("");
            require(success, "CrossChainEscrow: ETH transfer failed");
        } else {
            IERC20(token).safeTransfer(owner(), amount);
        }
    }
}

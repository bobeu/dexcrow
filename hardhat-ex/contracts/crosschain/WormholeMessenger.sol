// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import { IWormholeMessenger } from "./interfaces/IWormholeMessenger.sol";
import { ReentrancyGuard } from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";
import { Pausable } from "@openzeppelin/contracts/utils/Pausable.sol";

/**
 * @title WormholeMessenger
 * @dev Implementation of Wormhole cross-chain messaging
 * @notice Handles secure cross-chain message passing for escrow operations
 */
contract WormholeMessenger is IWormholeMessenger, ReentrancyGuard, Ownable, Pausable {
    /// @notice Wormhole core contract address
    address public immutable wormholeCore;
    
    /// @notice Guardian set for message verification
    mapping(uint32 => uint256) public guardianSets;
    uint32 public currentGuardianSetIndex;
    
    /// @notice Message fees per target chain
    mapping(uint16 => uint256) public messageFees;
    
    /// @notice Supported chains
    uint16[] public supportedChains;
    mapping(uint16 => bool) public chainSupported;
    
    /// @notice Message nonce counter
    uint32 private _nonceCounter;
    
    /// @notice Message tracking
    mapping(bytes32 => bool) public processedMessages;
    
    /// @notice Constants
    uint256 public constant MAX_MESSAGE_FEE = 0.1 ether;
    uint256 public constant MESSAGE_TIMEOUT = 1 hours;
    
    /// @notice Modifiers
    modifier onlySupportedChain(uint16 chainId) {
        require(chainSupported[chainId], "WormholeMessenger: Unsupported chain");
        _;
    }
    
    modifier validMessage(WormholeMessage calldata message) {
        require(message.sourceChainId != 0, "WormholeMessenger: Invalid source chain");
        require(message.targetChainId != 0, "WormholeMessenger: Invalid target chain");
        require(message.payloadHash != bytes32(0), "WormholeMessenger: Invalid payload");
        require(block.timestamp - message.timestamp <= MESSAGE_TIMEOUT, "WormholeMessenger: Message expired");
        _;
    }

    /**
     * @dev Constructor
     * @param _wormholeCore Address of Wormhole core contract
     * @param _initialGuardianSet Initial guardian set
     */
    constructor(
        address _wormholeCore,
        uint256 _initialGuardianSet
    ) Ownable(msg.sender) {
        require(_wormholeCore != address(0), "WormholeMessenger: Invalid Wormhole core");
        
        wormholeCore = _wormholeCore;
        guardianSets[0] = _initialGuardianSet;
        currentGuardianSetIndex = 0;
        
        // Initialize supported chains
        supportedChains = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]; // Example chain IDs
        for (uint256 i = 0; i < supportedChains.length; i++) {
            chainSupported[supportedChains[i]] = true;
            messageFees[supportedChains[i]] = 0.001 ether; // Default fee
        }
    }

    /**
     * @notice Send a cross-chain message
     * @param targetChainId Target chain ID
     * @param payload Message payload
     * @return nonce Message nonce
     */
    function sendMessage(
        uint16 targetChainId,
        MessagePayload calldata payload
    ) external payable override onlySupportedChain(targetChainId) nonReentrant whenNotPaused returns (uint32) {
        require(msg.value >= messageFees[targetChainId], "WormholeMessenger: Insufficient fee");
        
        uint32 nonce = ++_nonceCounter;
        bytes32 payloadHash = keccak256(abi.encode(payload));
        
        // WormholeMessage memory message = WormholeMessage({
        //     nonce: nonce,
        //     sourceChainId: uint16(block.chainid),
        //     targetChainId: targetChainId,
        //     payloadHash: payloadHash,
        //     timestamp: block.timestamp,
        //     signature: bytes("") // Would be filled by Wormhole core
        // });
        
        // In a real implementation, this would call Wormhole core
        // IWormholeCore(wormholeCore).publishMessage(nonce, payload, 1);
        
        emit MessageSent(nonce, uint16(block.chainid), targetChainId, payloadHash);
        
        return nonce;
    }

    /**
     * @notice Receive and process a cross-chain message
     * @param encodedMessage Encoded Wormhole message
     * @return success Whether message was processed successfully
     */
    function receiveMessage(
        bytes calldata encodedMessage
    ) external override nonReentrant whenNotPaused returns (bool) {
        WormholeMessage memory message = abi.decode(encodedMessage, (WormholeMessage));
        
        // Validate message
        require(message.sourceChainId != 0, "WormholeMessenger: Invalid source chain");
        require(message.targetChainId != 0, "WormholeMessenger: Invalid target chain");
        require(message.payloadHash != bytes32(0), "WormholeMessenger: Invalid payload");
        require(block.timestamp - message.timestamp <= MESSAGE_TIMEOUT, "WormholeMessenger: Message expired");
        
        require(verifyMessage(message), "WormholeMessenger: Invalid signature");
        
        bytes32 messageHash = keccak256(encodedMessage);
        require(!processedMessages[messageHash], "WormholeMessenger: Message already processed");
        
        processedMessages[messageHash] = true;
        
        // Process the message payload
        bool success = _processMessage(message);
        
        emit MessageReceived(message.nonce, message.sourceChainId, message.targetChainId, success);
        
        return success;
    }

    /**
     * @notice Verify a Wormhole message signature
     * @param message Wormhole message to verify
     * @return valid Whether message signature is valid
     */
    function verifyMessage(
        WormholeMessage memory message
    ) public view override returns (bool) {
        // In a real implementation, this would verify the guardian signature
        // For now, we'll simulate verification
        return message.signature.length > 0;
    }

    /**
     * @notice Get message fee for target chain
     * @param targetChainId Target chain ID
     * @return fee Required fee in wei
     */
    function getMessageFee(uint16 targetChainId) external view override returns (uint256) {
        return messageFees[targetChainId];
    }

    /**
     * @notice Get all supported chains
     * @return chains Array of supported chain IDs
     */
    function getSupportedChains() external view override returns (uint16[] memory) {
        return supportedChains;
    }

    /**
     * @notice Check if chain is supported
     * @param chainId Chain ID to check
     * @return supported Whether chain is supported
     */
    function isChainSupported(uint16 chainId) external view override returns (bool) {
        return chainSupported[chainId];
    }

    /**
     * @notice Process a received message
     * @return success Whether processing was successful
     */
    function _processMessage(WormholeMessage memory /* message */) internal pure returns (bool) {
        // Decode and process the payload
        // This would contain the actual escrow logic
        // For now, we'll return true as a placeholder
        return true;
    }

    /**
     * @notice Update guardian set
     * @param newGuardianSet New guardian set
     */
    function updateGuardianSet(uint256 newGuardianSet) external onlyOwner {
        currentGuardianSetIndex++;
        guardianSets[currentGuardianSetIndex] = newGuardianSet;
        
        emit GuardianSetUpdated(currentGuardianSetIndex, newGuardianSet);
    }

    /**
     * @notice Set message fee for a chain
     * @param chainId Chain ID
     * @param fee New fee amount
     */
    function setMessageFee(uint16 chainId, uint256 fee) external onlyOwner {
        require(fee <= MAX_MESSAGE_FEE, "WormholeMessenger: Fee too high");
        messageFees[chainId] = fee;
    }

    /**
     * @notice Add supported chain
     * @param chainId Chain ID to add
     * @param fee Initial fee for the chain
     */
    function addSupportedChain(uint16 chainId, uint256 fee) external onlyOwner {
        require(!chainSupported[chainId], "WormholeMessenger: Chain already supported");
        require(fee <= MAX_MESSAGE_FEE, "WormholeMessenger: Fee too high");
        
        supportedChains.push(chainId);
        chainSupported[chainId] = true;
        messageFees[chainId] = fee;
    }

    /**
     * @notice Remove supported chain
     * @param chainId Chain ID to remove
     */
    function removeSupportedChain(uint16 chainId) external onlyOwner {
        require(chainSupported[chainId], "WormholeMessenger: Chain not supported");
        
        chainSupported[chainId] = false;
        delete messageFees[chainId];
        
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
     * @notice Withdraw accumulated fees
     */
    function withdrawFees() external onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "WormholeMessenger: No fees to withdraw");
        
        (bool success, ) = payable(owner()).call{value: balance}("");
        require(success, "WormholeMessenger: Withdrawal failed");
    }
}

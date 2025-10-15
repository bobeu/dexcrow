// SPDX-License-Identifier: MIT

pragma solidity 0.8.30;

/**
 * @title IWormholeMessenger
 * @dev Interface for Wormhole cross-chain messaging
 * @notice Handles cross-chain message passing and verification
 */
interface IWormholeMessenger {
    /// @notice Wormhole message structure
    struct WormholeMessage {
        uint32 nonce;
        uint16 sourceChainId;
        uint16 targetChainId;
        bytes32 payloadHash;
        uint256 timestamp;
        bytes signature;
    }

    /// @notice Cross-chain message payload
    struct MessagePayload {
        bytes32 escrowId;
        address buyer;
        address seller;
        address arbiter;
        bytes32 tokenId;
        uint256 amount;
        uint256 deadline;
        uint256 sourceChainId;
        uint256 targetChainId;
        uint8 action; // 1: Create, 2: Fulfill, 3: Cancel, 4: Dispute
    }

    /// @notice Events
    event MessageSent(
        uint32 indexed nonce,
        uint16 indexed sourceChainId,
        uint16 indexed targetChainId,
        bytes32 payloadHash
    );

    event MessageReceived(
        uint32 indexed nonce,
        uint16 indexed sourceChainId,
        uint16 indexed targetChainId,
        bool success
    );

    event GuardianSetUpdated(
        uint32 indexed newIndex,
        uint256 newGuardianSet
    );

    /// @notice Functions
    function sendMessage(
        uint16 targetChainId,
        MessagePayload calldata payload
    ) external payable returns (uint32);

    function receiveMessage(
        bytes calldata encodedMessage
    ) external returns (bool);

    function verifyMessage(
        WormholeMessage memory message
    ) external view returns (bool);

    function getMessageFee(uint16 targetChainId) external view returns (uint256);

    function getSupportedChains() external view returns (uint16[] memory);

    function isChainSupported(uint16 chainId) external view returns (bool);
}

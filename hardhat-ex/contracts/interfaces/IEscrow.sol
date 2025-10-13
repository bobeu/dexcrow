// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

interface IEscrow {
    // Events
    event EscrowCreated(
        address indexed buyer,
        address indexed seller,
        address indexed arbiter,
        address assetToken,
        uint256 assetAmount,
        uint256 deadline
    );
    
    event AssetDeposited(
        address indexed depositor,
        address indexed assetToken,
        uint256 amount,
        uint256 timestamp
    );
    
    event FulfillmentConfirmed(
        address indexed confirmer,
        uint256 timestamp
    );
    
    event FundsReleased(
        address indexed recipient,
        address indexed assetToken,
        uint256 amount,
        uint256 timestamp
    );
    
    event FundsRefunded(
        address indexed recipient,
        address indexed assetToken,
        uint256 amount,
        uint256 timestamp
    );
    
    event DisputeRaised(
        address indexed disputer,
        string reason,
        uint256 timestamp
    );
    
    event DisputeResolved(
        address indexed arbiter,
        bool releaseFunds,
        string reasoning,
        uint256 timestamp
    );

    // Enums
    enum EscrowState {
        AWAITING_DEPOSIT,
        AWAITING_FULFILLMENT,
        DISPUTE_RAISED,
        COMPLETED,
        CANCELED
    }

    // Structs
    struct EscrowDetails {
        address buyer;
        address seller;
        address arbiter;
        address assetToken;
        uint256 assetAmount;
        uint256 deadline;
        EscrowState state;
        uint256 createdAt;
        uint256 updatedAt;
        string description;
        uint256 disputeWindowHours;
    }

    struct DisputeInfo {
        bool isActive;
        address disputer;
        bytes reason;
        uint256 raisedAt;
        address arbiter;
        bool arbiterDecision;
        bytes arbiterReasoning;
        uint256 resolvedAt;
    }

    struct EscrowData {
        EscrowDetails escrowDetails;
        DisputeInfo disputeInfo;
        uint256 platformFeePercentage; // 50 = 0.5%
        uint256 arbiterFeePercentage; // 100 = 1%
        uint256 feeDenominator; // default is 10000
        address platformFeeRecipient;
    }

}
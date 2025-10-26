// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

/**
 * @title IEscrow 
 * @dev Interface for the Escrow contract
 * @author Bobeu - https://github.com/bobeu
 */
interface IEscrow {
        // Custom Errors
    error InvalidBuyerAddress();
    error InvalidSellerAddress();
    error InvalidArbiterAddress();
    error AssetAmountMustBeGreaterThanZero();
    error DeadlineMustBeInTheFuture();
    error DisputeWindowMustBeGreaterThanZero();
    error InvalidPlatformFeeRecipient();
    error OnlyBuyerOrSellerCanCall();
    error OnlyBuyerCanCall();
    error OnlySellerCanCall();
    error OnlyArbiterCanCall();
    error OnlyAuthorizedAgentsCanCall();
    error InvalidEscrowState();
    error EscrowHasExpired();
    error EscrowHasNotExpired();
    error IncorrectETHAmount();
    error ETHNotAcceptedForERC20Escrow();
    error InsufficientTokenBalance();
    error InsufficientTokenAllowance();
    error OnlyBuyerOrArbiterCanReleaseFunds();
    error OnlyBuyerOrArbiterCanRefundFunds();
    error DeadlineNotReached();
    error DisputeReasonCannotBeEmpty();
    error NoActiveDispute();
    error ReasoningCannotBeEmpty();
    error InvalidStateForFundRelease();
    error TransferToRecipientFailed();
    error TransferToPlatformFailed();
    error TransferToArbiterFailed();
    error InvalidAgentAddress();
    error ContractMustBePaused();
    error EmergencyWithdrawFailed();
    error ArbiterSwapWindowNotOpen();
    error EscrowWasResolved();
    error NotApproved();
    error CallerIsTheArbiter();

    // Events
    event ArbiterSwapped(
        address indexed oldArbiter,
        address indexed newArbiter
    );

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
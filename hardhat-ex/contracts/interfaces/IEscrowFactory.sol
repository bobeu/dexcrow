// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

/**
 * @title IEscrowFactory
 * @dev Interface of the EscrowFactory contract
 * @author Bobeu - https://github.com/bobeu
 */
interface IEscrowFactory {
        //Errors
    error InsufficientCreationFee(uint256 valueSent);
    error DescriptionCannotBeEmpty();
    error BuyerAndSellerCannotBeTheSame();
    error BuyerAndArbiterCannotBeTheSame();
    error SellerAndArbiterCannotBeTheSame();
    error ErrorSendingToPlatformFeeRecipient();
    error InvalidAddress();
    error AmountMustBeGreaterThanZero();
    error DeadlineMustBeInTheFuture();
    error DisputeWindowMustBeGreaterThanZero();
    error DisputeWindowCannotExceedSevenDays();
    error InvalidEscrowAddress();
    error OffsetOutOfBounds();
    error WithdrawalFailed();
    error ContractMustBePaused();

    // Events
    event EscrowCreated(
        address indexed escrowAddress,
        address indexed buyer,
        address indexed seller,
        uint256 timestamp
    );

    event PlatformFeeRecipientUpdated(
        address indexed oldRecipient,
        address indexed newRecipient
    );

    event DefaultDisputeWindowUpdated(
        uint256 oldWindow,
        uint256 newWindow
    );

    struct ReadData {
        address[] allEscrow;
        address[] userEscrows;
        uint totalEscrows;
        uint userEscrowCount;
    }

   function getArbiterStatus(address arbiter) external view returns(bool, uint8 num);
   function updateArbiterStatus(address arbiter) external returns(bool);
   function isApprovedArbiter(address arbiter, uint8 flag) external returns(bool);

}
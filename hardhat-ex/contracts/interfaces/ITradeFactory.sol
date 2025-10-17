// SPDX-License-Identifier: MIT

pragma solidity 0.8.30;

import { ICommon } from "./ICommon.sol";

/**
 * @title ITradeFactory
 * @dev Interface for the trade factory contract
 * @author Bobeu - https://github.com/bobeu
 */
interface ITradeFactory is ICommon {
    
    // ============ CUSTOM ERRORS ============
    error Paused();
    error InvalidOwner();
    error AccountAlreadyExists();
    error InvalidAmount();
    error InvalidFee();
    error TransferFailed();
    error InvalidAddress();


    enum FeeType {
        PLATFORM,
        CREATION
    }

    enum OrderStatus {
        ACTIVE,
        INACTIVE
    }

    struct Index {
        uint index;
        bool hasIndex;
    }

    struct FactoryData {
        address owner;
        uint256 platformFee;
        uint256 totalFees;
        uint256 totalAccounts;
        AccountInfo[] accounts;
        FactoryVariables variables;
        bool isPaused;
    }

    // Events
    event AccountCreated(
        address indexed user,
        address indexed tradingAccount,
        uint256 timestamp
    );

    event NewPaymentAssetAdded(
        address indexed oldPaymentAsset,
        address indexed newPaymentAsset
    );

    event FeeSet(
        uint256 newFee,
        FeeType feeType
    );

    event FeesWithdrawn(
        uint256 amount,
        address indexed to
    );

    // Functions
    function getAccountInfo(address user) external view returns (AccountInfo memory);

    function getVariables(address user) external view returns(FactoryVariables memory _fvs);

    function createTradingAccount(address agent, string memory nickName) external returns(address account);
}
// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

import { ICommon } from "./ICommon.sol";

/**
 * @title ITradingAccount
 * @dev Interface for individual trading accounts
 * @author TradeVerse Team
 */
interface ITradingAccount is ICommon {
    enum OrderStatus {
        INACTIVE,
        ACTIVE, 
        FULFILLED,
        CANCELLED,
        EXPIRED 
    }

    // enum FundType {
    //     NATIVE,
    //     ERC20
    // }

    // Structs
    struct SellerInfo {
        bytes nickName;
        uint256 reputation;
        address id;
    }

    struct OrderIndex {
        uint index;
        bool hasIndex;
    }

    struct AssetDetail {
        uint8 decimals;
        bytes name;
        bytes symbol;
        address tokenAddress;
    }

    struct OrderDetails {
        uint256 amount;
        uint256 pricePerUnit;
        uint256 createdAt;
        uint256 expiresAt;
        uint256 reputation;
        AssetDetail asseetInfo;
        OrderStatus status;
    }

    struct WithdrawalRequest {
        uint256 amount;
        uint256 requestedAt;
        uint256 cooldownEnd;
        bool isOpen;
    }

    struct AccountData {
        address owner;
        address tradeFactory;
        uint256 totalOrders;
        uint256 successfulOrders;
        uint256 cancelledOrders;
        uint256 cooldownPeriod;
        uint256 activeOrderCount;
    }

    // Events
    event OrderCreated(
        bytes32 indexed orderId,
        address indexed tokenAddress,
        uint indexed orderIndex,
        uint256 amount,
        uint256 price,
        bool useLivePrice,
        bytes32 nickname
    );
    
    event OrderCancelled(
        bytes32 indexed orderId,
        address indexed tokenAddress,
        uint256 amount
    );
    
    event AssetDeposited(
        address indexed token,
        uint256 amount,
        uint256 erc20Balance,
        uint256 nativeBalance
    );
    
    event AssetWithdrawn(
        address indexed token,
        uint256 amount,
        uint256 newBalance
    );
    
    event WithdrawalRequested(
        address indexed token,
        uint256 amount,
        uint256 cooldownEnd
    );
    
    event OrderFulfilled(
        bytes32 indexed orderId,
        address indexed buyer,
        uint256 amount
    );
    
    event CooldownPeriodSet(uint256 newCooldownPeriod);

    // Functions
    function createOrder(
        address seller,
        bytes32 tokenAddress,
        uint256 amount,
        uint256 price,
        uint256 expirationHours,
        bytes32 nickname
    ) external payable returns (address order, bytes32 orderId);

    function cancelOrder(bytes32 orderId) external;

    function deposit(address token, uint256 amount) external payable;

    function requestWithdrawal(address token, uint256 amount) external;

    function processWithdrawal(address token) external;

    function setCooldownPeriod(uint256 newCooldownPeriod) external;

    function fulfillOrder(bytes32 orderId, address buyer, uint256 amount) external;

    function updateReputation(bytes32 orderId, uint256 reputation) external;

    function getAccountData() external view returns (AccountData memory);

    function getOrder(bytes32 orderId) external view returns (OrderDetails memory);

    function getActiveOrderIds() external view returns (bytes32[] memory);

    function getBalance(address token) external view returns (uint256);

    function getLockedBalance(address token) external view returns (uint256);

    function getWithdrawalRequest(address token) external view returns (WithdrawalRequest memory);

    function getOwnerAndApproved(address agent) external view returns (address);

    function tradeFactory() external view returns (address);

    function cooldownPeriod() external view returns (uint256);

    function totalOrders() external view returns (uint256);

    function successfulOrders() external view returns (uint256);

    function cancelledOrders() external view returns (uint256);

    function deactivateAccount(bool stop) external returns (bool);
}
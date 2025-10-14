// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

/**
 * @title ITradingAccount
 * @dev Interface for individual trading accounts
 * @author TradeVerse Team
 */
interface ITradingAccount {
    // Structs
    struct OrderDetails {
        bytes32 tokenAddress;
        uint256 chainId;
        uint256 amount;
        uint256 price;
        bool useLivePrice;
        bytes32 nickname;
        uint256 createdAt;
        uint256 expiresAt;
        uint8 orderType; // 0 = BUY, 1 = SELL
        uint8 status;    // 0 = ACTIVE, 1 = FULFILLED, 2 = CANCELLED, 3 = EXPIRED, 4 = BLACKLISTED
        uint256 reputation;
    }

    struct WithdrawalRequest {
        uint256 amount;
        uint256 requestedAt;
        uint256 cooldownEnd;
        bool isProcessed;
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
        bytes32 indexed tokenAddress,
        uint256 indexed chainId,
        uint256 amount,
        uint256 price,
        bool useLivePrice,
        bytes32 nickname
    );
    
    event OrderCancelled(
        bytes32 indexed orderId,
        bytes32 indexed tokenAddress,
        uint256 amount
    );
    
    event AssetDeposited(
        address indexed token,
        uint256 amount,
        uint256 newBalance
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
        bytes32 tokenAddress,
        uint256 chainId,
        uint256 amount,
        uint256 price,
        bool useLivePrice,
        uint256 expirationHours,
        bytes32 nickname
    ) external returns (address order, bytes32 orderId);

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

    function owner() external view returns (address);

    function tradeFactory() external view returns (address);

    function cooldownPeriod() external view returns (uint256);

    function totalOrders() external view returns (uint256);

    function successfulOrders() external view returns (uint256);

    function cancelledOrders() external view returns (uint256);
}
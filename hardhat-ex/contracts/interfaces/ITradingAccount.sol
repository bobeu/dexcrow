// SPDX-License-Identifier: MIT

pragma solidity 0.8.30;

import { ICommon } from "./ICommon.sol";

/**
 * @title ITradingAccount
 * @dev Interface for individual trading accounts
 * @author Bobeu - https://github.com/bobeu
 */
interface ITradingAccount is ICommon {
        // ============ CUSTOM ERRORS ============
    error OnlyFactory();
    error NoWithdrawalRequest();
    error WithdrawalAlreadyProcessed();
    error CooldownNotPassed();
    error InsufficientBalance();
    error OrderNotFound();
    error OrderNotActive();
    error InvalidAmount();
    error OrderExpired();
    error TransferFailed();
    error PriceNotProvided();
    error NoFundDetected();
    error FundFaucetFailed();
    error InvalidOrderId();
    error MinimumFundingRequired();
    error PendingWithdrawalRequest();
    error InvalidPaymentAsset();
    error TradeUnverified();
    error InvalidTotalRequest();
    error InvalidParameters();
    error UnrecognizedAsset();
    error TrickyMove();
    error InvalidTokenOut();
    error BalanceTooLow();
    error FallbackExecutionFailed();
    error InsufficientBalForRequestedToken();
    error InvalidFallbackTradingAccount();

    enum OrderStatus {
        INACTIVE,
        ACTIVE, 
        FULFILLED,
        CANCELLED
    }

    // Structs
    struct SellerInfo {
        bytes nickName;
        uint256 reputation;
        address id;
        bytes32 agentId;
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
        AssetDetail asseetInfo;
        OrderStatus status;
    }

    struct AccountData {
        address owner;
        address tradeFactory;
        OrderDetails[] orders;
        uint256 successfulOrders;
        uint256 cancelledOrders;
        uint256 activeOrderCount;
        SellerInfo sellerInfo;
    }

    // Events
    event OrderCreated(
        bytes32 indexed orderId,
        address indexed tokenAddress,
        uint indexed orderIndex,
        uint256 amount,
        uint256 price,
        bool useLivePrice
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
     
    event OrderFulfilled(
        bytes32 indexed orderId,
        address indexed buyer,
        uint256 amount
    );

    event ExchangeSuccess(
        address indexed seller, 
        uint256 totalCost, 
        uint256 volume, 
        uint pricePerUnit, 
        address indexed tokenOut, 
        address indexed tokenIn
    );
    
    event OrderActivated(bytes32 orderId, uint newDuration);

    // Functions
    function createOrder(
        bytes32 tokenAddress,
        uint256 amount,
        uint256 price,
        uint256 expirationHours
    ) external payable returns (bytes32 orderId);

    function cancelOrder(bytes32 orderId) external returns(bool);

    function deposit(address token) external payable returns(bool);

    function fulfillOrder(bytes32 orderId, address buyer, uint256 amount) external returns(bool);

    function getAccountData() external view returns (AccountData memory);

    function getBalance(address token) external view returns (uint256);

    function getLockedBalance(address token) external view returns (uint256);

    function exchangeValues(uint256 totalCost, uint pricePerUnit, address tokenIn, address tokenOut) external payable returns(bool);
}
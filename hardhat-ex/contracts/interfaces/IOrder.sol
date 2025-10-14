// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

/**
 * @title IOrder
 * @dev Interface for individual trading orders
 * @author TradeVerse Team
 */
interface IOrder {
    // Enums
    enum OrderType {
        BUY,
        SELL
    }

    enum OrderStatus {
        ACTIVE,
        FULFILLED,
        CANCELLED,
        EXPIRED,
        BLACKLISTED
    }

    // Structs
    struct OrderData {
        bytes32 tokenAddress;
        uint256 chainId;
        uint256 amount;
        uint256 price;
        bool useLivePrice;
        bytes32 nickname;
        uint256 createdAt;
        uint256 expiresAt;
        OrderType orderType;
        OrderStatus status;
        uint256 reputation;
    }

    // Events
    event OrderCreated(
        bytes32 indexed orderId,
        address indexed tradingAccount,
        OrderType orderType,
        uint256 timestamp
    );

    event OrderFulfilled(
        bytes32 indexed orderId,
        address indexed buyer,
        uint256 amount,
        uint256 timestamp
    );

    event OrderCancelled(
        bytes32 indexed orderId,
        uint256 amount,
        uint256 timestamp
    );

    event OrderPriceUpdated(
        bytes32 indexed orderId,
        uint256 newPrice,
        uint256 timestamp
    );

    event OrderBlacklisted(
        bytes32 indexed orderId,
        uint256 timestamp
    );

    // Functions
    function fulfillOrder(address buyer, uint256 amount) external;

    function cancelOrder() external;

    function updatePrice(uint256 newPrice) external;

    function blacklistOrder() external;

    function getOrderData() external view returns (OrderData memory);

    function getOrderId() external view returns (bytes32);

    function getStatus() external view returns (OrderStatus);

    function getOrderType() external view returns (OrderType);

    function getAmount() external view returns (uint256);

    function getPrice() external view returns (uint256);

    function getTokenAddress() external view returns (bytes32);

    function getChainId() external view returns (uint256);

    function getExpiresAt() external view returns (uint256);

    function getCreatedAt() external view returns (uint256);

    function getNickname() external view returns (bytes32);

    function getReputation() external view returns (uint256);

    function getTradingAccount() external view returns (address);

    function getTradeFactory() external view returns (address);

    function getPythPriceFeedId() external view returns (bytes32);

    function isActive() external view returns (bool);

    function isExpired() external view returns (bool);
}
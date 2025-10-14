// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

/**
 * @title ITradeFactory
 * @dev Interface for the trade factory contract
 * @author TradeVerse Team
 */
interface ITradeFactory {
    // Structs
    struct AccountInfo {
        address user;
        address tradingAccount;
        uint256 reputation;
        uint256 totalOrders;
        uint256 successfulOrders;
        uint256 cancelledOrders;
        uint256 createdAt;
    }

    struct OrderInfo {
        bytes32 orderId;
        address user;
        address tradingAccount;
        address order;
        bytes32 tokenAddress;
        uint256 chainId;
        uint256 amount;
        uint256 price;
        bool useLivePrice;
        uint256 createdAt;
        uint8 status; // 0 = ACTIVE, 1 = FULFILLED, 2 = CANCELLED, 3 = EXPIRED, 4 = BLACKLISTED
    }

    struct SupportedChain {
        uint256 chainId;
        string chainName;
        bool isActive;
        address factoryAddress;
    }

    struct FactoryData {
        address owner;
        uint256 platformFee;
        uint256 totalFees;
        uint256 supportedChainCount;
        uint256 totalAccounts;
    }

    // Events
    event AccountCreated(
        address indexed user,
        address indexed tradingAccount,
        uint256 timestamp
    );

    event OrderCreated(
        bytes32 indexed orderId,
        address indexed user,
        address indexed tradingAccount,
        address order,
        bytes32 tokenAddress,
        uint256 chainId,
        uint256 amount,
        uint256 price
    );

    event OrderExecuted(
        bytes32 indexed orderId,
        address indexed user,
        address indexed buyer,
        uint256 amount,
        uint256 platformFee
    );

    event OrderCancelled(
        bytes32 indexed orderId,
        address indexed user,
        address indexed tradingAccount
    );

    event OrderBlacklisted(
        bytes32 indexed orderId,
        address indexed user
    );

    event ChainAdded(
        uint256 indexed chainId,
        string chainName,
        address factoryAddress
    );

    event ChainRemoved(
        uint256 indexed chainId
    );

    event PlatformFeeSet(
        uint256 newFee
    );

    event FeesWithdrawn(
        uint256 amount,
        address indexed to
    );

    // Functions
    function createTradingAccount(address user) external returns (address account);

    function createOrder(
        bytes32 tokenAddress,
        uint256 chainId,
        uint256 amount,
        uint256 price,
        bool useLivePrice,
        uint256 expirationHours,
        bytes32 nickname
    ) external returns (bytes32 orderId);

    function executeOrder(bytes32 orderId, address buyer, uint256 amount) external;

    function cancelOrder(bytes32 orderId) external;

    function blacklistOrder(bytes32 orderId) external;

    function addSupportedChain(uint256 chainId, string calldata chainName, address factoryAddress) external;

    function removeSupportedChain(uint256 chainId) external;

    function setPlatformFee(uint256 newFee) external;

    function withdrawFees() external;

    function getFactoryData() external view returns (FactoryData memory);

    function getTradingAccount(address user) external view returns (address account);

    function getAccountInfo(address user) external view returns (AccountInfo memory);

    function getOrderInfo(bytes32 orderId) external view returns (OrderInfo memory);

    function getAccountReputation(address user) external view returns (uint256 reputation);

    function getSupportedChains() external view returns (SupportedChain[] memory);

    function getSupportedChain(uint256 chainId) external view returns (SupportedChain memory);

    function getPlatformFee() external view returns (uint256 fee);

    function getTotalFees() external view returns (uint256 fees);

    function owner() external view returns (address);
}
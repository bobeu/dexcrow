// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

import { ICommon } from "./ICommon.sol";

/**
 * @title ITradeFactory
 * @dev Interface for the trade factory contract
 * @author TradeVerse Team
 */
interface ITradeFactory is ICommon {
    enum FeeType {
        PLATFORM,
        CREATION
    }

    enum OrderStatus {
        ACTIVE,
        INACTIVE
    }

    // Structs
    // struct AccountInfo {
    //     address user;
    //     address tradingAccount;
    //     uint256 reputation;
    //     uint256 totalOrders;
    //     uint256 successfulOrders;
    //     uint256 cancelledOrders;
    //     uint256 createdAt;
    // }
    // Structs

    struct AccountInfo {
        address user;
        address tradingAccount;
        uint256 createdAt;
    }

    struct Index {
        uint index;
        bool hasIndex;
    }

    // struct OrderInfo {
    //     bytes32 orderId;
    //     address user;
    //     address tradingAccount;
    //     address order;
    //     bytes32 tokenAddress;
    //     uint256 amount;
    //     uint256 price;
    //     bool useLivePrice;
    //     uint256 createdAt;
    //     uint8 status;
    // }

    struct FactoryData {
        address owner;
        uint256 platformFee;
        uint256 totalFees;
        uint256 totalAccounts;
        AccountInfo[] accounts;
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

    // event OrderCreated(
    //     bytes32 indexed orderId,
    //     address indexed user,
    //     address indexed tradingAccount,
    //     address order,
    //     bytes32 tokenAddress,
    //     uint256 chainId,
    //     uint256 amount,
    //     uint256 price
    // );

    // event OrderExecuted(
    //     bytes32 indexed orderId,
    //     address indexed user,
    //     address indexed buyer,
    //     uint256 amount,
    //     uint256 platformFee
    // );

    // event OrderCancelled(
    //     bytes32 indexed orderId,
    //     address indexed user,
    //     address indexed tradingAccount
    // );

    // event OrderBlacklisted(
    //     bytes32 indexed orderId,
    //     address indexed user
    // );

    // event ChainAdded(
    //     uint256 indexed chainId,
    //     string chainName,
    //     address factoryAddress
    // );

    // event ChainRemoved(
    //     uint256 indexed chainId
    // );

    event FeeSet(
        uint256 newFee,
        FeeType feeType
    );

    event FeesWithdrawn(
        uint256 amount,
        address indexed to
    );

    // Functions
    function createTradingAccount(address user) external returns (address account);

    // function createOrder(
    //     address seller,
    //     bytes32 tokenAddress,
    //     uint256 amount,
    //     uint256 price,
    //     uint256 expirationHours,
    //     bytes32 nickname
    // ) external payable returns (bytes32 orderId);

    // function executeOrder(bytes32 orderId, address buyer, uint256 amount) external;

    // function cancelOrder(bytes32 orderId) external;

    // function blacklistOrder(bytes32 orderId) external;

    // function addSupportedChain(uint256 chainId, string calldata chainName, address factoryAddress) external;

    // function removeSupportedChain(uint256 chainId) external;

    // function setPlatformFee(uint256 newFee) external;

    // function setCreationFee(uint256 newFee) external;

    // function withdrawFees() external;

    // function getFactoryData() external view returns (FactoryData memory);

    // function getTradingAccount(address user) external view returns (address account);
    function getAccountInfo(address user) external view returns (AccountInfo memory);
    function getVariables() external view returns(FactoryVariables memory _fvs);

    // function getOrderInfo(bytes32 orderId) external view returns (OrderInfo memory);

    // function getAccountReputation(address user) external view returns (uint256 reputation);

    // function getSupportedChains() external view returns (SupportedChain[] memory);

    // function getSupportedChain(uint256 chainId) external view returns (SupportedChain memory);

    // function getPlatformFee() external view returns (uint256 fee);

    // function getTotalFees() external view returns (uint256 fees);

    // function owner() external view returns (address);
}
// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

import {ITradeFactory} from "../interfaces/ITradeFactory.sol";
import {ITradingAccount} from "../interfaces/ITradingAccount.sol";
import {IOrder} from "../interfaces/IOrder.sol";
import {TradingAccount} from "./TradingAccount.sol";
import {Order} from "./Order.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * @title TradeFactory
 * @dev Factory contract for managing trading accounts and orders
 * @author TradeVerse Team
 */
contract TradeFactory is ITradeFactory, ReentrancyGuard, Pausable {
    using SafeERC20 for IERC20;

    // ============ CUSTOM ERRORS ============
    error InvalidOwner();
    error AccountAlreadyExists();
    error AccountNotFound();
    error OrderNotFound();
    error OrderNotActive();
    error InvalidAmount();
    error InvalidFee();
    error UnsupportedChain();
    error TransferFailed();
    error OnlyAuthorized();

    // ============ STATE VARIABLES ============

    /**
     * @dev Address of the contract owner
     */
    address private immutable _owner;

    /**
     * @dev Mapping of user addresses to their trading accounts
     */
    mapping(address => address) private _tradingAccounts;

    /**
     * @dev Mapping of order IDs to order information
     */
    mapping(bytes32 => OrderInfo) private _orders;

    /**
     * @dev Mapping of user addresses to account information
     */
    mapping(address => AccountInfo) private _accounts;

    /**
     * @dev Array of supported chains
     */
    SupportedChain[] private _supportedChains;

    /**
     * @dev Mapping of chain IDs to supported chain information
     */
    mapping(uint256 => SupportedChain) private _chainInfo;

    /**
     * @dev Platform fee percentage (in basis points)
     */
    uint256 private _platformFee = 50; // 0.5%

    /**
     * @dev Total fees collected
     */
    uint256 private _totalFees;

    /**
     * @dev Fee denominator for calculations
     */
    uint256 private constant FEE_DENOMINATOR = 10000;

    /**
     * @dev Maximum platform fee (5%)
     */
    uint256 private constant MAX_PLATFORM_FEE = 500;

    // ============ MODIFIERS ============

    /**
     * @dev Restricts function access to only the owner
     */
    modifier onlyOwner() {
        if (msg.sender != _owner) revert InvalidOwner();
        _;
    }

    /**
     * @dev Ensures account exists
     */
    modifier accountExists(address user) {
        if (_tradingAccounts[user] == address(0)) revert AccountNotFound();
        _;
    }

    /**
     * @dev Ensures chain is supported
     */
    modifier chainSupported(uint256 chainId) {
        if (!_chainInfo[chainId].isActive) revert UnsupportedChain();
        _;
    }

    // ============ CONSTRUCTOR ============

    /**
     * @dev Constructor to initialize the trade factory
     */
    constructor() {
        _owner = msg.sender;
        
        // Initialize with default supported chains
        _supportedChains.push(SupportedChain({
            chainId: 1,
            chainName: "Ethereum",
            isActive: true,
            factoryAddress: address(0)
        }));
        _chainInfo[1] = _supportedChains[_supportedChains.length - 1];

        _supportedChains.push(SupportedChain({
            chainId: 137,
            chainName: "Polygon",
            isActive: true,
            factoryAddress: address(0)
        }));
        _chainInfo[137] = _supportedChains[_supportedChains.length - 1];
    }

    // ============ EXTERNAL FUNCTIONS ============

    /**
     * @dev Create a new trading account for a user
     * @param user Address of the user
     * @return account Address of the created trading account
     */
    function createTradingAccount(address user) external override nonReentrant whenNotPaused returns (address account) {
        if (user == address(0)) revert InvalidOwner();
        if (_tradingAccounts[user] != address(0)) revert AccountAlreadyExists();

        // Deploy new trading account
        account = address(new TradingAccount(user, address(this)));
        _tradingAccounts[user] = account;

        // Initialize account info
        _accounts[user] = AccountInfo({
            user: user,
            tradingAccount: account,
            reputation: 0,
            totalOrders: 0,
            successfulOrders: 0,
            cancelledOrders: 0,
            createdAt: block.timestamp
        });

        emit AccountCreated(user, account, block.timestamp);
    }

    /**
     * @dev Create a new order
     * @param tokenAddress Token address
     * @param chainId Chain ID
     * @param amount Amount to trade
     * @param price Price per token
     * @param useLivePrice Whether to use live price
     * @param expirationHours Hours until expiration
     * @param nickname User nickname
     * @return orderId Unique order identifier
     */
    function createOrder(
        bytes32 tokenAddress,
        uint256 chainId,
        uint256 amount,
        uint256 price,
        bool useLivePrice,
        uint256 expirationHours,
        bytes32 nickname
    ) external override nonReentrant whenNotPaused chainSupported(chainId) returns (bytes32 orderId) {
        if (amount == 0) revert InvalidAmount();
        if (price == 0) revert InvalidAmount();

        address user = msg.sender;
        if (_tradingAccounts[user] == address(0)) revert AccountNotFound();

        // Create order through trading account
        TradingAccount tradingAccount = TradingAccount(_tradingAccounts[user]);
        (address order, bytes32 orderId_) = tradingAccount.createOrder(
            tokenAddress,
            chainId,
            amount,
            price,
            useLivePrice,
            expirationHours,
            nickname
        );

        orderId = orderId_;

        // Store order info
        _orders[orderId] = OrderInfo({
            orderId: orderId,
            user: user,
            tradingAccount: address(tradingAccount),
            order: order,
            tokenAddress: tokenAddress,
            chainId: chainId,
            amount: amount,
            price: price,
            useLivePrice: useLivePrice,
            createdAt: block.timestamp,
            status: uint8(IOrder.OrderStatus.ACTIVE)
        });

        // Update account stats
        _accounts[user].totalOrders++;

        emit OrderCreated(orderId, user, address(tradingAccount), order, tokenAddress, chainId, amount, price);
    }

    /**
     * @dev Execute an order
     * @param orderId ID of the order to execute
     * @param buyer Address of the buyer
     * @param amount Amount being traded
     */
    function executeOrder(bytes32 orderId, address buyer, uint256 amount) external override nonReentrant whenNotPaused {
        OrderInfo storage orderInfo = _orders[orderId];
        if (orderInfo.orderId == bytes32(0)) revert OrderNotFound();
        if (orderInfo.status != uint8(IOrder.OrderStatus.ACTIVE)) revert OrderNotActive();
        if (amount == 0) revert InvalidAmount();

        // Update order status
        orderInfo.status = uint8(IOrder.OrderStatus.FULFILLED);

        // Fulfill order through trading account
        TradingAccount tradingAccount = TradingAccount(orderInfo.tradingAccount);
        tradingAccount.fulfillOrder(orderId, buyer, amount);

        // Calculate and collect platform fee
        uint256 platformFee = (amount * _platformFee) / FEE_DENOMINATOR;
        _totalFees += platformFee;

        // Update account reputation
        _updateReputation(orderInfo.user, true);

        emit OrderExecuted(orderId, orderInfo.user, buyer, amount, platformFee);
    }

    /**
     * @dev Cancel an order
     * @param orderId ID of the order to cancel
     */
    function cancelOrder(bytes32 orderId) external override nonReentrant whenNotPaused {
        OrderInfo storage orderInfo = _orders[orderId];
        if (orderInfo.orderId == bytes32(0)) revert OrderNotFound();
        if (orderInfo.status != uint8(IOrder.OrderStatus.ACTIVE)) revert OrderNotActive();

        // Update order status
        orderInfo.status = uint8(IOrder.OrderStatus.CANCELLED);

        // Cancel order through trading account
        TradingAccount tradingAccount = TradingAccount(orderInfo.tradingAccount);
        tradingAccount.cancelOrder(orderId);

        // Update account stats
        _accounts[orderInfo.user].cancelledOrders++;

        // Update reputation (negative impact for cancellations)
        _updateReputation(orderInfo.user, false);

        emit OrderCancelled(orderId, orderInfo.user, orderInfo.tradingAccount);
    }

    /**
     * @dev Blacklist an order
     * @param orderId ID of the order to blacklist
     */
    function blacklistOrder(bytes32 orderId) external override onlyOwner {
        OrderInfo storage orderInfo = _orders[orderId];
        if (orderInfo.orderId == bytes32(0)) revert OrderNotFound();

        orderInfo.status = uint8(IOrder.OrderStatus.BLACKLISTED);

        emit OrderBlacklisted(orderId, orderInfo.user);
    }

    // ============ CHAIN MANAGEMENT ============

    /**
     * @dev Add a supported chain
     * @param chainId Chain ID
     * @param chainName Chain name
     * @param factoryAddress Factory address on the chain
     */
    function addSupportedChain(uint256 chainId, string calldata chainName, address factoryAddress) external override onlyOwner {
        if (_chainInfo[chainId].isActive) revert UnsupportedChain();

        _supportedChains.push(SupportedChain({
            chainId: chainId,
            chainName: chainName,
            isActive: true,
            factoryAddress: factoryAddress
        }));
        _chainInfo[chainId] = _supportedChains[_supportedChains.length - 1];

        emit ChainAdded(chainId, chainName, factoryAddress);
    }

    /**
     * @dev Remove a supported chain
     * @param chainId Chain ID to remove
     */
    function removeSupportedChain(uint256 chainId) external override onlyOwner {
        if (!_chainInfo[chainId].isActive) revert UnsupportedChain();

        _chainInfo[chainId].isActive = false;

        // Remove from array
        for (uint256 i = 0; i < _supportedChains.length; i++) {
            if (_supportedChains[i].chainId == chainId) {
                _supportedChains[i] = _supportedChains[_supportedChains.length - 1];
                _supportedChains.pop();
                break;
            }
        }

        emit ChainRemoved(chainId);
    }

    // ============ FEE MANAGEMENT ============

    /**
     * @dev Set platform fee
     * @param newFee New fee percentage (in basis points)
     */
    function setPlatformFee(uint256 newFee) external override onlyOwner {
        if (newFee > MAX_PLATFORM_FEE) revert InvalidFee();
        _platformFee = newFee;
        emit PlatformFeeSet(newFee);
    }

    /**
     * @dev Withdraw collected fees
     */
    function withdrawFees() external override onlyOwner {
        uint256 amount = _totalFees;
        if (amount == 0) revert InvalidAmount();

        _totalFees = 0;
        (bool success, ) = payable(_owner).call{value: amount}("");
        if (!success) revert TransferFailed();

        emit FeesWithdrawn(amount, _owner);
    }

    // ============ VIEW FUNCTIONS ============

    /**
     * @dev Get comprehensive factory data
     * @return factoryData Packed factory data
     */
    function getFactoryData() external view override returns (FactoryData memory factoryData) {
        factoryData = FactoryData({
            owner: _owner,
            platformFee: _platformFee,
            totalFees: _totalFees,
            supportedChainCount: _supportedChains.length,
            totalAccounts: 0 // Would need to track this separately
        });
    }

    /**
     * @dev Get trading account for a user
     * @param user User address
     * @return account Trading account address
     */
    function getTradingAccount(address user) external view override returns (address account) {
        account = _tradingAccounts[user];
    }

    /**
     * @dev Get account information
     * @param user User address
     * @return accountInfo Account information
     */
    function getAccountInfo(address user) external view override returns (AccountInfo memory accountInfo) {
        accountInfo = _accounts[user];
    }

    /**
     * @dev Get order information
     * @param orderId Order ID
     * @return orderInfo Order information
     */
    function getOrderInfo(bytes32 orderId) external view override returns (OrderInfo memory orderInfo) {
        orderInfo = _orders[orderId];
    }

    /**
     * @dev Get account reputation
     * @param user User address
     * @return reputation User reputation score
     */
    function getAccountReputation(address user) external view override returns (uint256 reputation) {
        reputation = _accounts[user].reputation;
    }

    /**
     * @dev Get all supported chains
     * @return chains Array of supported chains
     */
    function getSupportedChains() external view override returns (SupportedChain[] memory chains) {
        chains = _supportedChains;
    }

    /**
     * @dev Get supported chain by ID
     * @param chainId Chain ID
     * @return chain Supported chain information
     */
    function getSupportedChain(uint256 chainId) external view override returns (SupportedChain memory chain) {
        chain = _chainInfo[chainId];
    }

    /**
     * @dev Get platform fee
     * @return fee Platform fee percentage
     */
    function getPlatformFee() external view override returns (uint256 fee) {
        fee = _platformFee;
    }

    /**
     * @dev Get total fees collected
     * @return fees Total fees collected
     */
    function getTotalFees() external view override returns (uint256 fees) {
        fees = _totalFees;
    }

    /**
     * @dev Get owner address
     * @return owner_ Owner address
     */
    function owner() external view override returns (address owner_) {
        owner_ = _owner;
    }

    // ============ INTERNAL FUNCTIONS ============

    /**
     * @dev Update user reputation
     * @param user User address
     * @param isPositive Whether the action is positive or negative
     */
    function _updateReputation(address user, bool isPositive) internal {
        AccountInfo storage accountInfo = _accounts[user];
        
        if (isPositive) {
            // Positive reputation for successful orders
            accountInfo.reputation += 5;
            accountInfo.successfulOrders++;
        } else {
            // Negative reputation for cancelled orders
            if (accountInfo.reputation > 0) {
                accountInfo.reputation -= 1;
            }
        }
    }

    // ============ ADMIN FUNCTIONS ============

    /**
     * @dev Pause the contract
     */
    function pause() external onlyOwner {
        _pause();
    }

    /**
     * @dev Unpause the contract
     */
    function unpause() external onlyOwner {
        _unpause();
    }
}
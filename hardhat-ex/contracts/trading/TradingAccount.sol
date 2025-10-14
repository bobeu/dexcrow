// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

import {ITradingAccount} from "../interfaces/ITradingAccount.sol";
import {ITradeFactory} from "../interfaces/ITradeFactory.sol";
import {IOrder} from "../interfaces/IOrder.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * @title TradingAccount
 * @dev Individual trading account contract for each user
 * @author TradeVerse Team
 */
contract TradingAccount is ITradingAccount, ReentrancyGuard, Pausable {
    using SafeERC20 for IERC20;

    // ============ CUSTOM ERRORS ============
    error InvalidOwner();
    error InvalidFactory();
    error OnlyFactory();
    error NoWithdrawalRequest();
    error WithdrawalAlreadyProcessed();
    error CooldownNotPassed();
    error InvalidTokenAddress();
    error InsufficientBalance();
    error OrderNotFound();
    error OrderNotActive();
    error InvalidAmount();
    error InvalidExpiration();
    error TransferFailed();

    // ============ STATE VARIABLES ============

    /**
     * @dev Address of the trade factory contract
     */
    ITradeFactory private immutable _tradeFactory;

    /**
     * @dev Address of the account owner
     */
    address private immutable _owner;

    /**
     * @dev Mapping of order IDs to order details
     */
    mapping(bytes32 => OrderDetails) private _orders;

    /**
     * @dev Array of active order IDs
     */
    bytes32[] private _activeOrderIds;

    /**
     * @dev Mapping of token addresses to balances
     */
    mapping(address => uint256) private _balances;

    /**
     * @dev Mapping of token addresses to locked balances (in orders)
     */
    mapping(address => uint256) private _lockedBalances;

    /**
     * @dev Mapping of token addresses to withdrawal requests
     */
    mapping(address => WithdrawalRequest) private _withdrawalRequests;

    /**
     * @dev Cooldown period for withdrawals (in seconds)
     */
    uint256 private _cooldownPeriod = 15 minutes;

    /**
     * @dev Total number of orders created
     */
    uint256 private _totalOrders;

    /**
     * @dev Number of successful orders
     */
    uint256 private _successfulOrders;

    /**
     * @dev Number of cancelled orders
     */
    uint256 private _cancelledOrders;

    // ============ MODIFIERS ============

    /**
     * @dev Restricts function access to only the trade factory
     */
    modifier onlyFactory() {
        if (msg.sender != address(_tradeFactory)) revert OnlyFactory();
        _;
    }

    /**
     * @dev Ensures withdrawal request exists and is not processed
     */
    modifier hasWithdrawalRequest(address token) {
        if (_withdrawalRequests[token].amount == 0) revert NoWithdrawalRequest();
        if (_withdrawalRequests[token].isProcessed) revert WithdrawalAlreadyProcessed();
        _;
    }

    /**
     * @dev Ensures cooldown period has passed
     */
    modifier cooldownPassed(address token) {
        if (block.timestamp < _withdrawalRequests[token].cooldownEnd) revert CooldownNotPassed();
        _;
    }

    // ============ CONSTRUCTOR ============

    /**
     * @dev Constructor to initialize the trading account
     * @param owner_ Address of the account owner
     * @param tradeFactory_ Address of the trade factory contract
    */
    constructor(address owner_, address tradeFactory_) {
        if (owner_ == address(0)) revert InvalidOwner();
        if (tradeFactory_ == address(0)) revert InvalidFactory();

        _tradeFactory = ITradeFactory(tradeFactory_);
        _owner = owner_;
    }

    // ============ EXTERNAL FUNCTIONS ============

    /**
     * @dev Create a new trading order
     * @param tokenAddress Token address (as bytes32 for cross-chain compatibility)
     * @param chainId Chain ID where the token is domiciled
     * @param amount Amount of tokens to trade
     * @param price Price per token
     * @param useLivePrice Whether to use live price from Pyth oracle
     * @param expirationHours Hours until order expires
     * @param nickname User's nickname (as bytes32 for gas efficiency)
     * @return order Address of the created order contract
     * @return orderId Unique identifier for the order
     */
    function createOrder(
        bytes32 tokenAddress,
        uint256 chainId,
        uint256 amount,
        uint256 price,
        bool useLivePrice,
        uint256 expirationHours,
        bytes32 nickname
    ) external override nonReentrant whenNotPaused returns (address order, bytes32 orderId) {
        if (amount == 0) revert InvalidAmount();
        if (expirationHours == 0 || expirationHours > 168) revert InvalidExpiration(); // Max 1 week

        // Generate unique order ID
        orderId = keccak256(abi.encodePacked(
            block.timestamp,
            block.chainid,
            _owner,
            tokenAddress,
            amount,
            _totalOrders
        ));

        // Create order details
        OrderDetails memory orderDetails = OrderDetails({
            tokenAddress: tokenAddress,
            chainId: chainId,
            amount: amount,
            price: price,
            useLivePrice: useLivePrice,
            nickname: nickname,
            createdAt: block.timestamp,
            expiresAt: block.timestamp + (expirationHours * 1 hours),
            orderType: uint8(IOrder.OrderType.SELL), // Default to sell, can be changed later
            status: uint8(IOrder.OrderStatus.ACTIVE),
            reputation: 0 // Will be updated by factory
        });

        _orders[orderId] = orderDetails;
        _activeOrderIds.push(orderId);
        _totalOrders++;

        // Lock the balance for the order
        address tokenAddr = address(uint160(uint256(tokenAddress)));
        if (tokenAddr != address(0)) {
            _lockedBalances[tokenAddr] += amount;
        }

        // Deploy order contract (simplified for gas optimization)
        // In a real implementation, this would deploy a new Order contract
        order = address(0); // Placeholder

        emit OrderCreated(orderId, tokenAddress, chainId, amount, price, useLivePrice, nickname);
    }

    /**
     * @dev Cancel an existing order
     * @param orderId ID of the order to cancel
     */
    function cancelOrder(bytes32 orderId) external override nonReentrant whenNotPaused {
        OrderDetails storage orderDetails = _orders[orderId];
        if (orderDetails.amount == 0) revert OrderNotFound();
        if (orderDetails.status != uint8(IOrder.OrderStatus.ACTIVE)) revert OrderNotActive();

        orderDetails.status = uint8(IOrder.OrderStatus.CANCELLED);
        _cancelledOrders++;

        // Unlock the balance
        address tokenAddr = address(uint160(uint256(orderDetails.tokenAddress)));
        if (tokenAddr != address(0)) {
            _lockedBalances[tokenAddr] -= orderDetails.amount;
        }

        // Remove from active orders
        for (uint256 i = 0; i < _activeOrderIds.length; i++) {
            if (_activeOrderIds[i] == orderId) {
                _activeOrderIds[i] = _activeOrderIds[_activeOrderIds.length - 1];
                _activeOrderIds.pop();
                break;
            }
        }

        emit OrderCancelled(orderId, orderDetails.tokenAddress, orderDetails.amount);
    }

    /**
     * @dev Deposit tokens into the trading account
     * @param token Token address (address(0) for native ETH)
     * @param amount Amount to deposit
     */
    function deposit(address token, uint256 amount) external payable override nonReentrant whenNotPaused {
        if (amount == 0) revert InvalidAmount();

        if (token == address(0)) {
            // Native ETH deposit
            if (msg.value != amount) revert InvalidAmount();
            _balances[address(0)] += amount;
        } else {
            // ERC20 token deposit
            if (msg.value != 0) revert InvalidAmount();
            IERC20(token).safeTransferFrom(msg.sender, address(this), amount);
            _balances[token] += amount;
        }

        emit AssetDeposited(token, amount, _balances[token]);
    }

    /**
     * @dev Request withdrawal of tokens
     * @param token Token address to withdraw
     * @param amount Amount to withdraw
     */
    function requestWithdrawal(address token, uint256 amount) external override nonReentrant whenNotPaused {
        if (amount == 0) revert InvalidAmount();
        if (_balances[token] < amount) revert InsufficientBalance();

        _withdrawalRequests[token] = WithdrawalRequest({
            amount: amount,
            requestedAt: block.timestamp,
            cooldownEnd: block.timestamp + _cooldownPeriod,
            isProcessed: false
        });

        emit WithdrawalRequested(token, amount, block.timestamp + _cooldownPeriod);
    }

    /**
     * @dev Process withdrawal after cooldown period
     * @param token Token address to withdraw
     */
    function processWithdrawal(address token) external override nonReentrant whenNotPaused 
        hasWithdrawalRequest(token) cooldownPassed(token) {
        
        WithdrawalRequest storage request = _withdrawalRequests[token];
        request.isProcessed = true;
        _balances[token] -= request.amount;

        if (token == address(0)) {
            // Native ETH withdrawal
            (bool success, ) = payable(_owner).call{value: request.amount}("");
            if (!success) revert TransferFailed();
        } else {
            // ERC20 token withdrawal
            IERC20(token).safeTransfer(_owner, request.amount);
        }

        emit AssetWithdrawn(token, request.amount, _balances[token]);
    }

    /**
     * @dev Set cooldown period for withdrawals
     * @param newCooldownPeriod New cooldown period in seconds
     */
    function setCooldownPeriod(uint256 newCooldownPeriod) external override {
        if (msg.sender != _owner) revert InvalidOwner();
        _cooldownPeriod = newCooldownPeriod;
        emit CooldownPeriodSet(newCooldownPeriod);
    }

    // ============ FACTORY FUNCTIONS ============

    /**
     * @dev Fulfill an order (called by factory)
     * @param orderId ID of the order to fulfill
     * @param buyer Address of the buyer
     * @param amount Amount being traded
     */
    function fulfillOrder(bytes32 orderId, address buyer, uint256 amount) external override onlyFactory {
        OrderDetails storage orderDetails = _orders[orderId];
        if (orderDetails.amount == 0) revert OrderNotFound();
        if (orderDetails.status != uint8(IOrder.OrderStatus.ACTIVE)) revert OrderNotActive();

        orderDetails.status = uint8(IOrder.OrderStatus.FULFILLED);
        _successfulOrders++;

        // Unlock the balance
        address tokenAddr = address(uint160(uint256(orderDetails.tokenAddress)));
        if (tokenAddr != address(0)) {
            _lockedBalances[tokenAddr] -= amount;
        }

        // Remove from active orders
        for (uint256 i = 0; i < _activeOrderIds.length; i++) {
            if (_activeOrderIds[i] == orderId) {
                _activeOrderIds[i] = _activeOrderIds[_activeOrderIds.length - 1];
                _activeOrderIds.pop();
                break;
            }
        }

        emit OrderFulfilled(orderId, buyer, amount);
    }

    /**
     * @dev Update reputation (called by factory)
     * @param orderId ID of the order
     * @param reputation New reputation value
     */
    function updateReputation(bytes32 orderId, uint256 reputation) external override onlyFactory {
        OrderDetails storage orderDetails = _orders[orderId];
        if (orderDetails.amount == 0) revert OrderNotFound();
        
        orderDetails.reputation = reputation;
    }

    // ============ VIEW FUNCTIONS ============

    /**
     * @dev Get comprehensive account information
     * @return accountData Packed account data
     */
    function getAccountData() external view override returns (AccountData memory accountData) {
        accountData = AccountData({
            owner: _owner,
            tradeFactory: address(_tradeFactory),
            totalOrders: _totalOrders,
            successfulOrders: _successfulOrders,
            cancelledOrders: _cancelledOrders,
            cooldownPeriod: _cooldownPeriod,
            activeOrderCount: _activeOrderIds.length
        });
    }

    /**
     * @dev Get order details
     * @param orderId ID of the order
     * @return orderDetails Order details
     */
    function getOrder(bytes32 orderId) external view override returns (OrderDetails memory orderDetails) {
        orderDetails = _orders[orderId];
    }

    /**
     * @dev Get all active order IDs
     * @return orderIds Array of active order IDs
     */
    function getActiveOrderIds() external view override returns (bytes32[] memory orderIds) {
        orderIds = _activeOrderIds;
    }

    /**
     * @dev Get balance for a specific token
     * @param token Token address
     * @return balance Token balance
     */
    function getBalance(address token) external view override returns (uint256 balance) {
        balance = _balances[token];
    }

    /**
     * @dev Get locked balance for a specific token
     * @param token Token address
     * @return lockedBalance Locked token balance
     */
    function getLockedBalance(address token) external view override returns (uint256 lockedBalance) {
        lockedBalance = _lockedBalances[token];
    }

    /**
     * @dev Get withdrawal request for a specific token
     * @param token Token address
     * @return request Withdrawal request details
     */
    function getWithdrawalRequest(address token) external view override returns (WithdrawalRequest memory request) {
        request = _withdrawalRequests[token];
    }

    /**
     * @dev Get owner address
     * @return owner_ Account owner address
     */
    function owner() external view override returns (address owner_) {
        owner_ = _owner;
    }

    /**
     * @dev Get trade factory address
     * @return factory_ Trade factory address
     */
    function tradeFactory() external view override returns (address factory_) {
        factory_ = address(_tradeFactory);
    }

    /**
     * @dev Get cooldown period
     * @return cooldownPeriod_ Cooldown period in seconds
     */
    function cooldownPeriod() external view override returns (uint256 cooldownPeriod_) {
        cooldownPeriod_ = _cooldownPeriod;
    }

    /**
     * @dev Get total orders count
     * @return totalOrders_ Total number of orders
     */
    function totalOrders() external view override returns (uint256 totalOrders_) {
        totalOrders_ = _totalOrders;
    }

    /**
     * @dev Get successful orders count
     * @return successfulOrders_ Number of successful orders
     */
    function successfulOrders() external view override returns (uint256 successfulOrders_) {
        successfulOrders_ = _successfulOrders;
    }

    /**
     * @dev Get cancelled orders count
     * @return cancelledOrders_ Number of cancelled orders
     */
    function cancelledOrders() external view override returns (uint256 cancelledOrders_) {
        cancelledOrders_ = _cancelledOrders;
    }

    // ============ ADMIN FUNCTIONS ============

    /**
     * @dev Pause the contract
     */
    function pause() external {
        if (msg.sender != _owner) revert InvalidOwner();
        _pause();
    }

    /**
     * @dev Unpause the contract
     */
    function unpause() external {
        if (msg.sender != _owner) revert InvalidOwner();
        _unpause();
    }

    /**
     * @dev Emergency withdraw (only owner)
     * @param token Token address to withdraw
     * @param amount Amount to withdraw
     */
    function emergencyWithdraw(address token, uint256 amount) external {
        if (msg.sender != _owner) revert InvalidOwner();
        if (amount == 0) revert InvalidAmount();
        if (_balances[token] < amount) revert InsufficientBalance();

        _balances[token] -= amount;

        if (token == address(0)) {
            (bool success, ) = payable(_owner).call{value: amount}("");
            if (!success) revert TransferFailed();
        } else {
            IERC20(token).safeTransfer(_owner, amount);
        }
    }
}
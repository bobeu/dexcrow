// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

import { IOrder } from "../../interfaces/IOrder.sol";
import { ITradingAccount } from "../../interfaces/ITradingAccount.sol";
import { ITradeFactory } from "../../interfaces/ITradeFactory.sol";
import { ReentrancyGuard } from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import { Pausable } from "@openzeppelin/contracts/utils/Pausable.sol";
import { SafeERC20 } from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * @title Order
 * @dev Individual trading order contract that represents a buy or sell order
 * @author TradeVerse Team
 */
contract Order is IOrder, ReentrancyGuard, Pausable {
    using SafeERC20 for IERC20;

    // ============ CUSTOM ERRORS ============
    error InvalidTradingAccount();
    error InvalidTradeFactory();
    error OrderNotActive();
    error OrderExpired();
    error InvalidAmount();
    error TransferFailed();
    error OnlyTradingAccount();
    error OnlyFactory();
    error OrderAlreadyFulfilled();
    error OrderAlreadyCancelled();
    error InsufficientBalanceToFulfilOrder();

    // ============ STATE VARIABLES ============

    /**
     * @dev Order data structure containing all order information
     */
    OrderData private _orderData;

    /**
     * @dev Reference to the trading account that created this order
     */
    ITradingAccount private immutable _tradingAccount;

    /**
     * @dev Reference to the trade factory contract
     */
    ITradeFactory private immutable _tradeFactory;

    /**
     * @dev Order ID generated from order data hash
     */
    bytes32 private immutable _orderId;

    /**
     * @dev Pyth price feed ID for live price updates (if applicable i.e if user prefer to use live price field)
     */
    bytes32 private immutable _pythPriceFeedId;

    // ============ MODIFIERS ============

    /**
     * @dev Ensures order is active
     */
    modifier onlyActive() {
        if (_orderData.status != OrderStatus.ACTIVE) revert OrderNotActive();
        if (_now() > _orderData.expiresAt) revert OrderExpired();
        _;
    }

    /**
     * @dev Restricts function access to only the trading account
     */
    modifier onlyTradingAccount() {
        if (_msgSender() != address(_tradingAccount)) revert OnlyTradingAccount();
        _;
    }

    /**
     * @dev Restricts function access to only the trade factory
     */
    modifier onlyFactory() {
        if (_msgSender() != address(_tradeFactory)) revert OnlyFactory();
        _;
    }

    // ============ CONSTRUCTOR ============

    /**
     * @dev Constructor to initialize the order
     * @param orderData_ Order data structure
     * @param tradingAccount_ Address of the trading account
     * @param tradeFactory_ Address of the trade factory
     * @param pythPriceFeedId_ Pyth price feed ID
     */
    constructor(
        OrderData memory orderData_,
        address tradingAccount_,
        address tradeFactory_,
        bytes32 pythPriceFeedId_
    ) {
        if (tradingAccount_ == address(0)) revert InvalidTradingAccount();
        if (tradeFactory_ == address(0)) revert InvalidTradeFactory();
        if (orderData_.amount == 0) revert InvalidAmount();

        _orderData = orderData_;
        _tradingAccount = ITradingAccount(tradingAccount_);
        _tradeFactory = ITradeFactory(tradeFactory_);
        _pythPriceFeedId = pythPriceFeedId_;

        // Generate order ID
        _orderId = keccak256(abi.encodePacked(
            _now(),
            block.chainid,
            tradingAccount_,
            orderData_.tokenAddress,
            orderData_.amount,
            orderData_.price
        ));
    }

    // ============ EXTERNAL FUNCTIONS ============

    /**
     * @dev Fulfill the order
     * @param buyer Address of the buyer
     * @param amount Amount being traded
     */
    function fulfillOrder(address buyer, uint256 amount) external override nonReentrant whenNotPaused onlyActive {
        if (amount == 0) revert InvalidAmount();
        if (amount > _orderData.amount) revert InvalidAmount();

        // Update order status
        _orderData.status = OrderStatus.FULFILLED;

        // Transfer tokens based on order type
        if (_orderData.orderType == OrderType.BUY) {
            _handleBuyOrder(buyer, amount);
        } else {
            _handleSellOrder(buyer, amount);
        }

        emit OrderFulfilled(_orderId, buyer, amount, _now());
    }

    /**
     * @dev Cancel the order
     */
    function cancelOrder() external override nonReentrant whenNotPaused onlyTradingAccount {
        if (_orderData.status != OrderStatus.ACTIVE) revert OrderNotActive();

        _orderData.status = OrderStatus.CANCELLED;

        emit OrderCancelled(_orderId, _orderData.amount, _now());
    }

    /**
     * @dev Update order price
     * @param newPrice New price per token
     */
    function updatePrice(uint256 newPrice) external override onlyTradingAccount {
        if (newPrice == 0) revert InvalidAmount();
        if (_orderData.status != OrderStatus.ACTIVE) revert OrderNotActive();

        _orderData.price = newPrice;

        emit OrderPriceUpdated(_orderId, newPrice, _now());
    }

    /**
     * @dev Blacklist the order
     */
    function blacklistOrder() external override onlyFactory {
        _orderData.status = OrderStatus.BLACKLISTED;

        emit OrderBlacklisted(_orderId, _now());
    }

    // ============ INTERNAL FUNCTIONS ============

    // Get the current block time stamp
    function _now() internal view returns(uint currentTime){
        currentTime = block.timestamp;
    }

    /**
     * @dev Handle buy order fulfillment
     * @param buyer Address of the buyer
     * @param amount Amount being traded
     */
    function _handleBuyOrder(address buyer, uint256 amount) internal {
        // For buy orders, the buyer sends tokens to the seller
        // This is a simplified implementation
        // In a real implementation, this would handle token transfers
        
        // Calculate total cost
        uint256 totalCost = amount * _orderData.price;
        
        // Transfer payment from buyer to seller
        if (_orderData.tokenAddress == bytes32(uint256(uint160(address(0))))) {
            // Native ETH transfer
            if(address(this).balance < totalCost) revert InsufficientBalanceToFulfilOrder();
            (bool success, ) = payable(_tradingAccount.owner()).call{value: totalCost}("");
            if (!success) revert TransferFailed();
            
        } else {
            // ERC20 token transfer
            address tokenAddr = address(uint160(uint256(_orderData.tokenAddress)));
            IERC20(tokenAddr).safeTransferFrom(buyer, _tradingAccount.owner(), totalCost);
        }
    }

    /**
     * @dev Handle sell order fulfillment
     * @param buyer Address of the buyer
     * @param amount Amount being traded
     */
    function _handleSellOrder(address buyer, uint256 amount) internal {
        // For sell orders, the seller sends tokens to the buyer
        // This is a simplified implementation
        // In a real implementation, this would handle token transfers
        
        // Calculate total cost
        uint256 totalCost = amount * _orderData.price;
        
        // Transfer payment from buyer to seller
        if (_orderData.tokenAddress == bytes32(uint256(uint160(address(0))))) {
            // Native ETH transfer
            (bool success, ) = payable(_tradingAccount.owner()).call{value: totalCost}("");
            if (!success) revert TransferFailed();
        } else {
            // ERC20 token transfer
            address tokenAddr = address(uint160(uint256(_orderData.tokenAddress)));
            IERC20(tokenAddr).safeTransferFrom(buyer, _tradingAccount.owner(), totalCost);
        }
    }

    // ============ VIEW FUNCTIONS ============

    /**
     * @dev Get comprehensive order data
     * @return orderData_ Complete order data
     */
    function getOrderData() external view override returns (OrderData memory orderData_) {
        orderData_ = _orderData;
    }

    /**
     * @dev Get order ID
     * @return orderId_ Order ID
     */
    function getOrderId() external view override returns (bytes32 orderId_) {
        orderId_ = _orderId;
    }

    /**
     * @dev Get order status
     * @return status Order status
     */
    function getStatus() external view override returns (OrderStatus status) {
        status = _orderData.status;
    }

    /**
     * @dev Get order type
     * @return orderType Order type
     */
    function getOrderType() external view override returns (OrderType orderType) {
        orderType = _orderData.orderType;
    }

    /**
     * @dev Get order amount
     * @return amount Order amount
     */
    function getAmount() external view override returns (uint256 amount) {
        amount = _orderData.amount;
    }

    /**
     * @dev Get order price
     * @return price Order price
     */
    function getPrice() external view override returns (uint256 price) {
        price = _orderData.price;
    }

    /**
     * @dev Get order token address
     * @return tokenAddress Token address
     */
    function getTokenAddress() external view override returns (bytes32 tokenAddress) {
        tokenAddress = _orderData.tokenAddress;
    }

    /**
     * @dev Get order chain ID
     * @return chainId Chain ID
     */
    function getChainId() external view override returns (uint256 chainId) {
        chainId = _orderData.chainId;
    }

    /**
     * @dev Get order expiration time
     * @return expiresAt Expiration timestamp
     */
    function getExpiresAt() external view override returns (uint256 expiresAt) {
        expiresAt = _orderData.expiresAt;
    }

    /**
     * @dev Get order creation time
     * @return createdAt Creation timestamp
     */
    function getCreatedAt() external view override returns (uint256 createdAt) {
        createdAt = _orderData.createdAt;
    }

    /**
     * @dev Get order nickname
     * @return nickname User nickname
     */
    function getNickname() external view override returns (bytes32 nickname) {
        nickname = _orderData.nickname;
    }

    /**
     * @dev Get order reputation
     * @return reputation Order reputation
     */
    function getReputation() external view override returns (uint256 reputation) {
        reputation = _orderData.reputation;
    }

    /**
     * @dev Get trading account address
     * @return tradingAccount_ Trading account address
     */
    function getTradingAccount() external view override returns (address tradingAccount_) {
        tradingAccount_ = address(_tradingAccount);
    }

    /**
     * @dev Get trade factory address
     * @return tradeFactory_ Trade factory address
     */
    function getTradeFactory() external view override returns (address tradeFactory_) {
        tradeFactory_ = address(_tradeFactory);
    }

    /**
     * @dev Get Pyth price feed ID
     * @return pythPriceFeedId_ Pyth price feed ID
     */
    function getPythPriceFeedId() external view override returns (bytes32 pythPriceFeedId_) {
        pythPriceFeedId_ = _pythPriceFeedId;
    }

    /**
     * @dev Check if order is active
     * @return isActive_ Whether order is active
     */
    function isActive() external view override returns (bool isActive_) {
        isActive_ = _orderData.status == OrderStatus.ACTIVE && _now() <= _orderData.expiresAt;
    }

    /**
     * @dev Check if order is expired
     * @return isExpired_ Whether order is expired
     */
    function isExpired() external view override returns (bool isExpired_) {
        isExpired_ = _now() > _orderData.expiresAt;
    }

    // ============ ADMIN FUNCTIONS ============

    /**
     * @dev Pause the contract
     */
    function pause() external onlyTradingAccount {
        _pause();
    }

    /**
     * @dev Unpause the contract
     */
    function unpause() external onlyTradingAccount {
        _unpause();
    }
}
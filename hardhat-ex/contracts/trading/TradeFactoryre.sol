// SPDX-License-Identifier: MIT

pragma solidity 0.8.30;

// import { ITradingAccount } from "../interfaces/ITradingAccount.sol";
// import { Order } from "./Order.sol";
// import { Pausable } from "@openzeppelin/contracts/utils/Pausable.sol";
// import { SafeERC20 } from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
// import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";
import { ReentrancyGuard } from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import { ITradeFactory } from "../interfaces/ITradeFactory.sol";
import { TradingAccount } from "./TradingAccount.sol";
import { IOrder } from "../interfaces/IOrder.sol";
// import { Approved } from "../Approved.sol";

/**
 * @title TradeFactory
 * @dev Factory contract for managing trading accounts and orders
 * @author TradeVerse Team
 */
contract TradeFactory is ITradeFactory, ReentrancyGuard, Ownable {
    // using SafeERC20 for IERC20;

    // ============ CUSTOM ERRORS ============
    error InvalidOwner();
    error AccountAlreadyExists();
    error AccountNotFound();
    error OrderNotFound();
    error OrderNotActive();
    error InvalidAmount();
    error InvalidFee();
    error TransferFailed();
    error InvalidAccountOwner();
    error InvalidAgent();
    error InsufficientOrderDurationFee();

    // ============ STATE VARIABLES ============

    /**
     * @dev Mapping of user addresses to their trading accounts
     */
    mapping(address => address) private _tradingAccounts;

    // /**
    //  * @dev Mapping of order IDs to order information
    //  */
    // mapping(bytes32 => OrderInfo) private _orders;

    /**
     * @dev Mapping of user addresses to account information
     */
    // mapping(address => AccountInfo) private _accounts;

    AccountInfo[] private _account;

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

    /**
     * @dev Required fee for listing an order for some period of time
     */
    uint256 private creationFee;

    // ============ MODIFIERS ============

    // /**
    //  * @dev Ensures account exists
    //  */
    // modifier accountExists(address user) {
    //     if(_tradingAccounts[user] == address(0)) revert AccountNotFound();
    //     _;
    // }

    // ============ CONSTRUCTOR ============

    /**
     * @dev Constructor to initialize the trade factory
     */
    constructor() Approved(_msgSender(), _msgSender()) {
        creationFee = 1e15 wei; // 0.0015 ether per 24 hours
    }

    // ============ INTERNAL FUNCTIONS ============

    /**
     * @dev Create a new trading account for a seller - internal
     * @param seller Address of the seller
     * @param agent Seller's agent address
     * @return account Address of the created trading account
     */
    function _tryGetTradingAccount(address seller, address agent) internal returns(bool account) {
        if(seller == address(0)) revert InvalidOwner();
        if(_tradingAccounts[seller] == address(0)) {
            // Deploy new trading account
            account = address(new TradingAccount(seller, agent, address(this)));
            _tradingAccounts[seller] = account;
            uint currentTime = _now();

            // Initialize account info
            _accounts[seller] = AccountInfo({
                user: seller,
                tradingAccount: account,
                createdAt: currentTime
                // reputation: 0,
                // totalOrders: 0,
                // successfulOrders: 0,
                // cancelledOrders: 0,
            });

            emit AccountCreated(seller, account, currentTime);
        } else {
            account = _tradingAccounts[seller];
        }


    }

    // ============ EXTERNAL FUNCTIONS ============

    /**
     * @dev Create a new trading account for a user
     * @param user Address of the user
     * @return account Address of the created trading account
     * @notice Uses the msg.sender if the parsed address is empty otherwise defaults to user. This allows approved or external accounts
     * such as agent to act on behalf of another.
     */
    function createTradingAccount(address user) external override nonReentrant whenNotPaused returns (address account) {
        address seller = user == address(0)? _msgSender() : user;
        if(_tradingAccounts[seller] != address(0)) revert AccountAlreadyExists();
        return _tryGetTradingAccount(seller, _msgSender());
    }

    /**
     * @dev Create a new sell order
     * @param tokenAddress Token address
     * @param amount Amount to trade
     * @param price Price per token
     * @param expirationHours Hours until expiration
     * @param nickname User nickname
     * @return orderId Unique order identifier
    */
    function createOrder(
        address seller,
        bytes32 tokenAddress,
        uint256 amount,
        uint256 price,
        uint256 expirationHours,
        string memory nickname
    ) external payable nonReentrant whenNotPaused returns (bytes32 orderId) {
        TradingAccount tradingAccount = TradingAccount(_tryGetTradingAccount(seller == address(0)? _msgSender() : seller), _msgSender());
        (address owner_, bool isApprovedAgent) = tradingAccount.getOwnerAndApproved(_msgSender());
        if(seller != address(0)) {
            if(!isApprovedAgent) revert InvalidAgent();
            if(owner_ != seller) revert InvalidOwner();
        } else {
            if(owner_ != _msgSender()) revert InvalidOwner();
        }

        if(amount == 0) revert InvalidAmount();
        uint expiration = expirationHours * 1 hours;
        if(expirationHours == 0) {
            expiration = 24 hours;
        } else {
            if(expiration > 24) {
                if(msg.value < (creationFee * (expiration - 24))) {
                    revert InsufficientOrderDurationFee();
                }
            }
        }

        // Create order through trading account
        (address order, bytes32 orderId_) = tradingAccount.createOrder(
            tokenAddress,
            amount,
            price,
            price == 0, // If price is set to 0, it defaults to using live price data
            expirationHours,
            abi.encode(bytes(nickname))
        );

        orderId = orderId_;

        // Store order info
        _orders[orderId] = OrderInfo({
            orderId: orderId,
            user: owner_,
            tradingAccount: address(tradingAccount),
            order: order,
            tokenAddress: tokenAddress,
            amount: amount,
            price: price,
            useLivePrice: price == 0,
            createdAt: _now(),
            status: uint8(IOrder.OrderStatus.ACTIVE)
        });

        // Update account stats
        _accounts[owner_].totalOrders++;

        emit OrderCreated(orderId, owner_, address(tradingAccount), order, tokenAddress, amount, price);
    }

    /**
     * @dev Execute a buy order
     * @param orderId ID of the order to execute
     * @param buyer Address of the buyer
     * @param amount Amount being traded
     */
    function executeOrder(bytes32 orderId, address buyer, uint256 amount) external override nonReentrant whenNotPaused {
        OrderInfo storage orderInfo = _orders[orderId];
        if(orderInfo.orderId == bytes32(0)) revert OrderNotFound();
        if(orderInfo.status != uint8(IOrder.OrderStatus.ACTIVE)) revert OrderNotActive();
        if(amount == 0) revert InvalidAmount();

        // Update order status
        orderInfo.status = uint8(IOrder.OrderStatus.FULFILLED);

        // Fulfill order through trading account
        TradingAccount(orderInfo.tradingAccount);
        tradingAccount.fulfillOrder(orderId, buyer, amount);

        // Calculate and collect platform fee
        uint256 platformFee = (amount * _platformFee) / FEE_DENOMINATOR;
        _totalFees += platformFee;

        // Update account reputation
        _updateReputation(orderInfo.user, true, false);
        _updateReputation(buyer, true, true);

        emit OrderExecuted(orderId, orderInfo.user, buyer, amount, platformFee);
    }

    /**
     * @dev Cancel an order
     * @param orderId ID of the order to cancel
     * @param accountOwner Address of the account owner
     * @notice Only the seller or Approved Agent can cancel the order
     */
    function cancelOrder(bytes32 orderId, address accountOwner) external override nonReentrant whenNotPaused {
        OrderInfo storage orderInfo = _orders[orderId];
        require(orderInfo.user == _msgSender() || _isApproved(_msgSender()), "Not Authorized");
        if(orderInfo.orderId == bytes32(0)) revert OrderNotFound();
        if(orderInfo.status != uint8(IOrder.OrderStatus.ACTIVE)) revert OrderNotActive();
        if(accountOwner == address(0)) revert InvalidAccountOwner();

        // Update order status
        orderInfo.status = uint8(IOrder.OrderStatus.CANCELLED);

        // Cancel order through trading account
        TradingAccount(orderInfo.tradingAccount).cancelOrder(orderId);

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
    function blacklistOrder(bytes32 orderId) external override {
        require(orderInfo.user == _msgSender() || _isApproved(_msgSender()), "Not Authorized");
        OrderInfo storage orderInfo = _orders[orderId];
        if(orderInfo.orderId == bytes32(0)) revert OrderNotFound();

        orderInfo.status = uint8(IOrder.OrderStatus.BLACKLISTED);

        emit OrderBlacklisted(orderId, orderInfo.user);
    }

    // ============ FEE MANAGEMENT ============

    /**
     * @dev Set platform fee
     * @param newFee New fee percentage (in basis points)
     */
    function setPlatformFee(uint256 newFee) external override onlyOwner {
        if(newFee > MAX_PLATFORM_FEE) revert InvalidFee();
        _platformFee = newFee;
        emit FeeSet(newFee, FeeType.PLATFORM);
    }

    /**
     * @dev Set order creation fee
     * @param newFee New fee percentage (in basis points)
     */
    function setCreationFee(uint256 newFee) external override onlyOwner {
        creationFee = newFee;
        emit FeeSet(newFee, FeeType.CREATION);
    }

    /**
     * @dev Withdraw collected fees
     */
    function withdrawFees() external override onlyOwner {
        uint256 amount = _totalFees;
        if(amount == 0) revert InvalidAmount();

        _totalFees = 0;
        address _owner = owner();
        uint contractBal = address(this).balance;
        if(contractBal < amount || (amount == 0 && contractBal > amount)) amount = contractBal;
        (bool success, ) = payable(_owner).call{value: amount}("");
        if(!success) revert TransferFailed();

        emit FeesWithdrawn(amount, _owner);
    }

    // ============ VIEW FUNCTIONS ============

    // Get the current block time stamp
    function _now() internal view returns(uint currentTime) {
        currentTime = block.timestamp;
    }

    /**
     * @dev Get comprehensive factory data
     * @return factoryData Packed factory data
     */
    function getFactoryData() external view override returns (FactoryData memory factoryData) {
        factoryData = FactoryData({
            owner: owner(),
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
        return account;
    }

    /**
     * @dev Get account information
     * @param user User address
     * @return accountInfo Account information
     */
    function getAccountInfo(address user) external view override returns (AccountInfo memory accountInfo) {
        accountInfo = _accounts[user];
        return accountInfo;
    }

    /**
     * @dev Get order information
     * @param orderId Order ID
     * @return orderInfo Order information
     */
    function getOrderInfo(bytes32 orderId) external view override returns (OrderInfo memory orderInfo) {
        orderInfo = _orders[orderId];
        return orderInfo;
    }

    /**
     * @dev Get account reputation
     * @param user User address
     * @return reputation User reputation score
     */
    function getAccountReputation(address user) external view override returns (uint256 reputation) {
        reputation = _accounts[user].reputation;
        return reputation;
    }

    // ============ INTERNAL FUNCTIONS ============

    /**
     * @dev Update user reputation
     * @param user User address
     * @param isBuyer Whether the user is buyer or the seller
     * @param isPositive Whether the action is positive or negative
     */
    function _updateReputation(address user, bool isPositive, bool isBuyer) internal {
        AccountInfo storage accountInfo = _accounts[user];
        
        if(isPositive) {
            // Positive reputation for successful orders
            accountInfo.reputation += (isBuyer? 2 : 5);
            accountInfo.successfulOrders++;
        } else {
            // Negative reputation for cancelled orders
            if(accountInfo.reputation > 0) {
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
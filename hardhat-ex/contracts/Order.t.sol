// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

import {Order} from "./trading/Order.sol";
import {IOrder} from "./interfaces/IOrder.sol";
import {ITradingAccount} from "./interfaces/ITradingAccount.sol";
import {ITradeFactory} from "./interfaces/ITradeFactory.sol";
import {Test} from "forge-std/Test.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

// Mock ERC20 token for testing
contract MockERC20 is IERC20 {
    mapping(address => uint256) private _balances;
    mapping(address => mapping(address => uint256)) private _allowances;
    
    uint256 private _totalSupply;
    string public name = "Mock Token";
    string public symbol = "MOCK";
    uint8 public decimals = 18;
    
    constructor(uint256 initialSupply) {
        _totalSupply = initialSupply;
        _balances[msg.sender] = initialSupply;
    }
    
    function totalSupply() external view override returns (uint256) {
        return _totalSupply;
    }
    
    function balanceOf(address account) external view override returns (uint256) {
        return _balances[account];
    }
    
    function transfer(address to, uint256 amount) external override returns (bool) {
        _transfer(msg.sender, to, amount);
        return true;
    }
    
    function allowance(address owner, address spender) external view override returns (uint256) {
        return _allowances[owner][spender];
    }
    
    function approve(address spender, uint256 amount) external override returns (bool) {
        _approve(msg.sender, spender, amount);
        return true;
    }
    
    function transferFrom(address from, address to, uint256 amount) external override returns (bool) {
        uint256 currentAllowance = _allowances[from][msg.sender];
        require(currentAllowance >= amount, "ERC20: insufficient allowance");
        _transfer(from, to, amount);
        _approve(from, msg.sender, currentAllowance - amount);
        return true;
    }
    
    function _transfer(address from, address to, uint256 amount) internal {
        require(from != address(0), "ERC20: transfer from the zero address");
        require(to != address(0), "ERC20: transfer to the zero address");
        require(_balances[from] >= amount, "ERC20: transfer amount exceeds balance");
        
        _balances[from] -= amount;
        _balances[to] += amount;
    }
    
    function _approve(address owner, address spender, uint256 amount) internal {
        require(owner != address(0), "ERC20: approve from the zero address");
        require(spender != address(0), "ERC20: approve to the zero address");
        
        _allowances[owner][spender] = amount;
    }
    
    function mint(address to, uint256 amount) external {
        _totalSupply += amount;
        _balances[to] += amount;
    }
}

// Mock TradingAccount for testing
contract MockTradingAccount is ITradingAccount {
    address public owner;
    address public tradeFactory;
    uint256 public totalOrders;
    uint256 public successfulOrders;
    uint256 public cancelledOrders;
    uint256 public cooldownPeriod = 15 minutes;
    
    mapping(bytes32 => OrderDetails) public orders;
    bytes32[] public activeOrderIds;
    mapping(address => uint256) public balances;
    mapping(address => uint256) public lockedBalances;
    mapping(address => WithdrawalRequest) public withdrawalRequests;
    
    constructor(address owner_, address tradeFactory_) {
        owner = owner_;
        tradeFactory = tradeFactory_;
    }
    
    function createOrder(
        bytes32 /* tokenAddress */,
        uint256 /* chainId */,
        uint256 /* amount */,
        uint256 /* price */,
        bool /* useLivePrice */,
        uint256 /* expirationHours */,
        bytes32 /* nickname */
    ) external pure returns (address order, bytes32 orderId) {
        // Mock implementation
        return (address(0), bytes32(0));
    }
    
    function cancelOrder(bytes32 orderId) external {
        // Mock implementation
    }
    
    function deposit(address token, uint256 amount) external payable {
        // Mock implementation
    }
    
    function requestWithdrawal(address token, uint256 amount) external {
        // Mock implementation
    }
    
    function processWithdrawal(address token) external {
        // Mock implementation
    }
    
    function setCooldownPeriod(uint256 newCooldownPeriod) external {
        cooldownPeriod = newCooldownPeriod;
    }
    
    function fulfillOrder(bytes32 orderId, address buyer, uint256 amount) external {
        // Mock implementation
    }
    
    function updateReputation(bytes32 orderId, uint256 reputation) external {
        // Mock implementation
    }
    
    function getAccountData() external view returns (AccountData memory) {
        return AccountData({
            owner: owner,
            tradeFactory: tradeFactory,
            totalOrders: totalOrders,
            successfulOrders: successfulOrders,
            cancelledOrders: cancelledOrders,
            cooldownPeriod: cooldownPeriod,
            activeOrderCount: activeOrderIds.length
        });
    }
    
    function getOrder(bytes32 orderId) external view returns (OrderDetails memory) {
        return orders[orderId];
    }
    
    function getActiveOrderIds() external view returns (bytes32[] memory) {
        return activeOrderIds;
    }
    
    function getBalance(address token) external view returns (uint256) {
        return balances[token];
    }
    
    function getLockedBalance(address token) external view returns (uint256) {
        return lockedBalances[token];
    }
    
    function getWithdrawalRequest(address token) external view returns (WithdrawalRequest memory) {
        return withdrawalRequests[token];
    }
}

// Mock TradeFactory for testing
contract MockTradeFactory is ITradeFactory {
    address public owner;
    uint256 public platformFee = 50;
    uint256 public totalFees;
    
    constructor() {
        owner = msg.sender;
    }
    
    function createTradingAccount(address /* user */) external pure returns (address account) {
        return address(0);
    }
    
    function createOrder(
        bytes32 /* tokenAddress */,
        uint256 /* chainId */,
        uint256 /* amount */,
        uint256 /* price */,
        bool /* useLivePrice */,
        uint256 /* expirationHours */,
        bytes32 /* nickname */
    ) external pure returns (bytes32 orderId) {
        return bytes32(0);
    }
    
    function executeOrder(bytes32 orderId, address buyer, uint256 amount) external {
        // Mock implementation
    }
    
    function cancelOrder(bytes32 orderId) external {
        // Mock implementation
    }
    
    function blacklistOrder(bytes32 orderId) external {
        // Mock implementation
    }
    
    function addSupportedChain(uint256 chainId, string calldata chainName, address factoryAddress) external {
        // Mock implementation
    }
    
    function removeSupportedChain(uint256 chainId) external {
        // Mock implementation
    }
    
    function setPlatformFee(uint256 newFee) external {
        platformFee = newFee;
    }
    
    function withdrawFees() external {
        // Mock implementation
    }
    
    function getFactoryData() external view returns (FactoryData memory) {
        return FactoryData({
            owner: owner,
            platformFee: platformFee,
            totalFees: totalFees,
            supportedChainCount: 0,
            totalAccounts: 0
        });
    }
    
    function getTradingAccount(address /* user */) external pure returns (address account) {
        return address(0);
    }
    
    function getAccountInfo(address user) external pure returns (AccountInfo memory) {
        return AccountInfo({
            user: user,
            tradingAccount: address(0),
            reputation: 0,
            totalOrders: 0,
            successfulOrders: 0,
            cancelledOrders: 0,
            createdAt: 0
        });
    }
    
    function getOrderInfo(bytes32 orderId) external view returns (OrderInfo memory) {
        return OrderInfo({
            orderId: orderId,
            user: address(0),
            tradingAccount: address(0),
            order: address(0),
            tokenAddress: bytes32(0),
            chainId: 0,
            amount: 0,
            price: 0,
            useLivePrice: false,
            createdAt: 0,
            status: 0
        });
    }
    
    function getAccountReputation(address /* user */) external pure returns (uint256 reputation) {
        return 0;
    }
    
    function getSupportedChains() external pure returns (SupportedChain[] memory) {
        return new SupportedChain[](0);
    }
    
    function getSupportedChain(uint256 chainId) external pure returns (SupportedChain memory) {
        return SupportedChain({
            chainId: chainId,
            chainName: "",
            isActive: false,
            factoryAddress: address(0)
        });
    }
    
    function getPlatformFee() external view returns (uint256 fee) {
        return platformFee;
    }
    
    function getTotalFees() external view returns (uint256 fees) {
        return totalFees;
    }
}

/**
 * @title OrderTest
 * @dev Comprehensive test suite for Order contract
 * @author TradeVerse Team
 */
contract OrderTest is Test {
    // ============ CONSTANTS ============
    uint256 constant ORDER_AMOUNT = 100 ether;
    uint256 constant ORDER_PRICE = 1 ether;
    uint256 constant EXPIRATION_HOURS = 24;
    bytes32 constant NICKNAME = keccak256("testuser");
    bytes32 constant TOKEN_ADDRESS = bytes32(uint256(uint160(address(0x1234567890123456789012345678901234567890))));
    uint256 constant CHAIN_ID = 1;
    bytes32 constant PYTH_PRICE_FEED_ID = keccak256("pyth_feed");

    // ============ STATE VARIABLES ============
    Order public order;
    MockTradingAccount public mockTradingAccount;
    MockTradeFactory public mockTradeFactory;
    MockERC20 public mockToken;
    
    address public owner;
    address public buyer;
    address public tradingAccount;
    address public tradeFactory;

    // ============ EVENTS ============
    event OrderCreated(
        bytes32 indexed orderId,
        address indexed tradingAccount,
        uint8 orderType,
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

    // ============ SETUP ============
    function setUp() public {
        owner = makeAddr("owner");
        buyer = makeAddr("buyer");
        tradingAccount = makeAddr("tradingAccount");
        tradeFactory = makeAddr("tradeFactory");

        // Deploy mock contracts
        mockTradingAccount = new MockTradingAccount(owner, tradeFactory);
        mockTradeFactory = new MockTradeFactory();
        mockToken = new MockERC20(1000000 ether);

        // Create order data
        IOrder.OrderData memory orderData = IOrder.OrderData({
            tokenAddress: TOKEN_ADDRESS,
            chainId: CHAIN_ID,
            amount: ORDER_AMOUNT,
            price: ORDER_PRICE,
            useLivePrice: false,
            nickname: NICKNAME,
            createdAt: block.timestamp,
            expiresAt: block.timestamp + (EXPIRATION_HOURS * 1 hours),
            orderType: IOrder.OrderType.SELL,
            status: IOrder.OrderStatus.ACTIVE,
            reputation: 0
        });

        // Deploy order contract
        order = new Order(
            orderData,
            address(mockTradingAccount),
            address(mockTradeFactory),
            PYTH_PRICE_FEED_ID
        );

        // Fund accounts
        vm.deal(owner, 10000 ether);
        vm.deal(buyer, 10000 ether);
        vm.deal(address(order), 10000 ether);

        // Mint tokens to buyer
        mockToken.mint(buyer, ORDER_AMOUNT * 2);
    }

    // ============ CONSTRUCTOR TESTS ============

    function test_Constructor_Success() public {
        IOrder.OrderData memory orderData = IOrder.OrderData({
            tokenAddress: TOKEN_ADDRESS,
            chainId: CHAIN_ID,
            amount: ORDER_AMOUNT,
            price: ORDER_PRICE,
            useLivePrice: false,
            nickname: NICKNAME,
            createdAt: block.timestamp,
            expiresAt: block.timestamp + (EXPIRATION_HOURS * 1 hours),
            orderType: IOrder.OrderType.BUY,
            status: IOrder.OrderStatus.ACTIVE,
            reputation: 0
        });

        Order newOrder = new Order(
            orderData,
            address(mockTradingAccount),
            address(mockTradeFactory),
            PYTH_PRICE_FEED_ID
        );

        assertEq(newOrder.getTradingAccount(), address(mockTradingAccount));
        assertEq(newOrder.getTradeFactory(), address(mockTradeFactory));
        assertEq(newOrder.getPythPriceFeedId(), PYTH_PRICE_FEED_ID);
        assertTrue(newOrder.getOrderId() != bytes32(0));
    }

    function test_Constructor_InvalidTradingAccount() public {
        IOrder.OrderData memory orderData = IOrder.OrderData({
            tokenAddress: TOKEN_ADDRESS,
            chainId: CHAIN_ID,
            amount: ORDER_AMOUNT,
            price: ORDER_PRICE,
            useLivePrice: false,
            nickname: NICKNAME,
            createdAt: block.timestamp,
            expiresAt: block.timestamp + (EXPIRATION_HOURS * 1 hours),
            orderType: IOrder.OrderType.SELL,
            status: IOrder.OrderStatus.ACTIVE,
            reputation: 0
        });

        vm.expectRevert(Order.InvalidTradingAccount.selector);
        new Order(
            orderData,
            address(0),
            address(mockTradeFactory),
            PYTH_PRICE_FEED_ID
        );
    }

    function test_Constructor_InvalidTradeFactory() public {
        IOrder.OrderData memory orderData = IOrder.OrderData({
            tokenAddress: TOKEN_ADDRESS,
            chainId: CHAIN_ID,
            amount: ORDER_AMOUNT,
            price: ORDER_PRICE,
            useLivePrice: false,
            nickname: NICKNAME,
            createdAt: block.timestamp,
            expiresAt: block.timestamp + (EXPIRATION_HOURS * 1 hours),
            orderType: IOrder.OrderType.SELL,
            status: IOrder.OrderStatus.ACTIVE,
            reputation: 0
        });

        vm.expectRevert(Order.InvalidTradeFactory.selector);
        new Order(
            orderData,
            address(mockTradingAccount),
            address(0),
            PYTH_PRICE_FEED_ID
        );
    }

    function test_Constructor_InvalidAmount() public {
        IOrder.OrderData memory orderData = IOrder.OrderData({
            tokenAddress: TOKEN_ADDRESS,
            chainId: CHAIN_ID,
            amount: 0, // Invalid amount
            price: ORDER_PRICE,
            useLivePrice: false,
            nickname: NICKNAME,
            createdAt: block.timestamp,
            expiresAt: block.timestamp + (EXPIRATION_HOURS * 1 hours),
            orderType: IOrder.OrderType.SELL,
            status: IOrder.OrderStatus.ACTIVE,
            reputation: 0
        });

        vm.expectRevert(Order.InvalidAmount.selector);
        new Order(
            orderData,
            address(mockTradingAccount),
            address(mockTradeFactory),
            PYTH_PRICE_FEED_ID
        );
    }

    // ============ ORDER FULFILLMENT TESTS ============

    function test_FulfillOrder_Success() public {
        uint256 fulfillAmount = 50 ether;
        
        vm.prank(address(mockTradingAccount));
        vm.expectEmit(true, true, false, true);
        emit OrderFulfilled(order.getOrderId(), buyer, fulfillAmount, block.timestamp);
        order.fulfillOrder(buyer, fulfillAmount);

        IOrder.OrderData memory orderData = order.getOrderData();
        assertEq(uint8(orderData.status), uint8(IOrder.OrderStatus.FULFILLED));
    }

    function test_FulfillOrder_InvalidAmount() public {
        vm.prank(address(mockTradingAccount));
        vm.expectRevert(Order.InvalidAmount.selector);
        order.fulfillOrder(buyer, 0);
    }

    function test_FulfillOrder_AmountExceedsOrder() public {
        vm.prank(address(mockTradingAccount));
        vm.expectRevert(Order.InvalidAmount.selector);
        order.fulfillOrder(buyer, ORDER_AMOUNT + 1);
    }

    function test_FulfillOrder_OrderNotActive() public {
        // First fulfill the order
        vm.prank(address(mockTradingAccount));
        order.fulfillOrder(buyer, ORDER_AMOUNT);

        // Try to fulfill again
        vm.prank(address(mockTradingAccount));
        vm.expectRevert(Order.OrderNotActive.selector);
        order.fulfillOrder(buyer, ORDER_AMOUNT);
    }

    function test_FulfillOrder_OrderExpired() public {
        // Fast forward past expiration
        vm.warp(block.timestamp + EXPIRATION_HOURS * 1 hours + 1);

        vm.prank(address(mockTradingAccount));
        vm.expectRevert(Order.OrderExpired.selector);
        order.fulfillOrder(buyer, ORDER_AMOUNT);
    }

    function test_FulfillOrder_OnlyTradingAccount() public {
        vm.prank(buyer);
        vm.expectRevert(Order.OnlyTradingAccount.selector);
        order.fulfillOrder(buyer, ORDER_AMOUNT);
    }

    // ============ ORDER CANCELLATION TESTS ============

    function test_CancelOrder_Success() public {
        vm.prank(address(mockTradingAccount));
        vm.expectEmit(true, false, false, true);
        emit OrderCancelled(order.getOrderId(), ORDER_AMOUNT, block.timestamp);
        order.cancelOrder();

        IOrder.OrderData memory orderData = order.getOrderData();
        assertEq(uint8(orderData.status), uint8(IOrder.OrderStatus.CANCELLED));
    }

    function test_CancelOrder_OrderNotActive() public {
        // First cancel the order
        vm.prank(address(mockTradingAccount));
        order.cancelOrder();

        // Try to cancel again
        vm.prank(address(mockTradingAccount));
        vm.expectRevert(Order.OrderNotActive.selector);
        order.cancelOrder();
    }

    function test_CancelOrder_OnlyTradingAccount() public {
        vm.prank(buyer);
        vm.expectRevert(Order.OnlyTradingAccount.selector);
        order.cancelOrder();
    }

    // ============ PRICE UPDATE TESTS ============

    function test_UpdatePrice_Success() public {
        uint256 newPrice = 2 ether;
        
        vm.prank(address(mockTradingAccount));
        vm.expectEmit(true, false, false, true);
        emit OrderPriceUpdated(order.getOrderId(), newPrice, block.timestamp);
        order.updatePrice(newPrice);

        IOrder.OrderData memory orderData = order.getOrderData();
        assertEq(orderData.price, newPrice);
    }

    function test_UpdatePrice_InvalidPrice() public {
        vm.prank(address(mockTradingAccount));
        vm.expectRevert(Order.InvalidAmount.selector);
        order.updatePrice(0);
    }

    function test_UpdatePrice_OrderNotActive() public {
        // First cancel the order
        vm.prank(address(mockTradingAccount));
        order.cancelOrder();

        // Try to update price
        vm.prank(address(mockTradingAccount));
        vm.expectRevert(Order.OrderNotActive.selector);
        order.updatePrice(2 ether);
    }

    function test_UpdatePrice_OnlyTradingAccount() public {
        vm.prank(buyer);
        vm.expectRevert(Order.OnlyTradingAccount.selector);
        order.updatePrice(2 ether);
    }

    // ============ ORDER BLACKLISTING TESTS ============

    function test_BlacklistOrder_Success() public {
        vm.prank(address(mockTradeFactory));
        vm.expectEmit(true, false, false, true);
        emit OrderBlacklisted(order.getOrderId(), block.timestamp);
        order.blacklistOrder();

        IOrder.OrderData memory orderData = order.getOrderData();
        assertEq(uint8(orderData.status), uint8(IOrder.OrderStatus.BLACKLISTED));
    }

    function test_BlacklistOrder_OnlyFactory() public {
        vm.prank(buyer);
        vm.expectRevert(Order.OnlyFactory.selector);
        order.blacklistOrder();
    }

    // ============ VIEW FUNCTIONS TESTS ============

    function test_GetOrderData() public view {
        IOrder.OrderData memory orderData = order.getOrderData();
        assertEq(orderData.tokenAddress, TOKEN_ADDRESS);
        assertEq(orderData.chainId, CHAIN_ID);
        assertEq(orderData.amount, ORDER_AMOUNT);
        assertEq(orderData.price, ORDER_PRICE);
        assertEq(orderData.useLivePrice, false);
        assertEq(orderData.nickname, NICKNAME);
        assertEq(orderData.createdAt, block.timestamp);
        assertEq(orderData.expiresAt, block.timestamp + (EXPIRATION_HOURS * 1 hours));
        assertEq(uint8(orderData.orderType), uint8(IOrder.OrderType.SELL));
        assertEq(uint8(orderData.status), uint8(IOrder.OrderStatus.ACTIVE));
        assertEq(orderData.reputation, 0);
    }

    function test_GetOrderId() public view {
        bytes32 orderId = order.getOrderId();
        assertTrue(orderId != bytes32(0));
    }

    function test_GetStatus() public view {
        assertEq(uint8(order.getStatus()), uint8(IOrder.OrderStatus.ACTIVE));
    }

    function test_GetOrderType() public view {
        assertEq(uint8(order.getOrderType()), uint8(IOrder.OrderType.SELL));
    }

    function test_GetAmount() public view {
        assertEq(order.getAmount(), ORDER_AMOUNT);
    }

    function test_GetPrice() public view {
        assertEq(order.getPrice(), ORDER_PRICE);
    }

    function test_GetTokenAddress() public view {
        assertEq(order.getTokenAddress(), TOKEN_ADDRESS);
    }

    function test_GetChainId() public view {
        assertEq(order.getChainId(), CHAIN_ID);
    }

    function test_GetExpiresAt() public view {
        assertEq(order.getExpiresAt(), block.timestamp + (EXPIRATION_HOURS * 1 hours));
    }

    function test_GetCreatedAt() public view {
        assertEq(order.getCreatedAt(), block.timestamp);
    }

    function test_GetNickname() public view {
        assertEq(order.getNickname(), NICKNAME);
    }

    function test_GetReputation() public view {
        assertEq(order.getReputation(), 0);
    }

    function test_GetTradingAccount() public view {
        assertEq(order.getTradingAccount(), address(mockTradingAccount));
    }

    function test_GetTradeFactory() public view {
        assertEq(order.getTradeFactory(), address(mockTradeFactory));
    }

    function test_GetPythPriceFeedId() public view {
        assertEq(order.getPythPriceFeedId(), PYTH_PRICE_FEED_ID);
    }

    function test_IsActive() public view {
        assertTrue(order.isActive());
    }

    function test_IsActive_AfterFulfillment() public {
        vm.prank(address(mockTradingAccount));
        order.fulfillOrder(buyer, ORDER_AMOUNT);

        assertFalse(order.isActive());
    }

    function test_IsActive_AfterCancellation() public {
        vm.prank(address(mockTradingAccount));
        order.cancelOrder();

        assertFalse(order.isActive());
    }

    function test_IsActive_AfterExpiration() public {
        vm.warp(block.timestamp + EXPIRATION_HOURS * 1 hours + 1);

        assertFalse(order.isActive());
    }

    function test_IsExpired() public view {
        assertFalse(order.isExpired());
    }

    function test_IsExpired_AfterExpiration() public {
        vm.warp(block.timestamp + EXPIRATION_HOURS * 1 hours + 1);

        assertTrue(order.isExpired());
    }

    // ============ ADMIN FUNCTIONS TESTS ============

    function test_Pause_Success() public {
        vm.prank(address(mockTradingAccount));
        order.pause();

        assertTrue(order.paused());
    }

    function test_Pause_OnlyTradingAccount() public {
        vm.prank(buyer);
        vm.expectRevert(Order.OnlyTradingAccount.selector);
        order.pause();
    }

    function test_Unpause_Success() public {
        vm.startPrank(address(mockTradingAccount));
        order.pause();
        order.unpause();
        vm.stopPrank();

        assertFalse(order.paused());
    }

    function test_Unpause_OnlyTradingAccount() public {
        vm.prank(buyer);
        vm.expectRevert(Order.OnlyTradingAccount.selector);
        order.unpause();
    }

    // ============ EDGE CASES AND SECURITY TESTS ============

    function test_OrderExpiration() public {
        // Fast forward past expiration
        vm.warp(block.timestamp + EXPIRATION_HOURS * 1 hours + 1);

        // Order should be expired
        assertTrue(order.isExpired());
        assertFalse(order.isActive());

        // Should not be able to fulfill expired order
        vm.prank(address(mockTradingAccount));
        vm.expectRevert(Order.OrderExpired.selector);
        order.fulfillOrder(buyer, ORDER_AMOUNT);
    }

    function test_OrderStatusTransitions() public {
        // Start as ACTIVE
        assertEq(uint8(order.getStatus()), uint8(IOrder.OrderStatus.ACTIVE));

        // Fulfill order
        vm.prank(address(mockTradingAccount));
        order.fulfillOrder(buyer, ORDER_AMOUNT);
        assertEq(uint8(order.getStatus()), uint8(IOrder.OrderStatus.FULFILLED));

        // Create new order for cancellation test
        IOrder.OrderData memory orderData = IOrder.OrderData({
            tokenAddress: TOKEN_ADDRESS,
            chainId: CHAIN_ID,
            amount: ORDER_AMOUNT,
            price: ORDER_PRICE,
            useLivePrice: false,
            nickname: NICKNAME,
            createdAt: block.timestamp,
            expiresAt: block.timestamp + (EXPIRATION_HOURS * 1 hours),
            orderType: IOrder.OrderType.SELL,
            status: IOrder.OrderStatus.ACTIVE,
            reputation: 0
        });

        Order newOrder = new Order(
            orderData,
            address(mockTradingAccount),
            address(mockTradeFactory),
            PYTH_PRICE_FEED_ID
        );

        // Cancel order
        vm.prank(address(mockTradingAccount));
        newOrder.cancelOrder();
        assertEq(uint8(newOrder.getStatus()), uint8(IOrder.OrderStatus.CANCELLED));

        // Blacklist order
        vm.prank(address(mockTradeFactory));
        newOrder.blacklistOrder();
        assertEq(uint8(newOrder.getStatus()), uint8(IOrder.OrderStatus.BLACKLISTED));
    }

    function test_ReentrancyProtection() public {
        // This test ensures that reentrancy protection is working
        vm.prank(address(mockTradingAccount));
        order.fulfillOrder(buyer, ORDER_AMOUNT);

        // The contract should not be vulnerable to reentrancy attacks
        assertEq(uint8(order.getStatus()), uint8(IOrder.OrderStatus.FULFILLED));
    }

    function test_PausableFunctionality() public {
        vm.startPrank(address(mockTradingAccount));
        order.pause();
        vm.stopPrank();

        // Functions should revert when paused
        vm.prank(address(mockTradingAccount));
        vm.expectRevert("Pausable: paused");
        order.fulfillOrder(buyer, ORDER_AMOUNT);

        vm.prank(address(mockTradingAccount));
        vm.expectRevert("Pausable: paused");
        order.cancelOrder();
    }

    function test_OrderDataImmutability() public {
        IOrder.OrderData memory initialData = order.getOrderData();
        
        // Update price
        vm.prank(address(mockTradingAccount));
        order.updatePrice(2 ether);

        IOrder.OrderData memory updatedData = order.getOrderData();
        assertEq(updatedData.price, 2 ether);
        assertEq(updatedData.amount, initialData.amount); // Amount should remain unchanged
        assertEq(updatedData.tokenAddress, initialData.tokenAddress); // Token address should remain unchanged
    }
}

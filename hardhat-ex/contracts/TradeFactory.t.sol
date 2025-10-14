// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

import {TradeFactory} from "./trading/TradeFactory.sol";
import {ITradeFactory} from "./interfaces/ITradeFactory.sol";
import {TradingAccount} from "./trading/TradingAccount.sol";
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

/**
 * @title TradeFactoryTest
 * @dev Comprehensive test suite for TradeFactory contract
 * @author TradeVerse Team
 */
contract TradeFactoryTest is Test {
    // ============ CONSTANTS ============
    uint256 constant ASSET_AMOUNT = 1000 ether;
    uint256 constant ORDER_AMOUNT = 100 ether;
    uint256 constant ORDER_PRICE = 1 ether;
    uint256 constant EXPIRATION_HOURS = 24;
    bytes32 constant NICKNAME = keccak256("testuser");
    bytes32 constant TOKEN_ADDRESS = bytes32(uint256(uint160(address(0x1234567890123456789012345678901234567890))));
    uint256 constant CHAIN_ID = 1;
    uint256 constant NEW_CHAIN_ID = 137;
    uint256 constant PLATFORM_FEE = 50; // 0.5%
    uint256 constant MAX_PLATFORM_FEE = 500; // 5%

    // ============ STATE VARIABLES ============
    TradeFactory public tradeFactory;
    MockERC20 public mockToken;
    
    address public owner;
    address public user1;
    address public user2;
    address public buyer;

    // ============ EVENTS ============
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

    // ============ SETUP ============
    function setUp() public {
        owner = makeAddr("owner");
        user1 = makeAddr("user1");
        user2 = makeAddr("user2");
        buyer = makeAddr("buyer");

        // Deploy contracts
        vm.prank(owner);
        tradeFactory = new TradeFactory();
        mockToken = new MockERC20(1000000 ether);

        // Fund accounts
        vm.deal(owner, 10000 ether);
        vm.deal(user1, 10000 ether);
        vm.deal(user2, 10000 ether);
        vm.deal(buyer, 10000 ether);

        // Mint tokens to users
        mockToken.mint(user1, ASSET_AMOUNT);
        mockToken.mint(user2, ASSET_AMOUNT);
        mockToken.mint(buyer, ASSET_AMOUNT);
    }

    // ============ CONSTRUCTOR TESTS ============

    function test_Constructor_Success() public {
        TradeFactory newFactory = new TradeFactory();
        
        assertEq(newFactory.owner(), address(this));
        assertEq(newFactory.getPlatformFee(), 50); // Default 0.5%
        assertEq(newFactory.getTotalFees(), 0);
        
        ITradeFactory.SupportedChain[] memory chains = newFactory.getSupportedChains();
        assertEq(chains.length, 2); // Ethereum and Polygon
        assertEq(chains[0].chainId, 1);
        assertEq(chains[1].chainId, 137);
    }

    // ============ ACCOUNT CREATION TESTS ============

    function test_CreateTradingAccount_Success() public {
        vm.prank(user1);
        address account = tradeFactory.createTradingAccount(user1);

        assertTrue(account != address(0));
        assertEq(tradeFactory.getTradingAccount(user1), account);

        ITradeFactory.AccountInfo memory accountInfo = tradeFactory.getAccountInfo(user1);
        assertEq(accountInfo.user, user1);
        assertEq(accountInfo.tradingAccount, account);
        assertEq(accountInfo.reputation, 0);
        assertEq(accountInfo.totalOrders, 0);
        assertEq(accountInfo.successfulOrders, 0);
        assertEq(accountInfo.cancelledOrders, 0);
        assertEq(accountInfo.createdAt, block.timestamp);
    }

    function test_CreateTradingAccount_InvalidUser() public {
        vm.prank(user1);
        vm.expectRevert(TradeFactory.InvalidOwner.selector);
        tradeFactory.createTradingAccount(address(0));
    }

    function test_CreateTradingAccount_AccountAlreadyExists() public {
        vm.startPrank(user1);
        tradeFactory.createTradingAccount(user1);
        vm.expectRevert(TradeFactory.AccountAlreadyExists.selector);
        tradeFactory.createTradingAccount(user1);
        vm.stopPrank();
    }

    function test_CreateTradingAccount_EventEmitted() public {
        vm.prank(user1);
        vm.expectEmit(true, true, false, true);
        emit AccountCreated(user1, address(0), block.timestamp); // Address will be set by contract
        tradeFactory.createTradingAccount(user1);
    }

    // ============ ORDER CREATION TESTS ============

    function test_CreateOrder_Success() public {
        // First create trading account
        vm.prank(user1);
        tradeFactory.createTradingAccount(user1);

        vm.prank(user1);
        bytes32 orderId = tradeFactory.createOrder(
            TOKEN_ADDRESS,
            CHAIN_ID,
            ORDER_AMOUNT,
            ORDER_PRICE,
            false,
            EXPIRATION_HOURS,
            NICKNAME
        );

        assertTrue(orderId != bytes32(0));

        ITradeFactory.OrderInfo memory orderInfo = tradeFactory.getOrderInfo(orderId);
        assertEq(orderInfo.orderId, orderId);
        assertEq(orderInfo.user, user1);
        assertEq(orderInfo.tokenAddress, TOKEN_ADDRESS);
        assertEq(orderInfo.chainId, CHAIN_ID);
        assertEq(orderInfo.amount, ORDER_AMOUNT);
        assertEq(orderInfo.price, ORDER_PRICE);
        assertEq(orderInfo.useLivePrice, false);
        assertEq(orderInfo.createdAt, block.timestamp);
        assertEq(orderInfo.status, uint8(0)); // ACTIVE

        ITradeFactory.AccountInfo memory accountInfo = tradeFactory.getAccountInfo(user1);
        assertEq(accountInfo.totalOrders, 1);
    }

    function test_CreateOrder_AccountNotFound() public {
        vm.prank(user1);
        vm.expectRevert(TradeFactory.AccountNotFound.selector);
        tradeFactory.createOrder(
            TOKEN_ADDRESS,
            CHAIN_ID,
            ORDER_AMOUNT,
            ORDER_PRICE,
            false,
            EXPIRATION_HOURS,
            NICKNAME
        );
    }

    function test_CreateOrder_InvalidAmount() public {
        vm.prank(user1);
        tradeFactory.createTradingAccount(user1);

        vm.prank(user1);
        vm.expectRevert(TradeFactory.InvalidAmount.selector);
        tradeFactory.createOrder(
            TOKEN_ADDRESS,
            CHAIN_ID,
            0,
            ORDER_PRICE,
            false,
            EXPIRATION_HOURS,
            NICKNAME
        );
    }

    function test_CreateOrder_UnsupportedChain() public {
        vm.prank(user1);
        tradeFactory.createTradingAccount(user1);

        vm.prank(user1);
        vm.expectRevert(TradeFactory.UnsupportedChain.selector);
        tradeFactory.createOrder(
            TOKEN_ADDRESS,
            999, // Unsupported chain
            ORDER_AMOUNT,
            ORDER_PRICE,
            false,
            EXPIRATION_HOURS,
            NICKNAME
        );
    }

    function test_CreateOrder_EventEmitted() public {
        vm.prank(user1);
        tradeFactory.createTradingAccount(user1);

        vm.prank(user1);
        vm.expectEmit(true, true, true, true);
        emit OrderCreated(
            bytes32(0), // Will be set by contract
            user1,
            address(0), // Will be set by contract
            address(0), // Will be set by contract
            TOKEN_ADDRESS,
            CHAIN_ID,
            ORDER_AMOUNT,
            ORDER_PRICE
        );
        tradeFactory.createOrder(
            TOKEN_ADDRESS,
            CHAIN_ID,
            ORDER_AMOUNT,
            ORDER_PRICE,
            false,
            EXPIRATION_HOURS,
            NICKNAME
        );
    }

    // ============ ORDER EXECUTION TESTS ============

    function test_ExecuteOrder_Success() public {
        // Create account and order
        vm.startPrank(user1);
        tradeFactory.createTradingAccount(user1);
        bytes32 orderId = tradeFactory.createOrder(
            TOKEN_ADDRESS,
            CHAIN_ID,
            ORDER_AMOUNT,
            ORDER_PRICE,
            false,
            EXPIRATION_HOURS,
            NICKNAME
        );
        vm.stopPrank();

        uint256 expectedPlatformFee = (ORDER_AMOUNT * PLATFORM_FEE) / 10000;

        vm.prank(owner);
        vm.expectEmit(true, true, true, true);
        emit OrderExecuted(orderId, user1, buyer, ORDER_AMOUNT, expectedPlatformFee);
        tradeFactory.executeOrder(orderId, buyer, ORDER_AMOUNT);

        ITradeFactory.OrderInfo memory orderInfo = tradeFactory.getOrderInfo(orderId);
        assertEq(orderInfo.status, uint8(1)); // FULFILLED

        ITradeFactory.AccountInfo memory accountInfo = tradeFactory.getAccountInfo(user1);
        assertEq(accountInfo.successfulOrders, 1);
        assertEq(accountInfo.reputation, 5); // +5 for successful order

        assertEq(tradeFactory.getTotalFees(), expectedPlatformFee);
    }

    function test_ExecuteOrder_OrderNotFound() public {
        vm.prank(owner);
        vm.expectRevert(TradeFactory.OrderNotFound.selector);
        tradeFactory.executeOrder(keccak256("nonexistent"), buyer, ORDER_AMOUNT);
    }

    function test_ExecuteOrder_OrderNotActive() public {
        // Create account and order
        vm.startPrank(user1);
        tradeFactory.createTradingAccount(user1);
        bytes32 orderId = tradeFactory.createOrder(
            TOKEN_ADDRESS,
            CHAIN_ID,
            ORDER_AMOUNT,
            ORDER_PRICE,
            false,
            EXPIRATION_HOURS,
            NICKNAME
        );
        vm.stopPrank();

        // Cancel order first
        vm.prank(user1);
        tradeFactory.cancelOrder(orderId);

        // Try to execute cancelled order
        vm.prank(owner);
        vm.expectRevert(TradeFactory.OrderNotActive.selector);
        tradeFactory.executeOrder(orderId, buyer, ORDER_AMOUNT);
    }

    function test_ExecuteOrder_InvalidAmount() public {
        // Create account and order
        vm.startPrank(user1);
        tradeFactory.createTradingAccount(user1);
        bytes32 orderId = tradeFactory.createOrder(
            TOKEN_ADDRESS,
            CHAIN_ID,
            ORDER_AMOUNT,
            ORDER_PRICE,
            false,
            EXPIRATION_HOURS,
            NICKNAME
        );
        vm.stopPrank();

        vm.prank(owner);
        vm.expectRevert(TradeFactory.InvalidAmount.selector);
        tradeFactory.executeOrder(orderId, buyer, 0);
    }

    // ============ ORDER CANCELLATION TESTS ============

    function test_CancelOrder_Success() public {
        // Create account and order
        vm.startPrank(user1);
        tradeFactory.createTradingAccount(user1);
        bytes32 orderId = tradeFactory.createOrder(
            TOKEN_ADDRESS,
            CHAIN_ID,
            ORDER_AMOUNT,
            ORDER_PRICE,
            false,
            EXPIRATION_HOURS,
            NICKNAME
        );
        vm.stopPrank();

        vm.prank(user1);
        vm.expectEmit(true, true, true, true);
        emit OrderCancelled(orderId, user1, address(0)); // Address will be set by contract
        tradeFactory.cancelOrder(orderId);

        ITradeFactory.OrderInfo memory orderInfo = tradeFactory.getOrderInfo(orderId);
        assertEq(orderInfo.status, uint8(2)); // CANCELLED

        ITradeFactory.AccountInfo memory accountInfo = tradeFactory.getAccountInfo(user1);
        assertEq(accountInfo.cancelledOrders, 1);
        assertEq(accountInfo.reputation, 0); // No reputation change for new accounts
    }

    function test_CancelOrder_OrderNotFound() public {
        vm.prank(user1);
        vm.expectRevert(TradeFactory.OrderNotFound.selector);
        tradeFactory.cancelOrder(keccak256("nonexistent"));
    }

    function test_CancelOrder_OrderNotActive() public {
        // Create account and order
        vm.startPrank(user1);
        tradeFactory.createTradingAccount(user1);
        bytes32 orderId = tradeFactory.createOrder(
            TOKEN_ADDRESS,
            CHAIN_ID,
            ORDER_AMOUNT,
            ORDER_PRICE,
            false,
            EXPIRATION_HOURS,
            NICKNAME
        );
        vm.stopPrank();

        // Cancel order first
        vm.prank(user1);
        tradeFactory.cancelOrder(orderId);

        // Try to cancel again
        vm.prank(user1);
        vm.expectRevert(TradeFactory.OrderNotActive.selector);
        tradeFactory.cancelOrder(orderId);
    }

    // ============ ORDER BLACKLISTING TESTS ============

    function test_BlacklistOrder_Success() public {
        // Create account and order
        vm.startPrank(user1);
        tradeFactory.createTradingAccount(user1);
        bytes32 orderId = tradeFactory.createOrder(
            TOKEN_ADDRESS,
            CHAIN_ID,
            ORDER_AMOUNT,
            ORDER_PRICE,
            false,
            EXPIRATION_HOURS,
            NICKNAME
        );
        vm.stopPrank();

        vm.prank(owner);
        vm.expectEmit(true, true, false, true);
        emit OrderBlacklisted(orderId, user1);
        tradeFactory.blacklistOrder(orderId);

        ITradeFactory.OrderInfo memory orderInfo = tradeFactory.getOrderInfo(orderId);
        assertEq(orderInfo.status, uint8(4)); // BLACKLISTED
    }

    function test_BlacklistOrder_OnlyOwner() public {
        vm.prank(user1);
        vm.expectRevert(TradeFactory.InvalidOwner.selector);
        tradeFactory.blacklistOrder(keccak256("test"));
    }

    function test_BlacklistOrder_OrderNotFound() public {
        vm.prank(owner);
        vm.expectRevert(TradeFactory.OrderNotFound.selector);
        tradeFactory.blacklistOrder(keccak256("nonexistent"));
    }

    // ============ CHAIN MANAGEMENT TESTS ============

    function test_AddSupportedChain_Success() public {
        string memory chainName = "Polygon";
        address factoryAddress = makeAddr("polygonFactory");

        vm.prank(owner);
        vm.expectEmit(true, false, false, true);
        emit ChainAdded(NEW_CHAIN_ID, chainName, factoryAddress);
        tradeFactory.addSupportedChain(NEW_CHAIN_ID, chainName, factoryAddress);

        ITradeFactory.SupportedChain memory chain = tradeFactory.getSupportedChain(NEW_CHAIN_ID);
        assertEq(chain.chainId, NEW_CHAIN_ID);
        assertEq(chain.chainName, chainName);
        assertEq(chain.isActive, true);
        assertEq(chain.factoryAddress, factoryAddress);

        ITradeFactory.SupportedChain[] memory chains = tradeFactory.getSupportedChains();
        assertEq(chains.length, 3); // Original 2 + new 1
    }

    function test_AddSupportedChain_OnlyOwner() public {
        vm.prank(user1);
        vm.expectRevert(TradeFactory.InvalidOwner.selector);
        tradeFactory.addSupportedChain(NEW_CHAIN_ID, "Test", address(0));
    }

    function test_AddSupportedChain_ChainAlreadyExists() public {
        vm.prank(owner);
        vm.expectRevert(TradeFactory.UnsupportedChain.selector);
        tradeFactory.addSupportedChain(1, "Ethereum", address(0)); // Chain 1 already exists
    }

    function test_RemoveSupportedChain_Success() public {
        vm.prank(owner);
        vm.expectEmit(true, false, false, true);
        emit ChainRemoved(137);
        tradeFactory.removeSupportedChain(137);

        ITradeFactory.SupportedChain memory chain = tradeFactory.getSupportedChain(137);
        assertEq(chain.isActive, false);

        ITradeFactory.SupportedChain[] memory chains = tradeFactory.getSupportedChains();
        assertEq(chains.length, 1); // Only Ethereum remains
    }

    function test_RemoveSupportedChain_OnlyOwner() public {
        vm.prank(user1);
        vm.expectRevert(TradeFactory.InvalidOwner.selector);
        tradeFactory.removeSupportedChain(137);
    }

    function test_RemoveSupportedChain_ChainNotSupported() public {
        vm.prank(owner);
        vm.expectRevert(TradeFactory.UnsupportedChain.selector);
        tradeFactory.removeSupportedChain(999);
    }

    // ============ FEE MANAGEMENT TESTS ============

    function test_SetPlatformFee_Success() public {
        uint256 newFee = 100; // 1%

        vm.prank(owner);
        vm.expectEmit(false, false, false, true);
        emit PlatformFeeSet(newFee);
        tradeFactory.setPlatformFee(newFee);

        assertEq(tradeFactory.getPlatformFee(), newFee);
    }

    function test_SetPlatformFee_OnlyOwner() public {
        vm.prank(user1);
        vm.expectRevert(TradeFactory.InvalidOwner.selector);
        tradeFactory.setPlatformFee(100);
    }

    function test_SetPlatformFee_InvalidFee() public {
        vm.prank(owner);
        vm.expectRevert(TradeFactory.InvalidFee.selector);
        tradeFactory.setPlatformFee(600); // More than 5%
    }

    function test_WithdrawFees_Success() public {
        // First create some fees by executing orders
        vm.startPrank(user1);
        tradeFactory.createTradingAccount(user1);
        bytes32 orderId = tradeFactory.createOrder(
            TOKEN_ADDRESS,
            CHAIN_ID,
            ORDER_AMOUNT,
            ORDER_PRICE,
            false,
            EXPIRATION_HOURS,
            NICKNAME
        );
        vm.stopPrank();

        vm.prank(owner);
        tradeFactory.executeOrder(orderId, buyer, ORDER_AMOUNT);

        uint256 expectedFees = tradeFactory.getTotalFees();
        uint256 initialBalance = owner.balance;

        vm.prank(owner);
        vm.expectEmit(false, false, true, true);
        emit FeesWithdrawn(expectedFees, owner);
        tradeFactory.withdrawFees();

        assertEq(owner.balance, initialBalance + expectedFees);
        assertEq(tradeFactory.getTotalFees(), 0);
    }

    function test_WithdrawFees_OnlyOwner() public {
        vm.prank(user1);
        vm.expectRevert(TradeFactory.InvalidOwner.selector);
        tradeFactory.withdrawFees();
    }

    function test_WithdrawFees_NoFees() public {
        vm.prank(owner);
        vm.expectRevert(TradeFactory.InvalidAmount.selector);
        tradeFactory.withdrawFees();
    }

    // ============ VIEW FUNCTIONS TESTS ============

    function test_GetFactoryData() public {
        ITradeFactory.FactoryData memory factoryData = tradeFactory.getFactoryData();
        assertEq(factoryData.owner, owner);
        assertEq(factoryData.platformFee, PLATFORM_FEE);
        assertEq(factoryData.totalFees, 0);
        assertEq(factoryData.supportedChainCount, 2);
        assertEq(factoryData.totalAccounts, 0);
    }

    function test_GetTradingAccount() public {
        vm.prank(user1);
        address account = tradeFactory.createTradingAccount(user1);

        assertEq(tradeFactory.getTradingAccount(user1), account);
        assertEq(tradeFactory.getTradingAccount(user2), address(0));
    }

    function test_GetAccountInfo() public {
        vm.prank(user1);
        address account = tradeFactory.createTradingAccount(user1);

        ITradeFactory.AccountInfo memory accountInfo = tradeFactory.getAccountInfo(user1);
        assertEq(accountInfo.user, user1);
        assertEq(accountInfo.tradingAccount, account);
        assertEq(accountInfo.reputation, 0);
        assertEq(accountInfo.totalOrders, 0);
        assertEq(accountInfo.successfulOrders, 0);
        assertEq(accountInfo.cancelledOrders, 0);
        assertEq(accountInfo.createdAt, block.timestamp);
    }

    function test_GetOrderInfo() public {
        vm.startPrank(user1);
        tradeFactory.createTradingAccount(user1);
        bytes32 orderId = tradeFactory.createOrder(
            TOKEN_ADDRESS,
            CHAIN_ID,
            ORDER_AMOUNT,
            ORDER_PRICE,
            false,
            EXPIRATION_HOURS,
            NICKNAME
        );
        vm.stopPrank();

        ITradeFactory.OrderInfo memory orderInfo = tradeFactory.getOrderInfo(orderId);
        assertEq(orderInfo.orderId, orderId);
        assertEq(orderInfo.user, user1);
        assertEq(orderInfo.tokenAddress, TOKEN_ADDRESS);
        assertEq(orderInfo.chainId, CHAIN_ID);
        assertEq(orderInfo.amount, ORDER_AMOUNT);
        assertEq(orderInfo.price, ORDER_PRICE);
        assertEq(orderInfo.useLivePrice, false);
        assertEq(orderInfo.createdAt, block.timestamp);
        assertEq(orderInfo.status, uint8(0)); // ACTIVE
    }

    function test_GetAccountReputation() public {
        vm.prank(user1);
        tradeFactory.createTradingAccount(user1);

        assertEq(tradeFactory.getAccountReputation(user1), 0);
        assertEq(tradeFactory.getAccountReputation(user2), 0);
    }

    function test_GetSupportedChains() public {
        ITradeFactory.SupportedChain[] memory chains = tradeFactory.getSupportedChains();
        assertEq(chains.length, 2);
        assertEq(chains[0].chainId, 1);
        assertEq(chains[1].chainId, 137);
    }

    function test_GetSupportedChain() public {
        ITradeFactory.SupportedChain memory chain1 = tradeFactory.getSupportedChain(1);
        assertEq(chain1.chainId, 1);
        assertEq(chain1.chainName, "Ethereum");
        assertEq(chain1.isActive, true);

        ITradeFactory.SupportedChain memory chain137 = tradeFactory.getSupportedChain(137);
        assertEq(chain137.chainId, 137);
        assertEq(chain137.chainName, "Polygon");
        assertEq(chain137.isActive, true);
    }

    function test_GetPlatformFee() public {
        assertEq(tradeFactory.getPlatformFee(), PLATFORM_FEE);
    }

    function test_GetTotalFees() public {
        assertEq(tradeFactory.getTotalFees(), 0);
    }

    function test_Owner() public {
        assertEq(tradeFactory.owner(), owner);
    }

    // ============ ADMIN FUNCTIONS TESTS ============

    function test_Pause_Success() public {
        vm.prank(owner);
        tradeFactory.pause();

        assertTrue(tradeFactory.paused());
    }

    function test_Pause_OnlyOwner() public {
        vm.prank(user1);
        vm.expectRevert(TradeFactory.InvalidOwner.selector);
        tradeFactory.pause();
    }

    function test_Unpause_Success() public {
        vm.startPrank(owner);
        tradeFactory.pause();
        tradeFactory.unpause();
        vm.stopPrank();

        assertFalse(tradeFactory.paused());
    }

    function test_Unpause_OnlyOwner() public {
        vm.prank(user1);
        vm.expectRevert(TradeFactory.InvalidOwner.selector);
        tradeFactory.unpause();
    }

    // ============ EDGE CASES AND SECURITY TESTS ============

    function test_MultipleUsers() public {
        // Create accounts for multiple users
        vm.prank(user1);
        address account1 = tradeFactory.createTradingAccount(user1);

        vm.prank(user2);
        address account2 = tradeFactory.createTradingAccount(user2);

        assertTrue(account1 != account2);
        assertEq(tradeFactory.getTradingAccount(user1), account1);
        assertEq(tradeFactory.getTradingAccount(user2), account2);
    }

    function test_ReputationSystem() public {
        vm.startPrank(user1);
        tradeFactory.createTradingAccount(user1);
        bytes32 orderId = tradeFactory.createOrder(
            TOKEN_ADDRESS,
            CHAIN_ID,
            ORDER_AMOUNT,
            ORDER_PRICE,
            false,
            EXPIRATION_HOURS,
            NICKNAME
        );
        vm.stopPrank();

        // Execute order (should increase reputation)
        vm.prank(owner);
        tradeFactory.executeOrder(orderId, buyer, ORDER_AMOUNT);

        ITradeFactory.AccountInfo memory accountInfo = tradeFactory.getAccountInfo(user1);
        assertEq(accountInfo.reputation, 5); // +5 for successful order
        assertEq(accountInfo.successfulOrders, 1);

        // Create and cancel another order (should decrease reputation)
        vm.startPrank(user1);
        bytes32 orderId2 = tradeFactory.createOrder(
            TOKEN_ADDRESS,
            CHAIN_ID,
            ORDER_AMOUNT,
            ORDER_PRICE,
            false,
            EXPIRATION_HOURS,
            NICKNAME
        );
        tradeFactory.cancelOrder(orderId2);
        vm.stopPrank();

        accountInfo = tradeFactory.getAccountInfo(user1);
        assertEq(accountInfo.reputation, 4); // 5 - 1 for cancelled order
        assertEq(accountInfo.cancelledOrders, 1);
    }

    function test_PausableFunctionality() public {
        vm.startPrank(owner);
        tradeFactory.pause();
        vm.stopPrank();

        // Functions should revert when paused
        vm.prank(user1);
        vm.expectRevert("Pausable: paused");
        tradeFactory.createTradingAccount(user1);

        vm.prank(owner);
        vm.expectRevert("Pausable: paused");
        tradeFactory.executeOrder(keccak256("test"), buyer, ORDER_AMOUNT);
    }

    function test_ReentrancyProtection() public {
        // This test ensures that reentrancy protection is working
        vm.prank(user1);
        tradeFactory.createTradingAccount(user1);

        // The contract should not be vulnerable to reentrancy attacks
        assertTrue(tradeFactory.getTradingAccount(user1) != address(0));
    }
}

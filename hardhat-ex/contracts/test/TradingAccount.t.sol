// SPDX-License-Identifier: MIT

pragma solidity 0.8.30;

import { Test, console } from "forge-std/Test.sol";
import { TradingAccount } from "../trading/peripherals/TradingAccount.sol";
import { TradeFactory } from "../trading/TradeFactory.sol";
import { ITradingAccount } from "../interfaces/ITradingAccount.sol";
import { ICommon } from "../interfaces/ICommon.sol";
import { ITradeFactory } from "../interfaces/ITradeFactory.sol";
import { MockERC20 } from "../MockERC20.sol";
import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";
import { Pausable } from "@openzeppelin/contracts/utils/Pausable.sol";
import { Approved } from "../Approved.sol";

/**
 * @title TradingAccountTest
 * @dev Comprehensive test suite for TradingAccount contract
 * @author Bobeu - https://github.com/bobeu
 */
contract TradingAccountTest is Test {
    TradingAccount internal tradingAccount;
    TradeFactory internal tradeFactory;

    MockERC20 internal tradeToken;
    MockERC20 internal paymentToken;
    address internal tradeFactoryAddr;
    
    // Test accounts
    address internal owner;
    address internal agent;
    address internal user1;
    address internal user2;
    address internal unauthorizedUser;
    uint256 constant creationFee = 1e15 wei;
    uint256 constant platformFee = 50;
    
    // Test constants
    string internal nickName;
    uint256 constant TOKEN_AMOUNT = 1000 ether;
    uint256 constant ORDER_PRICE = 1e17 wei;
    uint256 constant EXPIRATION_HOURS = 24;
    uint256 constant EXTRA_EXPIRATION_HOURS = 168; // 7 days
    
    // Events
    event OrderCreated(bytes32 indexed orderId, address indexed user, uint256 indexed orderIndex, uint256 amount, uint256 price, bool useLivePrice, bytes32 nickname);
    event OrderCancelled(bytes32 indexed orderId, address indexed user);
    event OrderExecuted(bytes32 indexed orderId, address indexed buyer, address indexed seller);
    event OrderActivated(bytes32 indexed orderId, uint256 newDuration);
    event WithdrawalRequested(address indexed token, uint256 amount, uint256 cooldownEnd);
    event WithdrawalProcessed(address indexed token, uint256 amount, address indexed to);
    event ExecutionToggled(bool isPaused);
    
    function setUp() public {
        owner = address(this);
        user1 = makeAddr("user1");
        user2 = makeAddr("user2");
        agent = makeAddr("user3");
        unauthorizedUser = makeAddr("unauthorizedUser");
        nickName = "Bobelr";

        tradeFactory = new TradeFactory(0xA2aa501b19aff244D90cc15a4Cf739D2725B5729);
        tradeFactoryAddr = address(tradeFactory);
        
        // Deploy mock token
        tradeToken = new MockERC20(TOKEN_AMOUNT, "Test TradeToken", "TTT");
        paymentToken = new MockERC20(TOKEN_AMOUNT, "Test PaymentToken", "TPT");
        
        // Deploy trading account
        vm.prank(user1);
        address tradingAccountAddr = tradeFactory.createTradingAccount(agent, nickName);
        tradingAccount = TradingAccount(payable(tradingAccountAddr));

        // Update state variables and parameters
        tradeFactory.setSupportedPaymentAsset(address(paymentToken));
    }
    
    // ============ CONSTRUCTOR TESTS ============
    
    function test_Constructor_Success() public view {
        ITradeFactory.FactoryData memory data = tradeFactory.getFactoryData(user1);
        assertNotEq(data.variables.alc.tradingAccount, address(0));
        assertEq(data.accounts.length, 1);
        assertEq(data.variables.alc.tradingAccount, data.accounts[0].tradingAccount);
        assertEq(data.platformFee, platformFee);
        assertEq(data.totalFees, 0);
        assertEq(data.isPaused, false);
        assertEq(data.owner, address(this));
        assertEq(data.totalAccounts, data.accounts.length);
        assertEq(data.variables.alc.user, user1);
        assertEq(data.variables.creationFee, creationFee);
        assertEq(data.variables.supportedPaymentAsset.token, address(paymentToken));
    }
    
    // ============ DEPOSIT TESTS ============
     function test_Deposit_OnlyApproved() public {
        uint256 depositAmount = 1 ether;
        
        vm.deal(unauthorizedUser, depositAmount);
        vm.prank(unauthorizedUser);
        vm.expectRevert("Not approved account");
        tradingAccount.deposit{value: depositAmount}(address(0));
    }
    
    function test_Deposit_InvalidAmount() public {
        vm.prank(user1);
        vm.expectRevert(ITradingAccount.InvalidAmount.selector);
        tradingAccount.deposit(address(tradeToken));
    }
    
    function test_Deposit_InsufficientBalance() public {
        vm.prank(user1);
        vm.expectRevert(ITradingAccount.InvalidAmount.selector);
        tradingAccount.deposit(address(tradeToken));
    }

    function test_Deposit_ETH_Success() public {
        uint256 depositAmount = 1 ether;
        
        vm.deal(user1, depositAmount);
        vm.prank(user1);
        tradingAccount.deposit{value: depositAmount}(address(0));
        
        assertEq(tradingAccount.getBalance(address(0)), depositAmount);
    }

    function test_Deposit_ETH_By_Agent_Success() public {
        uint256 depositAmount = 1 ether;
        
        vm.deal(agent, depositAmount);
        vm.prank(agent);
        tradingAccount.deposit{value: depositAmount}(address(0));
        
        assertEq(tradingAccount.getBalance(address(0)), depositAmount);
    }


    ////////////////////////////

      
    // Seller deposit themselves
    function test_Deposit_ERC20_Success() public {
        uint256 depositAmount = 100 ether;
        
        vm.prank(user1);
        tradeToken.mint(user1, depositAmount);
        vm.prank(user1);
        tradeToken.approve(address(tradingAccount), depositAmount);
        vm.prank(user1);
        tradingAccount.deposit(address(tradeToken));
        
        assertEq(tradingAccount.getBalance(address(tradeToken)), depositAmount);
        assertEq(tradeToken.balanceOf(address(tradingAccount)), depositAmount);
    }

    function test_Deposit_ERC20_By_Agent_Success() public {
        uint256 depositAmount = 100 ether;
        
        vm.prank(agent);
        tradeToken.mint(agent, depositAmount);
        vm.prank(agent);
        tradeToken.approve(address(tradingAccount), depositAmount);
        vm.prank(agent);
        tradingAccount.deposit(address(tradeToken));
        
        assertEq(tradingAccount.getBalance(address(tradeToken)), depositAmount);
        assertEq(tradeToken.balanceOf(address(tradingAccount)), depositAmount);
    }

    ///////////////////////////////
    
    
    function test_CreateOrder_Success() public {
        uint256 amount = 50 ether;
        // First deposit some tokens
        vm.prank(user1);
        tradeToken.mint(user1, amount);
        vm.prank(user1);
        tradeToken.approve(address(tradingAccount), amount);
        vm.prank(user1);
        tradingAccount.deposit(address(tradeToken));
        
        address tokenAddress = address(tradeToken);
        uint256 price = ORDER_PRICE;
        uint256 expirationHours = EXPIRATION_HOURS;

        vm.prank(user1);        
        assertEq(
            tradingAccount.createOrder(
                tokenAddress,
                amount,
                price,
                expirationHours,
                bytes32(0)
            ),
            true
        );
        
        ITradingAccount.AccountData memory data = tradingAccount.getAccountData();
        assertEq(data.orders.length, 1);
    }
    
    function test_CreateOrder_OnlyApproved() public {
        address tokenAddress = address(tradeToken);
        uint256 amount = 50 ether;
        uint256 price = ORDER_PRICE;
        uint256 expirationHours = EXPIRATION_HOURS;
        // bytes32 nickname = keccak256("TestOrder");
        
        vm.prank(unauthorizedUser);
        vm.expectRevert("Not approved account");
        tradingAccount.createOrder(
            tokenAddress,
            amount,
            price,
            expirationHours,
            bytes32(0)
        );
    }
    
    function test_CreateOrder_InvalidAmount() public {
        address tokenAddress = address(tradeToken);
        uint256 amount = 0;
        uint256 price = ORDER_PRICE;
        uint256 expirationHours = EXPIRATION_HOURS;
        
        vm.expectRevert(ITradingAccount.InvalidAmount.selector);
        vm.prank(user1);
        tradingAccount.createOrder(
            tokenAddress,
            amount,
            price,
            expirationHours,
            bytes32(0)
        );
    }

    function test_CreateOrder_InsufficientBalance() public {
        address tokenAddress = address(tradeToken);
        uint256 amount = TOKEN_AMOUNT + 1;
        uint256 price = ORDER_PRICE;
        uint256 expirationHours = EXPIRATION_HOURS;

        vm.prank(user1);
        tradeToken.mint(user1, TOKEN_AMOUNT);
        vm.prank(user1);
        tradeToken.approve(address(tradingAccount), TOKEN_AMOUNT);
        vm.prank(user1);
        tradingAccount.deposit(address(tradeToken));

        vm.expectRevert(ITradingAccount.MinimumFundingRequired.selector);
        vm.prank(user1);
        tradingAccount.createOrder(
            tokenAddress,
            amount,
            price,
            expirationHours,
            bytes32(0)
        );
    }
    
    function test_CancelOrder_Success() public {
        uint256 amount = 50 ether;

        // Create an order first
        vm.prank(user1);
        tradeToken.mint(user1, amount);
        vm.prank(user1);
        tradeToken.approve(address(tradingAccount), amount);
        vm.prank(user1);
        tradingAccount.deposit(address(tradeToken));
        
        address tokenAddress = address(tradeToken);
        uint256 price = ORDER_PRICE;
        uint256 expirationHours = EXPIRATION_HOURS;
        
        vm.prank(user1);
        tradingAccount.createOrder(
            tokenAddress,
            amount,
            price,
            expirationHours,
            bytes32(0)
        );
        
        ITradingAccount.AccountData memory data = tradingAccount.getAccountData();
        bytes32 orderId = data.orders[0].orderId;
        
        vm.prank(user1);
        tradingAccount.cancelOrder(orderId);
        
        // Refetch the data
        data = tradingAccount.getAccountData();

        assertEq(data.cancelledOrders, 1);
    }
    
    function test_CancelOrder_OnlyApproved() public {
        uint256 amount = 50 ether;

        // Create an order first
        vm.prank(user1);
        tradeToken.mint(user1, amount);
        vm.prank(user1);
        tradeToken.approve(address(tradingAccount), amount);
        vm.prank(user1);
        tradingAccount.deposit(address(tradeToken));
        
        address tokenAddress = address(tradeToken);
        uint256 price = ORDER_PRICE;
        uint256 expirationHours = EXPIRATION_HOURS;
        
        vm.prank(user1);
        tradingAccount.createOrder(
            tokenAddress,
            amount,
            price,
            expirationHours,
            bytes32(0)
        );
        
        ITradingAccount.AccountData memory data = tradingAccount.getAccountData();
        bytes32 orderId = data.orders[0].orderId;

        vm.prank(unauthorizedUser);
        vm.expectRevert("Not approved account");
        tradingAccount.cancelOrder(orderId);
    }
    
    function test_CancelOrder_OrderNotFound() public {
        vm.prank(agent);
        vm.expectRevert(ITradingAccount.InvalidOrderId.selector);
        tradingAccount.cancelOrder(bytes32(0));
    }

    function test_CancelOrder_OrderNotActive() public {
        uint256 amount = 50 ether;

        vm.prank(user1);
        tradeToken.mint(user1, amount);

        vm.prank(user1);
        tradeToken.approve(address(tradingAccount), amount);

        vm.prank(user1);
        tradingAccount.deposit(address(tradeToken));
        
        address tokenAddress = address(tradeToken);
        uint256 price = ORDER_PRICE;
        uint256 expirationHours = EXPIRATION_HOURS;
        
        vm.prank(user1);
        assertEq(
            tradingAccount.createOrder(
                tokenAddress,
                amount,
                price,
                expirationHours,
                bytes32(0)
            ),
            true
        );
        ITradingAccount.AccountData memory data = tradingAccount.getAccountData();
        bytes32 orderId = data.orders[0].orderId;

        vm.prank(user1);
        tradingAccount.cancelOrder(orderId);
        
        // Try to cancel again
        vm.prank(user1);
        vm.expectRevert(ITradingAccount.OrderNotActive.selector);
        tradingAccount.cancelOrder(orderId);
    }

    function test_Withdraw_Success() public {
        // Deposit some ETH
        vm.deal(user1, 1 ether);
        vm.prank(user1);
        tradingAccount.deposit{value: 1 ether}(address(0));
        
        uint256 initialBalance = user1.balance;
        
        vm.prank(user1);
        tradingAccount.withdraw(address(0), 1 ether);
        
        assertTrue(user1.balance > initialBalance);
        assertEq(tradingAccount.getBalance(address(0)), 0);
    }

    function test_Withdraw_ERC20_Success() public {
        uint256 amount = 100 ether;
        // Deposit some tokens
        vm.prank(user1);
        tradeToken.mint(user1, amount);

        vm.prank(user1);
        tradeToken.approve(address(tradingAccount), amount);

        vm.prank(user1);
        tradingAccount.deposit(address(tradeToken));
        
        uint256 initialBalance = tradeToken.balanceOf(user1);
        
        vm.prank(user1);
        tradingAccount.withdraw(address(tradeToken), amount);
        
        assertEq(tradeToken.balanceOf(user1), initialBalance + amount);
        assertEq(tradingAccount.getBalance(address(tradeToken)), 0);
    }
    
    function test_Withdraw_OnlyOwner() public {
        vm.prank(unauthorizedUser);
        vm.expectRevert("Not approved account");
        tradingAccount.withdraw(address(0), 1 ether);
    }
    
    function test_Withdraw_InsufficientBalance() public {
        vm.prank(user1);
        vm.expectRevert(ITradingAccount.BalanceTooLow.selector);
        tradingAccount.withdraw(address(0), 1 ether);
    }
    
    function test_Pause_Success() public {        
        vm.prank(owner);
        tradingAccount.pause();
         
        assert(tradingAccount.paused());
    }
    
    function test_Pause_OnlyOwner() public {
        vm.expectRevert("custom error 118cdaa7:000000000000000000000000b8d67934956b11a9f49af9f88d4d5c39c9d44b67");
        vm.prank(unauthorizedUser);
        tradingAccount.pause();
    }

    // ============ VIEW FUNCTION TESTS ============
    
    function test_GetAccountData() public view {
        ITradingAccount.AccountData memory data = tradingAccount.getAccountData();
        
        assertEq(data.owner, user1);
        assertEq(data.orders.length, 0);
        assertEq(data.successfulOrders, 0);
        assertEq(data.cancelledOrders, 0);
        assertEq(data.sellerInfo.id, user1);
        assertEq(data.sellerInfo.nickName, abi.encode(nickName));
    }
    
    function test_GetBalance() public {
        // Mint tokens and approve
        vm.prank(user1);
        tradeToken.mint(user1, TOKEN_AMOUNT);
        vm.prank(user1);
        tradeToken.approve(address(tradingAccount), TOKEN_AMOUNT);
        
        // Deposit some tokens
        vm.prank(user1);
        tradingAccount.deposit(address(tradeToken));
        
        assertEq(tradingAccount.getBalance(address(tradeToken)), TOKEN_AMOUNT);
        assertEq(tradingAccount.getBalance(address(0)), 0);
    }
    
    function test_GetLockedBalance() public {
        // Initially no locked balance
        assertEq(tradingAccount.getLockedBalance(address(tradeToken)), 0);
        
        // Mint tokens and approve
        vm.prank(user1);
        tradeToken.mint(user1, TOKEN_AMOUNT);
        vm.prank(user1);
        tradeToken.approve(address(tradingAccount), TOKEN_AMOUNT);
        
        // Deposit and create order to lock balance
        vm.prank(user1);
        tradingAccount.deposit(address(tradeToken));
        
        address tokenAddress = address(tradeToken);
        uint256 amount = 50 ether;
        uint256 price = ORDER_PRICE;
        uint256 expirationHours = EXPIRATION_HOURS;
        
        vm.prank(user1);
        tradingAccount.createOrder(tokenAddress, amount, price, expirationHours, bytes32(0));
        
        // Check locked balance
        assertEq(tradingAccount.getLockedBalance(address(tradeToken)), amount);
    }
    
    // ============ EDGE CASES AND SECURITY TESTS ============
    
    function test_MultipleDeposits() public {
        // Mint tokens and approve for first deposit
        vm.prank(user1);
        tradeToken.mint(user1, TOKEN_AMOUNT);
        vm.prank(user1);
        tradeToken.approve(address(tradingAccount), TOKEN_AMOUNT);
        
        // First deposit
        vm.prank(user1);
        tradingAccount.deposit(address(tradeToken));
        
        // Mint more tokens and approve for second deposit
        vm.prank(user1);
        tradeToken.mint(user1, TOKEN_AMOUNT);
        vm.prank(user1);
        tradeToken.approve(address(tradingAccount), TOKEN_AMOUNT);
        
        // Second deposit
        vm.prank(user1);
        tradingAccount.deposit(address(tradeToken));
        
        // Should have double the amount
        assertEq(tradingAccount.getBalance(address(tradeToken)), TOKEN_AMOUNT * 2);
    }
    
    function test_MultipleOrders() public {
        // Mint tokens and approve
        vm.prank(user1);
        tradeToken.mint(user1, TOKEN_AMOUNT);
        vm.prank(user1);
        tradeToken.approve(address(tradingAccount), TOKEN_AMOUNT);
        
        // Deposit tokens
        vm.prank(user1);
        tradingAccount.deposit(address(tradeToken));
        
        address tokenAddress = address(tradeToken);
        uint256 amount = 50 ether;
        uint256 price = ORDER_PRICE;
        uint256 expirationHours = EXPIRATION_HOURS;
        
        // Create multiple orders
        vm.prank(user1);
        tradingAccount.createOrder(tokenAddress, amount, price, expirationHours, bytes32(0));
        
        vm.prank(user1);
        tradingAccount.createOrder(tokenAddress, amount, price, expirationHours, bytes32(0));
        
        ITradingAccount.AccountData memory data = tradingAccount.getAccountData();
        assertEq(data.orders.length, 2);
        
        // Check that both orders are active
        assertEq(uint256(data.orders[0].status), uint256(ITradingAccount.OrderStatus.ACTIVE));
        assertEq(uint256(data.orders[1].status), uint256(ITradingAccount.OrderStatus.ACTIVE));
    }
    
    function test_OrderCancellationAfterPause() public {
        // Mint tokens and approve
        vm.prank(user1);
        tradeToken.mint(user1, TOKEN_AMOUNT);
        vm.prank(user1);
        tradeToken.approve(address(tradingAccount), TOKEN_AMOUNT);
        
        // Create an order
        vm.prank(user1);
        tradingAccount.deposit(address(tradeToken));
        
        address tokenAddress = address(tradeToken);
        uint256 amount = 50 ether;
        uint256 price = ORDER_PRICE;
        uint256 expirationHours = EXPIRATION_HOURS;
        
        vm.prank(user1);
        tradingAccount.createOrder(tokenAddress, amount, price, expirationHours, bytes32(0));
        
        ITradingAccount.AccountData memory data = tradingAccount.getAccountData();
        bytes32 orderId = data.orders[0].orderId;
        
        // Pause the contract
        vm.prank(owner);
        tradingAccount.pause();
        
        // Try to cancel order when paused
        vm.prank(user1);
        vm.expectRevert(Pausable.EnforcedPause.selector);
        tradingAccount.cancelOrder(orderId);
    }
    
    function test_Unpause_Success() public {
        // First pause the contract
        vm.prank(owner);
        tradingAccount.pause();
        assertTrue(tradingAccount.paused());
        
        // Then unpause
        vm.prank(owner);
        tradingAccount.unpause();
        assertFalse(tradingAccount.paused());
    }
    
    function test_Unpause_OnlyOwner() public {
        // First pause the contract
        vm.prank(owner);
        tradingAccount.pause();
        
        // Try to unpause as unauthorized user
        vm.expectRevert();
        vm.prank(unauthorizedUser);
        tradingAccount.unpause();
    }
    
    // ============ GAS OPTIMIZATION TESTS ============
    
    function test_GasUsage_Deposit() public {
        // Mint tokens and approve
        vm.prank(user1);
        tradeToken.mint(user1, TOKEN_AMOUNT);
        vm.prank(user1);
        tradeToken.approve(address(tradingAccount), TOKEN_AMOUNT);
        
        uint256 gasBefore = gasleft();
        vm.prank(user1);
        tradingAccount.deposit(address(tradeToken));
        uint256 gasUsed = gasBefore - gasleft();
        
        console.log("Gas used for deposit:", gasUsed);
        assertTrue(gasUsed < 200000); // Reasonable gas limit
    }
    
    function test_GasUsage_CreateOrder() public {
        // Mint tokens and approve
        vm.prank(user1);
        tradeToken.mint(user1, TOKEN_AMOUNT);
        vm.prank(user1);
        tradeToken.approve(address(tradingAccount), TOKEN_AMOUNT);
        
        vm.prank(user1);
        tradingAccount.deposit(address(tradeToken));
        
        address tokenAddress = address(tradeToken);
        uint256 amount = 50 ether;
        uint256 price = ORDER_PRICE;
        uint256 expirationHours = EXPIRATION_HOURS;
        
        uint256 gasBefore = gasleft();
        vm.prank(user1);
        tradingAccount.createOrder(tokenAddress, amount, price, expirationHours, bytes32(0));
        uint256 gasUsed = gasBefore - gasleft();
        
        console.log("Gas used for createOrder:", gasUsed);
        assertTrue(gasUsed < 500000); // Reasonable gas limit
    }
    
    // ============ FOUNDRY FUZZ TESTS ============
    
    function testFuzz_Deposit(address token, uint256 amount) public {
        vm.assume(amount > 0);
        vm.assume(amount <= TOKEN_AMOUNT);
        
        if (token == address(0)) {
            vm.deal(user1, amount);
            vm.prank(user1);
            tradingAccount.deposit{value: amount}(token);
            assertEq(tradingAccount.getBalance(token), amount);
        } else {
            // For ERC20 tokens, we need to mint and approve
            MockERC20 tokenContract = new MockERC20(amount, "TestToken", "TT");
            tokenContract.mint(user1, amount);
            vm.prank(user1);
            tokenContract.approve(address(tradingAccount), amount);
            
            vm.prank(user1);
            tradingAccount.deposit(address(tokenContract));
            assertEq(tradingAccount.getBalance(address(tokenContract)), amount);
        }
    }
    
    
    function testFuzz_GetBalance(address token) public view {
        uint256 balance = tradingAccount.getBalance(token);
        assertTrue(balance >= 0);
    }
    
    // ============ ADDITIONAL COMPREHENSIVE TESTS ============
    
    function test_OrderExpiration() public {
        // Mint tokens and approve
        vm.prank(user1);
        tradeToken.mint(user1, TOKEN_AMOUNT);
        vm.prank(user1);
        tradeToken.approve(address(tradingAccount), TOKEN_AMOUNT);
        
        // Deposit tokens
        vm.prank(user1);
        tradingAccount.deposit(address(tradeToken));
        
        address tokenAddress = address(tradeToken);
        uint256 amount = 50 ether;
        uint256 price = ORDER_PRICE;
        uint256 expirationHours = 1; // 1 hour expiration
        
        vm.prank(user1);
        tradingAccount.createOrder(tokenAddress, amount, price, expirationHours, bytes32(0));
        
        ITradingAccount.AccountData memory data = tradingAccount.getAccountData();
        bytes32 orderId = data.orders[0].orderId;
        
        // Fast forward time past expiration
        vm.warp(block.timestamp + expirationHours * 3600 + 1);
        
        // Try to cancel expired order
        vm.prank(user1);
        vm.expectRevert(ITradingAccount.OrderExpired.selector);
        tradingAccount.cancelOrder(orderId);
    }
    
    function test_OrderFulfillment() public {
        // Mint tokens and approve
        vm.prank(user1);
        tradeToken.mint(user1, TOKEN_AMOUNT);
        vm.prank(user1);
        tradeToken.approve(address(tradingAccount), TOKEN_AMOUNT);
        
        // Deposit tokens
        vm.prank(user1);
        tradingAccount.deposit(address(tradeToken));
        
        address tokenAddress = address(tradeToken);
        uint256 amount = 50 ether;
        uint256 price = ORDER_PRICE;
        uint256 expirationHours = EXPIRATION_HOURS;
        
        vm.prank(user1);
        tradingAccount.createOrder(tokenAddress, amount, price, expirationHours, bytes32(0));
        
        ITradingAccount.AccountData memory data = tradingAccount.getAccountData();
        bytes32 orderId = data.orders[0].orderId;
        
        // Fulfill order (this would typically be called by the trade factory)
        vm.prank(address(tradeFactory));
        bool success = tradingAccount.fulfillOrder(orderId, user2, amount);
        assertTrue(success);
        
        // Check that order is fulfilled
        data = tradingAccount.getAccountData();
        assertEq(uint256(data.orders[0].status), uint256(ITradingAccount.OrderStatus.FULFILLED));
        assertEq(data.successfulOrders, 1);
    }
    
    function test_ExchangeValues() public {
        // Verify the payment token first
        vm.prank(user1);
        tradingAccount.toggleTokenVerificationStatus(address(paymentToken));
        
        // Deposit payment token
        vm.prank(user1);
        paymentToken.mint(user1, 1000 ether);
        vm.prank(user1);
        paymentToken.approve(address(tradingAccount), 1000 ether);
        vm.prank(user1);
        tradingAccount.deposit(address(paymentToken));
        
        uint256 totalCost = 100 ether;
        uint256 pricePerUnit = ORDER_PRICE;
        address tokenIn = address(paymentToken);
        address tokenOut = address(tradeToken);
        
        // This function would be called during order execution
        vm.prank(address(tradeFactory));
        bool success = tradingAccount.exchangeValues(totalCost, pricePerUnit, tokenIn, tokenOut);
        assertTrue(success);
    }
    
    
    function test_Deposit_WhenPaused() public {
        vm.prank(owner);
        tradingAccount.pause();
        
        vm.prank(user1);
        vm.expectRevert(Pausable.EnforcedPause.selector);
        tradingAccount.deposit(address(tradeToken));
    }
    
    
    function test_AgentPermissions() public {
        // Test that agent can perform operations
        uint256 depositAmount = 100 ether;
        
        vm.prank(agent);
        tradeToken.mint(agent, depositAmount);
        vm.prank(agent);
        tradeToken.approve(address(tradingAccount), depositAmount);
        vm.prank(agent);
        tradingAccount.deposit(address(tradeToken));
        
        assertEq(tradingAccount.getBalance(address(tradeToken)), depositAmount);
    }
    
    function test_UnauthorizedAccess() public {
        // Test that unauthorized users cannot perform operations
        vm.prank(unauthorizedUser);
        vm.expectRevert("Not approved account");
        tradingAccount.deposit(address(tradeToken));
        
        vm.prank(unauthorizedUser);
        vm.expectRevert("Not approved account");
        tradingAccount.createOrder(address(tradeToken), 50 ether, ORDER_PRICE, EXPIRATION_HOURS, bytes32(0));
        
        vm.prank(unauthorizedUser);
        vm.expectRevert("Not approved account");
        tradingAccount.withdraw(address(tradeToken), 50 ether);
    }
}

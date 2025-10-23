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
    // TradingAccount internal tradingAccount;
    // TradeFactory internal tradeFactory;

    // MockERC20 internal tradeToken;
    // MockERC20 internal paymentToken;
    // address internal tradeFactoryAddr;
    
    // // Test accounts
    // address internal owner;
    // address internal agent;
    // address internal user1;
    // address internal user2;
    // address internal unauthorizedUser;
    // uint256 constant creationFee = 1e15 wei;
    // uint256 constant platformFee = 50;
    
    // // Test constants
    // string internal nickName;
    // uint256 constant TOKEN_AMOUNT = 1000 ether;
    // uint256 constant ORDER_PRICE = 1e17 wei;
    // uint256 constant EXPIRATION_HOURS = 24;
    // uint256 constant EXTRA_EXPIRATION_HOURS = 168; // 7 days
    
    // // Events
    // event OrderCreated(bytes32 indexed orderId, address indexed user, uint256 indexed orderIndex, uint256 amount, uint256 price, bool useLivePrice, bytes32 nickname);
    // event OrderCancelled(bytes32 indexed orderId, address indexed user);
    // event OrderExecuted(bytes32 indexed orderId, address indexed buyer, address indexed seller);
    // event OrderActivated(bytes32 indexed orderId, uint256 newDuration);
    // event WithdrawalRequested(address indexed token, uint256 amount, uint256 cooldownEnd);
    // event WithdrawalProcessed(address indexed token, uint256 amount, address indexed to);
    // event ExecutionToggled(bool isPaused);
    
    // function setUp() public {
    //     owner = address(this);
    //     user1 = makeAddr("user1");
    //     user2 = makeAddr("user2");
    //     agent = makeAddr("user3");
    //     unauthorizedUser = makeAddr("unauthorizedUser");
    //     nickName = "Bobelr";

    //     tradeFactory = new TradeFactory();
    //     tradeFactoryAddr = address(tradeFactory);
        
    //     // Deploy mock token
    //     tradeToken = new MockERC20(TOKEN_AMOUNT, "Test TradeToken", "TTT");
    //     paymentToken = new MockERC20(TOKEN_AMOUNT, "Test PaymentToken", "TPT");
        
    //     // Deploy trading account
    //     vm.prank(user1);
    //     address tradingAccountAddr = tradeFactory.createTradingAccount(agent, nickName);
    //     tradingAccount = TradingAccount(payable(tradingAccountAddr));

    //     // Update state variables and parameters
    //     tradeFactory.setSupportedPaymentAsset(address(paymentToken));
    // }
    
    // // ============ CONSTRUCTOR TESTS ============
    
    // function test_Constructor_Success() public {
    //     ITradeFactory.FactoryData memory data = tradeFactory.getFactoryData(user1);
    //     assertNotEq(data.variables.alc.tradingAccount, address(0));
    //     assertEq(data.accounts.length, 1);
    //     assertEq(data.variables.alc.tradingAccount, data.accounts[0].tradingAccount);
    //     assertEq(data.platformFee, platformFee);
    //     assertEq(data.totalFees, 0);
    //     assertEq(data.isPaused, false);
    //     assertEq(data.owner, address(this));
    //     assertEq(data.totalAccounts, data.accounts.length);
    //     assertEq(data.variables.alc.user, user1);
    //     assertEq(data.variables.creationFee, creationFee);
    //     assertEq(data.variables.supportedPaymentAsset.token, address(paymentToken));
    // }
    
    // // ============ DEPOSIT TESTS ============
    //  function test_Deposit_OnlyApproved() public {
    //     uint256 depositAmount = 1 ether;
        
    //     vm.deal(unauthorizedUser, depositAmount);
    //     vm.prank(unauthorizedUser);
    //     vm.expectRevert("Not approved account");
    //     tradingAccount.deposit{value: depositAmount}(address(0));
    // }
    
    // function test_Deposit_InvalidAmount() public {
    //     vm.prank(user1);
    //     vm.expectRevert(ITradingAccount.InvalidAmount.selector);
    //     tradingAccount.deposit(address(tradeToken));
    // }
    
    // function test_Deposit_InsufficientBalance() public {
    //     uint256 depositAmount = TOKEN_AMOUNT + 1;
        
    //     vm.prank(user1);
    //     vm.expectRevert(ITradingAccount.InvalidAmount.selector);
    //     tradingAccount.deposit(address(tradeToken));
    // }

    // function test_Deposit_ETH_Success() public {
    //     uint256 depositAmount = 1 ether;
        
    //     vm.deal(user1, depositAmount);
    //     vm.prank(user1);
    //     tradingAccount.deposit{value: depositAmount}(address(0));
        
    //     assertEq(tradingAccount.getBalance(address(0)), depositAmount);
    // }

    // function test_Deposit_ETH_By_Agent_Success() public {
    //     uint256 depositAmount = 1 ether;
        
    //     vm.deal(agent, depositAmount);
    //     vm.prank(agent);
    //     tradingAccount.deposit{value: depositAmount}(address(0));
        
    //     assertEq(tradingAccount.getBalance(address(0)), depositAmount);
    // }


    // ////////////////////////////

      
    // // Seller deposit themselves
    // function test_Deposit_ERC20_Success() public {
    //     uint256 depositAmount = 100 ether;
        
    //     vm.prank(user1);
    //     tradeToken.mint(user1, depositAmount);
    //     vm.prank(user1);
    //     tradeToken.approve(address(tradingAccount), depositAmount);
    //     vm.prank(user1);
    //     tradingAccount.deposit(address(tradeToken));
        
    //     assertEq(tradingAccount.getBalance(address(tradeToken)), depositAmount);
    //     assertEq(tradeToken.balanceOf(address(tradingAccount)), depositAmount);
    // }

    // function test_Deposit_ERC20_By_Agent_Success() public {
    //     uint256 depositAmount = 100 ether;
        
    //     vm.prank(agent);
    //     tradeToken.mint(agent, depositAmount);
    //     vm.prank(agent);
    //     tradeToken.approve(address(tradingAccount), depositAmount);
    //     vm.prank(agent);
    //     tradingAccount.deposit(address(tradeToken));
        
    //     assertEq(tradingAccount.getBalance(address(tradeToken)), depositAmount);
    //     assertEq(tradeToken.balanceOf(address(tradingAccount)), depositAmount);
    // }

    // ///////////////////////////////
    
    
    // function test_CreateOrder_Success() public {
    //     uint256 amount = 50 ether;
    //     // First deposit some tokens
    //     vm.prank(user1);
    //     tradeToken.mint(user1, amount);
    //     vm.prank(user1);
    //     tradeToken.approve(address(tradingAccount), amount);
    //     vm.prank(user1);
    //     tradingAccount.deposit(address(tradeToken));
        
    //     address tokenAddress = address(tradeToken);
    //     uint256 price = ORDER_PRICE;
    //     uint256 expirationHours = EXPIRATION_HOURS;

    //     vm.prank(user1);        
    //     assertEq(
    //         tradingAccount.createOrder(
    //             tokenAddress,
    //             amount,
    //             price,
    //             expirationHours
    //         ),
    //         true
    //     );
        
    //     ITradingAccount.AccountData memory data = tradingAccount.getAccountData();
    //     assertEq(data.orders.length, 1);
    // }
    
    // function test_CreateOrder_OnlyApproved() public {
    //     address tokenAddress = address(tradeToken);
    //     uint256 amount = 50 ether;
    //     uint256 price = ORDER_PRICE;
    //     uint256 expirationHours = EXPIRATION_HOURS;
    //     bytes32 nickname = keccak256("TestOrder");
        
    //     vm.prank(unauthorizedUser);
    //     vm.expectRevert("Not approved account");
    //     tradingAccount.createOrder(
    //         tokenAddress,
    //         amount,
    //         price,
    //         expirationHours
    //     );
    // }
    
    // function test_CreateOrder_InvalidAmount() public {
    //     address tokenAddress = address(tradeToken);
    //     uint256 amount = 0;
    //     uint256 price = ORDER_PRICE;
    //     uint256 expirationHours = EXPIRATION_HOURS;
        
    //     vm.prank(user1);
    //     vm.expectRevert(ITradingAccount.InvalidAmount.selector);
    //     tradingAccount.createOrder(
    //         tokenAddress,
    //         amount,
    //         price,
    //         expirationHours
    //     );
    // }

    // function test_CreateOrder_InsufficientBalance() public {
    //     address tokenAddress = address(tradeToken);
    //     uint256 amount = TOKEN_AMOUNT + 1;
    //     uint256 price = ORDER_PRICE;
    //     uint256 expirationHours = EXPIRATION_HOURS;
    //     bytes32 nickname = keccak256("TestOrder");

    //     vm.prank(user1);
    //     vm.expectRevert(ITradingAccount.MinimumFundingRequired.selector);
    //     tradingAccount.createOrder(
    //         tokenAddress,
    //         amount,
    //         price,
    //         expirationHours
    //     );
    // }
    
    // function test_CreateOrder_WhenPaused() public {
    //     // tradingAccount.pause(); // Function doesn't exist
        
    //     address tokenAddress = address(tradeToken);
    //     uint256 amount = 50 ether;
    //     uint256 price = ORDER_PRICE;
    //     uint256 expirationHours = EXPIRATION_HOURS;

    //     vm.prank(owner);
    //     tradingAccount.pause();
        
    //     vm.prank(user1);
    //     vm.expectRevert(Pausable.EnforcedPause.selector);
    //     tradingAccount.createOrder(
    //         tokenAddress,
    //         amount,
    //         price,
    //         expirationHours
    //     );
    // }

    
    // function test_CancelOrder_Success() public {
    //     uint256 amount = 50 ether;

    //     // Create an order first
    //     vm.prank(user1);
    //     tradeToken.mint(user1, amount);
    //     vm.prank(user1);
    //     tradeToken.approve(address(tradingAccount), amount);
    //     vm.prank(user1);
    //     tradingAccount.deposit(address(tradeToken));
        
    //     address tokenAddress = address(tradeToken);
    //     uint256 price = ORDER_PRICE;
    //     uint256 expirationHours = EXPIRATION_HOURS;
        
    //     vm.prank(user1);
    //     assertEq(
    //         tradingAccount.createOrder(
    //             tokenAddress,
    //             amount,
    //             price,
    //             expirationHours
    //         ),
    //         true
    //     );
        

    //     ITradingAccount.AccountData memory data = tradingAccount.getAccountData();
    //     bytes32 orderId = data.orders[0].orderId;
        
    //     vm.prank(user1);
    //     tradingAccount.cancelOrder(orderId);
        
    //     // Refetch the data
    //     data = tradingAccount.getAccountData();

    //     assertEq(data.cancelledOrders, 1);
    // }
    
    // function test_CancelOrder_OnlyApproved() public {
    //     vm.prank(unauthorizedUser);
    //     vm.expectRevert("Not approved account");
    //     tradingAccount.cancelOrder(bytes32(0));
    // }
    
    // function test_CancelOrder_OrderNotFound() public {
    //     vm.prank(agent);
    //     vm.expectRevert(ITradingAccount.InvalidOrderId.selector);
    //     tradingAccount.cancelOrder(bytes32(0));
    // }

    // function test_CancelOrder_OrderNotActive() public {
    //     uint256 amount = 50 ether;

    //     vm.prank(user1);
    //     tradeToken.mint(user1, amount);

    //     vm.prank(user1);
    //     tradeToken.approve(address(tradingAccount), amount);

    //     vm.prank(user1);
    //     tradingAccount.deposit(address(tradeToken));
        
    //     address tokenAddress = address(tradeToken);
    //     uint256 price = ORDER_PRICE;
    //     uint256 expirationHours = EXPIRATION_HOURS;
        
    //     vm.prank(user1);
    //     assertEq(
    //         tradingAccount.createOrder(
    //             tokenAddress,
    //             amount,
    //             price,
    //             expirationHours
    //         ),
    //         true
    //     );
    //     ITradingAccount.AccountData memory data = tradingAccount.getAccountData();
    //     bytes32 orderId = data.orders[0].orderId;

    //     vm.prank(user1);
    //     tradingAccount.cancelOrder(orderId);
        
    //     // Try to cancel again
    //     vm.prank(user1);
    //     vm.expectRevert(ITradingAccount.OrderNotActive.selector);
    //     tradingAccount.cancelOrder(orderId);
    // }

    // function test_Withdraw_Success() public {
    //     // Deposit some ETH
    //     vm.deal(user1, 1 ether);
    //     vm.prank(user1);
    //     tradingAccount.deposit{value: 1 ether}(address(0));
        
    //     uint256 initialBalance = user1.balance;
        
    //     vm.prank(user1);
    //     tradingAccount.withdraw(address(0), 1 ether);
        
    //     assertTrue(user1.balance > initialBalance);
    //     assertEq(tradingAccount.getBalance(address(0)), 0);
    // }

    // function test_Withdraw_ERC20_Success() public {
    //     uint256 amount = 100 ether;
    //     // Deposit some tokens
    //     vm.prank(user1);
    //     tradeToken.mint(user1, amount);

    //     vm.prank(user1);
    //     tradeToken.approve(address(tradingAccount), amount);

    //     vm.prank(user1);
    //     tradingAccount.deposit(address(tradeToken));
        
    //     uint256 initialBalance = tradeToken.balanceOf(user1);
        
    //     vm.prank(user1);
    //     tradingAccount.withdraw(address(tradeToken), amount);
        
    //     assertEq(tradeToken.balanceOf(user1), initialBalance + amount);
    //     assertEq(tradingAccount.getBalance(address(tradeToken)), 0);
    // }
    
    // function test_Withdraw_OnlyOwner() public {
    //     vm.prank(unauthorizedUser);
    //     vm.expectRevert("Not approved account");
    //     tradingAccount.withdraw(address(0), 1 ether);
    // }
    
    // function test_Withdraw_InsufficientBalance() public {
    //     vm.prank(user1);
    //     vm.expectRevert("custom error a3281672");
    //     tradingAccount.withdraw(address(0), 1 ether);
    // }
    
    // function test_Withdraw_WhenPaused() public {
    //     // Deposit some ETH
    //     vm.deal(user1, 1 ether);
    //     vm.prank(user1);
    //     tradingAccount.deposit{value: 1 ether}(address(0));
                
    //     vm.prank(user1);
    //     vm.expectRevert("Pausable: paused");
    //     tradingAccount.withdraw(address(0), 1 ether);
    // }

    // function test_Pause_Success() public {        
    //     vm.prank(owner);
    //     tradingAccount.pause();
         
    //     assert(tradingAccount.paused());
    // }
    
    // function test_Pause_OnlyOwner() public {
    //     vm.expectRevert("custom error 118cdaa7:000000000000000000000000b8d67934956b11a9f49af9f88d4d5c39c9d44b67");
    //     vm.prank(unauthorizedUser);
    //     tradingAccount.pause();
    // }

    ///////////////////////////////////////////
    
    
    // // ============ EXECUTION TOGGLE TESTS ============
    
    
    // // ============ VIEW FUNCTION TESTS ============
    
    // function test_GetAccountData() public {
    //     ITradingAccount.AccountData memory data = tradingAccount.getAccountData();
        
    //     assertEq(data.owner, user1);
    //     assertEq(data.tradeFactory, tradeFactory);
    //     assertEq(data.orders.length, 0);
    //     assertEq(data.successfulOrders, 0);
    //     assertEq(data.cancelledOrders, 0);
    //     // cooldownPeriod is not part of AccountData struct
    //     assertEq(data.activeOrderCount, 0);
    // }
    
    // function test_GetBalance() public {
    //     // Deposit some tokens
    //     vm.prank(user1);
    //     tradingAccount.deposit(address(tradeToken));
        
    //     assertEq(tradingAccount.getBalance(address(tradeToken)), 100 ether);
    //     assertEq(tradingAccount.getBalance(address(0)), 0);
    // }
    
    // function test_GetWithdrawalRequest() public {
    //     // This would require implementing withdraw request functionality
    //     // For now, we'll test the basic structure
    //     assertTrue(true); // Placeholder
    // }
    
    // function test_GetTradeFactory() public {
    //     // assertEq(tradingAccount.getTradeFactory(), tradeFactory); // Function doesn't exist
    //     assertTrue(true); // Placeholder
    // }
    
    // // ============ EDGE CASES AND SECURITY TESTS ============
    
    // function test_MultipleDeposits() public {
    //     // Deposit multiple times
    //     vm.prank(user1);
    //     tradingAccount.deposit(address(tradeToken));
        
    //     vm.prank(user1);
    //     tradingAccount.deposit(address(tradeToken));
        
    //     assertEq(tradingAccount.getBalance(address(tradeToken)), 80 ether);
    // }
    
    // function test_MultipleOrders() public {
    //     // Deposit tokens
    //     vm.prank(user1);
    //     tradingAccount.deposit(address(tradeToken));
        
    //     address tokenAddress = address(tradeToken);
    //     uint256 amount = 50 ether;
    //     uint256 price = ORDER_PRICE;
    //     uint256 expirationHours = EXPIRATION_HOURS;
    //     bytes32 nickname = keccak256("TestOrder");
        
    //     // Create multiple orders
    //     tradingAccount.createOrder(tokenAddress, amount, price, expirationHours);
    //     tradingAccount.createOrder(tokenAddress, amount, price, expirationHours);
        
    //     ITradingAccount.AccountData memory data = tradingAccount.getAccountData();
    //     assertEq(data.orders.length, 2);
    //     assertEq(data.activeOrderCount, 2);
    // }
    
    // function test_OrderCancellationAfterPause() public {
    //     // Create an order
    //     vm.prank(user1);
    //     tradingAccount.deposit(address(tradeToken));
        
    //     address tokenAddress = address(tradeToken);
    //     uint256 amount = 50 ether;
    //     uint256 price = ORDER_PRICE;
    //     uint256 expirationHours = EXPIRATION_HOURS;
    //     bytes32 nickname = keccak256("TestOrder");
        
    //     assertEq(
    //         tradingAccount.createOrder(
    //             tokenAddress,
    //             amount,
    //             price,
    //             expirationHours
    //         ),
    //         true
    //     );
        
    //     // Pause and try to cancel
    //     // tradingAccount.pause(); // Function doesn't exist
        
    //     vm.expectRevert("Pausable: paused");
    //     tradingAccount.cancelOrder(orderId);
    // }
    
    // function test_ReentrancyProtection() public {
    //     // This test would require a malicious contract to test reentrancy
    //     // For now, we'll just ensure the contract has reentrancy guards
    //     assertTrue(true); // Placeholder for reentrancy test
    // }
    
    // // ============ GAS OPTIMIZATION TESTS ============
    
    // function test_GasUsage_Deposit() public {
    //     uint256 gasBefore = gasleft();
    //     vm.prank(user1);
    //     tradingAccount.deposit(address(tradeToken));
    //     uint256 gasUsed = gasBefore - gasleft();
        
    //     console.log("Gas used for deposit:", gasUsed);
    //     assertTrue(gasUsed < 200000); // Reasonable gas limit
    // }
    
    // function test_GasUsage_CreateOrder() public {
    //     vm.prank(user1);
    //     tradingAccount.deposit(address(tradeToken));
        
    //     address tokenAddress = address(tradeToken);
    //     uint256 amount = 50 ether;
    //     uint256 price = ORDER_PRICE;
    //     uint256 expirationHours = EXPIRATION_HOURS;
    //     bytes32 nickname = keccak256("TestOrder");
        
    //     uint256 gasBefore = gasleft();
    //     tradingAccount.createOrder(tokenAddress, amount, price, expirationHours);
    //     uint256 gasUsed = gasBefore - gasleft();
        
    //     console.log("Gas used for createOrder:", gasUsed);
    //     assertTrue(gasUsed < 500000); // Reasonable gas limit
    // }
    
    // // ============ FOUNDRY FUZZ TESTS ============
    
    // function testFuzz_Deposit(address token, uint256 amount) public {
    //     vm.assume(amount > 0);
    //     vm.assume(amount <= TOKEN_AMOUNT);
        
    //     if (token == address(0)) {
    //         vm.deal(user1, amount);
    //         vm.prank(user1);
    //         tradingAccount.deposit{value: amount}(token);
    //         assertEq(tradingAccount.getBalance(token), amount);
    //     } else {
    //         // For ERC20 tokens, we need to mint and approve
    //         MockERC20 tokenContract = new MockERC20(amount);
    //         tokenContract.mint(user1, amount);
    //         vm.prank(user1);
    //         tokenContract.approve(address(tradingAccount), amount);
            
    //         vm.prank(user1);
    //         tradingAccount.deposit(token);
    //         assertEq(tradingAccount.getBalance(token), amount);
    //     }
    // }
    
    
    // function testFuzz_GetBalance(address token) public {
    //     uint256 balance = tradingAccount.getBalance(token);
    //     assertTrue(balance >= 0);
    // }
}

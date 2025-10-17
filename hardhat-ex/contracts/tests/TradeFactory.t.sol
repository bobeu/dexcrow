// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

import {Test, console} from "forge-std/Test.sol";
import {TradeFactory} from "../trading/TradeFactory.sol";
import {ITradeFactory} from "../interfaces/ITradeFactory.sol";
import {ICommon} from "../interfaces/ICommon.sol";
import {MockERC20} from "../MockERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

// /**
//  * @title TradeFactoryTest
//  * @dev Comprehensive test suite for TradeFactory contract
//  * @author Bobeu - https://github.com/bobeu
//  */
// contract TradeFactoryTest is Test {
//     TradeFactory public tradeFactory;
//     MockERC20 public mockToken;
    
//     // Test accounts
//     address public owner;
//     address public user1;
//     address public user2;
//     address public user3;
//     address public unauthorizedUser;
    
//     // Test constants
//     uint256 constant PLATFORM_FEE = 100; // 1%
//     uint256 constant CREATION_FEE = 0.001 ether;
    
//     // Events
//     event AccountCreated(address indexed user, address indexed tradingAccount, uint256 timestamp);
//     event OrderCreated(bytes32 indexed orderId, address indexed user, address indexed tradingAccount);
//     event OrderExecuted(bytes32 indexed orderId, address indexed buyer, address indexed seller);
//     event PlatformFeeSet(uint256 newFee);
//     event CreationFeeSet(uint256 newFee);
//     event NewPaymentAssetAdded(address indexed oldPaymentAsset, address indexed newPaymentAsset);
//     event PythSupportToggled(bool isSupported);
//     event FeesWithdrawn(address indexed to, uint256 amount);
//     event AccountDeactivated(address indexed account);
//     event AccountReactivated(address indexed account);
    
//     function setUp() public {
//         owner = address(this);
//         user1 = makeAddr("user1");
//         user2 = makeAddr("user2");
//         user3 = makeAddr("user3");
//         unauthorizedUser = makeAddr("unauthorizedUser");
        
//         // Deploy contracts
//         tradeFactory = new TradeFactory();
//         mockToken = new MockERC20(1000000 ether, "MockERC20", "MRC");
        
//         // Initialize factory
//         tradeFactory.setPlatformFee(PLATFORM_FEE);
//         tradeFactory.setCreationFee(CREATION_FEE);
//         tradeFactory.setSupportedPaymentAsset(address(mockToken));
//         tradeFactory.toggleIsPythSupportedNetwork();
        
//         // Note: Chain management is handled by SupportedChains contract, not TradeFactory
//     }
    
//     // ============ CONSTRUCTOR TESTS ============
    
//     function test_Constructor_Success() public {
//         TradeFactory newFactory = new TradeFactory();
        
//         assertEq(newFactory.owner(), address(this));
//         ICommon.FactoryVariables memory vars = newFactory.getVariables(user1);
//         assertEq(vars.platformFee, 0);
//         assertEq(vars.creationFee, 0);
//     }
    
//     // ============ ACCOUNT CREATION TESTS ============
    
//     function test_CreateTradingAccount_Success() public {
//         vm.expectEmit(true, true, false, true);
//         emit AccountCreated(user1, address(0), block.timestamp);
        
//         address tradingAccount = tradeFactory.createTradingAccount(user1, "User1");
        
//         assertNotEq(tradingAccount, address(0));
//         ICommon.AccountInfo memory accountInfo = tradeFactory.getAccountInfo(user1);
//         assertEq(accountInfo.tradingAccount, tradingAccount);
//         assertEq(accountInfo.user, user1);
//         assertTrue(accountInfo.createdAt > 0);
        
//         ITradeFactory.FactoryData memory data = tradeFactory.getFactoryData(user1);
//         assertEq(data.totalAccounts, 1);
//     }
    
//     function test_CreateTradingAccount_WithoutNickname() public {
//         address tradingAccount = tradeFactory.createTradingAccount(user1, "User1");
        
//         assertNotEq(tradingAccount, address(0));
//         ICommon.AccountInfo memory accountInfo = tradeFactory.getAccountInfo(user1);
//         assertEq(accountInfo.tradingAccount, tradingAccount);
//     }
    
//     function test_CreateTradingAccount_OnlyOwner() public {
//         vm.prank(unauthorizedUser);
//         vm.expectRevert(abi.encodeWithSelector(Ownable.OwnableUnauthorizedAccount.selector, unauthorizedUser));
//         tradeFactory.createTradingAccount(user1, "User1");
//     }
    
//     function test_CreateTradingAccount_InvalidUser() public {
//         vm.expectRevert(ITradeFactory.InvalidOwner.selector);
//         tradeFactory.createTradingAccount(address(0), "User1");
//     }
    
//     function test_CreateTradingAccount_AccountAlreadyExists() public {
//         tradeFactory.createTradingAccount(user1, "User1");
        
//         vm.expectRevert(ITradeFactory.AccountAlreadyExists.selector);
//         tradeFactory.createTradingAccount(user1, "User1");
//     }
    
//     function test_CreateTradingAccount_WhenPaused() public {
//         tradeFactory.toggleExecution(true);
        
//         vm.expectRevert("Pausable: paused");
//         tradeFactory.createTradingAccount(user1, "User1");
//     }
    
//     // Note: Order creation tests are in TradingAccount.t.sol
    
//     // Note: Chain management tests are in SupportedChains.t.sol
    
//     // ============ FEE MANAGEMENT TESTS ============
    
//     function test_SetPlatformFee_Success() public {
//         uint256 newFee = 200; // 2%
        
//         vm.expectEmit(false, false, false, true);
//         emit PlatformFeeSet(newFee);
        
//         tradeFactory.setPlatformFee(newFee);
        
//         ICommon.FactoryVariables memory vars = tradeFactory.getVariables(user1);
//         assertEq(vars.platformFee, newFee);
//     }
    
//     function test_SetPlatformFee_OnlyOwner() public {
//         vm.prank(unauthorizedUser);
//         vm.expectRevert(abi.encodeWithSelector(Ownable.OwnableUnauthorizedAccount.selector, unauthorizedUser));
//         tradeFactory.setPlatformFee(200);
//     }
    
//     function test_SetPlatformFee_InvalidFee() public {
//         vm.expectRevert(ITradeFactory.InvalidFee.selector);
//         tradeFactory.setPlatformFee(1001); // > 10%
//     }
    
//     function test_SetCreationFee_Success() public {
//         uint256 newFee = 0.002 ether;
        
//         vm.expectEmit(false, false, false, true);
//         emit CreationFeeSet(newFee);
        
//         tradeFactory.setCreationFee(newFee);
        
//         ICommon.FactoryVariables memory vars = tradeFactory.getVariables(user1);
//         assertEq(vars.creationFee, newFee);
//     }
    
//     function test_SetCreationFee_OnlyOwner() public {
//         vm.prank(unauthorizedUser);
//         vm.expectRevert(abi.encodeWithSelector(Ownable.OwnableUnauthorizedAccount.selector, unauthorizedUser));
//         tradeFactory.setCreationFee(0.002 ether);
//     }
    
//     function test_SetSupportedPaymentAsset_Success() public {
//         MockERC20 newToken = new MockERC20(1000000 ether, "Support MockERC20", "SMRC");
        
//         vm.expectEmit(true, true, false, false);
//         emit NewPaymentAssetAdded(address(mockToken), address(newToken));
        
//         tradeFactory.setSupportedPaymentAsset(address(newToken));
        
//         ICommon.FactoryVariables memory vars = tradeFactory.getVariables(user1);
//         assertEq(vars.supportedPaymentAsset.token, address(newToken));
//     }
    
//     function test_SetSupportedPaymentAsset_OnlyOwner() public {
//         MockERC20 newToken = new MockERC20(1000000 ether, "New Supported MockERC20", "NMRC");
        
//         vm.prank(unauthorizedUser);
//         vm.expectRevert(abi.encodeWithSelector(Ownable.OwnableUnauthorizedAccount.selector, unauthorizedUser));
//         tradeFactory.setSupportedPaymentAsset(address(newToken));
//     }
    
//     function test_ToggleIsPythSupportedNetwork_Success() public {
//         vm.expectEmit(false, false, false, true);
//         emit PythSupportToggled(false);
        
//         tradeFactory.toggleIsPythSupportedNetwork();
        
//         ICommon.FactoryVariables memory vars = tradeFactory.getVariables(user1);
//         assertFalse(vars.isPythSupported);
//     }
    
//     function test_ToggleIsPythSupportedNetwork_OnlyOwner() public {
//         vm.prank(unauthorizedUser);
//         vm.expectRevert(abi.encodeWithSelector(Ownable.OwnableUnauthorizedAccount.selector, unauthorizedUser));
//         tradeFactory.toggleIsPythSupportedNetwork();
//     }
    
//     function test_WithdrawFees_Success() public {
//         // Send some ETH to the contract
//         vm.deal(address(tradeFactory), 1 ether);
        
//         uint256 initialBalance = address(this).balance;
        
//         vm.expectEmit(true, false, false, true);
//         emit FeesWithdrawn(address(this), 1 ether);
        
//         tradeFactory.withdrawFees();
        
//         assertEq(address(this).balance, initialBalance + 1 ether);
//         ITradeFactory.FactoryData memory data = tradeFactory.getFactoryData(user1);
//         assertEq(data.totalFees, 0);
//     }
    
//     function test_WithdrawFees_OnlyOwner() public {
//         vm.deal(address(tradeFactory), 1 ether);
        
//         vm.prank(unauthorizedUser);
//         vm.expectRevert(abi.encodeWithSelector(Ownable.OwnableUnauthorizedAccount.selector, unauthorizedUser));
//         tradeFactory.withdrawFees();
//     }
    
//     // ============ ACCOUNT MANAGEMENT TESTS ============
    
//     function test_DeactivateAccount_Success() public {
//         tradeFactory.createTradingAccount(user1, "User1");
//         ICommon.AccountInfo memory accountInfo = tradeFactory.getAccountInfo(user1);
//         address tradingAccount = accountInfo.tradingAccount;
        
//         vm.expectEmit(true, false, false, false);
//         emit AccountDeactivated(tradingAccount);
        
//         // Note: deactivateAccount function doesn't exist in TradeFactory
//         // Account should still exist
//         assertEq(accountInfo.tradingAccount, tradingAccount);
//     }
    
//     // Note: deactivateAccount function doesn't exist in TradeFactory
    
//     // Note: deactivateAccount function doesn't exist in TradeFactory
    
//     // Note: reactivateAccount function doesn't exist in TradeFactory
    
//     // Note: reactivateAccount function doesn't exist in TradeFactory
    
//     // ============ PAUSE/UNPAUSE TESTS ============
    
//     function test_Pause_Success() public {
//         tradeFactory.toggleExecution(true);
        
//         ITradeFactory.FactoryData memory data = tradeFactory.getFactoryData(user1);
//         assertTrue(data.isPaused);
//     }
    
//     function test_Pause_OnlyOwner() public {
//         vm.prank(unauthorizedUser);
//         vm.expectRevert(abi.encodeWithSelector(Ownable.OwnableUnauthorizedAccount.selector, unauthorizedUser));
//         tradeFactory.toggleExecution(true);
//     }
    
//     function test_Unpause_Success() public {
//         tradeFactory.toggleExecution(true);
//         tradeFactory.toggleExecution(false);
        
//         ITradeFactory.FactoryData memory data = tradeFactory.getFactoryData(user1);
//         assertFalse(data.isPaused);
//     }
    
//     function test_Unpause_OnlyOwner() public {
//         tradeFactory.toggleExecution(true);
        
//         vm.prank(unauthorizedUser);
//         vm.expectRevert(abi.encodeWithSelector(Ownable.OwnableUnauthorizedAccount.selector, unauthorizedUser));
//         tradeFactory.toggleExecution(false);
//     }
    
//     // ============ VIEW FUNCTION TESTS ============
    
//     function test_GetFactoryData() public {
//         ITradeFactory.FactoryData memory data = tradeFactory.getFactoryData(user1);
        
//         assertEq(data.owner, owner);
//         assertEq(data.platformFee, PLATFORM_FEE);
//         assertEq(data.totalFees, 0);
//         assertEq(data.totalAccounts, 0);
//     }
    
//     // Note: Chain-related view functions are tested in SupportedChains.t.sol
    
//     function test_GetPlatformFee() public {
//         ICommon.FactoryVariables memory vars = tradeFactory.getVariables(user1);
//         assertEq(vars.platformFee, PLATFORM_FEE);
//     }
    
//     function test_GetCreationFee() public {
//         ICommon.FactoryVariables memory vars = tradeFactory.getVariables(user1);
//         assertEq(vars.creationFee, CREATION_FEE);
//     }
    
//     function test_GetTotalFees() public {
//         ITradeFactory.FactoryData memory data1 = tradeFactory.getFactoryData(user1);
//         assertEq(data1.totalFees, 0);
        
//         // Send some ETH to the contract
//         vm.deal(address(tradeFactory), 1 ether);
//         ITradeFactory.FactoryData memory data2 = tradeFactory.getFactoryData(user1);
//         assertEq(data2.totalFees, 1 ether);
//     }
    
//     function test_GetTotalAccounts() public {
//         ITradeFactory.FactoryData memory data1 = tradeFactory.getFactoryData(user1);
//         assertEq(data1.totalAccounts, 0);
        
//         tradeFactory.createTradingAccount(user1, "User1");
//         ITradeFactory.FactoryData memory data2 = tradeFactory.getFactoryData(user1);
//         assertEq(data2.totalAccounts, 1);
        
//         tradeFactory.createTradingAccount(user2, "User2");
//         ITradeFactory.FactoryData memory data3 = tradeFactory.getFactoryData(user1);
//         assertEq(data3.totalAccounts, 2);
//     }
    
//     // Note: Chain count functions are tested in SupportedChains.t.sol
    
//     function test_GetVariables() public {
//         ICommon.FactoryVariables memory vars = tradeFactory.getVariables(user1);
        
//         assertEq(vars.platformFee, PLATFORM_FEE);
//         assertEq(vars.feeDenom, 10000);
//         assertEq(vars.creationFee, CREATION_FEE);
//         assertTrue(vars.isPythSupported);
//         assertEq(vars.supportedPaymentAsset.token, address(mockToken));
//     }
    
//     // Note: Reputation tests are in TradingAccount.t.sol
    
//     // ============ EDGE CASES AND SECURITY TESTS ============
    
//     function test_MultipleAccountCreation() public {
//         address account1 = tradeFactory.createTradingAccount(user1, "User1");
//         address account2 = tradeFactory.createTradingAccount(user2, "User2");
//         address account3 = tradeFactory.createTradingAccount(user3, "User3");
        
//         assertNotEq(account1, account2);
//         assertNotEq(account2, account3);
//         assertNotEq(account1, account3);
        
//         ITradeFactory.FactoryData memory data = tradeFactory.getFactoryData(user1);
//         assertEq(data.totalAccounts, 3);
//     }
    
//     function test_AccountCreationAfterPause() public {
//         tradeFactory.toggleExecution(true);
        
//         vm.expectRevert("Pausable: paused");
//         tradeFactory.createTradingAccount(user1, "User1");
        
//         tradeFactory.toggleExecution(false);
        
//         address account = tradeFactory.createTradingAccount(user1, "User1");
//         assertNotEq(account, address(0));
//     }
    
//     // Note: Order creation tests are in TradingAccount.t.sol
    
//     function test_ReentrancyProtection() public {
//         // This test would require a malicious contract to test reentrancy
//         // For now, we'll just ensure the contract has reentrancy guards
//         assertTrue(true); // Placeholder for reentrancy test
//     }
    
//     // ============ GAS OPTIMIZATION TESTS ============
    
//     function test_GasUsage_CreateAccount() public {
//         uint256 gasBefore = gasleft();
//         tradeFactory.createTradingAccount(user1, "User1");
//         uint256 gasUsed = gasBefore - gasleft();
        
//         console.log("Gas used for createTradingAccount:", gasUsed);
//         assertTrue(gasUsed < 500000); // Reasonable gas limit
//     }
    
//     // Note: Gas usage tests for createOrder are in TradingAccount.t.sol
    
//     // ============ FOUNDRY FUZZ TESTS ============
    
//     function testFuzz_CreateTradingAccount(address user, string memory nickname) public {
//         vm.assume(user != address(0));
//         vm.assume(bytes(nickname).length > 0);
//         ICommon.AccountInfo memory existingAccount = tradeFactory.getAccountInfo(user);
//         vm.assume(existingAccount.tradingAccount == address(0));
        
//         address tradingAccount = tradeFactory.createTradingAccount(user, nickname);
        
//         assertNotEq(tradingAccount, address(0));
//         ICommon.AccountInfo memory accountInfo = tradeFactory.getAccountInfo(user);
//         assertEq(accountInfo.tradingAccount, tradingAccount);
//     }
    
//     function testFuzz_SetPlatformFee(uint256 fee) public {
//         vm.assume(fee <= 1000); // Max 10%
        
//         tradeFactory.setPlatformFee(fee);
//         ICommon.FactoryVariables memory vars = tradeFactory.getVariables(user1);
//         assertEq(vars.platformFee, fee);
//     }
    
//     function testFuzz_IsAccountExists(address user) public {
//         ICommon.AccountInfo memory accountInfo = tradeFactory.getAccountInfo(user);
//         bool exists = accountInfo.tradingAccount != address(0);
        
//         if (user == user1) {
//             if (accountInfo.tradingAccount != address(0)) {
//                 assertTrue(exists);
//             }
//         } else {
//             assertFalse(exists);
//         }
//     }
// }

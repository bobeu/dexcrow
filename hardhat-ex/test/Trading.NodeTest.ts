import assert from "node:assert/strict";
import { describe, it, before, beforeEach } from "node:test";
import { network } from "hardhat";
import { parseEther, zeroAddress } from "viem";

/**
 * @fileoverview Comprehensive TypeScript tests for TradeVerse trading contracts using Hardhat 3 Node.js test runner
 */

describe("TradeVerse Trading Contracts - TypeScript Tests", async function () {
  const { viem } = await network.connect();
  const publicClient = await viem.getPublicClient();
  const walletClient = await viem.getWalletClient(`0x`);

  // Test accounts
  let owner: `0x${string}`;
  let trader1: `0x${string}`;
  let trader2: `0x${string}`;
  let trader3: `0x${string}`;
  let unauthorizedUser: `0x${string}`;

  // Contract instances
  let tradeFactory: any;
  let pythPriceFeed: any;
  let tradingAccount1: any;
  let tradingAccount2: any;
  let mockToken: any;

  // Test constants
  const ETH_AMOUNT = parseEther("1.0"); // 1 ETH
  const TOKEN_AMOUNT = parseEther("100.0"); // 100 tokens
  const ORDER_PRICE = parseEther("0.01"); // 0.01 ETH per token
  const PLATFORM_FEE = 50; // 0.5%
  const FEE_DENOMINATOR = 10000;

  before(async function () {
    // Get test accounts
    const accounts = await walletClient.getAddresses();
    [owner, trader1, trader2, trader3, unauthorizedUser] = accounts;

    // Deploy mock ERC20 token
    mockToken = await viem.deployContract("MockERC20", [parseEther("10000")]);

    // Deploy PythPriceFeed
    pythPriceFeed = await viem.deployContract("PythPriceFeed", [
      "0x1234567890123456789012345678901234567890" // Mock Pyth address
    ]);

    // Deploy TradeFactory
    tradeFactory = await viem.deployContract("TradeFactory", []);

    // Add additional supported chains (1 and 137 are already supported by default)
    await tradeFactory.write.addSupportedChain([56, "BSC", zeroAddress]);

    // Set platform fee
    await tradeFactory.write.setPlatformFee([PLATFORM_FEE]);
  });

  beforeEach(async function () {
    // Redeploy contracts
    pythPriceFeed = await viem.deployContract("PythPriceFeed", [
      "0x1234567890123456789012345678901234567890"
    ]);

    tradeFactory = await viem.deployContract("TradeFactory", []);

    // Add additional supported chains (1 and 137 are already supported by default)
    await tradeFactory.write.addSupportedChain([56, "BSC", zeroAddress]);

    // Set platform fee
    await tradeFactory.write.setPlatformFee([PLATFORM_FEE]);

    // Deploy mock token
    mockToken = await viem.deployContract("MockERC20", [parseEther("10000")]);

    // Fund test accounts
    await publicClient.request({ method: "hardhat_setBalance", params: [trader1, `0x${parseEther("10").toString(16)}`] });
    await publicClient.request({ method: "hardhat_setBalance", params: [trader2, `0x${parseEther("10").toString(16)}`] });
    await publicClient.request({ method: "hardhat_setBalance", params: [trader3, `0x${parseEther("10").toString(16)}`] });
  });

  describe("TradeFactory Contract", function () {
    it("Should initialize with correct parameters", async function () {
      const platformFee = await tradeFactory.read.getPlatformFee();
      const totalFees = await tradeFactory.read.getTotalFees();
      const isPaused = await tradeFactory.read.paused();

      assert.equal(platformFee, BigInt(PLATFORM_FEE));
      assert.equal(totalFees, 0n);
      assert.equal(isPaused, false);
    });

    it("Should create trading account for user", async function () {
      const tx = await tradeFactory.write.createTradingAccount([trader1]);
      const receipt = await tx.wait();

      const tradingAccountAddress = await tradeFactory.read.getTradingAccount([trader1]);
      assert.notEqual(tradingAccountAddress, zeroAddress);

      const accountInfo = await tradeFactory.read.getAccountInfo([trader1]);
      assert.equal(accountInfo.user, trader1);
      assert.equal(accountInfo.reputation, 0n);
      assert.equal(accountInfo.totalOrders, 0n);
      assert.equal(accountInfo.successfulOrders, 0n);
    });

    it("Should revert when creating duplicate trading account", async function () {
      // Create first account
      await tradeFactory.write.createTradingAccount([trader1]);

      // Try to create second account
      await assert.rejects(
        async () => {
          await tradeFactory.write.createTradingAccount([trader1]);
        },
        /AccountAlreadyExists/
      );
    });

    it("Should add and remove supported chains", async function () {
      // Add new chain
      await tradeFactory.write.addSupportedChain([999, "TestChain", zeroAddress]);

      const supportedChain = await tradeFactory.read.getSupportedChain([999]);
      assert.equal(supportedChain.isActive, true);

      // Remove chain
      await tradeFactory.write.removeSupportedChain([999]);

      const removedChain = await tradeFactory.read.getSupportedChain([999]);
      assert.equal(removedChain.isActive, false);
    });

    it("Should set platform fee", async function () {
      const newFee = 100; // 1%
      await tradeFactory.write.setPlatformFee([newFee]);

      const platformFee = await tradeFactory.read.getPlatformFee();
      assert.equal(platformFee, BigInt(newFee));
    });

    it("Should revert when setting invalid platform fee", async function () {
      await assert.rejects(
        async () => {
          await tradeFactory.write.setPlatformFee([600]); // More than 5%
        },
        /InvalidFee/
      );
    });

    it("Should create order", async function () {
      // First create trading account
      await tradeFactory.write.createTradingAccount([trader1]);

      const tokenAddress = "0x1234567890123456789012345678901234567890123456789012345678901234";
      const chainId = 1;
      const amount = parseEther("10");
      const price = parseEther("0.01");
      const useLivePrice = false;
      const expirationHours = 24;
      const nickname = "0x7465737465720000000000000000000000000000000000000000000000000000"; // "tester" in bytes32

      const tx = await tradeFactory.write.createOrder([
        tokenAddress,
        chainId,
        amount,
        price,
        useLivePrice,
        expirationHours,
        nickname
      ]);

      const receipt = await tx.wait();
      assert.ok(receipt.status === "success");
    });

    it("Should revert when creating order without account", async function () {
      const tokenAddress = "0x1234567890123456789012345678901234567890123456789012345678901234";
      const chainId = 1;
      const amount = parseEther("10");
      const price = parseEther("0.01");
      const useLivePrice = false;
      const expirationHours = 24;
      const nickname = "0x7465737465720000000000000000000000000000000000000000000000000000";

      await assert.rejects(
        async () => {
          await tradeFactory.write.createOrder([
            tokenAddress,
            chainId,
            amount,
            price,
            useLivePrice,
            expirationHours,
            nickname
          ]);
        },
        /AccountNotFound/
      );
    });

    it("Should revert when creating order with unsupported chain", async function () {
      // First create trading account
      await tradeFactory.write.createTradingAccount([trader1]);

      const tokenAddress = "0x1234567890123456789012345678901234567890123456789012345678901234";
      const chainId = 999; // Unsupported chain
      const amount = parseEther("10");
      const price = parseEther("0.01");
      const useLivePrice = false;
      const expirationHours = 24;
      const nickname = "0x7465737465720000000000000000000000000000000000000000000000000000";

      await assert.rejects(
        async () => {
          await tradeFactory.write.createOrder([
            tokenAddress,
            chainId,
            amount,
            price,
            useLivePrice,
            expirationHours,
            nickname
          ]);
        },
        /UnsupportedChain/
      );
    });

    it("Should pause and unpause contract", async function () {
      // Pause contract
      await tradeFactory.write.pause();
      let isPaused = await tradeFactory.read.paused();
      assert.equal(isPaused, true);

      // Unpause contract
      await tradeFactory.write.unpause();
      isPaused = await tradeFactory.read.paused();
      assert.equal(isPaused, false);
    });

    it("Should revert when non-owner tries to pause", async function () {
      await assert.rejects(
        async () => {
          await tradeFactory.write.pause({ account: trader1 });
        },
        /InvalidOwner/
      );
    });
  });

  describe("TradingAccount Contract", function () {
    beforeEach(async function () {
      // Create trading account for trader1
      await tradeFactory.write.createTradingAccount([trader1]);
      const tradingAccountAddress = await tradeFactory.read.getTradingAccount([trader1]);
      tradingAccount1 = await viem.getContractAt("TradingAccount", tradingAccountAddress);
    });

    it("Should deposit ETH", async function () {
      const depositAmount = parseEther("1.0");
      
      const tx = await tradingAccount1.write.deposit({
        value: depositAmount,
        account: trader1
      });
      const receipt = await tx.wait();

      assert.ok(receipt.status === "success");

      const balance = await tradingAccount1.read.getBalance([zeroAddress]);
      assert.equal(balance, depositAmount);
    });

    it("Should deposit ERC20 tokens", async function () {
      const depositAmount = parseEther("100.0");
      
      // Approve tokens
      await mockToken.write.approve([tradingAccount1.address, depositAmount], { account: trader1 });
      
      const tx = await tradingAccount1.write.deposit([mockToken.address, depositAmount], { account: trader1 });
      const receipt = await tx.wait();

      assert.ok(receipt.status === "success");

      const balance = await tradingAccount1.read.getBalance([mockToken.address]);
      assert.equal(balance, depositAmount);
    });

    it("Should create order", async function () {
      const tokenAddress = "0x1234567890123456789012345678901234567890123456789012345678901234";
      const chainId = 1;
      const amount = parseEther("10");
      const price = parseEther("0.01");
      const useLivePrice = false;
      const expirationHours = 24;
      const nickname = "0x7465737465720000000000000000000000000000000000000000000000000000";

      const tx = await tradingAccount1.write.createOrder([
        tokenAddress,
        chainId,
        amount,
        price,
        useLivePrice,
        expirationHours,
        nickname
      ], { account: trader1 });

      const receipt = await tx.wait();
      assert.ok(receipt.status === "success");

      const totalOrders = await tradingAccount1.read.totalOrders();
      assert.equal(totalOrders, 1n);
    });

    it("Should request withdrawal", async function () {
      // First deposit some tokens
      const depositAmount = parseEther("100.0");
      await mockToken.write.approve([tradingAccount1.address, depositAmount], { account: trader1 });
      await tradingAccount1.write.deposit([mockToken.address, depositAmount], { account: trader1 });

      const withdrawalAmount = parseEther("50.0");
      
      const tx = await tradingAccount1.write.requestWithdrawal([
        mockToken.address,
        withdrawalAmount
      ], { account: trader1 });

      const receipt = await tx.wait();
      assert.ok(receipt.status === "success");

      const withdrawalRequest = await tradingAccount1.read.getWithdrawalRequest([mockToken.address]);
      assert.equal(withdrawalRequest.amount, withdrawalAmount);
      assert.equal(withdrawalRequest.isProcessed, false);
    });

    it("Should process withdrawal after cooldown", async function () {
      // First deposit some tokens
      const depositAmount = parseEther("100.0");
      await mockToken.write.approve([tradingAccount1.address, depositAmount], { account: trader1 });
      await tradingAccount1.write.deposit([mockToken.address, depositAmount], { account: trader1 });

      // Request withdrawal
      const withdrawalAmount = parseEther("50.0");
      await tradingAccount1.write.requestWithdrawal([
        mockToken.address,
        withdrawalAmount
      ], { account: trader1 });

      // Fast forward past cooldown period
      await network.provider.send("evm_increaseTime", [16 * 60]); // 16 minutes
      await network.provider.send("evm_mine");

      const initialBalance = await mockToken.read.balanceOf([trader1]);
      
      const tx = await tradingAccount1.write.processWithdrawal([mockToken.address], { account: trader1 });
      const receipt = await tx.wait();

      assert.ok(receipt.status === "success");

      const finalBalance = await mockToken.read.balanceOf([trader1]);
      assert.equal(finalBalance, initialBalance + withdrawalAmount);
    });

    it("Should set cooldown period", async function () {
      const newCooldown = 30 * 60; // 30 minutes
      
      const tx = await tradingAccount1.write.setCooldownPeriod([newCooldown], { account: trader1 });
      const receipt = await tx.wait();

      assert.ok(receipt.status === "success");

      const cooldownPeriod = await tradingAccount1.read.cooldownPeriod();
      assert.equal(cooldownPeriod, BigInt(newCooldown));
    });

    it("Should get account data", async function () {
      const accountData = await tradingAccount1.read.getAccountData();
      
      assert.equal(accountData.owner, trader1);
      assert.equal(accountData.tradeFactory, tradeFactory.address);
      assert.equal(accountData.totalOrders, 0n);
      assert.equal(accountData.successfulOrders, 0n);
      assert.equal(accountData.cancelledOrders, 0n);
    });

    it("Should pause and unpause", async function () {
      // Pause
      await tradingAccount1.write.pause({ account: trader1 });
      let isPaused = await tradingAccount1.read.paused();
      assert.equal(isPaused, true);

      // Unpause
      await tradingAccount1.write.unpause({ account: trader1 });
      isPaused = await tradingAccount1.read.paused();
      assert.equal(isPaused, false);
    });
  });

  describe("PythPriceFeed Contract", function () {
    it("Should add price feed", async function () {
      const feedId = "0x1234567890123456789012345678901234567890123456789012345678901234";
      const feedName = "ETH/USD";

      const tx = await pythPriceFeed.write.addPriceFeed([feedId, feedName]);
      const receipt = await tx.wait();

      assert.ok(receipt.status === "success");

      const isValid = await pythPriceFeed.read.priceFeedValid([feedId]);
      assert.equal(isValid, true);
    });

    it("Should update price", async function () {
      const feedId = "0x1234567890123456789012345678901234567890123456789012345678901234";
      const feedName = "ETH/USD";

      // Add price feed first
      await pythPriceFeed.write.addPriceFeed([feedId, feedName]);

      const price = 2000e8; // $2000
      const confidence = 1e8; // $1
      const timestamp = Math.floor(Date.now() / 1000);

      const tx = await pythPriceFeed.write.updatePrice([feedId, price, confidence, timestamp]);
      const receipt = await tx.wait();

      assert.ok(receipt.status === "success");

      const [retrievedPrice, retrievedConfidence, retrievedTimestamp] = await pythPriceFeed.read.getPrice([feedId]);
      assert.equal(retrievedPrice, BigInt(price));
      assert.equal(retrievedConfidence, BigInt(confidence));
      assert.equal(retrievedTimestamp, BigInt(timestamp));
    });

    it("Should validate price", async function () {
      const feedId = "0x1234567890123456789012345678901234567890123456789012345678901234";
      const feedName = "ETH/USD";

      // Add price feed and update price
      await pythPriceFeed.write.addPriceFeed([feedId, feedName]);
      await pythPriceFeed.write.updatePrice([feedId, 2000e8, 1e8, Math.floor(Date.now() / 1000)]);

      const isValid = await pythPriceFeed.read.isPriceValid([feedId]);
      assert.equal(isValid, true);
    });

    it("Should set max price age", async function () {
      const newMaxAge = 7200; // 2 hours

      const tx = await pythPriceFeed.write.setMaxPriceAge([newMaxAge]);
      const receipt = await tx.wait();

      assert.ok(receipt.status === "success");

      const maxAge = await pythPriceFeed.read.maxPriceAge();
      assert.equal(maxAge, BigInt(newMaxAge));
    });

    it("Should set max price deviation", async function () {
      const newDeviation = 2000; // 20%

      const tx = await pythPriceFeed.write.setMaxPriceDeviation([newDeviation]);
      const receipt = await tx.wait();

      assert.ok(receipt.status === "success");

      const maxDeviation = await pythPriceFeed.read.maxPriceDeviation();
      assert.equal(maxDeviation, BigInt(newDeviation));
    });
  });

  describe("Integration Tests", function () {
    it("Should handle complete trading flow", async function () {
      // Create trading accounts
      await tradeFactory.write.createTradingAccount([trader1]);
      await tradeFactory.write.createTradingAccount([trader2]);

      const tradingAccount1Address = await tradeFactory.read.getTradingAccount([trader1]);
      const tradingAccount2Address = await tradeFactory.read.getTradingAccount([trader2]);

      tradingAccount1 = await viem.getContractAt("TradingAccount", tradingAccount1Address);
      tradingAccount2 = await viem.getContractAt("TradingAccount", tradingAccount2Address);

      // Deposit tokens
      const depositAmount = parseEther("100.0");
      await mockToken.write.approve([tradingAccount1.address, depositAmount], { account: trader1 });
      await tradingAccount1.write.deposit([mockToken.address, depositAmount], { account: trader1 });

      // Create order
      const tokenAddress = "0x1234567890123456789012345678901234567890123456789012345678901234";
      const chainId = 1;
      const amount = parseEther("10");
      const price = parseEther("0.01");
      const useLivePrice = false;
      const expirationHours = 24;
      const nickname = "0x7465737465720000000000000000000000000000000000000000000000000000";

      await tradingAccount1.write.createOrder([
        tokenAddress,
        chainId,
        amount,
        price,
        useLivePrice,
        expirationHours,
        nickname
      ], { account: trader1 });

      // Verify order was created
      const totalOrders = await tradingAccount1.read.totalOrders();
      assert.equal(totalOrders, 1n);

      // Verify account data
      const accountData = await tradingAccount1.read.getAccountData();
      assert.equal(accountData.totalOrders, 1n);
    });

    it("Should handle multiple users and orders", async function () {
      // Create trading accounts for multiple users
      await tradeFactory.write.createTradingAccount([trader1]);
      await tradeFactory.write.createTradingAccount([trader2]);
      await tradeFactory.write.createTradingAccount([trader3]);

      // Verify all accounts were created
      const account1 = await tradeFactory.read.getTradingAccount([trader1]);
      const account2 = await tradeFactory.read.getTradingAccount([trader2]);
      const account3 = await tradeFactory.read.getTradingAccount([trader3]);

      assert.notEqual(account1, zeroAddress);
      assert.notEqual(account2, zeroAddress);
      assert.notEqual(account3, zeroAddress);
      assert.notEqual(account1, account2);
      assert.notEqual(account2, account3);
    });
  });

  describe("Error Handling", function () {
    it("Should handle invalid function calls gracefully", async function () {
      // Test various error conditions
      await assert.rejects(
        async () => {
          await tradeFactory.write.createTradingAccount([zeroAddress]);
        },
        /InvalidOwner/
      );

      await assert.rejects(
        async () => {
          await tradeFactory.write.setPlatformFee([600]); // Invalid fee
        },
        /InvalidFee/
      );
    });

    it("Should handle paused contract state", async function () {
      // Pause contract
      await tradeFactory.write.pause();

      // Functions should revert when paused
      await assert.rejects(
        async () => {
          await tradeFactory.write.createTradingAccount([trader1]);
        },
        /Pausable: paused/
      );
    });
  });
});
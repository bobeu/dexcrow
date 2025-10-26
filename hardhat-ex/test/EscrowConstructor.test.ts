import assert from "node:assert/strict";
import { describe, it, before } from "node:test";
import { network } from "hardhat";
import { parseEther, zeroAddress } from "viem";

describe("Escrow Constructor Tests", async function () {
  const { viem } = await network.connect();
  const publicClient = await viem.getPublicClient();
  const walletClient = await viem.getWalletClient(`0x`);

  // Test accounts
  let buyer: `0x${string}`;
  let seller: `0x${string}`;
  let arbiter: `0x${string}`;
  let platformFeeRecipient: `0x${string}`;

  // Test constants
  const ASSET_AMOUNT = parseEther("1.0"); // 1 ETH
  const DEADLINE = 7 * 24 * 60 * 60; // 7 days in seconds
  const DISPUTE_WINDOW = 24 * 60 * 60; // 24 hours in seconds
  const DESCRIPTION = "Test Escrow Transaction";

  before(async function () {
    // Get test accounts
    const accounts = await walletClient.getAddresses();
    buyer = accounts[0];
    seller = accounts[1];
    arbiter = accounts[2];
    platformFeeRecipient = accounts[3];
  });

  it("Should create escrow with valid parameters", async function () {
    const { contractAddress } = await viem.deployContract("Escrow", [
      buyer,
      seller,
      arbiter,
      zeroAddress, // ETH
      ASSET_AMOUNT,
      BigInt(Math.floor(Date.now() / 1000) + DEADLINE),
      DESCRIPTION,
      BigInt(DISPUTE_WINDOW),
      platformFeeRecipient
    ]);

    assert.notEqual(contractAddress, zeroAddress, "Escrow should be deployed");

    // Check that the escrow was created with correct parameters
    const escrowData = await publicClient.readContract({
      address: contractAddress,
      abi: (await viem.getContractAt("Escrow", contractAddress)).abi,
      functionName: "getEscrowData"
    });

    assert.equal(escrowData.escrowDetails.buyer, buyer, "Buyer should be set correctly");
    assert.equal(escrowData.escrowDetails.seller, seller, "Seller should be set correctly");
    assert.equal(escrowData.escrowDetails.arbiter, arbiter, "Arbiter should be set correctly");
    assert.equal(escrowData.escrowDetails.assetToken, zeroAddress, "Asset token should be ETH");
    assert.equal(escrowData.escrowDetails.assetAmount, ASSET_AMOUNT, "Asset amount should be set correctly");
  });

  it("Should revert with invalid buyer address", async function () {
    try {
      await viem.deployContract("Escrow", [
        zeroAddress, // Invalid buyer
        seller,
        arbiter,
        zeroAddress, // ETH
        ASSET_AMOUNT,
        BigInt(Math.floor(Date.now() / 1000) + DEADLINE),
        DESCRIPTION,
        BigInt(DISPUTE_WINDOW),
        platformFeeRecipient
      ]);
      assert.fail("Should have reverted with invalid buyer");
    } catch (error: any) {
      assert(error.message.includes("InvalidBuyerAddress"), "Should revert with InvalidBuyerAddress");
    }
  });

  it("Should revert with invalid seller address", async function () {
    try {
      await viem.deployContract("Escrow", [
        buyer,
        zeroAddress, // Invalid seller
        arbiter,
        zeroAddress, // ETH
        ASSET_AMOUNT,
        BigInt(Math.floor(Date.now() / 1000) + DEADLINE),
        DESCRIPTION,
        BigInt(DISPUTE_WINDOW),
        platformFeeRecipient
      ]);
      assert.fail("Should have reverted with invalid seller");
    } catch (error: any) {
      assert(error.message.includes("InvalidSellerAddress"), "Should revert with InvalidSellerAddress");
    }
  });

  it("Should revert with invalid arbiter address", async function () {
    try {
      await viem.deployContract("Escrow", [
        buyer,
        seller,
        zeroAddress, // Invalid arbiter
        zeroAddress, // ETH
        ASSET_AMOUNT,
        BigInt(Math.floor(Date.now() / 1000) + DEADLINE),
        DESCRIPTION,
        BigInt(DISPUTE_WINDOW),
        platformFeeRecipient
      ]);
      assert.fail("Should have reverted with invalid arbiter");
    } catch (error: any) {
      assert(error.message.includes("InvalidArbiterAddress"), "Should revert with InvalidArbiterAddress");
    }
  });

  it("Should revert with zero asset amount", async function () {
    try {
      await viem.deployContract("Escrow", [
        buyer,
        seller,
        arbiter,
        zeroAddress, // ETH
        0n, // Invalid amount
        BigInt(Math.floor(Date.now() / 1000) + DEADLINE),
        DESCRIPTION,
        BigInt(DISPUTE_WINDOW),
        platformFeeRecipient
      ]);
      assert.fail("Should have reverted with zero amount");
    } catch (error: any) {
      assert(error.message.includes("AssetAmountMustBeGreaterThanZero"), "Should revert with AssetAmountMustBeGreaterThanZero");
    }
  });

  it("Should revert with past deadline", async function () {
    try {
      await viem.deployContract("Escrow", [
        buyer,
        seller,
        arbiter,
        zeroAddress, // ETH
        ASSET_AMOUNT,
        BigInt(Math.floor(Date.now() / 1000) - 3600), // Past deadline
        DESCRIPTION,
        BigInt(DISPUTE_WINDOW),
        platformFeeRecipient
      ]);
      assert.fail("Should have reverted with past deadline");
    } catch (error: any) {
      assert(error.message.includes("DeadlineMustBeInTheFuture"), "Should revert with DeadlineMustBeInTheFuture");
    }
  });

  it("Should revert with zero dispute window", async function () {
    try {
      await viem.deployContract("Escrow", [
        buyer,
        seller,
        arbiter,
        zeroAddress, // ETH
        ASSET_AMOUNT,
        BigInt(Math.floor(Date.now() / 1000) + DEADLINE),
        DESCRIPTION,
        0n, // Invalid dispute window
        platformFeeRecipient
      ]);
      assert.fail("Should have reverted with zero dispute window");
    } catch (error: any) {
      assert(error.message.includes("DisputeWindowMustBeGreaterThanZero"), "Should revert with DisputeWindowMustBeGreaterThanZero");
    }
  });

  it("Should revert with invalid platform fee recipient", async function () {
    try {
      await viem.deployContract("Escrow", [
        buyer,
        seller,
        arbiter,
        zeroAddress, // ETH
        ASSET_AMOUNT,
        BigInt(Math.floor(Date.now() / 1000) + DEADLINE),
        DESCRIPTION,
        BigInt(DISPUTE_WINDOW),
        zeroAddress // Invalid platform fee recipient
      ]);
      assert.fail("Should have reverted with invalid platform fee recipient");
    } catch (error: any) {
      assert(error.message.includes("InvalidPlatformFeeRecipient"), "Should revert with InvalidPlatformFeeRecipient");
    }
  });
});

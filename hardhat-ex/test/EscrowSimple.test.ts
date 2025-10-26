import assert from "node:assert/strict";
import { describe, it, before } from "node:test";
import { network } from "hardhat";
import { parseEther, zeroAddress } from "viem";

describe("Escrow Simple Tests", async function () {
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

  it("Should deploy escrow contract successfully", async function () {
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
    console.log("Escrow deployed at:", contractAddress);
  });

  it("Should check if escrow is expired", async function () {
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

    const isExpired = await publicClient.readContract({
      address: contractAddress,
      abi: (await viem.getContractAt("Escrow", contractAddress)).abi,
      functionName: "isExpired"
    });

    assert.equal(isExpired, false, "Escrow should not be expired");
  });

  it("Should get owner of escrow", async function () {
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

    const owner = await publicClient.readContract({
      address: contractAddress,
      abi: (await viem.getContractAt("Escrow", contractAddress)).abi,
      functionName: "owner"
    });

    assert.equal(owner, buyer, "Owner should be the buyer");
  });
});

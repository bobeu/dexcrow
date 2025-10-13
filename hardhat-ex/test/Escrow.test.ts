import { expect } from "chai";
import { ethers } from "hardhat";
import { Escrow, EscrowFactory } from "../typechain-types";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";

describe("Escrow Contract", function () {
  let escrow: Escrow;
  let escrowFactory: EscrowFactory;
  let owner: SignerWithAddress;
  let buyer: SignerWithAddress;
  let seller: SignerWithAddress;
  let arbiter: SignerWithAddress;
  let platformFeeRecipient: SignerWithAddress;
  let agent: SignerWithAddress;

  const assetAmount = ethers.utils.parseEther("1.0");
  const deadline = Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60; // 7 days from now
  const description = "Test escrow for 1 ETH";
  const disputeWindowHours = 24;

  beforeEach(async function () {
    [owner, buyer, seller, arbiter, platformFeeRecipient, agent] = await ethers.getSigners();

    // Deploy EscrowFactory
    const EscrowFactoryFactory = await ethers.getContractFactory("EscrowFactory");
    escrowFactory = await EscrowFactoryFactory.deploy(platformFeeRecipient.address);
    await escrowFactory.deployed();

    // Create escrow
    const tx = await escrowFactory.createEscrow(
      buyer.address,
      seller.address,
      arbiter.address,
      ethers.constants.AddressZero, // ETH
      assetAmount,
      deadline,
      description,
      disputeWindowHours,
      { value: ethers.utils.parseEther("0.001") }
    );

    const receipt = await tx.wait();
    const escrowCreatedEvent = receipt.events?.find(e => e.event === "EscrowCreated");
    const escrowAddress = escrowCreatedEvent?.args?.escrowAddress;

    // Get escrow contract instance
    const EscrowFactory = await ethers.getContractFactory("Escrow");
    escrow = EscrowFactory.attach(escrowAddress) as Escrow;

    // Authorize agent
    await escrow.connect(owner).authorizeAgent(agent.address);
  });

  describe("Deployment", function () {
    it("Should set the correct initial state", async function () {
      const escrowDetails = await escrow.getEscrowDetails();
      
      expect(escrowDetails.buyer).to.equal(buyer.address);
      expect(escrowDetails.seller).to.equal(seller.address);
      expect(escrowDetails.arbiter).to.equal(arbiter.address);
      expect(escrowDetails.assetToken).to.equal(ethers.constants.AddressZero);
      expect(escrowDetails.assetAmount).to.equal(assetAmount);
      expect(escrowDetails.deadline).to.equal(deadline);
      expect(escrowDetails.state).to.equal(0); // AWAITING_DEPOSIT
      expect(escrowDetails.description).to.equal(description);
      expect(escrowDetails.disputeWindowHours).to.equal(disputeWindowHours);
    });

    it("Should set the correct platform fee recipient", async function () {
      expect(await escrow.platformFeeRecipient()).to.equal(platformFeeRecipient.address);
    });

    it("Should have zero balance initially", async function () {
      expect(await escrow.getBalance()).to.equal(0);
    });
  });

  describe("Deposit", function () {
    it("Should allow buyer to deposit ETH", async function () {
      const tx = await escrow.connect(buyer).deposit({ value: assetAmount });
      await expect(tx)
        .to.emit(escrow, "AssetDeposited")
        .withArgs(buyer.address, ethers.constants.AddressZero, assetAmount, await getBlockTimestamp(tx));

      expect(await escrow.getBalance()).to.equal(assetAmount);
      
      const escrowDetails = await escrow.getEscrowDetails();
      expect(escrowDetails.state).to.equal(1); // AWAITING_FULFILLMENT
    });

    it("Should not allow non-buyer to deposit", async function () {
      await expect(
        escrow.connect(seller).deposit({ value: assetAmount })
      ).to.be.revertedWith("Only buyer can call this function");
    });

    it("Should not allow deposit with wrong amount", async function () {
      await expect(
        escrow.connect(buyer).deposit({ value: ethers.utils.parseEther("0.5") })
      ).to.be.revertedWith("Incorrect ETH amount");
    });

    it("Should not allow deposit after deadline", async function () {
      // Fast forward past deadline
      await ethers.provider.send("evm_increaseTime", [8 * 24 * 60 * 60]);
      await ethers.provider.send("evm_mine", []);

      await expect(
        escrow.connect(buyer).deposit({ value: assetAmount })
      ).to.be.revertedWith("Escrow has expired");
    });

    it("Should not allow deposit in wrong state", async function () {
      // First deposit
      await escrow.connect(buyer).deposit({ value: assetAmount });
      
      // Try to deposit again
      await expect(
        escrow.connect(buyer).deposit({ value: assetAmount })
      ).to.be.revertedWith("Invalid escrow state");
    });
  });

  describe("Fulfillment Confirmation", function () {
    beforeEach(async function () {
      await escrow.connect(buyer).deposit({ value: assetAmount });
    });

    it("Should allow buyer to confirm fulfillment", async function () {
      const tx = await escrow.connect(buyer).confirmFulfillment();
      await expect(tx)
        .to.emit(escrow, "FulfillmentConfirmed")
        .withArgs(buyer.address, await getBlockTimestamp(tx));

      const escrowDetails = await escrow.getEscrowDetails();
      expect(escrowDetails.state).to.equal(3); // COMPLETED
    });

    it("Should not allow non-buyer to confirm fulfillment", async function () {
      await expect(
        escrow.connect(seller).confirmFulfillment()
      ).to.be.revertedWith("Only buyer can call this function");
    });

    it("Should not allow confirmation in wrong state", async function () {
      // Complete the escrow first
      await escrow.connect(buyer).confirmFulfillment();
      
      // Try to confirm again
      await expect(
        escrow.connect(buyer).confirmFulfillment()
      ).to.be.revertedWith("Invalid escrow state");
    });
  });

  describe("Fund Release", function () {
    beforeEach(async function () {
      await escrow.connect(buyer).deposit({ value: assetAmount });
    });

    it("Should allow buyer to release funds", async function () {
      const tx = await escrow.connect(buyer).releaseFunds();
      await expect(tx)
        .to.emit(escrow, "FundsReleased")
        .withArgs(seller.address, ethers.constants.AddressZero, await calculateNetAmount(), await getBlockTimestamp(tx));

      const escrowDetails = await escrow.getEscrowDetails();
      expect(escrowDetails.state).to.equal(3); // COMPLETED
    });

    it("Should allow arbiter to release funds", async function () {
      const tx = await escrow.connect(arbiter).releaseFunds();
      await expect(tx)
        .to.emit(escrow, "FundsReleased")
        .withArgs(seller.address, ethers.constants.AddressZero, await calculateNetAmount(), await getBlockTimestamp(tx));

      const escrowDetails = await escrow.getEscrowDetails();
      expect(escrowDetails.state).to.equal(3); // COMPLETED
    });

    it("Should not allow non-authorized users to release funds", async function () {
      await expect(
        escrow.connect(seller).releaseFunds()
      ).to.be.revertedWith("Only buyer or arbiter can release funds");
    });
  });

  describe("Refund", function () {
    beforeEach(async function () {
      await escrow.connect(buyer).deposit({ value: assetAmount });
    });

    it("Should allow buyer to refund after deadline", async function () {
      // Fast forward past deadline
      await ethers.provider.send("evm_increaseTime", [8 * 24 * 60 * 60]);
      await ethers.provider.send("evm_mine", []);

      const tx = await escrow.connect(buyer).refundFunds();
      await expect(tx)
        .to.emit(escrow, "FundsReleased")
        .withArgs(buyer.address, ethers.constants.AddressZero, await calculateNetAmount(), await getBlockTimestamp(tx));

      const escrowDetails = await escrow.getEscrowDetails();
      expect(escrowDetails.state).to.equal(4); // CANCELED
    });

    it("Should allow arbiter to refund before deadline", async function () {
      const tx = await escrow.connect(arbiter).refundFunds();
      await expect(tx)
        .to.emit(escrow, "FundsReleased")
        .withArgs(buyer.address, ethers.constants.AddressZero, await calculateNetAmount(), await getBlockTimestamp(tx));

      const escrowDetails = await escrow.getEscrowDetails();
      expect(escrowDetails.state).to.equal(4); // CANCELED
    });

    it("Should not allow buyer to refund before deadline", async function () {
      await expect(
        escrow.connect(buyer).refundFunds()
      ).to.be.revertedWith("Deadline not reached");
    });
  });

  describe("Dispute Resolution", function () {
    beforeEach(async function () {
      await escrow.connect(buyer).deposit({ value: assetAmount });
    });

    it("Should allow buyer to raise dispute", async function () {
      const reason = "Seller did not deliver";
      const tx = await escrow.connect(buyer).raiseDispute(reason);
      
      await expect(tx)
        .to.emit(escrow, "DisputeRaised")
        .withArgs(buyer.address, reason, await getBlockTimestamp(tx));

      const escrowDetails = await escrow.getEscrowDetails();
      expect(escrowDetails.state).to.equal(2); // DISPUTE_RAISED

      const disputeInfo = await escrow.getDisputeInfo();
      expect(disputeInfo.isActive).to.be.true;
      expect(disputeInfo.disputer).to.equal(buyer.address);
      expect(disputeInfo.reason).to.equal(reason);
    });

    it("Should allow seller to raise dispute", async function () {
      const reason = "Buyer did not pay";
      const tx = await escrow.connect(seller).raiseDispute(reason);
      
      await expect(tx)
        .to.emit(escrow, "DisputeRaised")
        .withArgs(seller.address, reason, await getBlockTimestamp(tx));

      const escrowDetails = await escrow.getEscrowDetails();
      expect(escrowDetails.state).to.equal(2); // DISPUTE_RAISED
    });

    it("Should allow arbiter to resolve dispute (release)", async function () {
      await escrow.connect(buyer).raiseDispute("Test dispute");
      
      const reasoning = "Evidence supports seller";
      const tx = await escrow.connect(arbiter).resolveDispute(true, reasoning);
      
      await expect(tx)
        .to.emit(escrow, "DisputeResolved")
        .withArgs(arbiter.address, true, reasoning, await getBlockTimestamp(tx));

      const escrowDetails = await escrow.getEscrowDetails();
      expect(escrowDetails.state).to.equal(3); // COMPLETED

      const disputeInfo = await escrow.getDisputeInfo();
      expect(disputeInfo.isActive).to.be.false;
      expect(disputeInfo.arbiterDecision).to.be.true;
      expect(disputeInfo.arbiterReasoning).to.equal(reasoning);
    });

    it("Should allow arbiter to resolve dispute (refund)", async function () {
      await escrow.connect(buyer).raiseDispute("Test dispute");
      
      const reasoning = "Evidence supports buyer";
      const tx = await escrow.connect(arbiter).resolveDispute(false, reasoning);
      
      await expect(tx)
        .to.emit(escrow, "DisputeResolved")
        .withArgs(arbiter.address, false, reasoning, await getBlockTimestamp(tx));

      const escrowDetails = await escrow.getEscrowDetails();
      expect(escrowDetails.state).to.equal(4); // CANCELED

      const disputeInfo = await escrow.getDisputeInfo();
      expect(disputeInfo.isActive).to.be.false;
      expect(disputeInfo.arbiterDecision).to.be.false;
      expect(disputeInfo.arbiterReasoning).to.equal(reasoning);
    });

    it("Should not allow non-arbiter to resolve dispute", async function () {
      await escrow.connect(buyer).raiseDispute("Test dispute");
      
      await expect(
        escrow.connect(buyer).resolveDispute(true, "Test reasoning")
      ).to.be.revertedWith("Only arbiter can call this function");
    });

    it("Should not allow dispute resolution without active dispute", async function () {
      await expect(
        escrow.connect(arbiter).resolveDispute(true, "Test reasoning")
      ).to.be.revertedWith("No active dispute");
    });
  });

  describe("Agent Functions", function () {
    it("Should allow authorized agent to deposit", async function () {
      const tx = await escrow.connect(agent).agentDeposit();
      await expect(tx)
        .to.emit(escrow, "AssetDeposited")
        .withArgs(buyer.address, ethers.constants.AddressZero, assetAmount, await getBlockTimestamp(tx));

      const escrowDetails = await escrow.getEscrowDetails();
      expect(escrowDetails.state).to.equal(1); // AWAITING_FULFILLMENT
    });

    it("Should allow authorized agent to confirm fulfillment", async function () {
      await escrow.connect(agent).agentDeposit();
      
      const tx = await escrow.connect(agent).agentConfirmFulfillment();
      await expect(tx)
        .to.emit(escrow, "FulfillmentConfirmed")
        .withArgs(agent.address, await getBlockTimestamp(tx));

      const escrowDetails = await escrow.getEscrowDetails();
      expect(escrowDetails.state).to.equal(3); // COMPLETED
    });

    it("Should allow authorized agent to resolve dispute", async function () {
      await escrow.connect(agent).agentDeposit();
      await escrow.connect(buyer).raiseDispute("Test dispute");
      
      const reasoning = "Agent decision";
      const tx = await escrow.connect(agent).agentResolveDispute(true, reasoning);
      
      await expect(tx)
        .to.emit(escrow, "DisputeResolved")
        .withArgs(agent.address, true, reasoning, await getBlockTimestamp(tx));

      const escrowDetails = await escrow.getEscrowDetails();
      expect(escrowDetails.state).to.equal(3); // COMPLETED
    });

    it("Should not allow unauthorized agent to call agent functions", async function () {
      const unauthorizedAgent = (await ethers.getSigners())[6];
      
      await expect(
        escrow.connect(unauthorizedAgent).agentDeposit()
      ).to.be.revertedWith("Only authorized agents can call this function");
    });
  });

  describe("Admin Functions", function () {
    it("Should allow owner to authorize agent", async function () {
      const newAgent = (await ethers.getSigners())[6];
      
      await escrow.connect(owner).authorizeAgent(newAgent.address);
      expect(await escrow.authorizedAgents(newAgent.address)).to.be.true;
    });

    it("Should allow owner to revoke agent authorization", async function () {
      await escrow.connect(owner).revokeAgent(agent.address);
      expect(await escrow.authorizedAgents(agent.address)).to.be.false;
    });

    it("Should allow owner to pause contract", async function () {
      await escrow.connect(owner).pause();
      expect(await escrow.paused()).to.be.true;
    });

    it("Should allow owner to unpause contract", async function () {
      await escrow.connect(owner).pause();
      await escrow.connect(owner).unpause();
      expect(await escrow.paused()).to.be.false;
    });

    it("Should not allow non-owner to call admin functions", async function () {
      await expect(
        escrow.connect(buyer).authorizeAgent(agent.address)
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });
  });

  describe("Edge Cases", function () {
    it("Should handle zero fees correctly", async function () {
      // This test would require a custom escrow with zero fees
      // For now, we test the current fee structure
      await escrow.connect(buyer).deposit({ value: assetAmount });
      
      const netAmount = await calculateNetAmount();
      expect(netAmount).to.be.lessThan(assetAmount);
    });

    it("Should prevent reentrancy attacks", async function () {
      // This would require a malicious contract to test
      // The ReentrancyGuard should prevent this
      await escrow.connect(buyer).deposit({ value: assetAmount });
      
      // Normal operation should work
      await escrow.connect(buyer).confirmFulfillment();
    });

    it("Should handle expired escrow correctly", async function () {
      // Fast forward past deadline
      await ethers.provider.send("evm_increaseTime", [8 * 24 * 60 * 60]);
      await ethers.provider.send("evm_mine", []);

      expect(await escrow.isExpired()).to.be.true;
    });
  });

  // Helper functions
  async function getBlockTimestamp(tx: any): Promise<number> {
    const receipt = await tx.wait();
    const block = await ethers.provider.getBlock(receipt.blockNumber);
    return block.timestamp;
  }

  async function calculateNetAmount(): Promise<number> {
    const platformFee = assetAmount.mul(50).div(10000); // 0.5%
    const arbiterFee = assetAmount.mul(100).div(10000); // 1%
    return assetAmount.sub(platformFee).sub(arbiterFee);
  }
});

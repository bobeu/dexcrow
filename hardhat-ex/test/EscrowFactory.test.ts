import { expect } from "chai";
import { ethers } from "hardhat";
import { EscrowFactory, Escrow } from "../typechain-types";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";

describe("EscrowFactory Contract", function () {
  let escrowFactory: EscrowFactory;
  let owner: SignerWithAddress;
  let buyer: SignerWithAddress;
  let seller: SignerWithAddress;
  let arbiter: SignerWithAddress;
  let platformFeeRecipient: SignerWithAddress;
  let user1: SignerWithAddress;
  let user2: SignerWithAddress;

  const assetAmount = ethers.utils.parseEther("1.0");
  const deadline = Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60; // 7 days from now
  const description = "Test escrow for 1 ETH";
  const disputeWindowHours = 24;
  const creationFee = ethers.utils.parseEther("0.001");

  beforeEach(async function () {
    [owner, buyer, seller, arbiter, platformFeeRecipient, user1, user2] = await ethers.getSigners();

    const EscrowFactoryFactory = await ethers.getContractFactory("EscrowFactory");
    escrowFactory = await EscrowFactoryFactory.deploy(platformFeeRecipient.address);
    await escrowFactory.deployed();
  });

  describe("Deployment", function () {
    it("Should set the correct platform fee recipient", async function () {
      expect(await escrowFactory.platformFeeRecipient()).to.equal(platformFeeRecipient.address);
    });

    it("Should set the correct default dispute window", async function () {
      expect(await escrowFactory.defaultDisputeWindowHours()).to.equal(24);
    });

    it("Should set the correct creation fee", async function () {
      expect(await escrowFactory.creationFee()).to.equal(creationFee);
    });

    it("Should have zero total escrows initially", async function () {
      expect(await escrowFactory.getTotalEscrows()).to.equal(0);
    });
  });

  describe("Escrow Creation", function () {
    it("Should create escrow successfully", async function () {
      const tx = await escrowFactory.createEscrow(
        buyer.address,
        seller.address,
        arbiter.address,
        ethers.constants.AddressZero, // ETH
        assetAmount,
        deadline,
        description,
        disputeWindowHours,
        { value: creationFee }
      );

      await expect(tx)
        .to.emit(escrowFactory, "EscrowCreated")
        .withArgs(
          await getEscrowAddress(tx),
          buyer.address,
          seller.address,
          arbiter.address,
          await getBlockTimestamp(tx)
        );

      expect(await escrowFactory.getTotalEscrows()).to.equal(1);
      expect(await escrowFactory.getAllEscrows()).to.have.length(1);
    });

    it("Should create escrow with default dispute window", async function () {
      const tx = await escrowFactory.createEscrowWithDefaultWindow(
        buyer.address,
        seller.address,
        arbiter.address,
        ethers.constants.AddressZero,
        assetAmount,
        deadline,
        description,
        { value: creationFee }
      );

      await expect(tx)
        .to.emit(escrowFactory, "EscrowCreated");

      const escrowAddress = await getEscrowAddress(tx);
      const escrow = await ethers.getContractAt("Escrow", escrowAddress);
      const escrowDetails = await escrow.getEscrowDetails();
      
      expect(escrowDetails.disputeWindowHours).to.equal(24);
    });

    it("Should track user escrows correctly", async function () {
      await escrowFactory.createEscrow(
        buyer.address,
        seller.address,
        arbiter.address,
        ethers.constants.AddressZero,
        assetAmount,
        deadline,
        description,
        disputeWindowHours,
        { value: creationFee }
      );

      const buyerEscrows = await escrowFactory.getUserEscrows(buyer.address);
      const sellerEscrows = await escrowFactory.getUserEscrows(seller.address);
      const arbiterEscrows = await escrowFactory.getUserEscrows(arbiter.address);

      expect(buyerEscrows).to.have.length(1);
      expect(sellerEscrows).to.have.length(1);
      expect(arbiterEscrows).to.have.length(1);
      expect(buyerEscrows[0]).to.equal(sellerEscrows[0]);
      expect(sellerEscrows[0]).to.equal(arbiterEscrows[0]);
    });

    it("Should validate escrow addresses", async function () {
      const escrowAddress = await createEscrow();
      expect(await escrowFactory.isValidEscrow(escrowAddress)).to.be.true;
      expect(await escrowFactory.isValidEscrow(ethers.constants.AddressZero)).to.be.false;
    });

    it("Should not allow creation with invalid addresses", async function () {
      await expect(
        escrowFactory.createEscrow(
          ethers.constants.AddressZero,
          seller.address,
          arbiter.address,
          ethers.constants.AddressZero,
          assetAmount,
          deadline,
          description,
          disputeWindowHours,
          { value: creationFee }
        )
      ).to.be.revertedWith("Invalid buyer address");
    });

    it("Should not allow creation with same buyer and seller", async function () {
      await expect(
        escrowFactory.createEscrow(
          buyer.address,
          buyer.address,
          arbiter.address,
          ethers.constants.AddressZero,
          assetAmount,
          deadline,
          description,
          disputeWindowHours,
          { value: creationFee }
        )
      ).to.be.revertedWith("Buyer and seller cannot be the same");
    });

    it("Should not allow creation with same buyer and arbiter", async function () {
      await expect(
        escrowFactory.createEscrow(
          buyer.address,
          seller.address,
          buyer.address,
          ethers.constants.AddressZero,
          assetAmount,
          deadline,
          description,
          disputeWindowHours,
          { value: creationFee }
        )
      ).to.be.revertedWith("Buyer and arbiter cannot be the same");
    });

    it("Should not allow creation with same seller and arbiter", async function () {
      await expect(
        escrowFactory.createEscrow(
          buyer.address,
          seller.address,
          seller.address,
          ethers.constants.AddressZero,
          assetAmount,
          deadline,
          description,
          disputeWindowHours,
          { value: creationFee }
        )
      ).to.be.revertedWith("Seller and arbiter cannot be the same");
    });

    it("Should not allow creation with zero amount", async function () {
      await expect(
        escrowFactory.createEscrow(
          buyer.address,
          seller.address,
          arbiter.address,
          ethers.constants.AddressZero,
          0,
          deadline,
          description,
          disputeWindowHours,
          { value: creationFee }
        )
      ).to.be.revertedWith("Amount must be greater than 0");
    });

    it("Should not allow creation with past deadline", async function () {
      const pastDeadline = Math.floor(Date.now() / 1000) - 24 * 60 * 60; // 1 day ago
      
      await expect(
        escrowFactory.createEscrow(
          buyer.address,
          seller.address,
          arbiter.address,
          ethers.constants.AddressZero,
          assetAmount,
          pastDeadline,
          description,
          disputeWindowHours,
          { value: creationFee }
        )
      ).to.be.revertedWith("Deadline must be in the future");
    });

    it("Should not allow creation with zero dispute window", async function () {
      await expect(
        escrowFactory.createEscrow(
          buyer.address,
          seller.address,
          arbiter.address,
          ethers.constants.AddressZero,
          assetAmount,
          deadline,
          description,
          0,
          { value: creationFee }
        )
      ).to.be.revertedWith("Dispute window must be greater than 0");
    });

    it("Should not allow creation with excessive dispute window", async function () {
      await expect(
        escrowFactory.createEscrow(
          buyer.address,
          seller.address,
          arbiter.address,
          ethers.constants.AddressZero,
          assetAmount,
          deadline,
          description,
          200, // More than 7 days
          { value: creationFee }
        )
      ).to.be.revertedWith("Dispute window cannot exceed 7 days");
    });

    it("Should not allow creation with empty description", async function () {
      await expect(
        escrowFactory.createEscrow(
          buyer.address,
          seller.address,
          arbiter.address,
          ethers.constants.AddressZero,
          assetAmount,
          deadline,
          "",
          disputeWindowHours,
          { value: creationFee }
        )
      ).to.be.revertedWith("Description cannot be empty");
    });

    it("Should not allow creation with insufficient fee", async function () {
      await expect(
        escrowFactory.createEscrow(
          buyer.address,
          seller.address,
          arbiter.address,
          ethers.constants.AddressZero,
          assetAmount,
          deadline,
          description,
          disputeWindowHours,
          { value: ethers.utils.parseEther("0.0005") } // Less than required fee
        )
      ).to.be.revertedWith("Insufficient creation fee");
    });
  });

  describe("View Functions", function () {
    beforeEach(async function () {
      // Create multiple escrows
      await createEscrow();
      await createEscrow();
      await createEscrow();
    });

    it("Should return all escrows", async function () {
      const allEscrows = await escrowFactory.getAllEscrows();
      expect(allEscrows).to.have.length(3);
    });

    it("Should return paginated escrows", async function () {
      const page1 = await escrowFactory.getEscrowsPaginated(0, 2);
      const page2 = await escrowFactory.getEscrowsPaginated(2, 2);
      
      expect(page1).to.have.length(2);
      expect(page2).to.have.length(1);
    });

    it("Should return user escrow count", async function () {
      expect(await escrowFactory.getUserEscrowCount(buyer.address)).to.equal(3);
      expect(await escrowFactory.getUserEscrowCount(seller.address)).to.equal(3);
      expect(await escrowFactory.getUserEscrowCount(arbiter.address)).to.equal(3);
    });

    it("Should return escrow details", async function () {
      const escrowAddress = await createEscrow();
      const escrowDetails = await escrowFactory.getEscrowDetails(escrowAddress);
      
      expect(escrowDetails.buyer).to.equal(buyer.address);
      expect(escrowDetails.seller).to.equal(seller.address);
      expect(escrowDetails.arbiter).to.equal(arbiter.address);
    });

    it("Should return escrow state", async function () {
      const escrowAddress = await createEscrow();
      const state = await escrowFactory.getEscrowState(escrowAddress);
      
      expect(state).to.equal(0); // AWAITING_DEPOSIT
    });

    it("Should revert when getting details for invalid escrow", async function () {
      await expect(
        escrowFactory.getEscrowDetails(ethers.constants.AddressZero)
      ).to.be.revertedWith("Invalid escrow address");
    });
  });

  describe("Admin Functions", function () {
    it("Should allow owner to update platform fee recipient", async function () {
      const tx = await escrowFactory.connect(owner).updatePlatformFeeRecipient(user1.address);
      
      await expect(tx)
        .to.emit(escrowFactory, "PlatformFeeRecipientUpdated")
        .withArgs(platformFeeRecipient.address, user1.address);

      expect(await escrowFactory.platformFeeRecipient()).to.equal(user1.address);
    });

    it("Should allow owner to update default dispute window", async function () {
      const tx = await escrowFactory.connect(owner).updateDefaultDisputeWindow(48);
      
      await expect(tx)
        .to.emit(escrowFactory, "DefaultDisputeWindowUpdated")
        .withArgs(24, 48);

      expect(await escrowFactory.defaultDisputeWindowHours()).to.equal(48);
    });

    it("Should allow owner to update creation fee", async function () {
      const newFee = ethers.utils.parseEther("0.002");
      await escrowFactory.connect(owner).updateCreationFee(newFee);
      
      expect(await escrowFactory.creationFee()).to.equal(newFee);
    });

    it("Should allow owner to pause factory", async function () {
      await escrowFactory.connect(owner).pause();
      expect(await escrowFactory.paused()).to.be.true;
    });

    it("Should allow owner to unpause factory", async function () {
      await escrowFactory.connect(owner).pause();
      await escrowFactory.connect(owner).unpause();
      expect(await escrowFactory.paused()).to.be.false;
    });

    it("Should not allow non-owner to call admin functions", async function () {
      await expect(
        escrowFactory.connect(user1).updatePlatformFeeRecipient(user1.address)
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });

    it("Should not allow creation when paused", async function () {
      await escrowFactory.connect(owner).pause();
      
      await expect(
        escrowFactory.createEscrow(
          buyer.address,
          seller.address,
          arbiter.address,
          ethers.constants.AddressZero,
          assetAmount,
          deadline,
          description,
          disputeWindowHours,
          { value: creationFee }
        )
      ).to.be.revertedWith("Pausable: paused");
    });

    it("Should not allow invalid dispute window update", async function () {
      await expect(
        escrowFactory.connect(owner).updateDefaultDisputeWindow(0)
      ).to.be.revertedWith("Dispute window must be greater than 0");

      await expect(
        escrowFactory.connect(owner).updateDefaultDisputeWindow(200)
      ).to.be.revertedWith("Dispute window cannot exceed 7 days");
    });
  });

  describe("Fee Handling", function () {
    it("Should transfer creation fee to platform recipient", async function () {
      const initialBalance = await platformFeeRecipient.getBalance();
      
      await escrowFactory.createEscrow(
        buyer.address,
        seller.address,
        arbiter.address,
        ethers.constants.AddressZero,
        assetAmount,
        deadline,
        description,
        disputeWindowHours,
        { value: creationFee }
      );

      const finalBalance = await platformFeeRecipient.getBalance();
      expect(finalBalance.sub(initialBalance)).to.equal(creationFee);
    });

    it("Should handle excess payment", async function () {
      const excessPayment = ethers.utils.parseEther("0.002");
      const initialBalance = await platformFeeRecipient.getBalance();
      
      await escrowFactory.createEscrow(
        buyer.address,
        seller.address,
        arbiter.address,
        ethers.constants.AddressZero,
        assetAmount,
        deadline,
        description,
        disputeWindowHours,
        { value: excessPayment }
      );

      const finalBalance = await platformFeeRecipient.getBalance();
      expect(finalBalance.sub(initialBalance)).to.equal(excessPayment);
    });
  });

  describe("Edge Cases", function () {
    it("Should handle pagination with empty results", async function () {
      const page = await escrowFactory.getEscrowsPaginated(0, 10);
      expect(page).to.have.length(0);
    });

    it("Should handle pagination with offset beyond array length", async function () {
      await createEscrow();
      
      await expect(
        escrowFactory.getEscrowsPaginated(10, 10)
      ).to.be.revertedWith("Offset out of bounds");
    });

    it("Should handle emergency withdraw when paused", async function () {
      await escrowFactory.connect(owner).pause();
      
      // Send some ETH to the factory
      await owner.sendTransaction({
        to: escrowFactory.address,
        value: ethers.utils.parseEther("1.0")
      });

      const initialBalance = await owner.getBalance();
      await escrowFactory.connect(owner).emergencyWithdraw();
      const finalBalance = await owner.getBalance();
      
      expect(finalBalance).to.be.greaterThan(initialBalance);
    });
  });

  // Helper functions
  async function createEscrow(): Promise<string> {
    const tx = await escrowFactory.createEscrow(
      buyer.address,
      seller.address,
      arbiter.address,
      ethers.constants.AddressZero,
      assetAmount,
      deadline,
      description,
      disputeWindowHours,
      { value: creationFee }
    );

    return await getEscrowAddress(tx);
  }

  async function getEscrowAddress(tx: any): Promise<string> {
    const receipt = await tx.wait();
    const escrowCreatedEvent = receipt.events?.find((e: any) => e.event === "EscrowCreated");
    return escrowCreatedEvent?.args?.escrowAddress;
  }

  async function getBlockTimestamp(tx: any): Promise<number> {
    const receipt = await tx.wait();
    const block = await ethers.provider.getBlock(receipt.blockNumber);
    return block.timestamp;
  }
});

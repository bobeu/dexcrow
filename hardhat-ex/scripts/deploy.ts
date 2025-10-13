import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("Deploying contracts with the account:", deployer.address);
  console.log("Account balance:", (await deployer.getBalance()).toString());

  // Deploy EscrowFactory
  const EscrowFactory = await ethers.getContractFactory("EscrowFactory");
  const platformFeeRecipient = deployer.address; // Use deployer as platform fee recipient for now
  
  console.log("Deploying EscrowFactory...");
  const escrowFactory = await EscrowFactory.deploy(platformFeeRecipient);
  await escrowFactory.deployed();

  console.log("EscrowFactory deployed to:", escrowFactory.address);
  console.log("Platform fee recipient:", platformFeeRecipient);

  // Verify deployment
  console.log("\nVerifying deployment...");
  console.log("Total escrows:", (await escrowFactory.getTotalEscrows()).toString());
  console.log("Default dispute window:", (await escrowFactory.defaultDisputeWindowHours()).toString());
  console.log("Creation fee:", ethers.utils.formatEther(await escrowFactory.creationFee()), "ETH");

  // Create a sample escrow for testing
  console.log("\nCreating sample escrow...");
  const buyer = deployer.address;
  const seller = "0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6"; // Random address
  const arbiter = "0x8ba1f109551bD432803012645Hac136c"; // Random address
  const assetAmount = ethers.utils.parseEther("1.0");
  const deadline = Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60; // 7 days from now
  const description = "Sample escrow for testing";
  const disputeWindowHours = 24;
  const creationFee = await escrowFactory.creationFee();

  const createTx = await escrowFactory.createEscrow(
    buyer,
    seller,
    arbiter,
    ethers.constants.AddressZero, // ETH
    assetAmount,
    deadline,
    description,
    disputeWindowHours,
    { value: creationFee }
  );

  const receipt = await createTx.wait();
  const escrowCreatedEvent = receipt.events?.find((e: any) => e.event === "EscrowCreated");
  const escrowAddress = escrowCreatedEvent?.args?.escrowAddress;

  console.log("Sample escrow created at:", escrowAddress);
  console.log("Total escrows after creation:", (await escrowFactory.getTotalEscrows()).toString());

  // Save deployment info
  const deploymentInfo = {
    network: await ethers.provider.getNetwork(),
    escrowFactory: {
      address: escrowFactory.address,
      platformFeeRecipient: platformFeeRecipient,
      defaultDisputeWindowHours: (await escrowFactory.defaultDisputeWindowHours()).toString(),
      creationFee: ethers.utils.formatEther(await escrowFactory.creationFee()),
    },
    sampleEscrow: {
      address: escrowAddress,
      buyer: buyer,
      seller: seller,
      arbiter: arbiter,
      assetAmount: ethers.utils.formatEther(assetAmount),
      deadline: deadline,
      description: description,
      disputeWindowHours: disputeWindowHours,
    },
    deployer: {
      address: deployer.address,
      balance: ethers.utils.formatEther(await deployer.getBalance()),
    },
    timestamp: new Date().toISOString(),
  };

  console.log("\nDeployment completed successfully!");
  console.log("Deployment info:", JSON.stringify(deploymentInfo, null, 2));

  // Instructions for verification
  console.log("\n" + "=".repeat(60));
  console.log("DEPLOYMENT COMPLETE");
  console.log("=".repeat(60));
  console.log("EscrowFactory Address:", escrowFactory.address);
  console.log("Sample Escrow Address:", escrowAddress);
  console.log("\nTo verify contracts on Etherscan:");
  console.log(`npx hardhat verify --network ${await ethers.provider.getNetwork().then(n => n.name)} ${escrowFactory.address} "${platformFeeRecipient}"`);
  console.log("\nTo interact with the contracts:");
  console.log("1. Use the EscrowFactory to create new escrows");
  console.log("2. Use individual Escrow contracts to manage escrow lifecycle");
  console.log("3. Authorize agents using the owner functions");
  console.log("=".repeat(60));
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

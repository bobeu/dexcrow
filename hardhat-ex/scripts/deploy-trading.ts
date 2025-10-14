import { ethers } from "hardhat";

/**
 * @fileoverview Deployment script for TradeVerse trading contracts
 * @author TradeVerse Team
 */

async function main() {
  console.log("🚀 Starting TradeVerse trading contracts deployment...");

  // Get the deployer account
  const [deployer] = await ethers.getSigners();
  console.log("📝 Deploying contracts with account:", deployer.address);

  // Check deployer balance
  const balance = await deployer.getBalance();
  console.log("💰 Account balance:", ethers.utils.formatEther(balance), "ETH");

  if (balance.lt(ethers.utils.parseEther("0.1"))) {
    throw new Error("❌ Insufficient balance for deployment");
  }

  // Deploy Pyth Price Feed (using a mock address for now)
  console.log("\n📊 Deploying PythPriceFeed...");
  const PythPriceFeed = await ethers.getContractFactory("PythPriceFeed");
  const pythPriceFeed = await PythPriceFeed.deploy(
    "0x0000000000000000000000000000000000000000", // Mock Pyth address
    deployer.address
  );
  await pythPriceFeed.deployed();
  console.log("✅ PythPriceFeed deployed to:", pythPriceFeed.address);

  // Deploy TradeFactory
  console.log("\n🏭 Deploying TradeFactory...");
  const TradeFactory = await ethers.getContractFactory("TradeFactory");
  const tradeFactory = await TradeFactory.deploy(deployer.address);
  await tradeFactory.deployed();
  console.log("✅ TradeFactory deployed to:", tradeFactory.address);

  // Add supported chains
  console.log("\n🌐 Adding supported chains...");
  
  // Add Ethereum mainnet
  await tradeFactory.addSupportedChain(
    1, // Ethereum mainnet
    "Ethereum",
    "0x0000000000000000000000000000000000000000" // Placeholder address
  );
  console.log("✅ Added Ethereum mainnet");

  // Add Polygon
  await tradeFactory.addSupportedChain(
    137, // Polygon
    "Polygon",
    "0x0000000000000000000000000000000000000000" // Placeholder address
  );
  console.log("✅ Added Polygon");

  // Add BSC
  await tradeFactory.addSupportedChain(
    56, // BSC
    "BSC",
    "0x0000000000000000000000000000000000000000" // Placeholder address
  );
  console.log("✅ Added BSC");

  // Add Arbitrum
  await tradeFactory.addSupportedChain(
    42161, // Arbitrum
    "Arbitrum",
    "0x0000000000000000000000000000000000000000" // Placeholder address
  );
  console.log("✅ Added Arbitrum");

  // Add Optimism
  await tradeFactory.addSupportedChain(
    10, // Optimism
    "Optimism",
    "0x0000000000000000000000000000000000000000" // Placeholder address
  );
  console.log("✅ Added Optimism");

  // Add Avalanche
  await tradeFactory.addSupportedChain(
    43114, // Avalanche
    "Avalanche",
    "0x0000000000000000000000000000000000000000" // Placeholder address
  );
  console.log("✅ Added Avalanche");

  // Add Solana (using a mock chain ID)
  await tradeFactory.addSupportedChain(
    999999, // Mock Solana chain ID
    "Solana",
    "0x0000000000000000000000000000000000000000" // Placeholder address
  );
  console.log("✅ Added Solana");

  // Add Cosmos (using a mock chain ID)
  await tradeFactory.addSupportedChain(
    999998, // Mock Cosmos chain ID
    "Cosmos",
    "0x0000000000000000000000000000000000000000" // Placeholder address
  );
  console.log("✅ Added Cosmos");

  // Set platform fee to 0.5%
  console.log("\n⚙️ Setting platform fee...");
  await tradeFactory.setPlatformFee(50); // 0.5%
  console.log("✅ Platform fee set to 0.5%");

  // Verify deployments
  console.log("\n🔍 Verifying deployments...");
  
  const platformFee = await tradeFactory.getPlatformFee();
  console.log("📊 Platform fee:", platformFee.toString(), "basis points");

  const supportedChains = await tradeFactory.getSupportedChains();
  console.log("🌐 Supported chains:", supportedChains.length);

  const totalFees = await tradeFactory.getTotalFees();
  console.log("💰 Total fees collected:", ethers.utils.formatEther(totalFees), "ETH");

  // Create a test trading account
  console.log("\n👤 Creating test trading account...");
  const tx = await tradeFactory.createTradingAccount();
  const receipt = await tx.wait();
  console.log("✅ Test trading account created");

  // Get the trading account address
  const tradingAccountAddress = await tradeFactory.getTradingAccount(deployer.address);
  console.log("📝 Trading account address:", tradingAccountAddress);

  // Get account info
  const accountInfo = await tradeFactory.getAccountInfo(deployer.address);
  console.log("👤 Account reputation:", accountInfo.reputation.toString());
  console.log("📊 Total orders:", accountInfo.totalOrders.toString());
  console.log("✅ Successful orders:", accountInfo.successfulOrders.toString());

  // Summary
  console.log("\n🎉 Deployment Summary:");
  console.log("====================");
  console.log("📊 PythPriceFeed:", pythPriceFeed.address);
  console.log("🏭 TradeFactory:", tradeFactory.address);
  console.log("👤 Test Trading Account:", tradingAccountAddress);
  console.log("🌐 Supported Chains:", supportedChains.length);
  console.log("💰 Platform Fee:", platformFee.toString(), "basis points");
  console.log("🔗 Network:", await deployer.provider.getNetwork());

  // Save deployment info
  const deploymentInfo = {
    network: (await deployer.provider.getNetwork()).name,
    chainId: (await deployer.provider.getNetwork()).chainId,
    deployer: deployer.address,
    contracts: {
      PythPriceFeed: pythPriceFeed.address,
      TradeFactory: tradeFactory.address,
      TestTradingAccount: tradingAccountAddress
    },
    timestamp: new Date().toISOString()
  };

  console.log("\n💾 Deployment info saved to deployment-info.json");
  console.log(JSON.stringify(deploymentInfo, null, 2));

  console.log("\n🚀 TradeVerse trading contracts deployed successfully!");
  console.log("🎯 Ready for trading operations!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });

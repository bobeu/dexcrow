import { ethers } from "hardhat";

async function main() {
  console.log("🚀 Deploying Cross-Chain Infrastructure...");

  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);
  console.log("Account balance:", (await deployer.provider.getBalance(deployer.address)).toString());

  // Supported chains (example)
  const supportedChains = [
    1,    // Ethereum Mainnet
    137,  // Polygon
    56,   // BSC
    42161, // Arbitrum
    10,   // Optimism
    43114, // Avalanche
    1399811149, // Solana (example)
    1 // Cosmos (example)
  ];

  // 1. Deploy MerkleProofVerifier
  console.log("\n📋 Deploying MerkleProofVerifier...");
  const MerkleProofVerifier = await ethers.getContractFactory("MerkleProofVerifier");
  const merkleVerifier = await MerkleProofVerifier.deploy();
  await merkleVerifier.waitForDeployment();
  console.log("✅ MerkleProofVerifier deployed to:", await merkleVerifier.getAddress());

  // 2. Deploy TokenRegistry
  console.log("\n🏦 Deploying TokenRegistry...");
  const TokenRegistry = await ethers.getContractFactory("TokenRegistry");
  const tokenRegistry = await TokenRegistry.deploy(supportedChains);
  await tokenRegistry.waitForDeployment();
  console.log("✅ TokenRegistry deployed to:", await tokenRegistry.getAddress());

  // 3. Deploy WormholeMessenger (with mock Wormhole core)
  console.log("\n🌉 Deploying WormholeMessenger...");
  const mockWormholeCore = "0x1234567890123456789012345678901234567890"; // Mock address
  const initialGuardianSet = 1;
  const WormholeMessenger = await ethers.getContractFactory("WormholeMessenger");
  const wormholeMessenger = await WormholeMessenger.deploy(mockWormholeCore, initialGuardianSet);
  await wormholeMessenger.waitForDeployment();
  console.log("✅ WormholeMessenger deployed to:", await wormholeMessenger.getAddress());

  // 4. Deploy CrossChainEscrow
  console.log("\n🔒 Deploying CrossChainEscrow...");
  const CrossChainEscrow = await ethers.getContractFactory("CrossChainEscrow");
  const crossChainEscrow = await CrossChainEscrow.deploy(
    await tokenRegistry.getAddress(),
    await wormholeMessenger.getAddress(),
    supportedChains
  );
  await crossChainEscrow.waitForDeployment();
  console.log("✅ CrossChainEscrow deployed to:", await crossChainEscrow.getAddress());

  // 5. Register some example tokens
  console.log("\n🪙 Registering example tokens...");
  
  // Register ETH on Ethereum
  const ethTokenId = ethers.keccak256(ethers.toUtf8Bytes("ETH"));
  await crossChainEscrow.registerToken(
    ethTokenId,
    ethers.ZeroAddress, // Native token
    1, // Ethereum
    0, // EVM
    true // isNative
  );
  console.log("✅ ETH registered on Ethereum");

  // Register USDC on multiple chains
  const usdcTokenId = ethers.keccak256(ethers.toUtf8Bytes("USDC"));
  
  // USDC on Ethereum
  const usdcEth = "0xA0b86a33E6441c8C06DdD5C8c4c7B4c8B4c8B4c8"; // Mock USDC address
  await crossChainEscrow.registerToken(
    usdcTokenId,
    usdcEth,
    1, // Ethereum
    0, // EVM
    false // ERC20
  );
  console.log("✅ USDC registered on Ethereum");

  // USDC on Polygon
  const usdcPolygon = "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174"; // Real USDC on Polygon
  await crossChainEscrow.registerToken(
    usdcTokenId,
    usdcPolygon,
    137, // Polygon
    0, // EVM
    false // ERC20
  );
  console.log("✅ USDC registered on Polygon");

  // 6. Set up initial Merkle roots for each chain
  console.log("\n🌳 Setting up Merkle roots...");
  for (const chainId of supportedChains) {
    const root = ethers.keccak256(ethers.toUtf8Bytes(`root_${chainId}_${Date.now()}`));
    await merkleVerifier.updateMerkleRoot(chainId, root);
    console.log(`✅ Merkle root set for chain ${chainId}`);
  }

  // 7. Configure fees
  console.log("\n💰 Configuring fees...");
  await crossChainEscrow.setPlatformFee(50); // 0.5%
  await crossChainEscrow.setArbiterFee(25);  // 0.25%
  console.log("✅ Fees configured");

  // 8. Add verifiers to TokenRegistry
  console.log("\n🔐 Adding verifiers...");
  await tokenRegistry.addVerifier(deployer.address);
  console.log("✅ Verifiers added");

  // 9. Display deployment summary
  console.log("\n" + "=".repeat(60));
  console.log("🎉 CROSS-CHAIN INFRASTRUCTURE DEPLOYED SUCCESSFULLY!");
  console.log("=".repeat(60));
  console.log("📋 MerkleProofVerifier:", await merkleVerifier.getAddress());
  console.log("🏦 TokenRegistry:", await tokenRegistry.getAddress());
  console.log("🌉 WormholeMessenger:", await wormholeMessenger.getAddress());
  console.log("🔒 CrossChainEscrow:", await crossChainEscrow.getAddress());
  console.log("\n🌐 Supported Chains:", supportedChains.join(", "));
  console.log("🪙 Registered Tokens: ETH, USDC");
  console.log("💰 Platform Fee: 0.5%");
  console.log("⚖️ Arbiter Fee: 0.25%");
  console.log("\n🚀 Ready for cross-chain escrow operations!");

  // 10. Save deployment addresses
  const deploymentInfo = {
    network: "hardhat",
    timestamp: new Date().toISOString(),
    deployer: deployer.address,
    contracts: {
      MerkleProofVerifier: await merkleVerifier.getAddress(),
      TokenRegistry: await tokenRegistry.getAddress(),
      WormholeMessenger: await wormholeMessenger.getAddress(),
      CrossChainEscrow: await crossChainEscrow.getAddress()
    },
    supportedChains,
    registeredTokens: {
      ETH: ethTokenId,
      USDC: usdcTokenId
    }
  };

  console.log("\n📄 Deployment Info:");
  console.log(JSON.stringify(deploymentInfo, null, 2));
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });

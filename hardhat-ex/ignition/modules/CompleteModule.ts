import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

/**
 * @title CompleteModule
 * @dev Hardhat 3 Ignition deployment module for all TradeVerse contracts
 * 
 * This module deploys all contracts in the correct order:
 * - Escrow contracts (EscrowFactory, MockERC20)
 * - Trading contracts (TradeFactory, SupportedChains, PythPriceFeed)
 * - Cross-chain contracts (MerkleProofVerifier, TokenRegistry, WormholeMessenger, CrossChainEscrow)
 * 
 * This is the main deployment module for the complete TradeVerse platform.
 */
export default buildModule("CompleteModule", (m) => {
  // Get the deployer account
  const deployer = m.getAccount(0);
  
  // ============ ESCROW CONTRACTS ============
  
  // Deploy MockERC20 token for testing
  const mockToken = m.contract("MockERC20", [m.parseEther("1000000")], {
    id: "MockERC20"
  });
  
  // Deploy EscrowFactory
  const escrowFactory = m.contract("EscrowFactory", [deployer], {
    id: "EscrowFactory"
  });
  
  // Initialize EscrowFactory
  m.call(escrowFactory, "setDefaultDisputeWindow", [24 * 60 * 60]); // 24 hours
  m.call(escrowFactory, "setCreationFee", [m.parseEther("0.01")]); // 0.01 ETH
  
  // ============ TRADING CONTRACTS ============
  
  // Deploy PythPriceFeed
  const pythPriceFeed = m.contract("PythPriceFeed", [deployer], {
    id: "PythPriceFeed"
  });
  
  // Deploy TradeFactory
  const tradeFactory = m.contract("TradeFactory", [], {
    id: "TradeFactory"
  });
  
  // Deploy SupportedChains
  const initialChains = [
    {
      chainId: 1n, // Ethereum
      chainName: "Ethereum",
      factoryAddress: "0x0000000000000000000000000000000000000000"
    },
    {
      chainId: 137n, // Polygon
      chainName: "Polygon",
      factoryAddress: "0x0000000000000000000000000000000000000000"
    },
    {
      chainId: 56n, // BSC
      chainName: "BSC",
      factoryAddress: "0x0000000000000000000000000000000000000000"
    }
  ];
  
  const supportedChains = m.contract("SupportedChains", [initialChains], {
    id: "SupportedChains"
  });
  
  // Initialize TradeFactory
  m.call(tradeFactory, "setPlatformFee", [100]); // 1%
  m.call(tradeFactory, "setCreationFee", [m.parseEther("0.001")]); // 0.001 ETH
  m.call(tradeFactory, "setSupportedPaymentAsset", [mockToken.address]);
  m.call(tradeFactory, "toggleIsPythSupportedNetwork", []);
  
  // Initialize PythPriceFeed
  m.call(pythPriceFeed, "addPriceFeed", [
    "0x" + "ETHUSD".padStart(64, "0"),
    "ETH/USD"
  ]);
  m.call(pythPriceFeed, "addPriceFeed", [
    "0x" + "BTCUSD".padStart(64, "0"),
    "BTC/USD"
  ]);
  m.call(pythPriceFeed, "setMaxPriceAge", [300]); // 5 minutes
  m.call(pythPriceFeed, "setMaxPriceDeviation", [1000]); // 10%
  
  // ============ CROSS-CHAIN CONTRACTS ============
  
  // Deploy MerkleProofVerifier
  const merkleProofVerifier = m.contract("MerkleProofVerifier", [], {
    id: "MerkleProofVerifier"
  });
  
  // Deploy TokenRegistry
  const supportedChainsForRegistry = [1n, 137n, 56n];
  const tokenRegistry = m.contract("TokenRegistry", [supportedChainsForRegistry], {
    id: "TokenRegistry"
  });
  
  // Deploy WormholeMessenger
  const wormholeCore = "0x0000000000000000000000000000000000000000"; // Mock address
  const guardianSets = [];
  const currentGuardianSetIndex = 0;
  
  const wormholeMessenger = m.contract("WormholeMessenger", [
    wormholeCore,
    guardianSets,
    currentGuardianSetIndex,
    supportedChainsForRegistry
  ], {
    id: "WormholeMessenger"
  });
  
  // Deploy CrossChainEscrow
  const crossChainEscrow = m.contract("CrossChainEscrow", [
    tokenRegistry.address,
    wormholeMessenger.address,
    supportedChainsForRegistry
  ], {
    id: "CrossChainEscrow"
  });
  
  // Initialize CrossChainEscrow
  m.call(crossChainEscrow, "setPlatformFee", [100]); // 1%
  m.call(crossChainEscrow, "setArbiterFee", [50]); // 0.5%
  
  // Register sample tokens
  const ethTokenId = "0x" + "ETH".padStart(64, "0");
  const usdcTokenId = "0x" + "USDC".padStart(64, "0");
  
  m.call(tokenRegistry, "registerToken", [
    ethTokenId,
    "Ethereum",
    "0x0000000000000000000000000000000000000000",
    18,
    "0x" + "Ethereum".padStart(64, "0"),
    "0x" + "ETH".padStart(64, "0")
  ]);
  
  m.call(tokenRegistry, "registerToken", [
    usdcTokenId,
    "USD Coin",
    "0xA0b86a33E6441b8C4C8C0E4A8e4A8e4A8e4A8e4A",
    6,
    "0x" + "USD Coin".padStart(64, "0"),
    "0x" + "USDC".padStart(64, "0")
  ]);
  
  // Add supported chains to WormholeMessenger
  m.call(wormholeMessenger, "addSupportedChain", [1n, "Ethereum"]);
  m.call(wormholeMessenger, "addSupportedChain", [137n, "Polygon"]);
  m.call(wormholeMessenger, "addSupportedChain", [56n, "BSC"]);
  
  // ============ SAMPLE DATA CREATION ============
  
  // Create sample escrow
  const sampleBuyer = m.getAccount(0);
  const sampleSeller = "0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6";
  const sampleArbiter = "0x8ba1f109551bD432803012645Hac136c";
  const sampleAmount = m.parseEther("1.0");
  const sampleDeadline = Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60;
  const sampleDescription = "Sample escrow for testing";
  const sampleDisputeWindow = 24 * 60 * 60;
  
  m.call(escrowFactory, "createEscrow", [
    sampleBuyer,
    sampleSeller,
    sampleArbiter,
    "0x0000000000000000000000000000000000000000",
    sampleAmount,
    sampleDeadline,
    sampleDescription,
    sampleDisputeWindow
  ], {
    value: m.parseEther("0.01")
  });
  
  // Create sample trading accounts
  const user1 = m.getAccount(1);
  const user2 = m.getAccount(2);
  
  m.call(tradeFactory, "createTradingAccount", [user1, "User1"]);
  m.call(tradeFactory, "createTradingAccount", [user2, "User2"]);
  
  return {
    // Escrow contracts
    escrowFactory,
    mockToken,
    
    // Trading contracts
    tradeFactory,
    supportedChains,
    pythPriceFeed,
    
    // Cross-chain contracts
    merkleProofVerifier,
    tokenRegistry,
    wormholeMessenger,
    crossChainEscrow,
    
    // Deployer
    deployer
  };
});

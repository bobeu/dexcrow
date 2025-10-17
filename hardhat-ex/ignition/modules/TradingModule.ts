import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

/**
 * @title TradingModule
 * @dev Hardhat 3 Ignition deployment module for Trading contracts
 * 
 * This module deploys:
 * - TradeFactory: Main factory for creating trading accounts
 * - SupportedChains: Contract for managing supported blockchain networks
 * - PythPriceFeed: Oracle contract for live price feeds
 * - MockERC20: Test token for trading
 * 
 * The module also initializes the contracts with default parameters
 * and sets up supported chains and payment assets.
 */
export default buildModule("TradingModule", (m) => {
  // Get the deployer account
  const deployer = m.getAccount(0);
  
  // Deploy MockERC20 token for testing
  const mockToken = m.contract("MockERC20", [m.parseEther("1000000")], {
    id: "MockERC20"
  });
  
  // Deploy PythPriceFeed
  const pythPriceFeed = m.contract("PythPriceFeed", [deployer], {
    id: "PythPriceFeed"
  });
  
  // Deploy TradeFactory
  const tradeFactory = m.contract("TradeFactory", [], {
    id: "TradeFactory"
  });
  
  // Deploy SupportedChains with initial chains
  const initialChains = [
    {
      chainId: 1n, // Ethereum
      chainName: "Ethereum",
      factoryAddress: "0x0000000000000000000000000000000000000000" // Will be set after TradeFactory deployment
    },
    {
      chainId: 137n, // Polygon
      chainName: "Polygon", 
      factoryAddress: "0x0000000000000000000000000000000000000000" // Will be set after TradeFactory deployment
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
  
  // Add price feeds to PythPriceFeed
  m.call(pythPriceFeed, "addPriceFeed", [
    "0x" + "ETHUSD".padStart(64, "0"),
    "ETH/USD"
  ]);
  
  m.call(pythPriceFeed, "addPriceFeed", [
    "0x" + "BTCUSD".padStart(64, "0"), 
    "BTC/USD"
  ]);
  
  // Set price feed parameters
  m.call(pythPriceFeed, "setMaxPriceAge", [300]); // 5 minutes
  m.call(pythPriceFeed, "setMaxPriceDeviation", [1000]); // 10%
  
  // Create sample trading accounts
  const user1 = m.getAccount(1);
  const user2 = m.getAccount(2);
  
  m.call(tradeFactory, "createTradingAccount", [user1, "User1"]);
  m.call(tradeFactory, "createTradingAccount", [user2, "User2"]);
  
  return {
    tradeFactory,
    supportedChains,
    pythPriceFeed,
    mockToken,
    deployer
  };
});

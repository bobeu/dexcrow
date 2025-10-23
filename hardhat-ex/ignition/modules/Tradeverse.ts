import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";
import { namedAccounts } from "../../parameters";

/**
 * @title Tradeverse
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
export default buildModule("Tradeverse", (m) => {
  // Get the deployer account
  // const deployer = m.getAccount(0);
  
  // // Deploy PythPriceFeed
  // const pythPriceFeed = m.contract("PythPriceFeed", [deployer], {
  //   id: "PythPriceFeed"
  // });
  
  // Deploy TradeFactory
  const arbitrator = m.contract("Arbitrators", [], {
    id: "Arbitrators"
  });

  // Deploy TradeFactory
  const tradeFactory = m.contract("TradeFactory", [], {
    id: "TradeFactory"
  });
  
  // console.log("Arbitrator:", arbitrator);
  const escrowFactory = m.contract("EscrowFactory", [namedAccounts.feeRecipient, arbitrator], {
    id: "EscrowFactory"
  });
  
  return {
    tradeFactory,
    escrowFactory,
    arbitrator,
  };
});

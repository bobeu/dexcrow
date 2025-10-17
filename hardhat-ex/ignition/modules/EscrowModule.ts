import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

/**
 * @title EscrowModule
 * @dev Hardhat 3 Ignition deployment module for Escrow contracts
 * 
 * This module deploys:
 * - EscrowFactory: Main factory contract for creating escrows
 * - MockERC20: Test token for ERC20 escrow testing
 * 
 * The module also initializes the factory with default parameters
 * and creates a sample escrow for testing purposes.
 */
export default buildModule("EscrowModule", (m) => {
  // Get the deployer account
  const deployer = m.getAccount(0);
  
  // Deploy MockERC20 token for testing
  const mockToken = m.contract("MockERC20", [m.parseEther("1000000")], {
    id: "MockERC20"
  });
  
  // Deploy EscrowFactory
  const escrowFactory = m.contract("EscrowFactory", [deployer], {
    id: "EscrowFactory"
  });
  
  // Initialize factory with default parameters
  m.call(escrowFactory, "setDefaultDisputeWindow", [24 * 60 * 60]); // 24 hours
  m.call(escrowFactory, "setCreationFee", [m.parseEther("0.01")]); // 0.01 ETH
  
  // Create a sample escrow for testing
  const sampleBuyer = m.getAccount(0);
  const sampleSeller = "0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6";
  const sampleArbiter = "0x8ba1f109551bD432803012645Hac136c";
  const sampleAmount = m.parseEther("1.0");
  const sampleDeadline = Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60; // 7 days
  const sampleDescription = "Sample escrow for testing";
  const sampleDisputeWindow = 24 * 60 * 60; // 24 hours
  
  // Create sample escrow
  m.call(escrowFactory, "createEscrow", [
    sampleBuyer,
    sampleSeller,
    sampleArbiter,
    "0x0000000000000000000000000000000000000000", // ETH
    sampleAmount,
    sampleDeadline,
    sampleDescription,
    sampleDisputeWindow
  ], {
    value: m.parseEther("0.01") // Creation fee
  });
  
  return { 
    escrowFactory,
    mockToken,
    deployer
  };
});

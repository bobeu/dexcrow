import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

/**
 * @title SimpleEscrowModule
 * @dev Simplified Hardhat 3 Ignition deployment module for Escrow contracts
 * 
 * This module deploys:
 * - EscrowFactory: Main factory contract for creating escrows
 * - MockERC20: Test token for ERC20 escrow testing
 * 
 * Note: This module doesn't create sample escrows to avoid stack too deep issues
 */
export default buildModule("SimpleEscrowModule", (m) => {
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
  
  return { 
    escrowFactory,
    mockToken,
    deployer
  };
});

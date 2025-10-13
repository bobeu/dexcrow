// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import { ERC20 } from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/**
 * @title MockERC20
 * @dev A simple ERC20 token implementation for testing purposes
 * 
 * This contract provides a basic ERC20 token with minting capabilities
 * to be used in testing scenarios where a token contract is needed.
 * 
 * Features:
 * - Standard ERC20 functionality
 * - Minting capability for test setup
 * - Simple implementation without complex features
 * 
 * @author Test Suite
 */
contract MockERC20 is ERC20 {
    /**
     * @dev Constructor that initializes the token with a name, symbol, and initial supply
     * @param initialSupply The initial supply of tokens to mint to the deployer
     */
    constructor(uint256 initialSupply) ERC20("MockERC20", "MERC") {
        _mint(msg.sender, initialSupply);
    }

    /**
     * @dev Mints new tokens to the specified address
     * @param to The address to mint tokens to
     * @param amount The amount of tokens to mint
     * 
     * This function is only available for testing purposes and should not be used
     * in production contracts without proper access controls
     */
    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }

    /**
     * @dev Burns tokens from the caller's balance
     * @param amount The amount of tokens to burn
     * 
     * This function allows the caller to burn their own tokens
     */
    function burn(uint256 amount) external {
        _burn(msg.sender, amount);
    }
}

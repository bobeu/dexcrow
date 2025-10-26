// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import { ERC20 } from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/**
 * @title Verse Token
 * @dev A native ERC20 token of the Tradeverse ecosystem
 * 
 * This contract provides a basic ERC20 token with minting capabilities
 * 
 * Features:
 * - Standard ERC20 functionality
 * - Minting capability
 * - Simple implementation without complex features
 * 
 * @author Bobelr - https://github.com/bobeu
 */
contract VerseToken is ERC20 {
    error MaxSupplyExceeded();

    uint256 public immutable maxSupply; 
    address public immutable receiver;

    /**
     * @dev Constructor that initializes the token with a name, symbol, and initial supply
     * @param initialSupply The initial supply of tokens to mint to the deployer
     */
    constructor(
        uint256 _maxSupply, 
        uint256 initialSupply, 
        string memory name_, 
        string memory symbol_,
        address initialSupplyReceiver
    ) ERC20(name_, symbol_) {
        require(initialSupplyReceiver != address(0), "Verse Token: InitialSupplyReceiver is zero Address");
        require(initialSupply <= _maxSupply, "Initial supply exceeds max supply");
        receiver = initialSupplyReceiver;
        uint8 dec = decimals();
        unchecked {
            maxSupply = _maxSupply * (10 ** dec);
            _mint(initialSupplyReceiver, initialSupply * (10 ** dec));
        }
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
        require(msg.sender == receiver, "Not an approved account");
        unchecked {
            if((totalSupply() + amount) > maxSupply) revert MaxSupplyExceeded();
        }
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

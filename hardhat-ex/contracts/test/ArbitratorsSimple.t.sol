// SPDX-License-Identifier: MIT

pragma solidity 0.8.30;

import { Arbitrators } from "../escrow/Arbitrators.sol";
import { IArbitrators } from "../interfaces/IArbitrators.sol";
import { Test } from "forge-std/Test.sol";

/**
 * @title ArbitratorsSimpleTest
 * @dev Simple test to verify Arbitrators contract compilation
 */
contract ArbitratorsSimpleTest is Test {
    Arbitrators public arbitrators;
    
    address public owner = address(0x1);
    
    function setUp() public {
        vm.prank(owner);
        arbitrators = new Arbitrators();
    }
    
    function test_Constructor_Success() public view {
        assertEq(arbitrators.owner(), owner);
    }
    
    function test_ReadData() public view {
        IArbitrators.ReadData memory data = arbitrators.readData();
        assertEq(data.arbiters.length, 0);
    }
}

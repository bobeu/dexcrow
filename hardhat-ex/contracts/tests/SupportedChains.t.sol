// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

import {Test, console} from "forge-std/Test.sol";
import {SupportedChains} from "../trading/SupportedChains.sol";
import {ISupportedChains} from "../interfaces/ISupportedChains.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title SupportedChainsTest
 * @dev Comprehensive test suite for SupportedChains contract
 * @author TradeVerse Team
 */
contract SupportedChainsTest is Test {
    SupportedChains public supportedChains;
    
    // Test data
    address public owner;
    address public user1;
    address public user2;
    
    // Chain data
    uint256 constant CHAIN_ID_ETH = 1;
    uint256 constant CHAIN_ID_POLYGON = 137;
    uint256 constant CHAIN_ID_BSC = 56;
    uint256 constant CHAIN_ID_ARBITRUM = 42161;
    
    string constant CHAIN_NAME_ETH = "Ethereum";
    string constant CHAIN_NAME_POLYGON = "Polygon";
    string constant CHAIN_NAME_BSC = "BSC";
    string constant CHAIN_NAME_ARBITRUM = "Arbitrum";
    
    address constant FACTORY_ADDRESS_ETH = 0x1234567890123456789012345678901234567890;
    address constant FACTORY_ADDRESS_POLYGON = 0x2345678901234567890123456789012345678901;
    address constant FACTORY_ADDRESS_BSC = 0x3456789012345678901234567890123456789012;
    address constant FACTORY_ADDRESS_ARBITRUM = 0x4567890123456789012345678901234567890123;
    
    // Events
    event ChainAdded(uint256 indexed chainId, string chainName, address factoryAddress);
    event ChainRemoved(uint256 indexed chainId);
    
    function setUp() public {
        owner = address(this);
        user1 = makeAddr("user1");
        user2 = makeAddr("user2");
        
        // Initialize with some chains
        ISupportedChains.SupportedChainInput[] memory initialChains = new ISupportedChains.SupportedChainInput[](2);
        initialChains[0] = ISupportedChains.SupportedChainInput({
            chainId: CHAIN_ID_ETH,
            chainName: CHAIN_NAME_ETH,
            factoryAddress: FACTORY_ADDRESS_ETH
        });
        initialChains[1] = ISupportedChains.SupportedChainInput({
            chainId: CHAIN_ID_POLYGON,
            chainName: CHAIN_NAME_POLYGON,
            factoryAddress: FACTORY_ADDRESS_POLYGON
        });
        
        supportedChains = new SupportedChains(initialChains);
    }
    
    // ============ CONSTRUCTOR TESTS ============
    
    function test_Constructor_Success() public {
        ISupportedChains.SupportedChainInput[] memory initialChains = new ISupportedChains.SupportedChainInput[](1);
        initialChains[0] = ISupportedChains.SupportedChainInput({
            chainId: CHAIN_ID_BSC,
            chainName: CHAIN_NAME_BSC,
            factoryAddress: FACTORY_ADDRESS_BSC
        });
        
        SupportedChains newSupportedChains = new SupportedChains(initialChains);
        
        (bool isSupported,) = newSupportedChains.isSupportedChain(CHAIN_ID_BSC);
        assertTrue(isSupported);
        ISupportedChains.SupportedChain memory chain = newSupportedChains.getSupportedChain(CHAIN_ID_BSC);
        assertEq(string(chain.chainName), CHAIN_NAME_BSC);
        assertEq(chain.factoryAddress, FACTORY_ADDRESS_BSC);
    }
    
    function test_Constructor_EmptyArray() public {
        ISupportedChains.SupportedChainInput[] memory initialChains = new ISupportedChains.SupportedChainInput[](0);
        
        SupportedChains newSupportedChains = new SupportedChains(initialChains);
        
        (bool isSupported,) = newSupportedChains.isSupportedChain(CHAIN_ID_BSC);
        assertFalse(isSupported);
    }
    
    // ============ ADD SUPPORTED CHAIN TESTS ============
    
    function test_AddSupportedChain_Success() public {
        vm.expectEmit(true, false, false, true);
        emit ChainAdded(CHAIN_ID_BSC, CHAIN_NAME_BSC, FACTORY_ADDRESS_BSC);
        
        supportedChains.addSupportedChain(CHAIN_ID_BSC, CHAIN_NAME_BSC, FACTORY_ADDRESS_BSC);
        
        (bool isSupported,) = supportedChains.isSupportedChain(CHAIN_ID_BSC);
        assertTrue(isSupported);
        ISupportedChains.SupportedChain memory chain = supportedChains.getSupportedChain(CHAIN_ID_BSC);
        assertEq(string(chain.chainName), CHAIN_NAME_BSC);
        assertEq(chain.factoryAddress, FACTORY_ADDRESS_BSC);
    }
    
    function test_AddSupportedChain_OnlyOwner() public {
        vm.prank(user1);
        vm.expectRevert(abi.encodeWithSelector(Ownable.OwnableUnauthorizedAccount.selector, user1));
        supportedChains.addSupportedChain(CHAIN_ID_BSC, CHAIN_NAME_BSC, FACTORY_ADDRESS_BSC);
    }
    
    function test_AddSupportedChain_ChainAlreadySupported() public {
        vm.expectRevert(ISupportedChains.ChainSupported.selector);
        supportedChains.addSupportedChain(CHAIN_ID_ETH, CHAIN_NAME_ETH, FACTORY_ADDRESS_ETH);
    }
    
    // Note: The contract doesn't validate zero chain ID, empty chain name, or zero factory address
    // These validations would need to be added to the contract if required
    
    // ============ REMOVE SUPPORTED CHAIN TESTS ============
    
    function test_RemoveSupportedChain_Success() public {
        vm.expectEmit(true, false, false, false);
        emit ChainRemoved(CHAIN_ID_ETH);
        
        supportedChains.unSupportChain(CHAIN_ID_ETH);
        
        (bool isSupported,) = supportedChains.isSupportedChain(CHAIN_ID_ETH);
        assertFalse(isSupported);
    }
    
    function test_RemoveSupportedChain_OnlyOwner() public {
        vm.prank(user1);
        vm.expectRevert(abi.encodeWithSelector(Ownable.OwnableUnauthorizedAccount.selector, user1));
        supportedChains.unSupportChain(CHAIN_ID_ETH);
    }
    
    function test_RemoveSupportedChain_ChainNotSupported() public {
        vm.expectRevert(ISupportedChains.InvalidChain.selector);
        supportedChains.unSupportChain(CHAIN_ID_BSC);
    }
    
    // ============ VIEW FUNCTION TESTS ============
    
    function test_IsChainSupported_Supported() public {
        (bool isSupported1,) = supportedChains.isSupportedChain(CHAIN_ID_ETH);
        (bool isSupported2,) = supportedChains.isSupportedChain(CHAIN_ID_POLYGON);
        assertTrue(isSupported1);
        assertTrue(isSupported2);
    }
    
    function test_IsChainSupported_NotSupported() public {
        (bool isSupported1,) = supportedChains.isSupportedChain(CHAIN_ID_BSC);
        (bool isSupported2,) = supportedChains.isSupportedChain(999);
        assertFalse(isSupported1);
        assertFalse(isSupported2);
    }
    
    function test_GetChainName_Supported() public {
        ISupportedChains.SupportedChain memory chain1 = supportedChains.getSupportedChain(CHAIN_ID_ETH);
        ISupportedChains.SupportedChain memory chain2 = supportedChains.getSupportedChain(CHAIN_ID_POLYGON);
        assertEq(string(chain1.chainName), CHAIN_NAME_ETH);
        assertEq(string(chain2.chainName), CHAIN_NAME_POLYGON);
    }
    
    function test_GetChainName_NotSupported() public {
        vm.expectRevert(ISupportedChains.InvalidChain.selector);
        supportedChains.getSupportedChain(CHAIN_ID_BSC);
    }
    
    function test_GetFactoryAddress_Supported() public {
        ISupportedChains.SupportedChain memory chain1 = supportedChains.getSupportedChain(CHAIN_ID_ETH);
        ISupportedChains.SupportedChain memory chain2 = supportedChains.getSupportedChain(CHAIN_ID_POLYGON);
        assertEq(chain1.factoryAddress, FACTORY_ADDRESS_ETH);
        assertEq(chain2.factoryAddress, FACTORY_ADDRESS_POLYGON);
    }
    
    function test_GetFactoryAddress_NotSupported() public {
        vm.expectRevert(ISupportedChains.InvalidChain.selector);
        supportedChains.getSupportedChain(CHAIN_ID_BSC);
    }
    
    function test_GetSupportedChains() public {
        ISupportedChains.SupportedChain[] memory chains = supportedChains.getSupportedChains();
        assertEq(chains.length, 2);
        assertEq(chains[0].chainId, CHAIN_ID_ETH);
        assertEq(chains[1].chainId, CHAIN_ID_POLYGON);
    }
    
    function test_GetSupportedChainsCount() public {
        ISupportedChains.SupportedChain[] memory chains = supportedChains.getSupportedChains();
        assertEq(chains.length, 2);
        
        supportedChains.addSupportedChain(CHAIN_ID_BSC, CHAIN_NAME_BSC, FACTORY_ADDRESS_BSC);
        chains = supportedChains.getSupportedChains();
        assertEq(chains.length, 3);
        
        supportedChains.unSupportChain(CHAIN_ID_ETH);
        chains = supportedChains.getSupportedChains();
        assertEq(chains.length, 2);
    }
    
    // ============ EDGE CASES AND SECURITY TESTS ============
    
    function test_MultipleChainOperations() public {
        // Add multiple chains
        supportedChains.addSupportedChain(CHAIN_ID_BSC, CHAIN_NAME_BSC, FACTORY_ADDRESS_BSC);
        supportedChains.addSupportedChain(CHAIN_ID_ARBITRUM, CHAIN_NAME_ARBITRUM, FACTORY_ADDRESS_ARBITRUM);
        
        ISupportedChains.SupportedChain[] memory chains = supportedChains.getSupportedChains();
        assertEq(chains.length, 4);
        (bool isSupported1,) = supportedChains.isSupportedChain(CHAIN_ID_BSC);
        (bool isSupported2,) = supportedChains.isSupportedChain(CHAIN_ID_ARBITRUM);
        assertTrue(isSupported1);
        assertTrue(isSupported2);
        
        // Remove some chains
        supportedChains.unSupportChain(CHAIN_ID_ETH);
        supportedChains.unSupportChain(CHAIN_ID_BSC);
        
        ISupportedChains.SupportedChain[] memory chains2 = supportedChains.getSupportedChains();
        assertEq(chains2.length, 2);
        (bool isSupported3,) = supportedChains.isSupportedChain(CHAIN_ID_ETH);
        (bool isSupported4,) = supportedChains.isSupportedChain(CHAIN_ID_BSC);
        assertFalse(isSupported3);
        assertFalse(isSupported4);
        (bool isSupported5,) = supportedChains.isSupportedChain(CHAIN_ID_POLYGON);
        (bool isSupported6,) = supportedChains.isSupportedChain(CHAIN_ID_ARBITRUM);
        assertTrue(isSupported5);
        assertTrue(isSupported6);
    }
    
    function test_ReaddRemovedChain() public {
        // Remove chain
        supportedChains.unSupportChain(CHAIN_ID_ETH);
        (bool isSupported,) = supportedChains.isSupportedChain(CHAIN_ID_ETH);
        assertFalse(isSupported);
        
        // Readd chain
        supportedChains.addSupportedChain(CHAIN_ID_ETH, CHAIN_NAME_ETH, FACTORY_ADDRESS_ETH);
        (bool isSupported2,) = supportedChains.isSupportedChain(CHAIN_ID_ETH);
        assertTrue(isSupported2);
        ISupportedChains.SupportedChain memory chain = supportedChains.getSupportedChain(CHAIN_ID_ETH);
        assertEq(string(chain.chainName), CHAIN_NAME_ETH);
        assertEq(chain.factoryAddress, FACTORY_ADDRESS_ETH);
    }
    
    function test_UpdateFactoryAddress() public {
        address newFactoryAddress = makeAddr("newFactory");
        
        // Remove and readd with new factory address
        supportedChains.unSupportChain(CHAIN_ID_ETH);
        supportedChains.addSupportedChain(CHAIN_ID_ETH, CHAIN_NAME_ETH, newFactoryAddress);
        
        ISupportedChains.SupportedChain memory chain = supportedChains.getSupportedChain(CHAIN_ID_ETH);
        assertEq(chain.factoryAddress, newFactoryAddress);
    }
    
    function test_LargeChainId() public {
        uint256 largeChainId = 2**256 - 1;
        string memory chainName = "LargeChain";
        address factoryAddress = makeAddr("largeFactory");
        
        supportedChains.addSupportedChain(largeChainId, chainName, factoryAddress);
        
        (bool isSupported,) = supportedChains.isSupportedChain(largeChainId);
        assertTrue(isSupported);
        ISupportedChains.SupportedChain memory chain = supportedChains.getSupportedChain(largeChainId);
        assertEq(string(chain.chainName), chainName);
        assertEq(chain.factoryAddress, factoryAddress);
    }
    
    function test_EmptySupportedChainsList() public {
        // Remove all chains
        supportedChains.unSupportChain(CHAIN_ID_ETH);
        supportedChains.unSupportChain(CHAIN_ID_POLYGON);
        
        ISupportedChains.SupportedChain[] memory chains = supportedChains.getSupportedChains();
        assertEq(chains.length, 0);
    }
    
    // ============ GAS OPTIMIZATION TESTS ============
    
    function test_GasUsage_AddChain() public {
        uint256 gasBefore = gasleft();
        supportedChains.addSupportedChain(CHAIN_ID_BSC, CHAIN_NAME_BSC, FACTORY_ADDRESS_BSC);
        uint256 gasUsed = gasBefore - gasleft();
        
        console.log("Gas used for addSupportedChain:", gasUsed);
        assertTrue(gasUsed < 100000); // Reasonable gas limit
    }
    
    function test_GasUsage_RemoveChain() public {
        uint256 gasBefore = gasleft();
        supportedChains.unSupportChain(CHAIN_ID_ETH);
        uint256 gasUsed = gasBefore - gasleft();
        
        console.log("Gas used for unSupportChain:", gasUsed);
        assertTrue(gasUsed < 50000); // Reasonable gas limit
    }
    
    // ============ FOUNDRY FUZZ TESTS ============
    
    function testFuzz_AddSupportedChain(uint256 chainId, string memory chainName, address factoryAddress) public {
        vm.assume(chainId != 0);
        vm.assume(bytes(chainName).length > 0);
        vm.assume(factoryAddress != address(0));
        (bool isSupported1,) = supportedChains.isSupportedChain(chainId);
        vm.assume(!isSupported1);
        
        supportedChains.addSupportedChain(chainId, chainName, factoryAddress);
        
        (bool isSupported2,) = supportedChains.isSupportedChain(chainId);
        assertTrue(isSupported2);
        ISupportedChains.SupportedChain memory chain = supportedChains.getSupportedChain(chainId);
        assertEq(string(chain.chainName), chainName);
        assertEq(chain.factoryAddress, factoryAddress);
    }
    
    function testFuzz_IsChainSupported(uint256 chainId) public {
        (bool isSupported,) = supportedChains.isSupportedChain(chainId);
        
        if (chainId == CHAIN_ID_ETH || chainId == CHAIN_ID_POLYGON) {
            assertTrue(isSupported);
        } else {
            assertFalse(isSupported);
        }
    }
}

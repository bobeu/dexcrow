// SPDX-License-Identifier: MIT

pragma solidity 0.8.30;

import { ISupportedChains } from "../interfaces/ISupportedChains.sol";
import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title SupportedChains - To be deployed on local network/blockchain
 * @dev Contract for managing supportedChains chains
 * @author Bobeu - https://github.com/bobeu
 */
contract SupportedChains is ISupportedChains, Ownable {
    // ============ CUSTOM ERRORS ============
    error UnsupportedChain();

    // ============ STATE VARIABLES ============

    /**
     * @dev Array of supported chains
     */
    SupportedChain[] private _supportedChains;

    /**
     * @dev Mapping of chain IDs to their respective index or position in the _supportedChains array
     */
    mapping(uint256 => ChainIndex) private _chainIndexes;

    // /**
    //  * @dev Ensures chain is supported
    //  */
    // modifier chainSupported(uint256 chainId) {
    //     if (!_chainInfo[chainId].isActive) revert UnsupportedChain();
    //     _;
    // }

    // ============ CONSTRUCTOR ============

    /**
     * @dev Constructor to initialize the trade factory
     */
    constructor(SupportedChainInput[] memory initialChains) Ownable(_msgSender()) {
        for(uint8 i = 0; i < initialChains.length; i++) {
            _addChain(
                initialChains[i].chainId, 
                initialChains[i].chainName, 
                initialChains[i].factoryAddress
            );
        }
    }

    // ============ CHAIN MANAGEMENT ============

    // Add new chain
    function _addChain(uint chainId, string memory chainName, address factoryAddress) internal {
        if(!_chainIndexes[chainId].hasIndex) {
            _chainIndexes[chainId] = ChainIndex(_supportedChains.length, true, true);
            SupportedChain memory sC = SupportedChain(
                    initialChains[i].chainId,
                    abi.encode(bytes(chainName)),
                    true,
                    factoryAddress
                );
            _supportedChains.push(sC);

            emit ChainAdded(chainId, chainName, factoryAddress);
        } else {
            if(chI.isSupported) revert ChainSupported();
            _chainIndexes[chainId].isSupported = true;

            emit ChainActivated(chainId);
        }
    }

    /**
     * @dev Add a supported chain
     * @param chainId Chain ID
     * @param chainName Chain name
     * @param factoryAddress Factory address on the chain
     */
    function addSupportedChain(uint256 chainId, string calldata chainName, address factoryAddress) external override onlyOwner {
        if (_chainIndexes[chainId].isSupported) revert ChainSupported();
        _addChain(chainId, chainName, factoryAddress);
    }

    /**
     * @dev Unsupport a chain from the list. 
     * @param chainId Chain ID to remove
     * @notice We are not removing the chain from the list.We simply deactivate it.
     */
    function unSupportChain(uint256 chainId) external onlyOwner {
        if (!_chainIndexes[chainId].isSupported) revert UnsupportedChain();

        _chainInfo[chainId].isSupported = false;

        emit ChainUnsupported(chainId);
    }

    // ======================= VIEW FUNCTIONS ==========================

    /**
     * @dev Get all supported chains
     * @return chains Array of supported chains
     */
    function getSupportedChains() external view override returns (SupportedChain[] memory chains) {
        chains = _supportedChains;
    }

    /**
     * @dev Get supported chain by ID
     * @param chainId Chain ID
     * @return chain Supported chain information
     */
    function getSupportedChain(uint256 chainId) external view override returns (SupportedChain memory) {
        ChainIndex memory chI = _chainIndexes[chainId];
        if(!chI.hasIndex) revert InvalidChain();
        return _supportedChains[chI.index];
    }

    /**
     * @dev Get supported chain status
     * @param chainId Chain ID
     * @return chain Supported chain information
     */
    function isSupportedChain(uint256 chainId) external view returns (bool, SupportedChain memory _default) {
        ChainIndex memory chI = _chainIndexes[chainId];
        return (
            chI.isSupported,
            chI.hasIndex? _supportedChains[chI.index] : _default
        );
    }
}
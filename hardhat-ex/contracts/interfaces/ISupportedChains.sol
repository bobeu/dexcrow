// SPDX-License-Identifier: MIT

pragma solidity 0.8.30;

/**
 * @title ISupportedChains
 * @dev Interface for the SupportedChains contract
 * @author Bobeu - https://github.com/bobeu
 */
interface ISupportedChains {

    // User-defined data
    struct SupportedChainInput {
        uint256 chainId;
        string chainName;
        address factoryAddress;
    }

    struct SupportedChain {
        uint index;
        uint256 chainId;
        bytes chainName;
        bool isActive;
        address factoryAddress;
    }

    struct ChainIndex {
        uint index;
        bool hasIndex;
        bool isSupported;
    }

    // Functions
    function getSupportedChains() external view returns (SupportedChain[] memory);
    function getSupportedChain(uint256 chainId) external view returns (SupportedChain memory);
    function isSupportedChain(uint256 chainId) external view returns (bool, SupportedChain memory _default);

    // Events
    event ChainAdded(uint256 chainId, string chainName, address factoryAddress);
    event ChainUnsupported(uint chainId);
    event ChainActivated(uint chainId);

    // Custom errors
    error InvalidChain();
    error ChainSupported();
}
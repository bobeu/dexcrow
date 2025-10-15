// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

/**
 * @title ICommon
 * @dev Interface with commonly used data
 * @author TradeVerse Team
 */
interface ICommon {
    // Structs
    struct FactoryVariables {
        uint platformFee;
        uint feeDenom;
        uint creationFee;
        bool isPythSupported;
        address supportedPaymentAsset;
    }
}
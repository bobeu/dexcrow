// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

/**
 * @title ICommon
 * @dev Interface with commonly used data
 * @author Bobeu - https://github.com/bobeu
 */
interface ICommon {
    // Structs
    struct AccountInfo {
        address user;
        address tradingAccount;
        uint256 createdAt;
    }

    struct SupportPaymentAsset {
        address token;
        uint8 decimals;
        bytes name;
        bytes symbol;
    }

    struct FactoryVariables {
        uint platformFee;
        uint feeDenom;
        uint creationFee;
        bool isPythSupported;
        SupportPaymentAsset supportedPaymentAsset;
        AccountInfo alc;
    }

}
import { hexToString, stringToHex, zeroAddress } from "viem";
import { ArbitratorsReadData, EscrowFactoryReadData, EscrowReadData, EscrowState, TradeFactoryReadData } from ".";

const encodeAssetame = stringToHex('USDC Coin');
const encodedSymbol = stringToHex('USDC');

export const mockArbitratorReadData : ArbitratorsReadData = {
    arbiters: [
        {
            id: "",
            lockedBalance: 0n,
            isApproved: false,
            lastSeen: 0n,
            identifier: zeroAddress
        }
    ],
    verseToken: zeroAddress,
    factory: zeroAddress,
    minimumAbiterHolding: 0n
}

export const mockEscrowfactoryReadData : EscrowFactoryReadData = {
    allEscrow: [zeroAddress],
    userEscrows: [zeroAddress],
    totalEscrows: 0n,
    userEscrowCount: 0n,
    arbitrator: zeroAddress,
    platformFeeRecipient: zeroAddress,
    defaultDisputeWindowHours: 0n,
    totalEscrowsCreated: 0n,
    creationFee: 0n
}

export const mockTradeFactoryReadData : TradeFactoryReadData = {
    owner: zeroAddress,
    platformFee: 0n,
    totalFees: 0n,
    totalAccounts: 0n,
    accounts: [{
        user: zeroAddress,
        tradingAccount: zeroAddress,
        createdAt: 0n
    }],
    variables: {
        creationFee: 0n,
        feeDenom: 0n,
        isPythSupported: false,
        platformFee: 0n,
        supportedPaymentAsset: {
            decimals: 0,
            name: hexToString(encodeAssetame),
            symbol: hexToString(encodedSymbol),
            token: zeroAddress
        },
        alc: {
            user: zeroAddress,
            tradingAccount: zeroAddress,
            createdAt: 0n
        }
    },
    isPaused: false
}

export const mockEscrowReadData : EscrowReadData = {
    escrowDetails: {
        buyer: zeroAddress,
        seller: zeroAddress,
        arbiter: zeroAddress,
        assetToken: zeroAddress,
        assetAmount: 0n,
        deadline: 0n,
        state: EscrowState.AWAITING_DEPOSIT,
        createdAt: 0n,
        updatedAt: 0n,
        description: "",
        disputeWindowHours: 0n
    },
    disputeInfo: {
        isActive: false,
        disputer: zeroAddress,
        reason: "",
        raisedAt: 0n,
        arbiter: zeroAddress,
        arbiterDecision: false,
        arbiterReasoning: "",
        resolvedAt: 0n
    },
    platformFeePercentage: 0n,
    arbiterFeePercentage: 0n,
    feeDenominator: 0n,
    platformFeeRecipient: zeroAddress
}
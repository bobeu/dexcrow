import { Hex, hexToString, stringToHex, zeroAddress } from "viem";
import { Address, ArbitratorsReadData, EscrowDetails, EscrowFactoryReadData, EscrowReadData, EscrowState, FormattedEscrowDetails, TradeFactoryReadData, UserEscrowReadData } from ".";
import { formatAmount, formatDate, toLower, toNum } from "@/utilities";

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

export const formatEscrowDetails = (data: EscrowDetails, contractAddress: Address) : FormattedEscrowDetails => {
    const { buyer, seller, arbiter, assetAmount, description, deadline, state, assetToken, createdAt, disputeWindowHours } = data;
    let stateVariant = '';
    switch (state) {
      case EscrowState.AWAITING_DEPOSIT:
        stateVariant = 'Awaiting Deposit';
      case EscrowState.AWAITING_FULFILLMENT:
        stateVariant = 'Awaiting Fulfillment';
      case EscrowState.DISPUTE_RAISED:
        stateVariant = 'Dispute Raised';
      case EscrowState.COMPLETED:
        stateVariant = 'Completed';
      case EscrowState.CANCELED:
        stateVariant = 'Canceled';
      default:
        stateVariant = 'Awaiting Deposit';
        break;
    }

    return {
        id: contractAddress,
        buyer,
        seller,
        arbiter,
        amount: formatAmount(assetAmount),
        token: toLower(assetToken) === zeroAddress? 'NATIVE' : 'ERC20',
        description: hexToString(description as Hex),
        status: stateVariant,
        createdAt: formatDate(createdAt),
        deadlineToDate: formatDate(deadline),
        deadline,
        disputeWindow: toNum(disputeWindowHours)
    }
}

export const mockUserEscrowFiltered : FormattedEscrowDetails[] = [
    {
        id: '0x123...',
        buyer: '0x456...',
        seller: '0x789...',
        arbiter: '0xabc...',
        amount: '1.0',
        token: 'ETH',
        description: 'Purchase of digital artwork',
        status: 'AWAITING_FULFILLMENT',
        createdAt: formatDate(Date.now() - 3600000),
        deadlineToDate: formatDate(Date.now() + 86400000),
        deadline: Date.now() + 86400000,
        disputeWindow: 24
    },
    {
        id: '0x456...',
        buyer: '0xdef...',
        seller: '0xghi...',
        arbiter: '0xjkl...',
        amount: '100.0',
        token: 'USDC',
        description: 'Software development services',
        status: 'COMPLETED',
        createdAt: formatDate(Date.now() - 172800000),
        deadlineToDate: formatDate(Date.now() + 86400000),
        deadline: Date.now() + 86400000,
        disputeWindow: 48
    },
    {
        id: '0x789...',
        buyer: '0x123...',
        seller: '0x456...',
        arbiter: '0x789...',
        amount: '0.5',
        token: 'ETH',
        description: 'Consulting services',
        status: 'DISPUTE_RAISED',
        createdAt: formatDate(Date.now() - 7200000),
        deadline: Date.now() + 43200000,
        deadlineToDate: formatDate(Date.now() + 43200000),
        disputeWindow: 24
    }
]

export const mockUserEscrowReadData : UserEscrowReadData = {
    contractAddress: zeroAddress,
    ...mockEscrowReadData
}
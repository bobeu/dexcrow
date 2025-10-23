import { Address, zeroAddress } from "viem";
import { base, baseSepolia, mainnet, sepolia } from "viem/chains";

export interface SupportedChainsInput {
    chainId: bigint;
    chainName: string;
    factoryAddress: Address;
}

export const supportedChains = [
    base,
    baseSepolia,
    mainnet,
    sepolia,
];

export const chains = {
    base,
    baseSepolia,
    mainnet,
    sepolia
};

export const namedAccounts = {
    // deployer: {
    //   default: 0,
    //   11142220: process.env.P_KEY_0xD7c,
    //   42220: process.env.P_KEY_far as string
    // },
    // {
    //     id: celo,
    //     value: '0xff1a0f4744e8582DF1aE09D5611b887B6a12925C',
    // },
    // {
    //     id: bsc,
    //     value: '0x4D7E825f80bDf85e913E0DD2A2D54927e9dE1594',
    // },
    // {
    //     id: polygon,
    //     value: '0xff1a0f4744e8582DF1aE09D5611b887B6a12925C'
    // },
    // {
    //     id: bscTestnet,
    //     value: '0x5744Cbf430D99456a0A8771208b674F27f8EF0Fb'
    // },
    // {
    //     id: celoSepolia,
    //     value: '0xA2aa501b19aff244D90cc15a4Cf739D2725B5729'
    // }
    pythPriceFeed: [
        {
            id: base,
            value: '0x8250f4aF4B972684F7b336503E2D6dFeDeB1487a'
        },
        {
            id: baseSepolia,
            value: '0xA2aa501b19aff244D90cc15a4Cf739D2725B5729'
        },
        {
            id: mainnet,
            value: '0x4305FB66699C3B2702D4d05CF36551390A4c69C6'
        },
    ],
    feeRecipient: '0xa1f70ffA4322E3609dD905b41f17Bf3913366bC1',
    arbiter1: '0xa1f70ffA4322E3609dD905b41f17Bf3913366bC1',
  }

export const getParameters = (chainId: number) => {
    const selectedChain = namedAccounts.pythPriceFeed.find(q => q.id.id === chainId);
    return {
        chain: selectedChain?.id,
        pythPriceFeed: selectedChain?.value || ''
    }
}

export const getSupportedChains = (chainId: number, factoryAddress: Address, chainName: string) : SupportedChainsInput[] => {
    if(chainId === 0 || factoryAddress === zeroAddress || chainName === '') throw new Error(`Invalid configurations: ${chainId} ${factoryAddress} ${chainName}`);
    
    return [{
        chainId: BigInt(chainId),
        chainName,
        factoryAddress
    }]
}
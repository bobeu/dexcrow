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
    pythAddress: [
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
    priceFieldIs: {
        "BTC/USD": "0xe62df6c8b4a85fe1a67db44dc12de5db330f7ac66b72dc658afedf0f4a415b43",
        "CELO/USD": "0x512575268648015966400191d61c0b31e689465675c4207c56357b72b2204092",
        "CORE/USD": "0x9b4503710cc8c53f75c30e6e4fda1a7064680ef2e0ee97acd2e3a7c37b3c830c",
        "COW/USD": "0x4e53c6ef1f2f9952facdcf64551edb6d2a550985484ccce6a0477cae4c1bca3e",
        "DAI/USD": "0xb0948a5e5313200c632b51bb5ca32f6de0d36e9950a942d19751e833f70dabfd",
        "ETH/USD": "0xff61491a931112ddf1bd8147cd1b641375f79f5825126d665480874634fd0ace",
        
    },
    feeRecipient: '0xa1f70ffA4322E3609dD905b41f17Bf3913366bC1',
    arbiter1: '0xa1f70ffA4322E3609dD905b41f17Bf3913366bC1',
  }

export const getParameters = (chainId: number) => {
    const selectedChain = namedAccounts.pythAddress.find(q => q.id.id === chainId);
    const maxSupply = 50_000_000; 
    const initialSupply = maxSupply / 2;
    const name = 'Test Verse Token'; 
    const symbol = 'TVT';
    const initialSupplyReceiver = {
        84532: '0xD7c271d20c9E323336bFC843AEb8deC23B346352',
        8453: '0xb2ADb77A837d19c3adA396Db74483B05D49AD6b7'
    };

    return {
        initialSupply,
        maxSupply,
        name,
        symbol,
        initialSupplyReceiver,
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
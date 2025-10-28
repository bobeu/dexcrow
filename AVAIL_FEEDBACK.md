## Tradeverse's Gratitude to Avail-Nexus 👏

A vote of thanks and commendation from the Tradeverse team goes to the Avail-Nexus team for building this awesome project. We found the SDK useful and have integrated it into the Tradeverse project.

## Our Goal at Tradeverse
Tradeverse aims to simplify trading by creating a truly decentralized environment where privacy is preserved. Initially, our plan—as the logic demanded—was to have our contracts deployed on multiple chains so that users could create escrows and trade orders on their preferred chain, provided we supported it.

We also had difficulty implementing a cross-chain system. After a few hours of research, we came across the Avail-Nexus documentation, which gave us insight into how we could remedy the issues we were facing. We finally leveraged the SDK in the following areas:

- Aggregating and displaying user balances across chains: This enables users to easily view their balances and make fast decisions. Alternatively, they don't have to explicitly provide token addresses, as all the necessary information is collected for them.

- Simplifying cross-chain strategies: The burden of implementing cross-chain strategies was lifted from us. We only needed to use the SDK to bridge users' assets to any of the supported chains. This approach allowed our smart contracts to be deployed on only a single chain.

## Feedback
Each of the APIs was very useful, but we wish there could be a callback function for each of them so that developers can stream the status of the operation in their app.

Example: Below is an example of how we bridge a user's asset and execute a `createEscrow` operation with it. This code was extracted from the Tradeverse's dexcrow GitHub: **https://github.com/bobeu/dexcrow/blob/main/fe/src/lib/nexus/NexusManager.ts**

### Actual

```
// Bridge and create escrow
  async bridgeAndCreateEscrow(params: {
    token: string;
    amount: string;
    toChainId: number;
    sourceChains?: number[];
    buyerAddress: string;
    sellerAddress: string;
    assetToken: string;
    assetAmount: string;
    deadline: number;
    description: string;
    disputeWindowHours: number;
    userAddress: string;
  }): Promise<BridgeAndExecuteResult> {
    if (!this.initialized || !this.sdk) {
      throw new Error('SDK not initialized');
    }

    const { transactionData: td } = filterTransactionData({chainId: params.toChainId, filter: true, functionNames: ['createEscrow']});

    const bridgeAndExecuteParams: BridgeAndExecuteParams = {
      token: params.token as typeof SUPPORTED_TOKENS[keyof typeof SUPPORTED_TOKENS],
      amount: params.amount,
      toChainId: params.toChainId as SUPPORTED_CHAINS_IDS,
      sourceChains: params.sourceChains,
      execute: {
        contractAddress: td[0].contractAddress,
        contractAbi: td[0].abi,
        functionName: td[0].functionName,
        buildFunctionParams: (token, _, _chainId, _userAddress) => {
          const decimals = TOKEN_METADATA[token as keyof typeof TOKEN_METADATA]?.decimals || 18;
          const amountWei = parseUnits(params.assetAmount, decimals);
          return {
            functionParams: [
              params.buyerAddress as `0x${string}`,
              params.sellerAddress as `0x${string}`,
              params.assetToken as `0x${string}`,
              amountWei,
              BigInt(params.deadline),
              params.description,
              BigInt(params.disputeWindowHours),
            ],
          };
        },
        tokenApproval: {
          token: params.token as typeof SUPPORTED_TOKENS[keyof typeof SUPPORTED_TOKENS],
          amount: params.amount,
        },
      },
      waitForReceipt: true,
    };

    return await this.sdk.bridgeAndExecute(bridgeAndExecuteParams);
  }
```

### Expected

```
// Bridge and create escrow
  async bridgeAndCreateEscrow(params: {
    token: string;
    amount: string;
    toChainId: number;
    sourceChains?: number[];
    buyerAddress: string;
    sellerAddress: string;
    assetToken: string;
    assetAmount: string;
    deadline: number;
    description: string;
    disputeWindowHours: number;
    userAddress: string;
  }): Promise<BridgeAndExecuteResult> {
    if (!this.initialized || !this.sdk) {
      throw new Error('SDK not initialized');
    }

    const { transactionData: td } = filterTransactionData({chainId: params.toChainId, filter: true, functionNames: ['createEscrow']});

    const bridgeAndExecuteParams: BridgeAndExecuteParams = {
      token: params.token as typeof SUPPORTED_TOKENS[keyof typeof SUPPORTED_TOKENS],
      amount: params.amount,
      toChainId: params.toChainId as SUPPORTED_CHAINS_IDS,
      sourceChains: params.sourceChains,
      callback: (/**some status variables to track progress*/) => void,    // <========= Could be here
      execute: {
        contractAddress: td[0].contractAddress,
        contractAbi: td[0].abi,
        functionName: td[0].functionName,
        callback: (/**some status variables to track progress*/) => void, // <========= And here
        buildFunctionParams: (token, _, _chainId, _userAddress) => {
          const decimals = TOKEN_METADATA[token as keyof typeof TOKEN_METADATA]?.decimals || 18;
          const amountWei = parseUnits(params.assetAmount, decimals);
          return {
            functionParams: [
              params.buyerAddress as `0x${string}`,
              params.sellerAddress as `0x${string}`,
              params.assetToken as `0x${string}`,
              amountWei,
              BigInt(params.deadline),
              params.description,
              BigInt(params.disputeWindowHours),
            ],
          };
        },
        tokenApproval: {
          token: params.token as typeof SUPPORTED_TOKENS[keyof typeof SUPPORTED_TOKENS],
          amount: params.amount,
        },
      },
      waitForReceipt: true,
    };

    return await this.sdk.bridgeAndExecute(bridgeAndExecuteParams);
  }
```

The goal to provide real-time execution status for the specific operation
/*eslint-disable */

export type Address = `0x${string}`;
export type FunctionName = 'placeBet' | 'checkBalance' | 'checkEpochBalance' | 'trigger' | 'getData' | 'getDataByEpoch' | 'claimTriggerReward' | 'isDrawNeeded' | 'isVerified' | 'runDraw' | 'setBetListUpfront' | 'setFee' | 'setVerification' | 'setVerificationByOwner' | 'withdraw' | 'getBalanceFromCurrentEpoch' | 'isPermitted' | 'setDataStruct' | 'setPermission' | 'openOrder' | 'closeOrder' | 'hasSlot' | 'getAllOrders';
export interface BetData {
    
}

export interface FilterTransactionDataProps {
  chainId: number | undefined;
  functionNames?: FunctionName[];
  filter: boolean;
}

export interface FilterTransactionReturnType {
  transactionData: TransactionData[];
  approvedFunctions: string[];
  contractAddresses: {
    stablecoin: string;
    FeeReceiver: string;
    RandoFutures: string;
    Verifier: string;
  };
}

export type TransactionData = {
  contractAddress: string;
  inputCount: number;
  functionName: string;
  abi: any;
  requireArgUpdate: boolean;
};

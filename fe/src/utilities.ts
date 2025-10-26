/* eslint-disable */
import { formatEther, Hex, } from "viem";
import { Address, FilterTransactionDataProps, FilterTransactionReturnType, FunctionName, TransactionData }  from "@/lib/types";
import { getFunctionData } from "./contractData/functionData";
import BigNumber from "bignumber.js";
import globalContractData from "../contractsArtifacts/global.json";

export interface TrxnData {
  contractAddress: Address;
  abi: any;
  functionName: FunctionName;
  args: any[];
}

// export const mockHash = keccak256(stringToBytes('solidity'), 'hex');
// export const mockEncoded = stringToHex("solidity");

// export const toHash = (arg: string) => {
//   return keccak256(stringToHex(arg));
// }

/**
 * @dev Converts an argument to a bigInt value
 * @param arg : Argument to convert;
 * @returns BigInt
*/
export const toBigInt = (x: string | number | bigint | undefined) : bigint => {
  return BigInt(toBN(x as string || '0').toString());
} 

/**
 * @dev Converts onchain timestamp to a date object
 * @param arg : onchain time in seconds;
 * @returns Date string object
*/
export function getTimeFromEpoch(onchainUnixTime: number | bigint) {
  const toNumber = toBN(onchainUnixTime.toString()).toNumber()
  const date = new Date(toNumber * 1000);
  return (toNumber === 0? 'Not Set' : `${date.toLocaleDateString("en-GB")} ${date.toLocaleTimeString("en-US")}`);
}


/**
 * @dev Converts an argument to a Big Number value
 * @param arg : Argument to convert;
 * @returns BigNumber
*/
export const toBN = (x: string | number | BigNumber | bigint | Hex) => {
  return new BigNumber(x);
}

/**
 * Converts value of their string representation.
 * @param value : Value to convert.
 * @returns Formatted value.
 */
export const formatValue = (arg: string | number | bigint | undefined) => {
  if(typeof arg === 'bigint') {
    const valueInBigNumber = toBN(formatEther(arg)).decimalPlaces(4);
    return {
      toStr: valueInBigNumber.toString(),
      toNum: valueInBigNumber.toNumber()
   };
  }
    
  const valueInBigNumber = toBN(formatEther(toBigInt(arg))).decimalPlaces(4)
  return {
    toStr: valueInBigNumber.toString(),
    toNum: valueInBigNumber.toNumber()
  }
}
  
/**
 * @dev Converts a string to a hexadecimal representation. If no parameter was parsed, the default return 
 * value is a hex with length 42 compatible with an Ethereum address type padded with zero value.
 * @param x : string or undefined;
 * @returns Address
 */
export const formatAddr = (x: string | undefined) : Address => {
    if(!x || x === "") return `0x${'0'.repeat(40)}`;
    return `0x${x.substring(2, x.length)}`;
};

/**
 * @dev Filter transaction data such as abis, contract addresses, inputs etc. If the filter parameter is true, it creates transaction data for 
 * the parsed function names. Default to false.
 * @param param0 : Parameters
 * @returns object containing array of transaction data and approved functions
 */
export function filterTransactionData({chainId, filter, functionNames = []}: FilterTransactionDataProps) : FilterTransactionReturnType {
  const { approvedFunctions, contractAddresses, chainIds } = globalContractData;
  const transactionData : TransactionData[] = [];
  let chainid = chainId || chainIds[0];
  if(!chainIds.includes(Number(chainId))) chainid = chainIds[0];
  const chainIndex = chainIds.indexOf(chainid);
  if(filter && functionNames.length > 0) {
    functionNames.forEach((functionName) => {
      transactionData.push(getFunctionData(functionName, chainIndex));
    })
  }
   
  return {
    transactionData,
    approvedFunctions,
    contractAddresses: contractAddresses[chainIndex],
  }
}

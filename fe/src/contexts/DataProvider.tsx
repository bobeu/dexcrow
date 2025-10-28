/* eslint-disable */
import { Address, ArbitratorsReadData, EscrowFactoryReadData, EscrowReadData, TradeFactoryReadData, UserEscrowReadData } from '@/lib/types';
import { mockArbitratorReadData, mockEscrowfactoryReadData, mockEscrowReadData, mockTradeFactoryReadData, mockUserEscrowReadData } from '@/lib/types/mockdata';
import { filterTransactionData, formatAddr } from '@/utilities';
import React from 'react';
import { useAccount, useChainId, useConfig, useReadContracts } from 'wagmi';
// import { abi as arbitratorsAbi } from "../../contractsArtifacts/arbitratorsTemplate.json";
import escrowTemplate from "../../contractsArtifacts/escrowTemplate.json";
// import { abi as tradingAccountAbi } from "../../contractsArtifacts/tradeAccountTemplate.json";
import { StorageContextProvider } from './StorageContextProvider';
import { zeroAddress } from 'viem';

export default function DataProvider({children} : {children: React.ReactNode}) {
  const [escrowFactoryData, setEscrowFactoryData] = React.useState<EscrowFactoryReadData>(mockEscrowfactoryReadData);
  const [arbitratorsData, setArbitratorData] = React.useState<ArbitratorsReadData>(mockArbitratorReadData);
  const [tradeFactoryData, setTradeFactoryData] = React.useState<TradeFactoryReadData>(mockTradeFactoryReadData);
  const [allEscrows, setAllEscrows] = React.useState<UserEscrowReadData[]>([mockUserEscrowReadData]);
  const [userEscrows, setUserEscrows] = React.useState<UserEscrowReadData[]>([mockUserEscrowReadData]);
  const [isApprovedArbiter, setIsApprovedArbiter] = React.useState<boolean>(false);
  const [allowanceToArbiter, setAllowanceToArbiter] = React.useState<bigint>(0n);
  const [verseTokenBalance, setBalances] = React.useState<bigint>(0n);

    const chainId = useChainId();
    const config = useConfig();
    const { isConnected, address } = useAccount();
    const account = formatAddr(address);
    
  const { readTxObject  } = React.useMemo(() => {
    // Build read transactions data
    const { transactionData: td, contractAddresses: ca } = filterTransactionData({
        chainId,
        filter: true,
        functionNames: ['getData', 'readData', 'getFactoryData', 'isApprovedArbiter', 'allowance', 'balanceOf'],
    });
    const readArgs = [[account], [], [account], [account], [account, ca.Arbitrators], [account]];
    const contractAddresses = [
        ca.EscrowFactory as Address,
        ca.Arbitrators as Address,
        ca.TradeFactory as Address,
        ca.Arbitrators as Address,
        ca.VerseToken as Address,
        ca.VerseToken as Address
    ];
    
    const readTxObject = td.map((item, i) => {
      return{
        abi: item.abi,
        functionName: item.functionName,
        address: contractAddresses[i],
        args: readArgs[i]
      }
    });
    return { readTxObject };
  }, [account, chainId]);


    // Read data from the CampaignFactory contact 
    const { data } = useReadContracts({
        config,
        account,
        contracts: readTxObject,
        allowFailure: true,
        query: {
            enabled: !!isConnected,
            refetchOnReconnect: 'always', 
            refetchInterval: 5000,
        }
    });

    // Update the state with the result  of the read action
    React.useEffect(() => {
        let escrowFactoryData_ : EscrowFactoryReadData = mockEscrowfactoryReadData;
        let arbitratorsData_ : ArbitratorsReadData = mockArbitratorReadData;
        let tradeFactoryData_ : TradeFactoryReadData = mockTradeFactoryReadData;
        let isApprovedArbiter_ : boolean = false;
        let allowanceToArbiter_ : bigint = 0n;
        let verseTokenBalance_ : bigint = 0n;

        if(data && data[0].status === 'success' && data[0].result !== undefined) {
            escrowFactoryData_ = data[0].result as EscrowFactoryReadData;
        }
        if(data && data[1].status === 'success' && data[1].result !== undefined) {
            arbitratorsData_ = data[1].result as ArbitratorsReadData;
        }
        if(data && data[2].status === 'success' && data[2].result !== undefined) {
          tradeFactoryData_ = data[2].result as TradeFactoryReadData;
        }
        if(data && data[3].status === 'success' && data[3].result !== undefined) {
          isApprovedArbiter_ = data[3].result as boolean;
        }
        if(data && data[4].status === 'success' && data[4].result !== undefined) {
          allowanceToArbiter_ = data[4].result as bigint;
        }
        if(data && data[5].status === 'success' && data[5].result !== undefined) {
          verseTokenBalance_ = data[5].result as bigint;
        }
        
        setEscrowFactoryData(escrowFactoryData_);
        setArbitratorData(arbitratorsData_);
        setTradeFactoryData(tradeFactoryData_);
        setIsApprovedArbiter(isApprovedArbiter_);
        setAllowanceToArbiter(allowanceToArbiter_);
        setBalances(verseTokenBalance_);
    }, [data]);

    // Prepare to load escrow acounts data
    const { allEscrowReadObj, userEscrowsReadObj } = React.useMemo(() => {
        const { allEscrow, userEscrows } = escrowFactoryData ;
        const allEscrowReadObj = allEscrow.map((escrow) => {
            return {
                abi: escrowTemplate.abi as any,
                functionName: 'getEscrowData',
                address: escrow as Address,
                args: [],
            }
        });
        const userEscrowsReadObj = userEscrows.map((escrow) => {
            return {
                abi: escrowTemplate.abi as any,
                functionName: 'getEscrowData',
                address: escrow as Address,
                args: [],
            }
        });

        return { allEscrowReadObj, userEscrowsReadObj }
    }, [escrowFactoryData]);
    
    // Read data from the campaign addresses
    const { data: escrowReadData, isLoading: isLoadingEscrows } = useReadContracts({
        config,
        account,
        contracts: [...allEscrowReadObj, ...userEscrowsReadObj],
        allowFailure: true,
        query: {
            enabled: !!isConnected,
            refetchOnReconnect: 'always', 
            refetchInterval: 5000,
        }
    });
    
    // Update the state with the result  of the read action
    React.useEffect(() => {
        let allEscrowData : UserEscrowReadData[] = [mockUserEscrowReadData];
        if(escrowReadData && escrowReadData.length > 0) {
            allEscrowData = escrowReadData.map((data_, i) => {
                const {result, status} = data_;
                let result_ = mockEscrowReadData;
                if(status === 'success') {
                  result_ = result as EscrowReadData;
                }
                return {
                  ...result_,
                  contractAddress: allEscrowReadObj[i]?.address || zeroAddress
                };
            });
        }
        const user = account.toLowerCase();
        const userEscrows : UserEscrowReadData[] = allEscrowData.filter(
          q => q.escrowDetails.buyer.toLowerCase() === user || q.escrowDetails.seller === user || q.escrowDetails.arbiter === user
        )
        setAllEscrows(allEscrowData);
        setUserEscrows(userEscrows);
    }, [escrowReadData, account]);

    return (
      <StorageContextProvider
        value={{
          isLoading: isLoadingEscrows,
          escrowFactoryData,
          arbitratorsData,
          tradeFactoryData,
          allEscrows,
          userEscrows,
          isApprovedArbiter,
          allowanceToArbiter,
          verseTokenBalance
        }}
    >
        { children }
    </StorageContextProvider>
  );
}
import { 
    EscrowReadData, 
    EscrowFactoryReadData, 
    ArbitratorsReadData, 
    TradeFactoryReadData, 
} from "@/lib/types";

export interface DataContextProps {
    escrowFactoryData: EscrowFactoryReadData;
    arbitratorsData: ArbitratorsReadData;
    tradeFactoryData: TradeFactoryReadData;
    allEscrows: EscrowReadData[];
    userEscrows: EscrowReadData[];
    isLoading: boolean;
    isApprovedArbiter: boolean;
    allowanceToArbiter: bigint;
    verseTokenBalance: bigint;
}

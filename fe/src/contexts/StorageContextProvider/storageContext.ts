import { 
    EscrowFactoryReadData, 
    ArbitratorsReadData, 
    TradeFactoryReadData,
    UserEscrowReadData, 
} from "@/lib/types";

export interface DataContextProps {
    escrowFactoryData: EscrowFactoryReadData;
    arbitratorsData: ArbitratorsReadData;
    tradeFactoryData: TradeFactoryReadData;
    allEscrows: UserEscrowReadData[];
    userEscrows: UserEscrowReadData[];
    isLoading: boolean;
    isApprovedArbiter: boolean;
    allowanceToArbiter: bigint;
    verseTokenBalance: bigint;
}

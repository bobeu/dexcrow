// DexCrow contract configs for localhost (8453)
import requestToBeAnArbiter8453 from "../../contractsArtifacts/8453/requestToBeAnArbiter.json";
import approveArbiter8453 from "../../contractsArtifacts/8453/approveArbiter.json";
import unlock8453 from "../../contractsArtifacts/8453/unlock.json";
import getArbiter8453 from "../../contractsArtifacts/8453/getArbiter.json";
import isApprovedArbiter8453 from "../../contractsArtifacts/8453/isApprovedArbiter.json";
import readData8453 from "../../contractsArtifacts/8453/readData.json";
import createEscrow8453 from "../../contractsArtifacts/8453/createEscrow.json";
import createEscrowWithDefaultWindow8453 from "../../contractsArtifacts/8453/createEscrowWithDefaultWindow.json";
import getData8453 from "../../contractsArtifacts/8453/getData.json";
import getAllEscrows8453 from "../../contractsArtifacts/8453/getAllEscrows.json";
import getUserEscrows8453 from "../../contractsArtifacts/8453/getUserEscrows.json";
import getTotalEscrows8453 from "../../contractsArtifacts/8453/getTotalEscrows.json";
import getUserEscrowCount8453 from "../../contractsArtifacts/8453/getUserEscrowCount.json";
import isValidEscrow8453 from "../../contractsArtifacts/8453/isValidEscrow.json";
import getArbiterStatus8453 from "../../contractsArtifacts/8453/getArbiterStatus.json";
import updateArbiterStatus8453 from "../../contractsArtifacts/8453/updateArbiterStatus.json";
import updateCreationFee8453 from "../../contractsArtifacts/8453/updateCreationFee.json";
import pause8453 from "../../contractsArtifacts/8453/pause.json";
import unpause8453 from "../../contractsArtifacts/8453/unpause.json";
import emergencyWithdraw8453 from "../../contractsArtifacts/8453/emergencyWithdraw.json";
import createTradingAccount8453 from "../../contractsArtifacts/8453/createTradingAccount.json";
import setPlatformFee8453 from "../../contractsArtifacts/8453/setPlatformFee.json";
import setCreationFee8453 from "../../contractsArtifacts/8453/setCreationFee.json";
import setSupportedPaymentAsset8453 from "../../contractsArtifacts/8453/setSupportedPaymentAsset.json";
import toggleIsPythSupportedNetwork8453 from "../../contractsArtifacts/8453/toggleIsPythSupportedNetwork.json";
import withdrawFees8453 from "../../contractsArtifacts/8453/withdrawFees.json";
import getVariables8453 from "../../contractsArtifacts/8453/getVariables.json";
import getFactoryData8453 from "../../contractsArtifacts/8453/getFactoryData.json";
import getAccountInfo8453 from "../../contractsArtifacts/8453/getAccountInfo.json";
import toggleExecution8453 from "../../contractsArtifacts/8453/toggleExecution.json";

// DexCrow contract configs for Base Sepolia (84532)
import requestToBeAnArbiter84532 from "../../contractsArtifacts/84532/requestToBeAnArbiter.json";
import approveArbiter84532 from "../../contractsArtifacts/84532/approveArbiter.json";
import unlock84532 from "../../contractsArtifacts/84532/unlock.json";
import getArbiter84532 from "../../contractsArtifacts/84532/getArbiter.json";
import isApprovedArbiter84532 from "../../contractsArtifacts/84532/isApprovedArbiter.json";
import readData84532 from "../../contractsArtifacts/84532/readData.json";
import createEscrow84532 from "../../contractsArtifacts/84532/createEscrow.json";
import createEscrowWithDefaultWindow84532 from "../../contractsArtifacts/84532/createEscrowWithDefaultWindow.json";
import getData84532 from "../../contractsArtifacts/84532/getData.json";
import getAllEscrows84532 from "../../contractsArtifacts/84532/getAllEscrows.json";
import getUserEscrows84532 from "../../contractsArtifacts/84532/getUserEscrows.json";
import getTotalEscrows84532 from "../../contractsArtifacts/84532/getTotalEscrows.json";
import getUserEscrowCount84532 from "../../contractsArtifacts/84532/getUserEscrowCount.json";
import isValidEscrow84532 from "../../contractsArtifacts/84532/isValidEscrow.json";
import getArbiterStatus84532 from "../../contractsArtifacts/84532/getArbiterStatus.json";
import updateArbiterStatus84532 from "../../contractsArtifacts/84532/updateArbiterStatus.json";
import updateCreationFee84532 from "../../contractsArtifacts/84532/updateCreationFee.json";
import pause84532 from "../../contractsArtifacts/84532/pause.json";
import unpause84532 from "../../contractsArtifacts/84532/unpause.json";
import emergencyWithdraw84532 from "../../contractsArtifacts/84532/emergencyWithdraw.json";
import createTradingAccount84532 from "../../contractsArtifacts/84532/createTradingAccount.json";
import setPlatformFee84532 from "../../contractsArtifacts/84532/setPlatformFee.json";
import setCreationFee84532 from "../../contractsArtifacts/84532/setCreationFee.json";
import setSupportedPaymentAsset84532 from "../../contractsArtifacts/84532/setSupportedPaymentAsset.json";
import toggleIsPythSupportedNetwork84532 from "../../contractsArtifacts/84532/toggleIsPythSupportedNetwork.json";
import withdrawFees84532 from "../../contractsArtifacts/84532/withdrawFees.json";
import getVariables84532 from "../../contractsArtifacts/84532/getVariables.json";
import getFactoryData84532 from "../../contractsArtifacts/84532/getFactoryData.json";
import getAccountInfo84532 from "../../contractsArtifacts/84532/getAccountInfo.json";
import toggleExecution84532 from "../../contractsArtifacts/84532/toggleExecution.json";

// Global data import
import globalData from "../../contractsArtifacts/global.json";

const { chainIds, approvedFunctions } = globalData;

const functionData = [
    // Localhost (8453) - DexCrow functions
    [
        { key: 'requestToBeAnArbiter', value: { ...requestToBeAnArbiter8453} },
        { key: 'approveArbiter', value: { ...approveArbiter8453} },
        { key: 'unlock', value: { ...unlock8453} },
        { key: 'getArbiter', value: { ...getArbiter8453} },
        { key: 'isApprovedArbiter', value: { ...isApprovedArbiter8453} },
        { key: 'readData', value: { ...readData8453} },
        { key: 'createEscrow', value: { ...createEscrow8453} },
        { key: 'createEscrowWithDefaultWindow', value: { ...createEscrowWithDefaultWindow8453} },
        { key: 'getData', value: { ...getData8453} },
        { key: 'getAllEscrows', value: { ...getAllEscrows8453} },
        { key: 'getUserEscrows', value: { ...getUserEscrows8453} },
        { key: 'getTotalEscrows', value: { ...getTotalEscrows8453} },
        { key: 'getUserEscrowCount', value: { ...getUserEscrowCount8453} },
        { key: 'isValidEscrow', value: { ...isValidEscrow8453} },
        { key: 'getArbiterStatus', value: { ...getArbiterStatus8453} },
        { key: 'updateArbiterStatus', value: { ...updateArbiterStatus8453} },
        { key: 'updateCreationFee', value: { ...updateCreationFee8453} },
        { key: 'pause', value: { ...pause8453} },
        { key: 'unpause', value: { ...unpause8453} },
        { key: 'emergencyWithdraw', value: { ...emergencyWithdraw8453} },
        { key: 'createTradingAccount', value: { ...createTradingAccount8453} },
        { key: 'setPlatformFee', value: { ...setPlatformFee8453} },
        { key: 'setCreationFee', value: { ...setCreationFee8453} },
        { key: 'setSupportedPaymentAsset', value: { ...setSupportedPaymentAsset8453} },
        { key: 'toggleIsPythSupportedNetwork', value: { ...toggleIsPythSupportedNetwork8453} },
        { key: 'withdrawFees', value: { ...withdrawFees8453} },
        { key: 'getVariables', value: { ...getVariables8453} },
        { key: 'getFactoryData', value: { ...getFactoryData8453} },
        { key: 'getAccountInfo', value: { ...getAccountInfo8453} },
        { key: 'toggleExecution', value: { ...toggleExecution8453} },
    ],
    // Base Sepolia (84532) - DexCrow functions
    [
        { key: 'requestToBeAnArbiter', value: { ...requestToBeAnArbiter84532} },
        { key: 'approveArbiter', value: { ...approveArbiter84532} },
        { key: 'unlock', value: { ...unlock84532} },
        { key: 'getArbiter', value: { ...getArbiter84532} },
        { key: 'isApprovedArbiter', value: { ...isApprovedArbiter84532} },
        { key: 'readData', value: { ...readData84532} },
        { key: 'createEscrow', value: { ...createEscrow84532} },
        { key: 'createEscrowWithDefaultWindow', value: { ...createEscrowWithDefaultWindow84532} },
        { key: 'getData', value: { ...getData84532} },
        { key: 'getAllEscrows', value: { ...getAllEscrows84532} },
        { key: 'getUserEscrows', value: { ...getUserEscrows84532} },
        { key: 'getTotalEscrows', value: { ...getTotalEscrows84532} },
        { key: 'getUserEscrowCount', value: { ...getUserEscrowCount84532} },
        { key: 'isValidEscrow', value: { ...isValidEscrow84532} },
        { key: 'getArbiterStatus', value: { ...getArbiterStatus84532} },
        { key: 'updateArbiterStatus', value: { ...updateArbiterStatus84532} },
        { key: 'updateCreationFee', value: { ...updateCreationFee84532} },
        { key: 'pause', value: { ...pause84532} },
        { key: 'unpause', value: { ...unpause84532} },
        { key: 'emergencyWithdraw', value: { ...emergencyWithdraw84532} },
        { key: 'createTradingAccount', value: { ...createTradingAccount84532} },
        { key: 'setPlatformFee', value: { ...setPlatformFee84532} },
        { key: 'setCreationFee', value: { ...setCreationFee84532} },
        { key: 'setSupportedPaymentAsset', value: { ...setSupportedPaymentAsset84532} },
        { key: 'toggleIsPythSupportedNetwork', value: { ...toggleIsPythSupportedNetwork84532} },
        { key: 'withdrawFees', value: { ...withdrawFees84532} },
        { key: 'getVariables', value: { ...getVariables84532} },
        { key: 'getFactoryData', value: { ...getFactoryData84532} },
        { key: 'getAccountInfo', value: { ...getAccountInfo84532} },
        { key: 'toggleExecution', value: { ...toggleExecution84532} },
    ],
];

/**
 * @dev Fetch contract data related to a specific chain and function. By default it fetches data for localhost if
 * no chainId is provided.
 * @param functionName : Function name
 * @param chainId : Connected chainId
 * @returns Contract data
 */
export const getFunctionData = (functionName: string, chainId: number | undefined) => {
    let _chainId = chainId || 84532; // Default to Base Sepolia
    if(!approvedFunctions.includes(functionName)) {
        throw new Error(`${functionName} not supported`);
    }
    const chainIndex = chainIds.indexOf(_chainId);
    if (chainIndex === -1) {
        throw new Error(`Chain ID ${_chainId} not supported`);
    }
    const found = functionData[chainIndex].filter(q => q.key.toLowerCase() === functionName.toLowerCase());
    return found?.[0]?.value || {};
}
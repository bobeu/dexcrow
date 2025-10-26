#!/usr/bin/env node

// import fs from 'fs';
// import path from 'path';
// import { fileURLToPath } from 'url';
// import { zeroAddress } from 'viem';

const fs = require('fs');
const path = require('path');
const { zeroAddress } = require('viem');

const erc20Artifacts = require('./artifacts/contracts/MockERC20.sol/MockERC20.json');
const escrowAccountArtifacts = require('./artifacts/contracts/escrow/Escrow.sol/Escrow.json');
const arbitatorsArtifacts = require('./artifacts/contracts/escrow/Arbitrators.sol/Arbitrators.json')
const tradeAccountArtifacts = require('./artifacts/contracts/trading/peripherals/TradingAccount.sol/TradingAccount.json');
// import erc20Artifacts from './artifacts/contracts/MockERC20.sol/MockERC20.json';
// import escrowAccountArtifacts from './artifacts/contracts/escrow/Escrow.sol/Escrow.json';
// import tradeAccountArtifacts from './artifacts/contracts/trading/peripherals/TradingAccount.sol/TradingAccount.json';

// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);


// Configuration - directory files
const HARDHAT_ARTIFACTS_PATH = './ignition/deployments/';
const REACT_DATA_PATH = '../fe/contractsArtifacts';
const GLOBAL_OUTPUT_PATH = '../fe/contractsArtifacts/global.json';
const ERC20_ARTIFACTS_PATH = '../fe/contractsArtifacts/erc20Template.json';
const ESCROW_ARTIFACTS_PATH = '../fe/contractsArtifacts/escrowTemplate.json';
const TRADING_ARTIFACTS_PATH = '../fe/contractsArtifacts/tradeAccountTemplate.json';
const ARBITRATORS_ARTIFACTS_PATH = '../fe/contractsArtifacts/arbitratorsTemplate.json';

const approvedFunctions = [
    // Arbitrators functions
    'requestToBeAnArbiter',
    'approveArbiter',
    'unlock',
    'getArbiter',
    'isApprovedArbiter',
    'readData',
    
    // EscrowFactory functions
    'createEscrow',
    'createEscrowWithDefaultWindow',
    'getData',
    'getAllEscrows',
    'getUserEscrows',
    'getTotalEscrows',
    'getUserEscrowCount',
    'isValidEscrow',
    'getArbiterStatus',
    'updateArbiterStatus',
    'updateCreationFee',
    'pause',
    'unpause',
    'emergencyWithdraw',
    
    // TradeFactory functions
    'createTradingAccount',
    'setPlatformFee',
    'setCreationFee',
    'setSupportedPaymentAsset',
    'toggleIsPythSupportedNetwork',
    'withdrawFees',
    'getVariables',
    'getFactoryData',
    'getAccountInfo',
    'toggleExecution',

    // Verse Token
    'allowance',
    'balanceOf',
    'transfer',
    'transferFrom',
    'symbol',
    'name',
    'approve'
];
const readFunctions = ['getData', 'getAllEscrows', 'getUserEscrows', 'getTotalEscrows', 'getUserEscrowCount', 'isValidEscrow', 'getArbiterStatus', 'getVariables', 'getFactoryData', 'getAccountInfo', 'readData', 'getArbiter', 'isApprovedArbiter'];
const requiredContracts = ['Tradeverse#Arbitrators.json', 'Tradeverse#EscrowFactory.json', 'Tradeverse#TradeFactory.json', 'Tradeverse#VerseToken.json'];
const chainName = {84532: 'base-sepolia', 8453: 'base'};
const chainIds = [84532, 8453];
let workBuild = {
    84532: [],
    8453: [],
};

// Removed template and ERC20 references as they're not used in this project

let globalOutput = {
    approvedFunctions: approvedFunctions,
    chainName: chainName,
    chainIds: chainIds,
    paths: workBuild,
    contractAddresses: [
        {
            "Arbitrators": "",
            "EscrowFactory": "",
            "TradeFactory": ""
        },
        {
            "Arbitrators": "",
            "EscrowFactory": "",
            "TradeFactory": ""
        }
    ],
};
// {"stablecoin": "0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1"}, 

let itemOutput = {
    contractAddress: '',
    functionName: '',
    inputCount: 0,
    abi: []
};

// Create the React ABI directory if it doesn't exist
if (!fs.existsSync(REACT_DATA_PATH)) {
    fs.mkdirSync(REACT_DATA_PATH, { recursive: true });
}

// Function to walk through directories recursively
function walkDir(dir) {
    let list = fs.readdirSync(dir);
    if(list.includes('contracts.json')){
        list = list.filter((item) => item !== 'contracts.json')
    }
    
    chainIds.forEach((chain) => {
        list.forEach(file => {
            const filePath = path.join(dir, file);
            const stat = fs.statSync(filePath);
            const isChainRelated = filePath.includes(`chain-${chain}`);
            const fileWithSolcInputs = file.includes('solcInputs');
            const fileWithChainId = file.endsWith('.chainId');
            const onlyRequired = requiredContracts.includes(file);
            if (stat && stat.isDirectory() && !fileWithSolcInputs && !fileWithChainId) {
                if(isChainRelated){
                    workBuild[chain].concat(walkDir(filePath));
                }
            } else {
                if(isChainRelated && !fileWithSolcInputs && !fileWithChainId && onlyRequired) workBuild[chain].push(filePath);
            }
        });
    })
    return workBuild;
}

// Main script
console.log("🔄 Syncing contracts data to Next App...");

try {
    // Find all artifact JSON files
    walkDir(HARDHAT_ARTIFACTS_PATH);
    // console.log("Found files:", workBuild); 
    chainIds.forEach((chainId) => {
        // Read deployed addresses for this chain
        const deployedAddressesPath = `./ignition/deployments/chain-${chainId}/deployed_addresses.json`;
        let deployedAddresses = {};
        try {
            deployedAddresses = JSON.parse(fs.readFileSync(deployedAddressesPath, 'utf8'));
        } catch (error) {
            console.log(`No deployed addresses found for chain ${chainId}`);
        }
        
        workBuild[chainId].forEach(filepath => {
            const artifact = JSON.parse(fs.readFileSync(filepath, 'utf8'));
            const basename = path.basename(filepath).replace('.json', '');
            let contractAddress = deployedAddresses[basename];
            if(!contractAddress || contractAddress === '') contractAddress = zeroAddress;

            // Extract and save all the required data such as the ABI, contractAddress, inputs etc
            // console.log(`Processing ${basename} with ${artifact.abi.length} functions`);
            artifact.abi.forEach((item) => {
                if(item.type === 'function' && approvedFunctions.includes(item.name)) {
                    // console.log(`Found approved function: ${item.name}`);
                    let inputs = [];
                    const chainIndex = chainIds.indexOf(chainId);
                    item.inputs && item.inputs.forEach((input) => {
                        inputs.push(input.name);
                    });
                    const isReadFunction = readFunctions.includes(item.name);
                    const dir = `${REACT_DATA_PATH}/${chainId}`;
                    if (!fs.existsSync(dir)) {
                        fs.mkdirSync(dir, { recursive: true });
                        // console.log(`Directory created: ${dir}`);
                    }
                    const stdItemOutPath = path.join(dir, `${item.name}.json`);
                    itemOutput.abi = isReadFunction? [item] : artifact.abi;
                    itemOutput.inputCount = inputs.length;
                    itemOutput.functionName = item.name;
                    itemOutput.contractAddress = contractAddress;
                    fs.writeFileSync(stdItemOutPath, JSON.stringify(itemOutput, null, 2));
                    // Map contract names properly
                    const contractName = basename.replace('Tradeverse#', '');
                    // console.log(`Setting contract address for ${contractName}: ${contractAddress}`);
                    globalOutput.contractAddresses[chainIndex][contractName] = contractAddress;

                }
            })
        });

    });
    // console.log("erc20Artifacts", erc20Artifacts);
    fs.writeFileSync(GLOBAL_OUTPUT_PATH, JSON.stringify(globalOutput, null, 2));
    fs.writeFileSync(ERC20_ARTIFACTS_PATH, JSON.stringify(erc20Artifacts, null, 2));
    fs.writeFileSync(ESCROW_ARTIFACTS_PATH, JSON.stringify(escrowAccountArtifacts, null, 2));
    fs.writeFileSync(TRADING_ARTIFACTS_PATH, JSON.stringify(tradeAccountArtifacts, null, 2));
    fs.writeFileSync(ARBITRATORS_ARTIFACTS_PATH, JSON.stringify(arbitatorsArtifacts, null, 2));

    // Removed template and ERC20 file writes as they're not used in this project
    console.log("✅ Data synchronization completed!");
} catch (error) {
    console.error("❌ Error syncing ABIs:", error);
    process.exit(1);
}

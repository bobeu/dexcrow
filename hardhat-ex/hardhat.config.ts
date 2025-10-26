import type { HardhatUserConfig } from "hardhat/config";
import hardhatViem from "@nomicfoundation/hardhat-viem";
import hardhatToolboxViemPlugin from "@nomicfoundation/hardhat-toolbox-viem";
import hardhatNodeTestRunner from "@nomicfoundation/hardhat-node-test-runner";
import { configVariable } from "hardhat/config";
import hardhatIgnitionViemPlugin from "@nomicfoundation/hardhat-ignition-viem";
import { config as CONFIG } from "dotenv";
// import hardhatDeploy from "hardhat-deploy";
// import hardhatWeb3 from "@nomiclabs/hardhat-web3";
// import hardhatToolbox from "@nomicfoundation/hardhat-toolbox";

CONFIG();
// console.log("P_KEY_far", process.env.P_KEY_far)
const config: HardhatUserConfig = {
  plugins: [
    hardhatToolboxViemPlugin, 
    hardhatViem, 
    hardhatNodeTestRunner, 
    hardhatIgnitionViemPlugin
    // hardhatDeploy, 
    // hardhatWeb3,
    // hardhatToolbox,
  ],
  solidity: {
    compilers: [
      {
        version: "0.8.30",
        settings: {
          optimizer: {
            enabled: true,
            runs: 200,
          },
          viaIR: true,
          evmVersion: "paris",
        },
      },
    ],
  },
  networks: {
    hardhatMainnet: {
      type: "edr-simulated",
      chainType: "l1",
    },
    hardhatOp: {
      type: "edr-simulated",
      chainType: "op",
    },
    sepolia: {
      type: "http",
      chainType: "l1",
      url: configVariable("SEPOLIA_RPC_URL"),
      accounts: [configVariable("PRIVATE_farc")],
    },
    baseSepolia: {
      type: "http",
      chainType: "generic",
      url: configVariable("BASE_SEPOLIA_RPC_URL"),
      accounts: [configVariable("PRIVATE_0xD7c")],
      chainId: 84532,
    },
    base: {
      type: "http",
      chainType: "generic",
      url: configVariable("BASE_RPC_URL"),
      accounts: [configVariable("PRIVATE_farc")],
      chainId: 8453,
    },
  },
  // namedAccounts: {
  //   deployer: {
  //     default: 0,
  //     11142220: `privatekey://${configVariable("P_KEY_0xD7c")}`,
  //     42220: `privatekey://${configVariable("P_KEY_far")}`
  //   },
  //   pythPriceFeed: {
  //     default: 1,
  //     11142220: ``,
  //     42220: `0xff1a0f4744e8582DF1aE09D5611b887B6a12925C`,
  //     56: '0x4D7E825f80bDf85e913E0DD2A2D54927e9dE1594',
  //     8453: '0x8250f4aF4B972684F7b336503E2D6dFeDeB1487a',
  //     1:' 0x4305FB66699C3B2702D4d05CF36551390A4c69C6',
  //     polygon: '0xff1a0f4744e8582DF1aE09D5611b887B6a12925C',
  //     94: '0x5744Cbf430D99456a0A8771208b674F27f8EF0Fb',
  //     baseSepolia: '0xA2aa501b19aff244D90cc15a4Cf739D2725B5729',
  //     44787: '0x74f09cb3c7e2A01865f424FD14F6dc9A14E3e94E',
  //     mumbai: '0xFC6bd9F9f0c6481c6Af3A7Eb46b296A5B85ed379',
  //   },

  // }
};

export default config;

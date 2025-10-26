import {HardhatRuntimeEnvironment} from 'hardhat/types';
import {DeployFunction} from 'hardhat-deploy/types';
import { config as dotconfig } from "dotenv";
import { parseUnits } from 'ethers';

dotconfig();

// const CHAINLINK_CCIP_CHAIN_SELECTOR_CELO = BigInt('1346049177634351622');
// const CHAINLINK_CCIP_CHAIN_SELECTOR_BASE = BigInt('15971525489660198786');
// const CHAINLINK_CCIP_CHAIN_SELECTOR_BASE_SEPOLIA = BigInt('10344971235874465080');
// const CHAINLINK_CCIP_CHAIN_SELECTOR_CELO_ALFAJORES = BigInt('3552045678561919002');

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const {deployments, getNamedAccounts} = hre;
  const {deploy, getNetworkName, execute, read} = deployments;
  const {deployer, identityVerificationHub, escapeAddr, admin2, witnetRandomness } = await getNamedAccounts();

  const networkName = getNetworkName();
  const SCOPE_SEED = process.env.SCOPE_SEED as string;
  const olderThan = 18;
  const ofacEnabled = true;
  const forbiddenCountries = ["IRN", "PRK", "RUS", "SYR"];
  const maxPlayer = 50;
  console.log("SCOPE_SEED", SCOPE_SEED); 
  console.log("Network Name", networkName); 

  const INITIAL_BET = parseUnits('0.001', 18);
  const PLAYER_FEE = parseUnits('0.001', 18);
  const FLAT = 20;
  const OTHERFEE = 100;
  const DRAW_INTERVAL_IN_MIN = 15; // 15 minutes

  const fundHolder = await deploy("FundHolder", {
    from: deployer,
    args: [],
    log: true,
  });
  
  console.log(`FundHolder deployed to: ${fundHolder.address}`);
 
  const feeReceiver = await deploy("FeeReceiver", {
    from: deployer,
    args: [escapeAddr],
    log: true,
  });
  
  console.log(`FeeReceiver deployed to: ${feeReceiver.address}`);

  const randoFutures = await deploy("RandoFutures", {
    from: deployer,
    args: [INITIAL_BET, FLAT, OTHERFEE, witnetRandomness],
    log: true,
  });

  console.log(`RandoFutures deployed to: ${randoFutures.address}`)

  const verifier = await deploy("Verifier", {
    from: deployer,
    args: [
      identityVerificationHub,
      SCOPE_SEED,
      ofacEnabled,
      olderThan,
      forbiddenCountries
    ],
    log: true,
  });
  console.log(`Verifier deployed to: ${verifier.address}`);

  const standingOrder = await deploy("StandingOrder", {
    from: deployer,
    args: [],
    log: true,
  });
  console.log(`StandingOrder deployed to: ${standingOrder.address}`);
  
  // Update VrfSetUp address in RandoFutures

  const verificationConfig = await read("Verifier", "verificationConfig");
  console.log("verificationConfig", verificationConfig);
  
  const verificationConfigId = await read("Verifier", "verificationConfigId");
  console.log("verificationConfigId", verificationConfigId);

  const paused = await read("RandoFutures", "paused");
  console.log("paused", paused);
  
  const scope = await read("Verifier", "scope");
  console.log("scope", scope.toString());
  
  // Pause the contract
  // try {
  // 	await execute("RandoFutures", {from: deployer}, "pause");
  //   console.log("Pause executed");
  // } catch (error) {
  // 	const errorMessage = error?.message || error?.reason || error?.data?.message || error?.data?.reason;
  // 	console.error("Error executing pause:", errorMessage?.stack || errorMessage?.slice(0, 100));
  // }

  // const pausedAfter = await read("RandoFutures", "paused");
  // console.log("paused", pausedAfter);
  
  // try {
  // 	await execute("RandoFutures", {from: deployer}, "setVerifier", verifier.address);
  //   console.log("setVerifier executed");
  // } catch (error) {
  // 	const errorMessage = error?.message || error?.reason || error?.data?.message || error?.data?.reason;
  // 	console.error("Error executing setVerifier:", errorMessage?.stack || errorMessage?.slice(0, 100));
  // }

  // try {
  // 	await execute("RandoFutures", {from: deployer}, "setDataStruct", DRAW_INTERVAL_IN_MIN, feeReceiver.address, PLAYER_FEE, maxPlayer, standingOrder.address, fundHolder.address);
  //   console.log("setDataStruct executed");
  // } catch (error) {
  // 	const errorMessage = error?.message || error?.reason || error?.data?.message || error?.data?.reason;
  // 	console.error("Error executing setDataStruct:", errorMessage?.stack || errorMessage?.slice(0, 100));
  // }
  
  // try {
  // 	await execute('StandingOrder', {from: deployer}, 'setBetFactory', randoFutures.address);
  //   console.log("setBetFactory executed");
  // } catch (error) {
  // 	const errorMessage = error?.message || error?.reason || error?.data?.message || error?.data?.reason;
  // 	console.error("Error executing setBetFactory:", errorMessage?.stack || errorMessage?.slice(0, 100));
  // }


  // try {
  // 	await execute('RandoFutures', {from: deployer}, 'setPermission', admin2);
  //   console.log(`Admin2 address ${admin2} added to RandoFutures`);
  // } catch (error) {
  // 	const errorMessage = error?.message || error?.reason || error?.data?.message || error?.data?.reason;
  // 	console.error("Error executing setPermission:", errorMessage?.stack || errorMessage?.slice(0, 100));
  // }

};

export default func;

func.tags = ["RandoFutures", "Verifier", "FeeReceiver"];

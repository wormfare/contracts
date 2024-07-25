import { parseEther } from 'ethers';
import { HardhatRuntimeEnvironment } from 'hardhat/types';
import {
  logDeploymentInfo,
  logHardhatNetworkWarning,
} from './utils/deployment-utils';

const contractName = 'Spinner';

module.exports = async ({
  getNamedAccounts,
  deployments,
}: HardhatRuntimeEnvironment) => {
  logHardhatNetworkWarning();

  const { deploy } = deployments;
  const { deployer, admin, apiSigner } = await getNamedAccounts();

  logDeploymentInfo(deployer, contractName);

  // deploy the contract
  const proxyParams = {
    proxyContract: 'OpenZeppelinTransparentProxy',
    execute: {
      methodName: 'initialize',
      args: [
        admin,
        process.env.USDT_CONTRACT_ADDRESS,
        process.env.TREASURY_WALLET_ADDRESS,
        apiSigner,
        parseEther(process.env.SPINNER_SPIN_PRICE_USDT),
        process.env.SPINNER_MAX_SPINS_PER_DAY,
      ],
    },
  };

  if (process.env.UPGRADE) {
    delete proxyParams.execute;
  }

  await deploy(contractName, {
    from: deployer,
    proxy: proxyParams,
    log: true,
  });
};

module.exports.tags = ['All', contractName];

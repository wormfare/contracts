import { HardhatRuntimeEnvironment } from 'hardhat/types';
import {
  logDeploymentInfo,
  logHardhatNetworkWarning,
} from '../utils/deployment-utils';

const contractName = 'WormfareGenesis';

module.exports = async ({
  getNamedAccounts,
  deployments,
}: HardhatRuntimeEnvironment) => {
  logHardhatNetworkWarning();

  const { deploy } = deployments;
  const { deployer, wormfareGenesisOwner } = await getNamedAccounts();

  logDeploymentInfo(deployer, contractName);

  // deploy the contract
  await deploy(contractName, {
    from: deployer,
    proxy: {
      proxyContract: 'OpenZeppelinTransparentProxy',
      execute: {
        methodName: 'initialize',
        args: [wormfareGenesisOwner, deployer],
      },
    },
    log: true,
  });
};

module.exports.tags = ['All', contractName, 'Queue1'];

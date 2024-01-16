import { HardhatRuntimeEnvironment } from 'hardhat/types';
import {
  logDeploymentInfo,
  logHardhatNetworkWarning,
} from './utils/deployment-utils';

const contractName = 'TokenSale';

module.exports = async ({
  getNamedAccounts,
  deployments,
}: HardhatRuntimeEnvironment) => {
  logHardhatNetworkWarning();

  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();

  logDeploymentInfo(deployer, contractName);

  // deploy the contract
  await deploy(contractName, {
    from: deployer,
    proxy: {
      proxyContract: 'OpenZeppelinTransparentProxy',
    },
    log: true,
  });
};

module.exports.tags = ['All', contractName + '_v2'];

import { HardhatRuntimeEnvironment } from 'hardhat/types';
import {
  logDeploymentInfo,
  logHardhatNetworkWarning,
} from './utils/deployment-utils';

const contractName = 'WOFR';

module.exports = async ({
  getNamedAccounts,
  deployments,
}: HardhatRuntimeEnvironment) => {
  logHardhatNetworkWarning();

  const { deploy } = deployments;
  const { deployer, wofrOwner } = await getNamedAccounts();

  logDeploymentInfo(deployer, contractName);

  // deploy the contract
  await deploy(contractName, {
    from: deployer,
    args: [wofrOwner],
    log: true,
  });
};

module.exports.tags = ['All', contractName];

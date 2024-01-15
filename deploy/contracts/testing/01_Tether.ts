import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { isTestnetNetwork } from '../../../src/utils';
import {
  logDeploymentInfo,
  logHardhatNetworkWarning,
} from '../utils/deployment-utils';

const contractName = 'Tether';

module.exports = async ({
  getNamedAccounts,
  deployments,
}: HardhatRuntimeEnvironment) => {
  if (!isTestnetNetwork()) {
    return;
  }

  logHardhatNetworkWarning();

  const { deploy } = deployments;
  const { deployer, admin } = await getNamedAccounts();

  logDeploymentInfo(deployer, contractName);

  // deploy the contract
  await deploy(contractName, {
    from: deployer,
    args: [admin],
    log: true,
  });
};

module.exports.tags = ['All', contractName];

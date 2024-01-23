import { ethers } from 'hardhat';
import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { WormfareGenesis } from '../../typechain-types';

export const deployWormfareGenesis = async ({
  deployments,
  getNamedAccounts,
}: HardhatRuntimeEnvironment): Promise<WormfareGenesis> => {
  const { deploy } = deployments;
  const { deployer, wormfareGenesisOwner } = await getNamedAccounts();

  // deploy the contract
  const res = await deploy('WormfareGenesisTesting', {
    contract: 'WormfareGenesis',
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

  return ethers.getContractAt('WormfareGenesis', res.address);
};

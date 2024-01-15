import { ethers } from 'hardhat';
import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { Tether } from '../../typechain-types';

export const deployTether = async ({
  deployments,
  getNamedAccounts,
}: HardhatRuntimeEnvironment): Promise<Tether> => {
  const { deploy } = deployments;
  const { deployer, admin } = await getNamedAccounts();

  const res = await deploy('TetherTesting', {
    contract: 'Tether',
    from: deployer,
    args: [admin],
    log: true,
  });

  return ethers.getContractAt('Tether', res.address);
};

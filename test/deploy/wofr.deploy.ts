import { ethers } from 'hardhat';
import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { WOFR } from '../../typechain-types';

export const deployWofr = async (
  { deployments, getNamedAccounts }: HardhatRuntimeEnvironment,
  owner?: string,
): Promise<WOFR> => {
  const { deploy } = deployments;
  const { deployer, wofrOwner } = await getNamedAccounts();

  const res = await deploy('WOFR', {
    from: deployer,
    args: [owner || wofrOwner],
    log: true,
  });

  return ethers.getContractAt('WOFR', res.address);
};

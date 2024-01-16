import { parseEther } from 'ethers';
import { ethers } from 'hardhat';
import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { TokenSale } from '../../typechain-types';

export const deployTokenSale = async ({
  deployments,
  getNamedAccounts,
}: HardhatRuntimeEnvironment): Promise<TokenSale> => {
  const { deploy } = deployments;
  const { deployer, admin, apiSigner, treasuryWallet } =
    await getNamedAccounts();

  const tetherContractRes = await deployments.get('TetherTesting');

  const res = await deploy('TokenSaleTesting', {
    contract: 'TokenSale',
    from: deployer,
    proxy: {
      proxyContract: 'OpenZeppelinTransparentProxy',
      execute: {
        methodName: 'initialize',
        args: [
          admin,
          tetherContractRes.address,
          treasuryWallet,
          apiSigner,
          parseEther('10000'),
          parseEther('0.5'),
        ],
      },
    },
    log: true,
  });

  return ethers.getContractAt('TokenSale', res.address);
};

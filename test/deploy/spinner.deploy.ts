import { ethers } from 'hardhat';
import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { Spinner } from '../../typechain-types';
import { parseTether } from '../utils/common';

export const deploySpinner = async ({
  deployments,
  getNamedAccounts,
}: HardhatRuntimeEnvironment): Promise<Spinner> => {
  const { deploy } = deployments;
  const { deployer, admin, apiSigner, treasuryWallet } =
    await getNamedAccounts();

  const tetherContractRes = await deployments.get('TetherTesting');

  const res = await deploy('SpinnerTesting', {
    contract: 'Spinner',
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
          parseTether(process.env.SPINNER_SPIN_PRICE_USDT),
          process.env.SPINNER_MAX_SPINS_PER_DAY,
        ],
      },
    },
    log: true,
  });

  return ethers.getContractAt('Spinner', res.address);
};

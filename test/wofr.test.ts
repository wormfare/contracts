import { SignerWithAddress } from '@nomicfoundation/hardhat-ethers/signers';
import { expect } from 'chai';
import { parseEther, ZeroAddress } from 'ethers';
import { deployments, ethers, getNamedAccounts } from 'hardhat';
import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { WOFR } from '../typechain-types';
import { deployWofr } from './deploy/wofr.deploy';

describe('WOFR contract tests', () => {
  let wofrContract: WOFR;

  let deployerWallet: SignerWithAddress;
  let ownerWallet: SignerWithAddress;

  before(async () => {
    const { deployer, wofrOwner } = await getNamedAccounts();

    deployerWallet = await ethers.getSigner(deployer);
    ownerWallet = await ethers.getSigner(wofrOwner);
  });

  beforeEach(async () => {
    await deployContract();
  });

  // Deployment fixture
  const deployContract = async (owner?: string) => {
    await deployments.createFixture(
      async (env: HardhatRuntimeEnvironment): Promise<void> => {
        await deployments.fixture(); // ensure you start from a fresh deployments

        wofrContract = await deployWofr(env, owner);
      },
    )();
  };

  ////////////////////////////////////
  // Tests below
  ////////////////////////////////////

  it('Contract cannot be deployed with an invalid owner address', async () => {
    const promise = deployContract(ZeroAddress);

    await expect(promise).to.be.revertedWithCustomError(
      wofrContract,
      'InvalidOwnerAddress',
    );
  });

  it("All the supply is minted to the owner's address after the deployment", async () => {
    const balance = await wofrContract.balanceOf(ownerWallet.address);
    const totalSupply = await wofrContract.totalSupply();
    const expectedTotalSupply = parseEther(String(300_000_000));

    expect(balance).to.eq(expectedTotalSupply);
    expect(totalSupply).to.eq(expectedTotalSupply);
  });
});

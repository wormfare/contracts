import { SignerWithAddress } from '@nomicfoundation/hardhat-ethers/signers';
import { expect } from 'chai';
import { ZeroAddress } from 'ethers';
import { deployments, ethers, getNamedAccounts } from 'hardhat';
import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { WormfareGenesis } from '../typechain-types';
import { deployWormfareGenesis } from './deploy/wormfare-genesis.deploy';

describe('WormfareGenesis contract tests', () => {
  let nftContract: WormfareGenesis;

  let deployerWallet: SignerWithAddress;
  let ownerWallet: SignerWithAddress;

  let aliceWallet: SignerWithAddress;
  let bobWallet: SignerWithAddress;
  let charlieWallet: SignerWithAddress;
  let randomWallet: SignerWithAddress;
  let randomSigners: SignerWithAddress[];

  before(async () => {
    const { deployer, wormfareGenesisOwner } = await getNamedAccounts();

    deployerWallet = await ethers.getSigner(deployer);
    ownerWallet = await ethers.getSigner(wormfareGenesisOwner);

    // we need to skip first n accounts here (or more)
    // n = count of the accounts in the 'namedAccounts' config section (hardhat.config.ts)
    [
      ,
      ,
      ,
      ,
      ,
      randomWallet,
      aliceWallet,
      bobWallet,
      charlieWallet,
      ...randomSigners
    ] = await ethers.getSigners();
  });

  beforeEach(async () => {
    await deployContract();
  });

  // Deployment fixture
  const deployContract = deployments.createFixture(
    async (env: HardhatRuntimeEnvironment): Promise<void> => {
      await deployments.fixture(); // ensure you start from a fresh deployments

      nftContract = await deployWormfareGenesis(env);
    },
  );

  ////////////////////////////////////
  // Tests below
  ////////////////////////////////////

  describe('Permissions', () => {
    it('Arbitrary account cannot mint tokens', async () => {
      const promise = nftContract
        .connect(aliceWallet)
        .batchMint(aliceWallet.address, [1, 2], ['qwe', 'asd']);

      await expect(promise).to.be.revertedWith('Invalid sender.');
    });

    it('Cannot call the initialize() function', async () => {
      const promise = nftContract
        .connect(deployerWallet)
        .initialize(ZeroAddress, ZeroAddress);

      await expect(promise).to.be.revertedWithCustomError(
        nftContract,
        'InvalidInitialization',
      );
    });
  });

  describe('Main logic', () => {
    it('Deployer mints tokens', async () => {
      const tokenIds = [];
      const tokenUris = [];

      for (let i = 0; i < 100; i++) {
        tokenIds.push(i);
        tokenUris.push(
          'https://arweave.net/H8Na1bOlSitINLdUyY_mvarU8D0PaX5CkQ4xcub3dGA' + i,
        );
      }

      await nftContract
        .connect(deployerWallet)
        .batchMint(ownerWallet.address, tokenIds, tokenUris);

      expect(await nftContract.tokenURI(0)).to.eq(
        'https://arweave.net/H8Na1bOlSitINLdUyY_mvarU8D0PaX5CkQ4xcub3dGA0',
      );
      expect(await nftContract.tokenURI(99)).to.eq(
        'https://arweave.net/H8Na1bOlSitINLdUyY_mvarU8D0PaX5CkQ4xcub3dGA99',
      );
      expect(await nftContract.ownerOf(0)).to.eq(ownerWallet.address);
      expect(await nftContract.ownerOf(99)).to.eq(ownerWallet.address);
    });

    it('Cannot mint more than 100 tokens', async () => {
      const tokenIds = [];
      const tokenUris = [];

      for (let i = 0; i < 100; i++) {
        tokenIds.push(i);
        tokenUris.push(
          'https://arweave.net/H8Na1bOlSitINLdUyY_mvarU8D0PaX5CkQ4xcub3dGA' + i,
        );
      }

      await nftContract
        .connect(deployerWallet)
        .batchMint(ownerWallet.address, tokenIds, tokenUris);

      // mint one more
      const promise = nftContract
        .connect(deployerWallet)
        .batchMint(ownerWallet.address, [tokenIds[0]], [tokenUris[0]]);

      await expect(promise).to.revertedWith('Unable to mint more tokens.');
    });
  });
});

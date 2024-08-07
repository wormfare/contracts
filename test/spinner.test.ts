import { SignerWithAddress } from '@nomicfoundation/hardhat-ethers/signers';
import { expect } from 'chai';
import { ZeroAddress, parseEther } from 'ethers';
import { deployments, ethers, getNamedAccounts } from 'hardhat';
import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { Tether, Spinner } from '../typechain-types';
import { deployTether } from './deploy/tether.deploy';
import { deploySpinner } from './deploy/spinner.deploy';
import { parseTether } from './utils/common';

describe('Spinner contract tests', () => {
  let tetherContract: Tether;
  let tetherContractAddress: string;
  let spinnerContract: Spinner;
  let spinnerContractAddress: string;

  let deployerWallet: SignerWithAddress;
  let adminWallet: SignerWithAddress;
  let apiSignerWallet: SignerWithAddress;
  let treasuryWallet: SignerWithAddress;

  let aliceWallet: SignerWithAddress;
  let bobWallet: SignerWithAddress;
  let charlieWallet: SignerWithAddress;
  let randomWallet: SignerWithAddress;
  let randomSigners: SignerWithAddress[];

  let spinPriceUsdt: bigint; // value from the contract (18 decimals)
  let totalTokensForSale: bigint;

  let TOKEN_ID_WOFR: bigint;
  let TOKEN_ID_USDT: bigint;
  let TOKEN_ID_BOND: bigint;
  let TOKEN_ID_VOUCHER: bigint;

  const MAX_SPINS_PER_DAY = +process.env.SPINNER_MAX_SPINS_PER_DAY;
  const SPIN_PRICE_USDT = parseTether(process.env.SPINNER_SPIN_PRICE_USDT);

  before(async () => {
    const {
      deployer,
      admin,
      apiSigner,
      treasuryWallet: treasury,
    } = await getNamedAccounts();

    deployerWallet = await ethers.getSigner(deployer);
    adminWallet = await ethers.getSigner(admin);
    apiSignerWallet = await ethers.getSigner(apiSigner);
    treasuryWallet = await ethers.getSigner(treasury);

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

      tetherContract = await deployTether(env);
      tetherContractAddress = await tetherContract.getAddress();
      spinnerContract = await deploySpinner(env);
      spinnerContractAddress = await spinnerContract.getAddress();
      spinPriceUsdt = await spinnerContract.spinPriceUsdt();

      TOKEN_ID_WOFR = await spinnerContract.WOFR();
      TOKEN_ID_USDT = await spinnerContract.USDT();
      TOKEN_ID_BOND = await spinnerContract.BOND();
      TOKEN_ID_VOUCHER = await spinnerContract.VOUCHER();

      await tetherContract
        .connect(adminWallet)
        .mint(aliceWallet, parseTether('1000000'));
      await tetherContract
        .connect(adminWallet)
        .mint(bobWallet, parseTether('1000000'));
      await tetherContract
        .connect(adminWallet)
        .mint(adminWallet, parseTether('1000000'));
      await tetherContract
        .connect(adminWallet)
        .mint(spinnerContractAddress, parseTether('1000000'));
    },
  );

  /**
   * @param signerWallet
   * @param claimerWallet
   * @param tokeId
   * @param amount
   * @param signer
   * @returns [to, tokenId, amount, signature]
   */
  const prepareClaimData = async (
    signerWallet: SignerWithAddress,
    claimerWallet: SignerWithAddress,
    amount = 1,
    tokenId = TOKEN_ID_WOFR,
    nonce = 0,
    signer = apiSignerWallet,
  ): Promise<[string, bigint, number, string]> => {
    const network = await ethers.provider.getNetwork();
    const domain = {
      name: 'Wormfare Spinner',
      version: '1',
      chainId: network.chainId,
      verifyingContract: spinnerContractAddress,
    };

    const types = {
      ClaimParams: [
        { name: 'to', type: 'address' },
        { name: 'tokenId', type: 'uint256' },
        { name: 'amount', type: 'uint256' },
        { name: 'nonce', type: 'uint256' },
        { name: 'sender', type: 'address' },
      ],
    };

    const to = claimerWallet.address.toLowerCase();
    const data = {
      to,
      tokenId,
      amount,
      nonce,
      sender: signerWallet.address,
    };

    const signature = await signer.signTypedData(domain, types, data);

    return [to, data.tokenId, data.amount, signature];
  };

  const buySpins = async (
    signer: SignerWithAddress,
    amountSpins: number,
    allowance: bigint = BigInt(0),
  ) => {
    await tetherContract
      .connect(signer)
      .approve(
        spinnerContractAddress,
        allowance > 0 ? allowance : BigInt(amountSpins) * SPIN_PRICE_USDT,
      );

    return spinnerContract.connect(signer).buySpins(amountSpins);
  };

  ////////////////////////////////////
  // Tests below
  ////////////////////////////////////

  describe('Initialization', () => {
    it('Cannot call the initialize() function', async () => {
      const promise = spinnerContract
        .connect(adminWallet)
        .initialize(ZeroAddress, ZeroAddress, ZeroAddress, ZeroAddress, 0, 0);

      await expect(promise).to.be.revertedWithCustomError(
        spinnerContract,
        'InvalidInitialization',
      );
    });

    it('Should initialize correctly', async () => {
      expect(await spinnerContract.spinPriceUsdt()).to.equal(spinPriceUsdt);
      expect(await spinnerContract.maxSpinsPerDay()).to.equal(
        MAX_SPINS_PER_DAY,
      );
      expect(await spinnerContract.usdtContract()).to.equal(
        tetherContractAddress,
      );

      const DEFAULT_ADMIN_ROLE = await spinnerContract.DEFAULT_ADMIN_ROLE();
      expect(
        await spinnerContract.hasRole(DEFAULT_ADMIN_ROLE, adminWallet.address),
      ).to.be.true;
      expect(
        await spinnerContract.hasRole(
          await spinnerContract.PAUSER_ROLE(),
          adminWallet.address,
        ),
      ).to.be.true;
      expect(
        await spinnerContract.hasRole(
          await spinnerContract.MINTER_ROLE(),
          adminWallet.address,
        ),
      ).to.be.true;
    });
  });

  describe('Permissions', () => {
    it('Non-admin cannot call the pause() function', async () => {
      const promise = spinnerContract.connect(aliceWallet).pause();

      await expect(promise).to.be.revertedWithCustomError(
        spinnerContract,
        'AccessControlUnauthorizedAccount',
      );
    });

    it('Non-admin cannot call the unpause() function', async () => {
      const promise = spinnerContract.connect(aliceWallet).unpause();

      await expect(promise).to.be.revertedWithCustomError(
        spinnerContract,
        'AccessControlUnauthorizedAccount',
      );
    });

    it('Non-admin cannot call the setApiSigner() function', async () => {
      const promise = spinnerContract
        .connect(aliceWallet)
        .setApiSigner(aliceWallet.address);

      await expect(promise).to.be.revertedWithCustomError(
        spinnerContract,
        'AccessControlUnauthorizedAccount',
      );
    });

    it('Non-admin cannot call the setSpinPriceUsdt() function', async () => {
      const promise = spinnerContract
        .connect(aliceWallet)
        .setSpinPriceUsdt(parseEther('0.0001'));

      await expect(promise).to.be.revertedWithCustomError(
        spinnerContract,
        'AccessControlUnauthorizedAccount',
      );
    });
  });

  describe('Admin functions', () => {
    it('Admin calls the pause() function', async () => {
      const promise = spinnerContract.connect(adminWallet).pause();

      await expect(promise).to.emit(spinnerContract, 'Paused');
    });

    it('Admin can call the unpause() function', async () => {
      await spinnerContract.connect(adminWallet).pause();
      const promise = spinnerContract.connect(adminWallet).unpause();

      await expect(promise).to.emit(spinnerContract, 'Unpaused');
    });

    it('Admin can call the setSpinPriceUsdt() function', async () => {
      const promise = spinnerContract
        .connect(adminWallet)
        .setSpinPriceUsdt(parseTether('3'));

      await expect(promise)
        .to.emit(spinnerContract, 'SpinPriceUsdtUpdate')
        .withArgs(parseTether('3'));
      expect(await spinnerContract.spinPriceUsdt()).to.eq(parseTether('3'));
    });

    it('Admin can call the setMaxSpinsPerDay() function', async () => {
      const promise = spinnerContract
        .connect(adminWallet)
        .setMaxSpinsPerDay(10);

      await expect(promise)
        .to.emit(spinnerContract, 'MaxSpinsPerDayUpdate')
        .withArgs(MAX_SPINS_PER_DAY);
      expect(await spinnerContract.maxSpinsPerDay()).to.eq(10);
    });

    it('Admin can call the setApiSigner() function', async () => {
      const promise = spinnerContract
        .connect(adminWallet)
        .setApiSigner(randomWallet.address);

      await expect(promise)
        .to.emit(spinnerContract, 'ApiSignerUpdate')
        .withArgs(randomWallet.address);
    });
  });

  describe('Claim rewards', () => {
    it('User cannot claim reward without a signature', async () => {
      const [to, tokeId, amount] = await prepareClaimData(
        aliceWallet,
        aliceWallet,
      );

      const promise = spinnerContract
        .connect(aliceWallet)
        .claim(to, tokeId, amount, '0x');

      await expect(promise).revertedWithCustomError(
        spinnerContract,
        'ECDSAInvalidSignatureLength',
      );
    });

    it("User cannot claim reward with someone else's signature", async () => {
      const [to, tokenId, amount, signature] = await prepareClaimData(
        aliceWallet,
        aliceWallet,
      );

      const promise = spinnerContract
        .connect(bobWallet)
        .claim(to, tokenId, amount, signature);

      await expect(promise).revertedWithCustomError(
        spinnerContract,
        'InvalidSignature',
      );
    });

    it('User cannot claim reward with the same signature twice', async () => {
      const [to, tokenId, amount, signature] = await prepareClaimData(
        aliceWallet,
        aliceWallet,
      );

      await spinnerContract
        .connect(aliceWallet)
        .claim(to, tokenId, amount, signature);
      const promise = spinnerContract
        .connect(aliceWallet)
        .claim(to, tokenId, amount, signature);

      await expect(promise).revertedWithCustomError(
        spinnerContract,
        'InvalidSignature',
      );
    });

    it('User cannot claim a reward using non-existent tokenId', async () => {
      const [to, tokenId, amount, signature] = await prepareClaimData(
        aliceWallet,
        aliceWallet,
        1,
        BigInt(999),
      );

      const promise = spinnerContract
        .connect(aliceWallet)
        .claim(to, tokenId, amount, signature);

      await expect(promise).revertedWithCustomError(
        spinnerContract,
        'InvalidTokenId',
      );
    });

    it('User cannot claim a reward using the wrong amount', async () => {
      const [to, tokenId, amount, signature] = await prepareClaimData(
        aliceWallet,
        aliceWallet,
        0,
      );

      const promise = spinnerContract
        .connect(aliceWallet)
        .claim(to, tokenId, amount, signature);

      await expect(promise).revertedWithCustomError(
        spinnerContract,
        'ZeroOrNegativeValueProvided',
      );
    });

    it('User cannot claim when the contract is paused', async () => {
      await spinnerContract.connect(adminWallet).pause();

      const [to, tokenId, amount, signature] = await prepareClaimData(
        aliceWallet,
        aliceWallet,
      );

      const promise = spinnerContract
        .connect(aliceWallet)
        .claim(to, tokenId, amount, signature);

      await expect(promise).revertedWithCustomError(
        spinnerContract,
        'EnforcedPause',
      );
    });

    it('User can claim WOFR reward', async () => {
      const [to, tokenId, amount, signature] = await prepareClaimData(
        aliceWallet,
        aliceWallet,
        1,
        TOKEN_ID_WOFR,
      );

      await spinnerContract
        .connect(aliceWallet)
        .claim(to, tokenId, amount, signature);

      expect(await spinnerContract.balanceOf(to, tokenId)).to.eq(amount);
    });

    it('User can claim USDT reward', async () => {
      const [to, tokenId, amount, signature] = await prepareClaimData(
        aliceWallet,
        aliceWallet,
        1,
        TOKEN_ID_USDT,
      );
      const amountUsdt = parseTether('1');

      const promise = spinnerContract
        .connect(aliceWallet)
        .claim(to, tokenId, amount, signature);

      await expect(promise)
        .to.emit(spinnerContract, 'ClaimReward')
        .withArgs(aliceWallet.address, tokenId, 1);

      await expect(promise).to.changeTokenBalances(
        tetherContract,
        [spinnerContract, aliceWallet],
        [-amountUsdt, amountUsdt],
      );

      expect(await spinnerContract.balanceOf(to, tokenId)).to.eq(amount);
    });

    it('User can claim BOND reward', async () => {
      const [to, tokenId, amount, signature] = await prepareClaimData(
        aliceWallet,
        aliceWallet,
        1,
        TOKEN_ID_BOND,
      );

      await spinnerContract
        .connect(aliceWallet)
        .claim(to, tokenId, amount, signature);

      expect(await spinnerContract.balanceOf(to, tokenId)).to.eq(amount);
    });

    it('User can claim VOUCHER reward', async () => {
      const [to, tokenId, amount, signature] = await prepareClaimData(
        aliceWallet,
        aliceWallet,
        1,
        TOKEN_ID_VOUCHER,
      );

      await spinnerContract
        .connect(aliceWallet)
        .claim(to, tokenId, amount, signature);

      expect(await spinnerContract.balanceOf(to, tokenId)).to.eq(amount);
    });
  });

  describe('Buy Spins', () => {
    it('User cannot buy spins with not enough USDT allowance', async () => {
      const promise = buySpins(aliceWallet, 3, parseTether('1'));

      await expect(promise).revertedWithCustomError(
        spinnerContract,
        'NotEnoughUsdtAllowance',
      );
    });

    it('User cannot buy spins with not enough USDT balance', async () => {
      const promise = buySpins(randomWallet, 3);

      await expect(promise).revertedWithCustomError(
        spinnerContract,
        'NotEnoughUsdtOnBalance',
      );
    });

    it('User cannot buy more then 10 spins per day', async () => {
      await buySpins(aliceWallet, 10);

      const promise = buySpins(aliceWallet, 1);

      await expect(promise).revertedWithCustomError(
        spinnerContract,
        'PurchaseLimitExceeded',
      );
    });

    it('User cannot buy spins when paused', async () => {
      await spinnerContract.connect(adminWallet).pause();

      const promise = buySpins(aliceWallet, 1);

      await expect(promise).revertedWithCustomError(
        spinnerContract,
        'EnforcedPause',
      );
    });

    it('User can buy spins', async () => {
      const promise = buySpins(aliceWallet, 1);

      await expect(promise)
        .to.emit(spinnerContract, 'BuySpins')
        .withArgs(aliceWallet.address, SPIN_PRICE_USDT, 1);

      await expect(
        tetherContract.balanceOf(treasuryWallet.address),
      ).to.eventually.eq(SPIN_PRICE_USDT);
    });
  });
});

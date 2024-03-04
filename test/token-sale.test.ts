import { SignerWithAddress } from '@nomicfoundation/hardhat-ethers/signers';
import { expect } from 'chai';
import { ZeroAddress, parseEther } from 'ethers';
import { deployments, ethers, getNamedAccounts } from 'hardhat';
import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { Tether, TokenSale } from '../typechain-types';
import { deployTether } from './deploy/tether.deploy';
import { deployTokenSale } from './deploy/token-sale.deploy';
import { castToTether, parseTether } from './utils/common';

describe('TokenSale contract tests', () => {
  let tetherContract: Tether;
  let saleContract: TokenSale;
  let saleContractAddress: string;

  let deployerWallet: SignerWithAddress;
  let adminWallet: SignerWithAddress;
  let apiSignerWallet: SignerWithAddress;
  let treasuryWallet: SignerWithAddress;

  let aliceWallet: SignerWithAddress;
  let bobWallet: SignerWithAddress;
  let charlieWallet: SignerWithAddress;
  let randomWallet: SignerWithAddress;
  let randomSigners: SignerWithAddress[];

  let tokenPriceUsdt: bigint; // value from the contract (18 decimals)
  let totalTokensForSale: bigint;

  const PERCENT_MULTIPLIER = 10;

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
      saleContract = await deployTokenSale(env);
      saleContractAddress = await saleContract.getAddress();
      tokenPriceUsdt = await saleContract.tokenPriceUsdt();
      totalTokensForSale = await saleContract.totalTokensForSale();

      await tetherContract
        .connect(adminWallet)
        .mint(aliceWallet, parseTether('1000000'));
      await tetherContract
        .connect(adminWallet)
        .mint(bobWallet, parseTether('1000000'));
      await tetherContract
        .connect(adminWallet)
        .mint(adminWallet, parseTether('1000000'));
    },
  );

  /**
   * @param signerWallet
   * @param buyerWallet
   * @param amountUsdt
   * @param discountPercent
   * @param referralWallet
   * @param referralRewardPercent
   * @param signer
   * @returns [amountUsdt, discountPercent, referralWallet, referralRewardPercent, signature]
   */
  const prepareBuyData = async (
    signerWallet: SignerWithAddress,
    buyerWallet: SignerWithAddress,
    amountUsdt: bigint,
    discountPercent?: number,
    referralWallet?: SignerWithAddress,
    referralRewardPercent?: number,
    signer = apiSignerWallet,
  ): Promise<[string, bigint, number, string, number, string]> => {
    const network = await ethers.provider.getNetwork();
    const domain = {
      name: 'Wormfare Token Sale',
      version: '1',
      chainId: network.chainId,
      verifyingContract: saleContractAddress,
    };

    const types = {
      BuyParams: [
        { name: 'to', type: 'address' },
        { name: 'amountUsdt', type: 'uint256' },
        { name: 'discountPercent', type: 'uint256' },
        { name: 'referralWallet', type: 'address' },
        { name: 'referralRewardPercent', type: 'uint256' },
        { name: 'sender', type: 'address' },
      ],
    };

    const to = buyerWallet.address.toLowerCase();
    const data = {
      to,
      amountUsdt,
      discountPercent: discountPercent
        ? discountPercent * PERCENT_MULTIPLIER
        : 0,
      referralWallet: referralWallet
        ? referralWallet.address.toLowerCase()
        : ZeroAddress,
      referralRewardPercent: referralRewardPercent
        ? referralRewardPercent * PERCENT_MULTIPLIER
        : 0,
      sender: signerWallet.address,
    };

    const signature = await signer.signTypedData(domain, types, data);

    return [
      to,
      data.amountUsdt,
      data.discountPercent,
      data.referralWallet,
      data.referralRewardPercent,
      signature,
    ];
  };

  /**
   * Same as buy() but without internal asserts.
   *
   * @param wallet
   * @param amountUsdt
   * @param discountPercent
   * @param referralWallet
   * @param referralRewardPercent
   */
  const buyWithoutChecks = async (
    wallet: SignerWithAddress,
    amountUsdt: bigint,
    discountPercent?: number,
    referralWallet?: SignerWithAddress,
    referralRewardPercent?: number,
  ) => {
    return buy(
      wallet,
      amountUsdt,
      discountPercent,
      referralWallet,
      referralRewardPercent,
      false,
    );
  };

  /**
   * @param wallet
   * @param amountUsdt
   * @param discountPercent
   * @param referralWallet
   * @param referralRewardPercent
   * @param checks
   */
  const buy = async (
    wallet: SignerWithAddress,
    amountUsdt: bigint,
    discountPercent?: number,
    referralWallet?: SignerWithAddress,
    referralRewardPercent?: number,
    checks = true,
  ) => {
    discountPercent ??= 0;

    await tetherContract
      .connect(wallet)
      .approve(saleContract, castToTether(amountUsdt));

    const promise = saleContract
      .connect(wallet)
      .buy(
        ...(await prepareBuyData(
          wallet,
          wallet,
          amountUsdt,
          discountPercent,
          referralWallet,
          referralRewardPercent,
        )),
      );

    if (checks) {
      await expect(promise)
        .to.emit(saleContract, 'Buy')
        .withArgs(
          wallet.address,
          amountUsdt,
          calcTokenAmount(amountUsdt, discountPercent),
          discountPercent * PERCENT_MULTIPLIER,
        );
    }

    return promise;
  };

  /**
   * Buy tokens for someone else.
   *
   * @param walletTo
   * @param amountUsdt
   * @param discountPercent
   * @param checks
   * @returns
   */
  const buyFor = async (
    walletTo: SignerWithAddress,
    amountUsdt: bigint,
    discountPercent?: number,
    checks = true,
  ) => {
    discountPercent ??= 0;

    await tetherContract
      .connect(adminWallet)
      .approve(saleContract, castToTether(amountUsdt));

    const promise = saleContract
      .connect(adminWallet)
      .buyFor(walletTo, amountUsdt, discountPercent * PERCENT_MULTIPLIER);

    if (checks) {
      await expect(promise)
        .to.emit(saleContract, 'Buy')
        .withArgs(
          walletTo.address,
          amountUsdt,
          calcTokenAmount(amountUsdt, discountPercent),
          discountPercent * PERCENT_MULTIPLIER,
        );

      await expect(promise).to.changeTokenBalances(
        tetherContract,
        [adminWallet, treasuryWallet],
        [castToTether(amountUsdt * -1n), castToTether(amountUsdt)],
      );
    }

    return promise;
  };

  const getTokenBalance = async (wallet: SignerWithAddress): Promise<bigint> =>
    saleContract.connect(wallet).getTokenBalance();

  const getUsdtBalance = async (wallet: SignerWithAddress): Promise<bigint> =>
    saleContract.connect(wallet).getUsdtBalance();

  const withdrawUsdt = async (
    wallet: SignerWithAddress,
    amount: bigint,
    toWallet?: SignerWithAddress,
  ) =>
    saleContract
      .connect(wallet)
      .withdrawUsdt(toWallet ? toWallet.address : wallet.address, amount);

  const calcTokenAmount = (amountUsdt: bigint, discountPercent = 0): bigint => {
    const pricePerToken =
      tokenPriceUsdt -
      (tokenPriceUsdt * BigInt(discountPercent * PERCENT_MULTIPLIER)) /
        100n /
        BigInt(PERCENT_MULTIPLIER);
    const tokenAmount = (amountUsdt * parseEther('1')) / pricePerToken;

    return tokenAmount;
  };

  const expectChangeUsdtBalances = async (
    promise: Promise<any>,
    wallets: SignerWithAddress[] | any[],
    balanceChanges: bigint[],
  ) =>
    expect(promise).to.changeTokenBalances(
      tetherContract,
      wallets,
      balanceChanges,
    );

  const expectReferralRewardEvent = async (
    promise: Promise<any>,
    buyer: SignerWithAddress,
    referral: SignerWithAddress,
    rewardUsdtAmount: bigint,
    spentUsdtAmount: bigint,
  ) =>
    expect(promise)
      .to.emit(saleContract, 'ReferralReward')
      .withArgs(
        buyer.address,
        referral.address,
        rewardUsdtAmount,
        spentUsdtAmount,
      );

  ////////////////////////////////////
  // Tests below
  ////////////////////////////////////

  describe('Permissions', () => {
    it('Arbitrary account cannot call the pause() function', async () => {
      const promise = saleContract.connect(aliceWallet).pause();

      await expect(promise).to.be.revertedWithCustomError(
        saleContract,
        'AccessControlUnauthorizedAccount',
      );
    });

    it('Arbitrary account cannot call the unpause() function', async () => {
      const promise = saleContract.connect(aliceWallet).unpause();

      await expect(promise).to.be.revertedWithCustomError(
        saleContract,
        'AccessControlUnauthorizedAccount',
      );
    });

    it('Arbitrary account cannot call the setApiSigner() function', async () => {
      const promise = saleContract
        .connect(aliceWallet)
        .setApiSigner(aliceWallet.address);

      await expect(promise).to.be.revertedWithCustomError(
        saleContract,
        'AccessControlUnauthorizedAccount',
      );
    });

    it('Arbitrary account cannot call the setTokenPriceUsdt() function', async () => {
      const promise = saleContract
        .connect(aliceWallet)
        .setTokenPriceUsdt(parseEther('0.0001'));

      await expect(promise).to.be.revertedWithCustomError(
        saleContract,
        'AccessControlUnauthorizedAccount',
      );
    });

    it('Arbitrary account cannot call the buyFor() function', async () => {
      const promise = saleContract
        .connect(aliceWallet)
        .buyFor(bobWallet.address, parseEther('10'), 0);

      await expect(promise).to.be.revertedWithCustomError(
        saleContract,
        'AccessControlUnauthorizedAccount',
      );
    });

    it('Cannot call the initialize() function', async () => {
      const promise = saleContract
        .connect(adminWallet)
        .initialize(ZeroAddress, ZeroAddress, ZeroAddress, ZeroAddress, 0, 0);

      await expect(promise).to.be.revertedWithCustomError(
        saleContract,
        'InvalidInitialization',
      );
    });
  });

  describe('Admin functions', () => {
    it('Admin calls the pause() function', async () => {
      const promise = saleContract.connect(adminWallet).pause();

      await expect(promise).to.emit(saleContract, 'Paused');
    });

    it('Admin calls the unpause() function', async () => {
      await saleContract.connect(adminWallet).pause();
      const promise = saleContract.connect(adminWallet).unpause();

      await expect(promise).to.emit(saleContract, 'Unpaused');
    });

    it('Admin calls the setTokenPriceUsdt() function', async () => {
      const promise = saleContract
        .connect(adminWallet)
        .setTokenPriceUsdt(parseEther('1.23'));

      await expect(promise)
        .to.emit(saleContract, 'TokenPriceUsdtUpdate')
        .withArgs(parseEther('1.23'));
      await expect(await saleContract.tokenPriceUsdt()).to.eq(
        parseEther('1.23'),
      );
    });

    it('Admin calls the setApiSigner() function', async () => {
      const promise = saleContract
        .connect(adminWallet)
        .setApiSigner(randomWallet.address);

      await expect(promise)
        .to.emit(saleContract, 'ApiSignerUpdate')
        .withArgs(randomWallet.address);
    });
  });

  describe('Defaults', () => {
    it('Default balances are 0', async () => {
      expect(await getTokenBalance(aliceWallet)).to.eq(0);
      expect(await getUsdtBalance(aliceWallet)).to.eq(0);
    });

    it('Admin calls the unpause() function', async () => {
      await saleContract.connect(adminWallet).pause();
      const promise = saleContract.connect(adminWallet).unpause();

      await expect(promise).to.emit(saleContract, 'Unpaused');
    });
  });

  describe('Signature', () => {
    it('Cannot buy tokens without a signature', async () => {
      const [
        to,
        amountUsdt,
        discountPercent,
        referralWallet,
        referralRewardPercent,
      ] = await prepareBuyData(aliceWallet, aliceWallet, parseEther('100'));

      const promise = saleContract
        .connect(aliceWallet)
        .buy(
          to,
          amountUsdt,
          discountPercent,
          referralWallet,
          referralRewardPercent,
          '0x',
        );

      await expect(promise).revertedWithCustomError(
        saleContract,
        'ECDSAInvalidSignatureLength',
      );
    });

    it("Cannot buy tokens with someone else's signature", async () => {
      // Alice gets params
      const [
        to,
        amountUsdt,
        discountPercent,
        referralWallet,
        referralRewardPercent,
        signature,
      ] = await prepareBuyData(aliceWallet, aliceWallet, parseEther('100'), 30);

      // Bob tries to buy
      const promise = saleContract
        .connect(bobWallet)
        .buy(
          to,
          amountUsdt,
          discountPercent,
          referralWallet,
          referralRewardPercent,
          signature,
        );

      await expect(promise).revertedWithCustomError(
        saleContract,
        'InvalidSignature',
      );
    });

    it("Cannot buy tokens with someone else's signature 2", async () => {
      // Alice gets params
      const [
        to,
        amountUsdt,
        discountPercent,
        referralWallet,
        referralRewardPercent,
        signature,
      ] = await prepareBuyData(aliceWallet, aliceWallet, parseEther('100'), 30);

      // Bob tries to buy
      const promise = saleContract
        .connect(aliceWallet)
        .buy(
          bobWallet.address,
          amountUsdt,
          discountPercent,
          referralWallet,
          referralRewardPercent,
          signature,
        );

      await expect(promise).revertedWithCustomError(
        saleContract,
        'InvalidSignature',
      );
    });
  });

  describe('Main logic', () => {
    it('User buys tokens without a discount and referral', async () => {
      const promise = buy(aliceWallet, parseEther('1'));

      await expect(promise).to.changeTokenBalances(
        tetherContract,
        [aliceWallet, treasuryWallet],
        [parseTether('-1'), parseTether('1')],
      );

      expect(await getUsdtBalance(aliceWallet)).to.eq(0);
      expect(await getTokenBalance(aliceWallet)).to.eq(parseEther('2'));
      expect(await saleContract.totalSoldTokens()).to.eq(parseEther('2'));
    });

    it('Can buy twice using the same params and signature', async () => {
      await tetherContract
        .connect(aliceWallet)
        .approve(saleContract, castToTether(parseEther('90')));

      const params = await prepareBuyData(
        aliceWallet,
        aliceWallet,
        parseEther('45'),
        10,
        bobWallet,
        10,
      );

      await saleContract.connect(aliceWallet).buy(...params);
      await saleContract.connect(aliceWallet).buy(...params);

      expect(await getUsdtBalance(aliceWallet)).to.eq(0);
      expect(await getUsdtBalance(bobWallet)).to.eq(parseEther('9'));
      expect(await getTokenBalance(aliceWallet)).to.eq(parseEther('200'));
      expect(await saleContract.totalSoldTokens()).to.eq(parseEther('200'));
    });

    it('Cannot buy with not enough USDT allowance', async () => {
      await tetherContract
        .connect(aliceWallet)
        .approve(saleContract, castToTether(parseEther('45') - 1n));

      const params = await prepareBuyData(
        aliceWallet,
        aliceWallet,
        parseEther('45'),
      );
      const promise = saleContract.connect(aliceWallet).buy(...params);

      await expect(promise).revertedWithCustomError(
        saleContract,
        'NotEnoughUsdtAllowance',
      );
    });

    it('User buys tokens several times without a discount and referral', async () => {
      let promise = buy(aliceWallet, parseEther('100'));

      await expect(promise).to.changeTokenBalances(
        tetherContract,
        [aliceWallet, treasuryWallet],
        [parseTether('-100'), parseTether('100')],
      );

      promise = buy(aliceWallet, parseEther('150'));

      await expect(promise).to.changeTokenBalances(
        tetherContract,
        [aliceWallet, treasuryWallet],
        [parseTether('-150'), parseTether('150')],
      );

      expect(await getUsdtBalance(aliceWallet)).to.eq(0);
      expect(await getTokenBalance(aliceWallet)).to.eq(parseEther('500'));
      expect(await saleContract.totalSoldTokens()).to.eq(parseEther('500'));
    });

    it('User buys tokens several times with a referral', async () => {
      let promise = buy(aliceWallet, parseEther('45'), 10, bobWallet, 10);

      await expectChangeUsdtBalances(
        promise,
        [aliceWallet, treasuryWallet, saleContract],
        [parseTether('-45'), parseTether('40.5'), parseTether('4.5')],
      );
      await expectReferralRewardEvent(
        promise,
        aliceWallet,
        bobWallet,
        parseEther('4.5'),
        parseEther('45'),
      );

      promise = buy(aliceWallet, parseEther('450'), 10, bobWallet, 10);

      await expectChangeUsdtBalances(
        promise,
        [aliceWallet, treasuryWallet, saleContract],
        [parseTether('-450'), parseTether('405'), parseTether('45')],
      );
      await expectReferralRewardEvent(
        promise,
        aliceWallet,
        bobWallet,
        parseEther('45'),
        parseEther('450'),
      );

      expect(await getUsdtBalance(aliceWallet)).to.eq(0);
      expect(await getUsdtBalance(bobWallet)).to.eq(parseEther('49.5'));
      expect(await getTokenBalance(aliceWallet)).to.eq(parseEther('1100'));
      expect(await getTokenBalance(bobWallet)).to.eq(0n);
      expect(await saleContract.totalSoldTokens()).to.eq(parseEther('1100'));
    });

    it('User buys tokens with a discount without a referral', async () => {
      let promise = buy(aliceWallet, parseEther('45'), 10);

      await expectChangeUsdtBalances(
        promise,
        [aliceWallet, treasuryWallet, saleContract],
        [parseTether('-45'), parseTether('45'), parseTether('0')],
      );

      expect(await getUsdtBalance(aliceWallet)).to.eq(0);
      expect(await getTokenBalance(aliceWallet)).to.eq(parseEther('100'));
      expect(await getTokenBalance(bobWallet)).to.eq(0n);
      expect(await saleContract.totalSoldTokens()).to.eq(parseEther('100'));
    });

    it('Buy minimum amount of tokens', async () => {
      // USDT has 6 decimals
      await buy(aliceWallet, parseEther('0.000001'));

      expect(await getUsdtBalance(aliceWallet)).to.eq(0);
      expect(await getTokenBalance(aliceWallet)).to.eq(parseEther('0.000002'));
    });

    it('Cannot buy tokens for 0 USDT', async () => {
      const promise = buy(aliceWallet, 0n);

      await expect(promise).revertedWithCustomError(
        saleContract,
        'ZeroValueProvided',
      );
    });

    it('Cannot buy more tokens if all tokens have been sold out', async () => {
      await buy(aliceWallet, totalTokensForSale / 2n);
      const promise = buy(aliceWallet, 1n);

      await expect(promise).revertedWithCustomError(saleContract, 'SoldOut');
    });

    it('Admin buys tokens for someone else without a discount', async () => {
      await buyFor(bobWallet, parseEther('500'));
      await buyFor(bobWallet, parseEther('1000'));

      const balance = await getTokenBalance(bobWallet);

      await expect(balance).to.eq(parseEther('3000'));
    });

    it('Admin buys tokens for someone else with a discount', async () => {
      await buyFor(bobWallet, parseEther('500'), 1.5);

      const balance = await getTokenBalance(bobWallet);

      await expect(balance).to.eq(1015228426395939086294n);
    });

    it('Admin cannot apply a discount that exceeds 10 percent when buying tokens for someone else', async () => {
      const promise = buyFor(bobWallet, parseEther('500'), 11);

      await expect(promise).revertedWithCustomError(
        saleContract,
        'DiscountPercentIsTooBig',
      );
    });

    it('Admin cannot buy tokens for zero address', async () => {
      const promise = saleContract
        .connect(adminWallet)
        .buyFor(ZeroAddress, parseEther('500'), 0);

      await expect(promise).revertedWithCustomError(
        saleContract,
        'ZeroAddressProvided',
      );
    });

    it('API buys tokens for a user using a deposit wallet (discount + referral)', async () => {
      const amountUsdt = parseEther('45');
      const discountPercent = 10;

      // transfer USDT to a deposit wallet
      await tetherContract
        .connect(aliceWallet)
        .transfer(randomWallet, castToTether(amountUsdt));

      // approve USDT withdrawal
      await tetherContract
        .connect(randomWallet)
        .approve(saleContract, amountUsdt);

      // buy tokens
      const promise = saleContract.connect(randomWallet).buy(
        ...(await prepareBuyData(
          randomWallet,
          aliceWallet,
          amountUsdt,
          10, // 10% discount
          bobWallet,
          10, // 10% to a referral
        )),
      );

      await expect(promise)
        .to.emit(saleContract, 'Buy')
        .withArgs(
          aliceWallet.address,
          parseEther('45'),
          calcTokenAmount(amountUsdt, 10),
          discountPercent * PERCENT_MULTIPLIER,
        );
      await expectReferralRewardEvent(
        promise,
        aliceWallet,
        bobWallet,
        parseEther('4.5'),
        parseEther('45'),
      );
      await expectChangeUsdtBalances(
        promise,
        [aliceWallet, randomWallet, treasuryWallet, saleContract],
        [0n, parseTether('-45'), parseTether('40.5'), parseTether('4.5')],
      );
    });

    it('Cannot buy tokens when paused', async () => {
      await saleContract.connect(adminWallet).pause();

      const promise = buy(aliceWallet, parseEther('1'));

      await expect(promise).to.revertedWithCustomError(
        saleContract,
        'EnforcedPause',
      );
    });

    it('Cannot purchase with a discount that exceeds 20 percent', async () => {
      const promise = buy(aliceWallet, parseEther('1'), 21);

      await expect(promise).to.revertedWithCustomError(
        saleContract,
        'DiscountPercentIsTooBig',
      );
    });

    it('Cannot purchase with a referral reward percent that exceeds 10 percent', async () => {
      const promise = buy(aliceWallet, parseEther('1'), 0, bobWallet, 11);

      await expect(promise).to.revertedWithCustomError(
        saleContract,
        'ReferralRewardPercentIsTooBig',
      );
    });
  });

  describe('Withdraw USDT', () => {
    it('User withdraws all their USDT reward', async () => {
      await buy(aliceWallet, parseEther('450'), 10, bobWallet, 10);

      const promise = withdrawUsdt(bobWallet, await getUsdtBalance(bobWallet));

      await expectChangeUsdtBalances(
        promise,
        [saleContract, bobWallet],
        [parseTether('-45'), parseTether('45')],
      );
      await expect(promise)
        .to.emit(saleContract, 'WithdrawUsdt')
        .withArgs(bobWallet.address, bobWallet.address, parseEther('45'));

      expect(await getUsdtBalance(bobWallet)).to.eq(0);
    });

    it('User withdraws USDT reward to another wallet', async () => {
      await buy(aliceWallet, parseEther('450'), 10, bobWallet, 10);

      const promise = withdrawUsdt(
        bobWallet,
        await getUsdtBalance(bobWallet),
        charlieWallet,
      );

      await expectChangeUsdtBalances(
        promise,
        [saleContract, bobWallet, charlieWallet],
        [parseTether('-45'), 0n, parseTether('45')],
      );
      await expect(promise)
        .to.emit(saleContract, 'WithdrawUsdt')
        .withArgs(bobWallet.address, charlieWallet.address, parseEther('45'));

      expect(await getUsdtBalance(bobWallet)).to.eq(0);
    });

    it('User withdraws their USDT reward several times', async () => {
      await buy(aliceWallet, parseEther('450'), 10, bobWallet, 10);

      let promise = withdrawUsdt(bobWallet, parseEther('10'));

      await expectChangeUsdtBalances(
        promise,
        [saleContract, bobWallet],
        [parseTether('-10'), parseTether('10')],
      );
      await expect(promise)
        .to.emit(saleContract, 'WithdrawUsdt')
        .withArgs(bobWallet.address, bobWallet.address, parseEther('10'));

      expect(await getUsdtBalance(bobWallet)).to.eq(parseEther('35'));

      promise = withdrawUsdt(bobWallet, parseEther('35'));

      await expectChangeUsdtBalances(
        promise,
        [saleContract, bobWallet],
        [parseTether('-35'), parseTether('35')],
      );
      await expect(promise)
        .to.emit(saleContract, 'WithdrawUsdt')
        .withArgs(bobWallet.address, bobWallet.address, parseEther('35'));

      expect(await getUsdtBalance(bobWallet)).to.eq(0);
    });

    it('Cannot withdraw more USDT than user has on their balance', async () => {
      let promise = withdrawUsdt(bobWallet, 1n);

      await expect(promise).revertedWithCustomError(
        saleContract,
        'NotEnoughUsdtOnBalance',
      );

      await buy(aliceWallet, parseEther('450'), 10, bobWallet, 10);

      promise = withdrawUsdt(bobWallet, parseEther('45') + 1n);

      await expect(promise).revertedWithCustomError(
        saleContract,
        'NotEnoughUsdtOnBalance',
      );
    });

    it('User buys tokens with a referral, then referral withdraws all USDT rewards', async () => {
      await buy(aliceWallet, 1999999999999999999n, 0, bobWallet, 1, false);
      await buy(aliceWallet, 1999999999999999999n, 0, bobWallet, 1, false);
      await buy(aliceWallet, 1999999999999999999n, 0, bobWallet, 1, false);

      // withdraw all USDT balance
      const balance = await saleContract.connect(bobWallet).getUsdtBalance();

      expect(balance).eq(59997000000000000n);

      await withdrawUsdt(bobWallet, balance);
    });

    it('Cannot withdraw USDT when paused', async () => {
      await saleContract.connect(adminWallet).pause();

      const promise = saleContract
        .connect(aliceWallet)
        .withdrawUsdt(aliceWallet.address, 1);

      await expect(promise).to.revertedWithCustomError(
        saleContract,
        'EnforcedPause',
      );
    });
  });

  describe('Edge case: last purchase', () => {
    it('Buy more tokens than still available without a discount or referral, the user should receive a partial refund', async () => {
      await buy(aliceWallet, parseEther('4500'));
      const promise = buyWithoutChecks(aliceWallet, parseEther('1000'));

      await expect(promise)
        .to.emit(saleContract, 'Buy')
        .withArgs(
          aliceWallet.address,
          parseEther('500'),
          calcTokenAmount(parseEther('500'), 0),
          0,
        );
      await expectChangeUsdtBalances(
        promise,
        [aliceWallet, treasuryWallet, saleContract],
        [parseTether('-500'), parseTether('500'), 0n],
      );

      expect(await getUsdtBalance(aliceWallet)).to.eq(0);
      expect(await getTokenBalance(aliceWallet)).to.eq(parseEther('10000'));
      expect(await saleContract.totalSoldTokens()).to.eq(totalTokensForSale);
    });

    it('Buy more tokens than still available with a referral, referral receives rewards in USDT', async () => {
      await buy(aliceWallet, parseEther('4750')); // buy 9500 tokens
      const promise = buyWithoutChecks(
        aliceWallet,
        parseEther('450'), // buy 1000 tokens
        10,
        bobWallet,
        10,
      );

      await expect(promise)
        .to.emit(saleContract, 'Buy')
        .withArgs(
          aliceWallet.address,
          parseEther('225'),
          parseEther('500'),
          10 * PERCENT_MULTIPLIER,
        );
      await expectChangeUsdtBalances(
        promise,
        [aliceWallet, treasuryWallet, saleContract],
        [parseTether('-225'), parseTether('202.5'), parseTether('22.5')],
      );

      expect(await getUsdtBalance(aliceWallet)).to.eq(0);
      expect(await getUsdtBalance(bobWallet)).to.eq(parseEther('22.5'));
      expect(await getTokenBalance(aliceWallet)).to.eq(parseEther('10000'));
      expect(await getTokenBalance(bobWallet)).to.eq(0n);
      expect(await saleContract.totalSoldTokens()).to.eq(totalTokensForSale);
    });
  });
});

// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.23;

import {Initializable} from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import {AccessControlUpgradeable} from "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import {PausableUpgradeable} from "@openzeppelin/contracts-upgradeable/utils/PausableUpgradeable.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {ECDSA} from "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import {EIP712Upgradeable} from "@openzeppelin/contracts-upgradeable/utils/cryptography/EIP712Upgradeable.sol";

contract TokenSale is
    Initializable,
    AccessControlUpgradeable,
    PausableUpgradeable,
    EIP712Upgradeable
{
    using SafeERC20 for IERC20;

    bytes32 internal constant BUY_PARAMS_TYPEHASH =
        keccak256(
            "BuyParams(address to,uint256 amountUsdt,uint256 discountPercent,address referralWallet,uint256 referralRewardPercent,address sender)"
        );
    uint256 public constant PERCENT_MULTIPLIER = 10;

    /// @dev Wallet that all incoming USDT will be transfered to.
    address internal treasuryWallet;

    /// @dev API wallet address.
    address internal apiSigner;

    /// @dev USDT contract address.
    IERC20 public usdtContract;

    /// @dev Token price in USDT. 18 decimals should be used here, though USDT has 6 decimals.
    uint public tokenPriceUsdt;

    /// @dev Total amount of tokens this contract may sell.
    uint public totalTokensForSale;

    /// @dev Sold tokens amount.
    uint public totalSoldTokens;

    /// @dev Bought tokens + referral rewards in tokens.
    mapping(address => uint) internal tokenBalances;

    /// @dev USDT referral rewards.
    mapping(address => uint) internal usdtBalances;

    event Buy(
        /// @dev Buyer's account.
        address indexed buyer,
        /// @dev USDT amount that user spent.
        uint amountUsdt,
        /// @dev Amount of tokens the user received.
        uint amount,
        /// @dev Applied discount.
        uint discountPercent
    );

    event ReferralReward(
        /// @dev Account that bought tokens.
        address indexed fromBuyer,
        /// @dev Account that received the reward.
        address indexed to,
        /// @dev Reward amount in USDT.
        uint amountUsdt,
        /// @dev The amount the user spent for purchasing tokens.
        uint spentAmountUsdt
    );

    event WithdrawUsdt(address indexed from, address indexed to, uint amount);
    event ApiSignerUpdate(address newApiSigner);
    event TokenPriceUsdtUpdate(uint newTokenPriceUsdt);

    // custom errors
    error ZeroAddressProvided(string param);
    error ZeroValueProvided(string param);

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    /**
     * @param _admin Admin wallet address.
     * @param _usdtContract USDT contract address.
     * @param _treasuryWallet Wallet that will receive all incoming USDT.
     * @param _apiSigner API signer wallet address.
     * @param _totalTokensForSale Total amount of tokens this contract may sell.
     * @param _tokenPriceUsdt USDT price for 10**18 tokens (should use 18 decimals).
     */
    function initialize(
        address _admin,
        IERC20 _usdtContract,
        address _treasuryWallet,
        address _apiSigner,
        uint _totalTokensForSale,
        uint _tokenPriceUsdt
    ) external initializer {
        __AccessControl_init();
        __Pausable_init();
        __EIP712_init("Wormfare Token Sale", "1");

        if (_admin == address(0)) {
            revert ZeroAddressProvided("_admin");
        }
        if (address(_usdtContract) == address(0)) {
            revert ZeroAddressProvided("_usdtContract");
        }
        if (_treasuryWallet == address(0)) {
            revert ZeroAddressProvided("_treasuryWallet");
        }
        if (_apiSigner == address(0)) {
            revert ZeroAddressProvided("_apiSigner");
        }
        if (_totalTokensForSale == 0) {
            revert ZeroValueProvided("_totalTokensForSale");
        }
        if (_tokenPriceUsdt == 0) {
            revert ZeroValueProvided("_tokenPriceUsdt");
        }

        _grantRole(DEFAULT_ADMIN_ROLE, _admin);

        usdtContract = _usdtContract;
        treasuryWallet = _treasuryWallet;
        apiSigner = _apiSigner;
        totalTokensForSale = _totalTokensForSale;
        tokenPriceUsdt = _tokenPriceUsdt;
    }

    /// Disable some contract functions.
    function pause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _pause();
    }

    /// Enable all contract functions.
    function unpause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _unpause();
    }

    /// Update apiSigner address.
    function setApiSigner(
        address _apiSigner
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        if (_apiSigner == address(0)) {
            revert ZeroAddressProvided("_apiSigner");
        }

        apiSigner = _apiSigner;

        emit ApiSignerUpdate(_apiSigner);
    }

    /// Update token price in USDT. 18 decimals should be used here.
    function setTokenPriceUsdt(
        uint _tokenPriceUsdt
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        if (_tokenPriceUsdt == 0) {
            revert ZeroValueProvided("_tokenPriceUsdt");
        }

        tokenPriceUsdt = _tokenPriceUsdt;

        emit TokenPriceUsdtUpdate(_tokenPriceUsdt);
    }

    /**
     * Buy tokens for someone else (admin only).
     *
     * @param _to Tokens receiver.
     * @param _amountUsdt USDT amount with 18 decimals.
     * @param _discountPercent Discount percent (multiplied by 10).
     */
    function buyFor(
        address _to,
        uint _amountUsdt,
        uint _discountPercent
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(_to != address(0), "Invalid recipient address.");
        require(
            _discountPercent <= 10 * PERCENT_MULTIPLIER,
            "Invalid discount."
        );

        internalBuy(_to, _amountUsdt, _discountPercent, address(0), 0);
    }

    /**
     * Buy tokens using USDT.
     *
     * @param _to Tokens receiver.
     * @param _amountUsdt USDT amount the user wants to spend (18 decimals).
     * @param _discountPercent Applied discount for buyer (multiplied by 10).
     * @param _referralWallet Referral wallet (or zero address).
     * @param _referralRewardPercent Percentage of bought amount the referral account should receive as a reward.
     * @param _signature API signature.
     */
    function buy(
        address _to,
        uint _amountUsdt,
        uint _discountPercent,
        address _referralWallet,
        uint _referralRewardPercent,
        bytes calldata _signature
    ) external whenNotPaused {
        checkSignature(
            _to,
            _amountUsdt,
            _discountPercent,
            _referralWallet,
            _referralRewardPercent,
            _signature
        );

        internalBuy(
            _to,
            _amountUsdt,
            _discountPercent,
            _referralWallet,
            _referralRewardPercent
        );
    }

    /**
     * @param _to Tokens receiver.
     * @param _amountUsdt USDT amount with 18 decimals.
     * @param _discountPercent Discount percent (multiplied by 10).
     * @param _referralWallet Referral wallet (or zero address).
     * @param _referralRewardPercent Percentage of bought amount the referral account should receive as a reward (multiplied by 10).
     */
    function internalBuy(
        address _to,
        uint _amountUsdt,
        uint _discountPercent,
        address _referralWallet,
        uint _referralRewardPercent
    ) internal {
        require(_amountUsdt > 0, "USDT amount is 0.");
        require(
            usdtContract.allowance(msg.sender, address(this)) >=
                castToTether(_amountUsdt),
            "Not enough USDT allowance."
        );
        require(totalSoldTokens < totalTokensForSale, "Sold out.");

        _amountUsdt = normalizeTether(_amountUsdt);
        uint _tokenPriceUsdt = tokenPriceUsdt -
            ((tokenPriceUsdt * _discountPercent) / 100 / PERCENT_MULTIPLIER);
        uint _tokenAmount = ((_amountUsdt * 1 ether) / _tokenPriceUsdt);

        // if the amount user wants to buy exceeds the limit, sell as much as possible to the user
        // and refund the rest later.
        if (totalSoldTokens + _tokenAmount > totalTokensForSale) {
            uint _redundantTokens = totalSoldTokens +
                _tokenAmount -
                totalTokensForSale;
            _tokenAmount -= _redundantTokens;
            _amountUsdt = getUsdtPrice(_tokenAmount, _tokenPriceUsdt);
        }

        uint _treasuryWalletAmountUsdt = _amountUsdt;
        uint _referralAmountUsdt = calculateReferralReward(
            _amountUsdt,
            _referralWallet,
            _referralRewardPercent
        );

        tokenBalances[_to] += _tokenAmount;
        totalSoldTokens += _tokenAmount;

        // transfer USDT referral reward to this contract
        if (_referralAmountUsdt > 0) {
            _treasuryWalletAmountUsdt -= _referralAmountUsdt;

            usdtContract.safeTransferFrom(
                msg.sender,
                address(this),
                castToTether(_referralAmountUsdt)
            );

            emit ReferralReward(
                _to,
                _referralWallet,
                _referralAmountUsdt,
                _amountUsdt
            );
        }

        // transfer USDT to the treasury wallet
        usdtContract.safeTransferFrom(
            msg.sender,
            treasuryWallet,
            castToTether(_treasuryWalletAmountUsdt)
        );

        emit Buy(_to, _amountUsdt, _tokenAmount, _discountPercent);
    }

    /// @dev Check signature for the buy() function call.
    function checkSignature(
        address _to,
        uint _amountUsdt,
        uint _discountPercent,
        address _referralWallet,
        uint _referralRewardPercent,
        bytes calldata _signature
    ) internal view {
        bytes32 _digest = _hashTypedDataV4(
            keccak256(
                abi.encode(
                    BUY_PARAMS_TYPEHASH,
                    _to,
                    _amountUsdt,
                    _discountPercent,
                    _referralWallet,
                    _referralRewardPercent,
                    msg.sender
                )
            )
        );

        require(
            ECDSA.recover(_digest, _signature) == apiSigner,
            "Invalid signature."
        );
    }

    /**
     * Calculate the USDT amount (with 18 decimals) that should be kept on this contract as a referral reward.
     *
     * @param _amountUsdt Purchase amount in USDT with 18 decimals.
     * @param _referralWallet Referral wallet address.
     * @param _referralRewardPercent Percentage of the purchase amount the referral wallet should receive (multiplied by 10).
     * @return The USDT amount (with 18 decimals) that should be sent to this contract as a referral reward.
     */
    function calculateReferralReward(
        uint _amountUsdt,
        address _referralWallet,
        uint _referralRewardPercent
    ) internal returns (uint) {
        if (_referralWallet == address(0)) {
            return 0;
        }

        uint _referralUsdtAmount = normalizeTether(
            (_amountUsdt * _referralRewardPercent) / 100 / PERCENT_MULTIPLIER
        );
        usdtBalances[_referralWallet] += _referralUsdtAmount;

        return _referralUsdtAmount;
    }

    /**
     * Withdraw USDT rewards.
     *
     * @param _to Receiver address.
     * @param _amount USDT amount to withdraw. Should be 18 decimals here.
     */
    function withdrawUsdt(address _to, uint _amount) external whenNotPaused {
        require(
            usdtBalances[msg.sender] >= _amount,
            "Not enough USDT on balance."
        );

        usdtBalances[msg.sender] -= _amount;
        usdtContract.safeTransfer(_to, castToTether(_amount));

        emit WithdrawUsdt(msg.sender, _to, _amount);
    }

    /// Returns sender's token balance.
    function getTokenBalance() external view returns (uint) {
        return tokenBalances[msg.sender];
    }

    /// Returns sender's USDT balance. Return value uses 18 decimals.
    function getUsdtBalance() external view returns (uint) {
        return usdtBalances[msg.sender];
    }

    /**
     * Get token price in USDT. The return value uses 18 decimals.
     *
     * @param _amount Tokens amount.
     */
    function getUsdtPrice(
        uint _amount,
        uint _tokenPriceUsdt
    ) internal pure returns (uint) {
        return (_amount * _tokenPriceUsdt) / 1 ether;
    }

    /**
     * Set all decimal digits after 6-th to 0 in a number with 18 decimals.
     *
     * @param _amount Tether amount with 18 decimals.
     */
    function normalizeTether(uint _amount) internal pure returns (uint) {
        return castToTether(_amount) * 10 ** 12;
    }

    /**
     * Cast 18-decimal number to a 6-decimal number.
     *
     * @param _amount Tether amount with 18 decimals.
     */
    function castToTether(uint _amount) internal pure returns (uint) {
        return _amount / (10 ** 12);
    }
}

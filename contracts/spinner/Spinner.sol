pragma solidity ^0.8.20;

import {ERC1155Upgradeable} from "@openzeppelin/contracts-upgradeable/token/ERC1155/ERC1155Upgradeable.sol";
import {AccessControlUpgradeable} from "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import {ERC1155PausableUpgradeable} from "@openzeppelin/contracts-upgradeable/token/ERC1155/extensions/ERC1155PausableUpgradeable.sol";
import {ERC1155SupplyUpgradeable} from "@openzeppelin/contracts-upgradeable/token/ERC1155/extensions/ERC1155SupplyUpgradeable.sol";
import {Initializable} from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import {ECDSA} from "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {EIP712Upgradeable} from "@openzeppelin/contracts-upgradeable/utils/cryptography/EIP712Upgradeable.sol";
import {ERC1155BurnableUpgradeable} from "@openzeppelin/contracts-upgradeable/token/ERC1155/extensions/ERC1155BurnableUpgradeable.sol";

contract Spinner is 
    Initializable, 
    ERC1155Upgradeable, 
    AccessControlUpgradeable, 
    ERC1155PausableUpgradeable, 
    ERC1155BurnableUpgradeable,
    ERC1155SupplyUpgradeable, 
    EIP712Upgradeable 
{
    using SafeERC20 for IERC20;

    /// @dev Token IDs
    uint public constant WOFR = 0;
    uint public constant USDT = 1;
    uint public constant BOND = 2;
    uint public constant VOUCHER = 3;

    bytes32 public constant URI_SETTER_ROLE = keccak256("URI_SETTER_ROLE");
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");

    bytes32 internal constant CLAIM_PARAMS_TYPEHASH =
        keccak256(
            "ClaimParams(address to,uint256 tokenId,uint256 amount,uint256 nonce,address sender)"
        );

    /// @dev API wallet address.
    address internal apiSigner;

    /// @dev USDT contract address.
    IERC20 public usdtContract;

    /// @dev The price of a single spin in USDT
    uint public spinPriceUsdt;

    /// @dev The maximum amount of spins a user can buy per day.
    uint public maxSpinsPerDay = 10;

    /// @dev Wallet that all incoming USDT will be transfered to.
    address internal treasuryWallet;

    struct PurchaseInfo {
        uint total;
        uint perDay;
        uint lastTime;
    }

    /// @dev User's purchase info.
    mapping(address => PurchaseInfo) public purchaseInfo;

    /// @dev Track nonces for each user to prevent signature reuse.
    mapping(address => uint) public nonces;

    event BuySpins(
        /// @dev Buyer's account.
        address indexed buyer,
        /// @dev USDT amount that user spent.
        uint amountUsdt,
        /// @dev Amount of spins the user received.
        uint amount
    );
    event MaxSpinsPerDayUpdate(uint newMaxSpinsPerDay);
    event SpinPriceUsdtUpdate(uint newSpinPriceUsdt);
    event ApiSignerUpdate(address newApiSigner);
    event ClaimReward(
        address indexed claimer,
        uint tokenId,
        uint amount
    );

    // custom errors
    error ZeroAddressProvided(string param);
    error ZeroValueProvided(string param);
    error ZeroOrNegativeValueProvided(string param);
    error NotEnoughUsdtAllowance();
    error InvalidSignature();
    error NotEnoughUsdtOnBalance();
    error InvalidTokenId(string param);
    error PurchaseLimitExceeded(string param);
    error SoulboundTransferFailed();

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    /**
        * @dev Initialize the contract.
        * @param _admin The admin address.
        * @param _usdtContract The USDT contract address.
        * @param _spinPriceUsdt The price of a single spin in USDT.
        * @param _maxSpinsPerDay The maximum amount of spins a user can buy per day.
        * @param _treasuryWallet The wallet that all incoming USDT will be transfered to.
        * @param _apiSigner The API wallet address.
     */
    function initialize(
        address _admin,
        IERC20 _usdtContract, 
        address _treasuryWallet, 
        address _apiSigner,
        uint _spinPriceUsdt, 
        uint _maxSpinsPerDay
    ) external initializer {
        __ERC1155_init("");
        __AccessControl_init();
        __ERC1155Pausable_init();
        __ERC1155Burnable_init();
        __ERC1155Supply_init();
        __EIP712_init("Wormfare Spinner", "1");

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

        _grantRole(DEFAULT_ADMIN_ROLE, _admin);
        _grantRole(PAUSER_ROLE, _admin);
        _grantRole(MINTER_ROLE, _admin);
        _grantRole(URI_SETTER_ROLE, _admin);

        usdtContract = _usdtContract;
        spinPriceUsdt = _spinPriceUsdt;
        treasuryWallet = _treasuryWallet;
        apiSigner = _apiSigner;
        maxSpinsPerDay = _maxSpinsPerDay;
    }

    function setURI(string memory newuri) public onlyRole(URI_SETTER_ROLE) {
        _setURI(newuri);
    }

    function pause() public onlyRole(PAUSER_ROLE) {
        _pause();
    }

    function unpause() public onlyRole(PAUSER_ROLE) {
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

    /// Update spin price in USDT.
    function setSpinPriceUsdt(
        uint _spinPriceUsdt
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        if (_spinPriceUsdt == 0) {
            revert ZeroValueProvided("_spinPriceUsdt");
        }

        spinPriceUsdt = _spinPriceUsdt;

        emit SpinPriceUsdtUpdate(_spinPriceUsdt);
    }

    /// Update max spins per day.
    function setMaxSpinsPerDay(
        uint _maxSpinsPerDay
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        if (_maxSpinsPerDay == 0) {
            revert ZeroValueProvided("_maxSpinsPerDay");
        }

        maxSpinsPerDay = _maxSpinsPerDay;

        emit MaxSpinsPerDayUpdate(_maxSpinsPerDay);
    }

    /**
     * @dev Claim tokens.
     * @param _to The account to claim tokens to.
     * @param _tokenId The token ID to claim.
     * @param _amount The amount of tokens to claim.
     * @param _signature The signature to verify the claim.
     * @notice The signature must be signed by the API wallet.
     */
    function claim(
        address _to, 
        uint _tokenId, 
        uint _amount, 
        bytes calldata _signature
    ) external whenNotPaused {
        checkSignature(
            _to,
            _tokenId,
            _amount,
            _signature
        );

        _claim(_to, _tokenId, _amount);
    }

    function _claim(
        address _to, 
        uint _tokenId, 
        uint _amount
    ) internal {
        if (_amount <= 0) {
            revert ZeroOrNegativeValueProvided("_amount");
        }
        if (_tokenId < 0 || _tokenId > 3) {
            revert InvalidTokenId("_tokenId");
        }

        if (_tokenId == USDT) {
            uint _amountUsdt = _amount * (10**6);
            usdtContract.safeTransfer(_to, _amountUsdt);
        }

        _mint(_to, _tokenId, _amount, "0x");

        emit ClaimReward(_to, _tokenId, _amount);
    }

    /**
     * @dev Buy spins with USDT.
     * @param _amountSpins The amount of spins to buy.
     * @notice The user must have enough USDT on their balance and have allowed the contract to spend the required amount.
     */
    function buySpins(uint _amountSpins) external whenNotPaused {
        if (_amountSpins > maxSpinsPerDay) {
            revert PurchaseLimitExceeded("maxSpinsPerDay");
        }
        if (!canBuySpins(msg.sender)) {
            revert PurchaseLimitExceeded("maxSpinsPerDay");
        }
        if (_amountSpins <= 0) {
            revert ZeroOrNegativeValueProvided("_amountSpins");
        }

        uint _amountUsdt = _amountSpins * spinPriceUsdt;

        if (
            usdtContract.allowance(msg.sender, address(this)) < 
            _amountUsdt
        ) {
            revert NotEnoughUsdtAllowance();
        }
        if (usdtContract.balanceOf(msg.sender) < _amountUsdt) {
            revert NotEnoughUsdtOnBalance();
        }

        if (block.timestamp - purchaseInfo[msg.sender].lastTime >= 1 days) {
            // Reset the purchase count if a day has passed
            purchaseInfo[msg.sender].perDay = 0;
        }

        purchaseInfo[msg.sender].perDay += _amountSpins;
        purchaseInfo[msg.sender].total += _amountSpins;
        purchaseInfo[msg.sender].lastTime = block.timestamp;

        // transfer USDT to the treasury wallet
        usdtContract.safeTransferFrom(
            msg.sender,
            treasuryWallet,
           _amountUsdt
        );

        emit BuySpins(msg.sender, _amountUsdt, _amountSpins);
    }

    /// @dev Check signature for the claim() function call.
    function checkSignature(
        address _to,
        uint _id,
        uint _amount,
        bytes calldata _signature
    ) internal {
        uint nonce = nonces[_to]; // 0 by default
        bytes32 _digest = _hashTypedDataV4(
            keccak256(
                abi.encode(
                    CLAIM_PARAMS_TYPEHASH,
                    _to,
                    _id,
                    _amount,
                    nonce,
                    msg.sender
                )
            )
        );

        if (ECDSA.recover(_digest, _signature) != apiSigner) {
            revert InvalidSignature();
        }

        nonces[_to] += 1;
    }

    function canBuySpins(address buyer) public view returns (bool) {
        if (purchaseInfo[buyer].perDay >= maxSpinsPerDay) {
            return false;
        }

        return true;
    }

    function getAvailableSpinsForPurchase(address buyer) public view returns (uint) {
        PurchaseInfo memory _purchaseInfo = purchaseInfo[buyer];

        if (block.timestamp - _purchaseInfo.lastTime >= 1 days) {
            return maxSpinsPerDay;
        }

        return maxSpinsPerDay - _purchaseInfo.perDay;
    }

    function getBoughtSpinsToday(address buyer) public view returns (uint) {
        if (block.timestamp - purchaseInfo[buyer].lastTime >= 1 days) {
            return 0;
        }

        return purchaseInfo[buyer].perDay;
    }

    function getTotalBoughtSpins(address buyer) public view returns (uint) {
        return purchaseInfo[buyer].total;
    }

    function getNonce(address _address) public view returns (uint) {
        return nonces[_address];
    }

    function burn(address account, uint256 id, uint256 value) public override onlyRole(DEFAULT_ADMIN_ROLE)  {
        super.burn(account, id, value);
    }

    function burnBatch(address account, uint256[] memory ids, uint256[] memory values) public override onlyRole(DEFAULT_ADMIN_ROLE) {
        super.burnBatch(account, ids, values);
    }


    // The following functions are overrides required by Solidity.
    function _update(address from, address to, uint[] memory ids, uint[] memory values)
        internal
        override(ERC1155Upgradeable, ERC1155PausableUpgradeable, ERC1155SupplyUpgradeable)
    {
        if (from != address(0) && to != address(0)) {
            revert SoulboundTransferFailed();
        }
        
        super._update(from, to, ids, values);
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC1155Upgradeable, AccessControlUpgradeable)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}

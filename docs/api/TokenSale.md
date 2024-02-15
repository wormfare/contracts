# TokenSale

## Functions

### constructor

```solidity
function constructor() public
```

### initialize

```solidity
function initialize(
    address _admin,
    contract IERC20 _usdtContract,
    address _treasuryWallet,
    address _apiSigner,
    uint256 _totalTokensForSale,
    uint256 _tokenPriceUsdt
) public
```

#### Parameters

| Name | Type | Description |
| :--- | :--- | :---------- |
| `_admin` | address | Admin wallet address. |
| `_usdtContract` | contract IERC20 | USDT contract address. |
| `_treasuryWallet` | address | Wallet that will receive all incoming USDT. |
| `_apiSigner` | address | API signer wallet address. |
| `_totalTokensForSale` | uint256 | Total amount of tokens this contract may sell. |
| `_tokenPriceUsdt` | uint256 | USDT price for 10**18 tokens (should use 18 decimals). |

### pause

```solidity
function pause() external
```

Disable some contract functions.

### unpause

```solidity
function unpause() external
```

Enable all contract functions.

### setApiSigner

```solidity
function setApiSigner(
    address _apiSigner
) external
```

Update apiSigner address.

#### Parameters

| Name | Type | Description |
| :--- | :--- | :---------- |
| `_apiSigner` | address |  |

### setTokenPriceUsdt

```solidity
function setTokenPriceUsdt(
    uint256 _tokenPriceUsdt
) external
```

Update token price in USDT. 18 decimals should be used here.

#### Parameters

| Name | Type | Description |
| :--- | :--- | :---------- |
| `_tokenPriceUsdt` | uint256 |  |

### buyFor

```solidity
function buyFor(
    address _to,
    uint256 _amountUsdt,
    uint256 _discountPercent
) external
```

Buy tokens for someone else (admin only).

#### Parameters

| Name | Type | Description |
| :--- | :--- | :---------- |
| `_to` | address | Tokens receiver. |
| `_amountUsdt` | uint256 | USDT amount. |
| `_discountPercent` | uint256 | Discount percent (multiplied by 10). |

### buy

```solidity
function buy(
    address _to,
    uint256 _amountUsdt,
    uint256 _discountPercent,
    address _referralWallet,
    uint256 _referralRewardPercent,
    bytes _signature
) external
```

Buy tokens using USDT.

#### Parameters

| Name | Type | Description |
| :--- | :--- | :---------- |
| `_to` | address | Tokens receiver. |
| `_amountUsdt` | uint256 | USDT amount the user wants to spend. |
| `_discountPercent` | uint256 | Applied discount for buyer (multiplied by 10). |
| `_referralWallet` | address | Referral wallet (or zero address). |
| `_referralRewardPercent` | uint256 | Percentage of bought amount the referral account should receive as a reward. |
| `_signature` | bytes | API signature. |

### internalBuy

```solidity
function internalBuy(
    address _to,
    uint256 _amountUsdt,
    uint256 _discountPercent,
    address _referralWallet,
    uint256 _referralRewardPercent
) internal
```

#### Parameters

| Name | Type | Description |
| :--- | :--- | :---------- |
| `_to` | address | Tokens receiver. |
| `_amountUsdt` | uint256 | USDT amount. |
| `_discountPercent` | uint256 | Discount percent (multiplied by 10). |
| `_referralWallet` | address | Referral wallet (or zero address). |
| `_referralRewardPercent` | uint256 | Percentage of bought amount the referral account should receive as a reward (multiplied by 10). |

### checkSignature

```solidity
function checkSignature(
    address _to,
    uint256 _amountUsdt,
    uint256 _discountPercent,
    address _referralWallet,
    uint256 _referralRewardPercent,
    bytes _signature
) internal
```

Check signature for the buy() function call.

#### Parameters

| Name | Type | Description |
| :--- | :--- | :---------- |
| `_to` | address |  |
| `_amountUsdt` | uint256 |  |
| `_discountPercent` | uint256 |  |
| `_referralWallet` | address |  |
| `_referralRewardPercent` | uint256 |  |
| `_signature` | bytes |  |

### buyWithReferral

```solidity
function buyWithReferral(
    address _buyer,
    uint256 _amountUsdt,
    address _referralWallet,
    uint256 _referralRewardPercent
) internal returns (uint256)
```

Distribute referral rewards from the purchase.
May modify purchased amount of tokens and the USDT amount that should be sent to the treasury.

#### Parameters

| Name | Type | Description |
| :--- | :--- | :---------- |
| `_buyer` | address | Tokens buyer wallet. |
| `_amountUsdt` | uint256 | Purchase amount in USDT. |
| `_referralWallet` | address | Referral wallet address. |
| `_referralRewardPercent` | uint256 | Percentage of the purchase amount the referral wallet should receive (multiplied by 10). |

#### Return Values

| Name | Type | Description |
| :--- | :--- | :---------- |
| `[0]` | uint256 | USDT amount that should be sent to the treasury (with 18 decimals). |
### withdrawUsdt

```solidity
function withdrawUsdt(
    address _to,
    uint256 _amount
) external
```

Withdraw USDT rewards.

#### Parameters

| Name | Type | Description |
| :--- | :--- | :---------- |
| `_to` | address | Receiver address. |
| `_amount` | uint256 | USDT amount to withdraw. Should be 18 decimals here. |

### getTokenBalance

```solidity
function getTokenBalance() external returns (uint256)
```

Returns sender's token balance.

### getUsdtBalance

```solidity
function getUsdtBalance() external returns (uint256)
```

Returns sender's USDT balance. Return value uses 18 decimals.

### getUsdtPrice

```solidity
function getUsdtPrice(
    uint256 _amount,
    uint256 _tokenPriceUsdt
) internal returns (uint256)
```

Get token price in USDT. The return value uses 18 decimals.

#### Parameters

| Name | Type | Description |
| :--- | :--- | :---------- |
| `_amount` | uint256 | Tokens amount. |
| `_tokenPriceUsdt` | uint256 |  |

### normalizeTether

```solidity
function normalizeTether(
    uint256 _amount
) internal returns (uint256)
```

Set all decimal digits after 6-th to 0 in a number with 18 decimals.

#### Parameters

| Name | Type | Description |
| :--- | :--- | :---------- |
| `_amount` | uint256 | Tether amount with 18 decimals. |

### castToTether

```solidity
function castToTether(
    uint256 _amount
) internal returns (uint256)
```

Cast 18-decimal number to a 6-decimal number.

#### Parameters

| Name | Type | Description |
| :--- | :--- | :---------- |
| `_amount` | uint256 | Tether amount with 18 decimals. |

## Events

### Buy

```solidity
event Buy(
    address buyer,
    uint256 amountUsdt,
    uint256 amount,
    uint256 discountPercent
)
```

#### Parameters

| Name | Type | Description |
| :--- | :--- | :---------- |
| `buyer` | address |  |
| `amountUsdt` | uint256 |  |
| `amount` | uint256 |  |
| `discountPercent` | uint256 |  |
### ReferralReward

```solidity
event ReferralReward(
    address fromBuyer,
    address to,
    uint256 amountUsdt,
    uint256 spentAmountUsdt
)
```

#### Parameters

| Name | Type | Description |
| :--- | :--- | :---------- |
| `fromBuyer` | address |  |
| `to` | address |  |
| `amountUsdt` | uint256 |  |
| `spentAmountUsdt` | uint256 |  |
### WithdrawUsdt

```solidity
event WithdrawUsdt(
    address from,
    address to,
    uint256 amount
)
```

#### Parameters

| Name | Type | Description |
| :--- | :--- | :---------- |
| `from` | address |  |
| `to` | address |  |
| `amount` | uint256 |  |


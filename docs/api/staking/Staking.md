# Staking

## Functions

### initialize

```solidity
function initialize(
    address _admin,
    contract IERC677 _token,
    contract TokenPriceFeed _tokenPriceFeed,
    contract RewardPool _rewardPool,
    address _signer
) public
```

#### Parameters

| Name | Type | Description |
| :--- | :--- | :---------- |
| `_admin` | address |  |
| `_token` | contract IERC677 |  |
| `_tokenPriceFeed` | contract TokenPriceFeed |  |
| `_rewardPool` | contract RewardPool |  |
| `_signer` | address |  |

### pause

```solidity
function pause() public
```

Disable some contract functions.

### unpause

```solidity
function unpause() public
```

Enable all contract functions.

### setSigner

```solidity
function setSigner(
    address _signer
) external
```

Set backend signer address for signatures verification.

#### Parameters

| Name | Type | Description |
| :--- | :--- | :---------- |
| `_signer` | address | Signer address. |

### setUnstakeLockPeriodSeconds

```solidity
function setUnstakeLockPeriodSeconds(
    uint256 _value
) external
```

#### Parameters

| Name | Type | Description |
| :--- | :--- | :---------- |
| `_value` | uint256 | Unstake lock period in seconds. |

### updateStakingTier

```solidity
function updateStakingTier(
    uint256 _tier,
    uint256 _minStakeUsdt,
    uint256 _maxStakeUsdt,
    uint256 _lockPeriodDays,
    uint256 _apyPercent
) external
```

Add/update a staking tier.

#### Parameters

| Name | Type | Description |
| :--- | :--- | :---------- |
| `_tier` | uint256 | Staking tier number. |
| `_minStakeUsdt` | uint256 | Min stake in USDT (NOT in Wei). |
| `_maxStakeUsdt` | uint256 | Min stake in USDT (NOT in Wei). |
| `_lockPeriodDays` | uint256 | Lock period in days. |
| `_apyPercent` | uint256 | APY percentage. |

### onTokenTransfer

```solidity
function onTokenTransfer(
    address _sender,
    uint256 _amount,
    bytes _data
) external
```

#### Parameters

| Name | Type | Description |
| :--- | :--- | :---------- |
| `_sender` | address | Sender wallet address. |
| `_amount` | uint256 | Received token amount. |
| `_data` | bytes | Encoded custom data. |

### upgradeTier

```solidity
function upgradeTier() external
```

Restake existing tokens to the next staking tier without increasing the stake amount.
Redundant tokens will be unstaked and locked if the next tier limits the amount.

### restake

```solidity
function restake(
    uint256 _amount
) external
```

Restake unstaked tokens.

#### Parameters

| Name | Type | Description |
| :--- | :--- | :---------- |
| `_amount` | uint256 |  |

### stake

```solidity
function stake(
    address _staker,
    uint256 _tier,
    uint256 _amount,
    bool _isRestake
) internal
```

#### Parameters

| Name | Type | Description |
| :--- | :--- | :---------- |
| `_staker` | address | Account that the tokens will be staked to. |
| `_tier` | uint256 | Staking tier. Cannot exceed user's current max tier. |
| `_amount` | uint256 | Received tokens amount. |
| `_isRestake` | bool | Whether this is a restake of the unstaked tokens. |

### unstake

```solidity
function unstake(
    uint256 _amount
) external
```

Unstake tokens. Unstaked tokens get locked for a certain period of time.

#### Parameters

| Name | Type | Description |
| :--- | :--- | :---------- |
| `_amount` | uint256 | Tokens amount. |

### updateMaxStakingTierIfPossible

```solidity
function updateMaxStakingTierIfPossible(
    address _staker
) internal
```

Update user's max staking tier if the staking conditions are met.

#### Parameters

| Name | Type | Description |
| :--- | :--- | :---------- |
| `_staker` | address |  |

### withdraw

```solidity
function withdraw() external
```

Withdraw all unstaked tokens.

### claimReward

```solidity
function claimReward(
    bytes _data
) external
```

Claim the accumulated reward.

The reward amount, nonce and signature are calculated by the backend.

#### Parameters

| Name | Type | Description |
| :--- | :--- | :---------- |
| `_data` | bytes | Encoded data received from the backend. |

### getStakeInfo

```solidity
function getStakeInfo() external returns (struct Staking.StakeData)
```

Returns caller's stake info.

### getMaxStakingTier

```solidity
function getMaxStakingTier() external returns (uint256)
```

Returns caller's max allowed staking tier number.

### isNextStakingTierAvailable

```solidity
function isNextStakingTierAvailable(
    address _staker,
    struct Staking.StakeData _stakeData
) internal returns (bool)
```

Check whether the next staking tier is already unlocked for the user

#### Parameters

| Name | Type | Description |
| :--- | :--- | :---------- |
| `_staker` | address |  |
| `_stakeData` | struct Staking.StakeData |  |

## Events

### Stake

```solidity
event Stake(
    address account,
    uint256 tier,
    uint256 amount,
    uint256 totalAmount,
    uint256 amountUsdt,
    uint256 lockPeriodDays,
    uint256 apyPercent
)
```

#### Parameters

| Name | Type | Description |
| :--- | :--- | :---------- |
| `account` | address |  |
| `tier` | uint256 |  |
| `amount` | uint256 |  |
| `totalAmount` | uint256 |  |
| `amountUsdt` | uint256 |  |
| `lockPeriodDays` | uint256 |  |
| `apyPercent` | uint256 |  |
### Unstake

```solidity
event Unstake(
    address account,
    uint256 tier,
    uint256 amount
)
```

#### Parameters

| Name | Type | Description |
| :--- | :--- | :---------- |
| `account` | address |  |
| `tier` | uint256 |  |
| `amount` | uint256 |  |
### ClaimReward

```solidity
event ClaimReward(
    address account,
    uint256 amount,
    uint256 totalClaimedAmount
)
```

#### Parameters

| Name | Type | Description |
| :--- | :--- | :---------- |
| `account` | address |  |
| `amount` | uint256 |  |
| `totalClaimedAmount` | uint256 |  |


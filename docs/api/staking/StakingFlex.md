# StakingFlex

## Functions

### initialize

```solidity
function initialize(
    address _admin,
    contract IERC677 _token,
    contract TokenPriceFeed _tokenPriceFeed,
    contract RewardPool _rewardPool
) public
```

#### Parameters

| Name | Type | Description |
| :--- | :--- | :---------- |
| `_admin` | address |  |
| `_token` | contract IERC677 |  |
| `_tokenPriceFeed` | contract TokenPriceFeed |  |
| `_rewardPool` | contract RewardPool |  |

### setMaxStakeAmount

```solidity
function setMaxStakeAmount(
    uint256 _maxStakeAmount
) external
```

Update the max tokens amount users may stake.

#### Parameters

| Name | Type | Description |
| :--- | :--- | :---------- |
| `_maxStakeAmount` | uint256 |  |

### updateStakingTier

```solidity
function updateStakingTier(
    uint256 _periodMonths,
    uint256 _apyPercent,
    uint256 _prematureUnstakePenaltyPercent
) external
```

Add/update a staking tier.

#### Parameters

| Name | Type | Description |
| :--- | :--- | :---------- |
| `_periodMonths` | uint256 |  |
| `_apyPercent` | uint256 |  |
| `_prematureUnstakePenaltyPercent` | uint256 |  |

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

### stake

```solidity
function stake(
    address _staker,
    uint256 _periodMonths,
    uint256 _amount
) internal
```

#### Parameters

| Name | Type | Description |
| :--- | :--- | :---------- |
| `_staker` | address | Account that the tokens will be staked to. |
| `_periodMonths` | uint256 | Staking period in months. |
| `_amount` | uint256 | Token amount. |

### updateEarnedReward

```solidity
function updateEarnedReward(
    struct StakingFlex.StakeData _stakeData,
    uint256 _penaltyPercent
) internal
```

WARNING:
_stakeData.amount, _stakeData.apyPercent and _stakeData.lastUpdateTimestamp must be set before calling this function.

#### Parameters

| Name | Type | Description |
| :--- | :--- | :---------- |
| `_stakeData` | struct StakingFlex.StakeData | StakeData struct which will be updated. |
| `_penaltyPercent` | uint256 | Should be passed if user unstakes early. |

### getStakeInfoForStaker

```solidity
function getStakeInfoForStaker(
    address _staker,
    uint256 _periodMonths
) internal returns (struct StakingFlex.StakeData)
```

Returns stake info for the given staker and period.

#### Parameters

| Name | Type | Description |
| :--- | :--- | :---------- |
| `_staker` | address |  |
| `_periodMonths` | uint256 | Staking period in months. |

### getStakeInfo

```solidity
function getStakeInfo(
    uint256 _periodMonths
) external returns (struct StakingFlex.StakeData)
```

Returns caller's stake info for the given period.

#### Parameters

| Name | Type | Description |
| :--- | :--- | :---------- |
| `_periodMonths` | uint256 | Staking period in months. |

### unstakeAndClaimReward

```solidity
function unstakeAndClaimReward(
    uint256 _periodMonths
) external
```

Claim the reward from a finished stake.

#### Parameters

| Name | Type | Description |
| :--- | :--- | :---------- |
| `_periodMonths` | uint256 | Staking period in months. |

### unstake

```solidity
function unstake(
    uint256 _periodMonths,
    uint256 _amount
) public
```

#### Parameters

| Name | Type | Description |
| :--- | :--- | :---------- |
| `_periodMonths` | uint256 | Staking period in months. |
| `_amount` | uint256 | Token amount. |

## Events

### Stake

```solidity
event Stake(
    address account,
    uint256 periodMonths,
    uint256 amount,
    uint256 amountUsdt,
    uint256 totalAmount,
    uint256 totalAmountUsdt,
    uint256 apyPercent
)
```

#### Parameters

| Name | Type | Description |
| :--- | :--- | :---------- |
| `account` | address |  |
| `periodMonths` | uint256 |  |
| `amount` | uint256 |  |
| `amountUsdt` | uint256 |  |
| `totalAmount` | uint256 |  |
| `totalAmountUsdt` | uint256 |  |
| `apyPercent` | uint256 |  |
### Unstake

```solidity
event Unstake(
    address account,
    uint256 periodMonths,
    uint256 amount,
    uint256 rewardAmount
)
```

#### Parameters

| Name | Type | Description |
| :--- | :--- | :---------- |
| `account` | address |  |
| `periodMonths` | uint256 |  |
| `amount` | uint256 |  |
| `rewardAmount` | uint256 |  |


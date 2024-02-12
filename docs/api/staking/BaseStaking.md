# BaseStaking

## Functions

### constructor

```solidity
function constructor() internal
```

### __BaseStaking_init

```solidity
function __BaseStaking_init(
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

### getTokenPriceInUsdt

```solidity
function getTokenPriceInUsdt(
    uint256 _amount
) internal returns (uint256)
```

Returns USDT price for the given amount of tokens.

#### Parameters

| Name | Type | Description |
| :--- | :--- | :---------- |
| `_amount` | uint256 |  |

### getEarnedReward

```solidity
function getEarnedReward(
    uint256 _amount,
    uint256 _apyPercent,
    uint256 _startTimestamp,
    uint256 _endTimestamp
) internal returns (uint256)
```

Returns earned tokens for the given stake amount till the current moment or the _endTimestamp.

#### Parameters

| Name | Type | Description |
| :--- | :--- | :---------- |
| `_amount` | uint256 | Total staked amount. |
| `_apyPercent` | uint256 | APY percent per year. |
| `_startTimestamp` | uint256 | Staking start timestamp (lastUpdateTimestamp should be used). |
| `_endTimestamp` | uint256 | Staking end timestamp. |


# VestingFactory

## Functions

### constructor

```solidity
function constructor() public
```

### initialize

```solidity
function initialize(
    address _admin,
    address _operator,
    contract IERC677 _token
) public
```

#### Parameters

| Name | Type | Description |
| :--- | :--- | :---------- |
| `_admin` | address |  |
| `_operator` | address |  |
| `_token` | contract IERC677 |  |

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
| `_data` | bytes | Encoded custom data. Shape: [address _wallet, uint _lockPeriodDays, uint _vestingDurationDays] |

### deploy

```solidity
function deploy(
    address _wallet,
    uint256 _amount,
    uint256 _startTimestamp,
    uint256 _endTimestamp
) internal
```

Deploy the vesting contract and transfer given amount of tokens to it.

#### Parameters

| Name | Type | Description |
| :--- | :--- | :---------- |
| `_wallet` | address | Wallet address that the vesting contract will be deployed for. |
| `_amount` | uint256 | Amount of tokens that will be transferred to the vesting contract. |
| `_startTimestamp` | uint256 | Vesting start timestamp. |
| `_endTimestamp` | uint256 | Vesting end timestamp. |

### getVestingContractAddress

```solidity
function getVestingContractAddress(
    address _wallet
) external returns (address)
```

Returns deployed vesting contract address for the given account. If not exists, returns zero address.

#### Parameters

| Name | Type | Description |
| :--- | :--- | :---------- |
| `_wallet` | address | Target account. |

## Events

### Deploy

```solidity
event Deploy(
    address account,
    address vestingContractAddress,
    uint256 amount,
    uint256 startTimestamp,
    uint256 endTimestamp
)
```

#### Parameters

| Name | Type | Description |
| :--- | :--- | :---------- |
| `account` | address |  |
| `vestingContractAddress` | address |  |
| `amount` | uint256 |  |
| `startTimestamp` | uint256 |  |
| `endTimestamp` | uint256 |  |


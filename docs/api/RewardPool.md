# RewardPool

## Functions

### constructor

```solidity
function constructor() public
```

### initialize

```solidity
function initialize(
    address _admin,
    contract IERC677 _token
) public
```

#### Parameters

| Name | Type | Description |
| :--- | :--- | :---------- |
| `_admin` | address |  |
| `_token` | contract IERC677 |  |

### transfer

```solidity
function transfer(
    address _to,
    uint256 _amount
) external
```

Transfer given amount of tokens to the given account.

#### Parameters

| Name | Type | Description |
| :--- | :--- | :---------- |
| `_to` | address |  |
| `_amount` | uint256 |  |

### getBalance

```solidity
function getBalance() external returns (uint256)
```

Get total amount of tokens in the pool.

## Events

### Deposit

```solidity
event Deposit(
    address from,
    uint256 amount
)
```

#### Parameters

| Name | Type | Description |
| :--- | :--- | :---------- |
| `from` | address |  |
| `amount` | uint256 |  |
### Transfer

```solidity
event Transfer(
    address initiator,
    address to,
    uint256 amount
)
```

#### Parameters

| Name | Type | Description |
| :--- | :--- | :---------- |
| `initiator` | address |  |
| `to` | address |  |
| `amount` | uint256 |  |


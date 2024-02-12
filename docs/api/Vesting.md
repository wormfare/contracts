# Vesting

## Functions

### constructor

```solidity
function constructor(
    contract IERC677 _token,
    address _wallet,
    uint256 _startTimestamp,
    uint256 _endTimestamp
) public
```

#### Parameters

| Name | Type | Description |
| :--- | :--- | :---------- |
| `_token` | contract IERC677 | ERC677 token address. |
| `_wallet` | address | Wallet address that tokens are vested for. |
| `_startTimestamp` | uint256 | Vesting start timestamp. |
| `_endTimestamp` | uint256 | Vesting end timestamp. |

### onTokenTransfer

```solidity
function onTokenTransfer(
    address ,
    uint256 _amount,
    bytes 
) external
```

Add tokens.

#### Parameters

| Name | Type | Description |
| :--- | :--- | :---------- |
| `` | address |  |
| `_amount` | uint256 | Received token amount. |
| `` | bytes |  |

### claim

```solidity
function claim(
    address _to,
    uint256 _amount
) external
```

Claim vested tokens.

#### Parameters

| Name | Type | Description |
| :--- | :--- | :---------- |
| `_to` | address | Wallet address where the tokens will be sent to. |
| `_amount` | uint256 | Tokens amount. |

### getAvailableAmount

```solidity
function getAvailableAmount() public returns (uint256)
```

Returns current available amount for claim.

### getVestedAmount

```solidity
function getVestedAmount() public returns (uint256)
```

Returns total unlocked amount since the beginning (claimed tokens not included).

## Events

### Claim

```solidity
event Claim(
    address to,
    uint256 amount
)
```

#### Parameters

| Name | Type | Description |
| :--- | :--- | :---------- |
| `to` | address |  |
| `amount` | uint256 |  |


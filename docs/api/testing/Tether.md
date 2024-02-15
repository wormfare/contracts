# Tether

This is a fake Tether (USDT) contract made for testing purposes.

## Functions

### constructor

```solidity
function constructor(
    address _owner
) public
```

#### Parameters

| Name | Type | Description |
| :--- | :--- | :---------- |
| `_owner` | address |  |

### mint

```solidity
function mint(
    address _to,
    uint256 _amount
) public
```

#### Parameters

| Name | Type | Description |
| :--- | :--- | :---------- |
| `_to` | address |  |
| `_amount` | uint256 |  |

### decimals

```solidity
function decimals() public returns (uint8)
```

Tether has 6 decimals.


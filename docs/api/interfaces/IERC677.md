# IERC677

## Functions

### transferAndCall

```solidity
function transferAndCall(
    address to,
    uint256 amount,
    bytes data
) external returns (bool)
```

Transfer tokens from `msg.sender` to another address and then call `onTransferReceived` on receiver

#### Parameters

| Name | Type | Description |
| :--- | :--- | :---------- |
| `to` | address | The address which you want to transfer to |
| `amount` | uint256 | The amount of tokens to be transferred |
| `data` | bytes | bytes Additional data with no specified format, sent in call to `to` |

#### Return Values

| Name | Type | Description |
| :--- | :--- | :---------- |
| `[0]` | bool | true unless throwing |

## Events

### Transfer

```solidity
event Transfer(
    address from,
    address to,
    uint256 value,
    bytes data
)
```

#### Parameters

| Name | Type | Description |
| :--- | :--- | :---------- |
| `from` | address |  |
| `to` | address |  |
| `value` | uint256 |  |
| `data` | bytes |  |


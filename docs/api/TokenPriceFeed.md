# TokenPriceFeed

## Functions

### constructor

```solidity
function constructor() public
```

### initialize

```solidity
function initialize(
    address _admin,
    address _oracle,
    address _token
) public
```

#### Parameters

| Name | Type | Description |
| :--- | :--- | :---------- |
| `_admin` | address | Admin wallet address. |
| `_oracle` | address | Oracle's wallet address. Oracle is a service that updates the price. |
| `_token` | address | Target ERC20 token address. |

### setPriceInUsdt

```solidity
function setPriceInUsdt(
    uint256 _price
) external
```

Update current USDT price per 1 ether (10^18 tokens).

#### Parameters

| Name | Type | Description |
| :--- | :--- | :---------- |
| `_price` | uint256 |  |

### getPriceInUsdt

```solidity
function getPriceInUsdt() external returns (uint256)
```

Returns USDT price per 1 ether (10^18 tokens).


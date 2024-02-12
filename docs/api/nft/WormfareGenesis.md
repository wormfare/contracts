# WormfareGenesis

## Functions

### constructor

```solidity
function constructor() public
```

### initialize

```solidity
function initialize(
    address _owner,
    address _minter
) public
```

#### Parameters

| Name | Type | Description |
| :--- | :--- | :---------- |
| `_owner` | address |  |
| `_minter` | address |  |

### batchMint

```solidity
function batchMint(
    address _to,
    uint256[] _tokenIds,
    string[] _uris
) public
```

Mint a new token.

#### Parameters

| Name | Type | Description |
| :--- | :--- | :---------- |
| `_to` | address |  |
| `_tokenIds` | uint256[] |  |
| `_uris` | string[] |  |

### tokenURI

```solidity
function tokenURI(
    uint256 tokenId
) public returns (string)
```

#### Parameters

| Name | Type | Description |
| :--- | :--- | :---------- |
| `tokenId` | uint256 |  |

### supportsInterface

```solidity
function supportsInterface(
    bytes4 interfaceId
) public returns (bool)
```

#### Parameters

| Name | Type | Description |
| :--- | :--- | :---------- |
| `interfaceId` | bytes4 |  |


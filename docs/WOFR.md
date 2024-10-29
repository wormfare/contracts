# WOFR Contract

The WOFR smart contract is a standard ERC-20 fungible token contract based on the OpenZeppelin's ERC-20 contract with the following extensions:  
 - `ERC20Permit` - https://docs.openzeppelin.com/contracts/5.x/api/token/erc20#ERC20Permit  
 - `ERC20Burnable` - https://docs.openzeppelin.com/contracts/5.x/api/token/erc20#ERC20Burnable  

Base ERC-20 contract API docs: https://docs.openzeppelin.com/contracts/5.x/api/token/erc20  

## Deployment

Adjust the following env variables in the `env.*` files:  
 - `WOFR_OWNER_ADDRESS` - the whole supply (300M tokens) will be minted to this address.  

Deploy the contract:  
```sh
yarn deploy-dev --tags WOFR
yarn deploy-stage --tags WOFR
yarn deploy-testnet --tags WOFR

# adjust the gas price for the mainnet deployment
GAS_PRICE=100 yarn deploy-mainnet --tags WOFR
```

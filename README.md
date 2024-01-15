# TokenSale Contract

## Quick start

```shell
cp .env.example .env && cp .env.example .env.stage && cp .env.example .env.mainnet
```

```shell
yarn
```

Once installed, let's run Hardhat's testing network:

```shell
yarn start
```

> this loads the `.env` file and automatically runs your deployment scripts

To run the tests:

```shell
yarn test
```

To run the tests with Gas usage report:

```shell
REPORT_GAS=1 yarn hardhat test
```

Run a specific test(s):

```sh
yarn t "test description"
```

> "test description" is a regular expression, so do not forget to escape special symbols there (if you have any)

## Deploying

### Dev/Stage deployment

Deploy the Tether contract first:

```sh
yarn deploy-dev --tags Tether
yarn deploy-stage --tags Tether
```

Open `.env.dev` or `.env.stage` and fill the `USDT_CONTRACT_ADDRESS` var.

Now deploy the rest of the contracts:

```sh
yarn deploy-dev
yarn deploy-stage
```

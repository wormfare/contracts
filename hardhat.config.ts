import 'dotenv-flow/config';

import { HardhatUserConfig } from 'hardhat/config';
import { relative } from 'path';
import { validateEnv } from './hardhat.validate';

import '@nomicfoundation/hardhat-toolbox';
import '@nomiclabs/hardhat-solhint';
import 'hardhat-deploy';
import 'hardhat-gas-reporter';
import 'solidity-docgen';
import { Network } from './src/enums/network.enum';

validateEnv();

const namedAccountAddress = (address: string | number) =>
  Object.values(Network).reduce(
    (prev, current) => ({ ...prev, [current]: address }),
    {},
  );

const config: HardhatUserConfig = {
  solidity: {
    version: '0.8.23',
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  paths: {
    deploy: 'deploy/contracts',
    deployments: 'deployments',
  },
  namedAccounts: {
    deployer: {
      default: 0, // this will by default take the first account as deployer
      ...namedAccountAddress(0),
    },
    admin: {
      default: 1,
      ...namedAccountAddress(process.env.ADMIN_WALLET_ADDRESS),
    },
    treasuryWallet: {
      default: 2,
      ...namedAccountAddress(process.env.TREASURY_WALLET_ADDRESS),
    },
    apiSigner: {
      default: 5,
      ...namedAccountAddress(process.env.API_SIGNER_ADDRESS),
    },
    wormfareGenesisOwner: {
      default: 6,
      ...namedAccountAddress(process.env.WORMFARE_GENESIS_OWNER_ADDRESS),
    },
  },
  networks: {
    localhost: {
      saveDeployments: false,
      allowUnlimitedContractSize: true,
    },
    hardhat: {
      saveDeployments: false,
      allowUnlimitedContractSize: true,
    },
    dev: {
      url: process.env.RPC_URL,
      chainId: +process.env.CHAIN_ID,
      accounts: [process.env.DEPLOYER_PRIVATE_KEY].filter((v) => !!v),
    },
    stage: {
      url: process.env.RPC_URL,
      chainId: +process.env.CHAIN_ID,
      accounts: [process.env.DEPLOYER_PRIVATE_KEY].filter((v) => !!v),
    },
    stage2: {
      url: process.env.RPC_URL,
      chainId: +process.env.CHAIN_ID,
      accounts: [process.env.DEPLOYER_PRIVATE_KEY].filter((v) => !!v),
    },
    testnet: {
      url: process.env.RPC_URL,
      chainId: +process.env.CHAIN_ID,
      accounts: [process.env.DEPLOYER_PRIVATE_KEY].filter((v) => !!v),
    },
    mainnet: {
      live: true,
      url: process.env.RPC_URL,
      chainId: +process.env.CHAIN_ID,
      accounts: [process.env.DEPLOYER_PRIVATE_KEY].filter((v) => !!v),
    },
  },
  docgen: {
    templates: './templates',
    pages: (_item, file) => {
      return file.absolutePath.startsWith('contracts')
        ? relative('contracts', file.absolutePath).replace('.sol', '.md')
        : undefined;
    },
  },
  gasReporter: {
    enabled: process.env.REPORT_GAS ? true : false,
  },
};

export default config;

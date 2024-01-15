import { AddressLike } from 'ethers';
import { ethers, network } from 'hardhat';

let hardhatNetworkWarningPrinted = false;

export const logHardhatNetworkWarning = () => {
  if (network.name === 'hardhat' && !hardhatNetworkWarningPrinted) {
    console.warn(
      'You are trying to deploy a contract to the Hardhat Network, which',
      'gets automatically created and destroyed every time.',
    );

    hardhatNetworkWarningPrinted = true;
  }
};

export const logDeploymentInfo = async (
  deployerAddress: AddressLike,
  contractName: string,
) => {
  console.log(
    `Deploying ${contractName} contract from account:`,
    deployerAddress,
    'with balance:',
    (await ethers.provider.getBalance(deployerAddress)).toString(),
  );
};

// Deployer will run this function upon deploying the contracts
export default function () {}

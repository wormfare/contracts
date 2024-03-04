import { Network } from './enums/network.enum';

export const isHardhatNetwork = () => !process.env.NODE_ENV;
export const isStage2Network = () => process.env.NODE_ENV === Network.Stage2;
export const isMainnetNetwork = () => process.env.NODE_ENV === Network.Mainnet;

export const isTestNetwork = () =>
  ['', Network.Dev, Network.Stage, Network.Stage2, Network.Testnet].includes(
    process.env.NODE_ENV || '',
  );

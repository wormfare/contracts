import { Network } from './enums/network.enum';

export const isHardhatNetwork = () => !process.env.NODE_ENV;

export const isTestNetwork = () =>
  ['', Network.Dev, Network.Stage, Network.Stage2, Network.Testnet].includes(
    process.env.NODE_ENV || '',
  );

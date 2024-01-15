import { Network } from './enums/network.enum';

export const isHardhatNetwork = () => !process.env.NODE_ENV;

export const isTestnetNetwork = () =>
  ['', Network.Dev, Network.Stage, Network.Testnet].includes(
    process.env.NODE_ENV || '',
  );

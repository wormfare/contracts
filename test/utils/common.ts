import { time } from '@nomicfoundation/hardhat-network-helpers';
import { parseUnits } from 'ethers';
import { ONE_DAY_IN_SECONDS } from './constants';

export const addresses = [
  '0x62eFb049d062f80eE41B1C1E6233b1a309a46003',
  '0xe3B76Ac3689B283A39acA3447fc29d0Cd4A00979',
  '0x7781cB74a8DcE243A65b6E38C3e87148B5078e09',
  '0x99c6Fd47481B54F5Df1fF675F4Ca8255AFc07360',
  '0x39b786557414EBF11299E103e385b01eEC79f7c7',
  '0x4911F0775bcfc92eE773C0012A97d632C230eC23',
  '0xcC4B38E7e250f39C0aF78b5eA213F308D13D16d9',
  '0xdE196356c4a0534Ee6cFCB09744ea691Ad4823bc',
  '0xF4bef4fe4c52FBB0f8B038201210098E1Fe8d132',
  '0x2092327A6227E57400103f4C8b494bc1621c65a9',
];

/**
 * Parse USDT amount. USDT has 6 decimals.
 *
 * @param amount USDT amount.
 */
export const parseTether = (amount: string): bigint => parseUnits(amount, 6);

/**
 * Increase the time for the NEXT BLOCK by the given amount of seconds.
 *
 * @param daysNum
 * @returns New timestamp.
 */
export const timeAddSeconds = async (
  seconds: number,
  sinceTimestamp?: number,
): Promise<number> => {
  sinceTimestamp ??= await time.latest();
  const targetTimestamp = sinceTimestamp + seconds;

  await time.setNextBlockTimestamp(targetTimestamp);

  return targetTimestamp;
};

/**
 * Increase the time for the NEXT BLOCK by the given amount of days.
 *
 * @param daysNum
 * @returns New timestamp.
 */
export const timeAddDays = async (
  daysNum: number,
  sinceTimestamp?: number,
): Promise<number> => {
  sinceTimestamp ??= await time.latest();
  const targetTimestamp = sinceTimestamp + days(daysNum);

  await time.setNextBlockTimestamp(targetTimestamp);

  return targetTimestamp;
};

/**
 * Increase the time by the given amount of seconds for the next block and mine it.
 *
 * @param seconds
 * @returns New timestamp.
 */
export const timeAddSecondsAndMine = async (
  seconds: number,
  sinceTimestamp?: number,
): Promise<number> => {
  sinceTimestamp ??= await time.latest();
  const targetTimestamp = sinceTimestamp + seconds;
  await time.increaseTo(targetTimestamp);

  return targetTimestamp;
};

/**
 * Increase the time by the given amount of days for the next block and mine it.
 *
 * @param daysNum
 * @returns New timestamp.
 */
export const timeAddDaysAndMine = async (
  daysNum: number,
  sinceTimestamp?: number,
): Promise<number> => {
  sinceTimestamp ??= await time.latest();
  const targetTimestamp = sinceTimestamp + days(daysNum);
  await time.increaseTo(targetTimestamp);

  return targetTimestamp;
};

/**
 * Returns given number of days in seconds.
 *
 * @param days
 */
export const days = (days: number) => days * ONE_DAY_IN_SECONDS;

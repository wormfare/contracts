import { getAddress } from 'ethers';
import { addError } from './zod-helpers';
import { RefinementCtx } from 'zod';

/**
 * ETH address rule.
 */
export const ethAddress = (address: string, ctx: RefinementCtx) => {
  try {
    getAddress(address);
  } catch (e) {
    return addError(ctx, 'Wallet address is not valid.', true);
  }
};

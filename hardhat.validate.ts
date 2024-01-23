import { z } from 'zod';
import { isHardhatNetwork, isTestNetwork } from './src/utils';
import { ZodRules } from './src/zod/zod-helpers';
import { ethAddress } from './src/zod/zod-rules';

const rules: ZodRules = {
  RPC_URL: z.string().min(1),
  CHAIN_ID: z.coerce.number(),
  DEPLOYER_PRIVATE_KEY: z.string(),
  ADMIN_WALLET_ADDRESS: z.string().superRefine(ethAddress),
  WORMFARE_GENESIS_OWNER_ADDRESS: z.string().superRefine(ethAddress),
  USDT_CONTRACT_ADDRESS: z.string().superRefine(ethAddress),
  TREASURY_WALLET_ADDRESS: z.string().superRefine(ethAddress),
  API_SIGNER_ADDRESS: z.string().superRefine(ethAddress),
  TOKEN_SALE_MAX_TOKENS: z.coerce.number().min(1),
  TOKEN_SALE_TOKEN_PRICE_USDT: z.coerce.number().min(0.01).max(1),
};

if (isTestNetwork()) {
  delete rules.USDT_CONTRACT_ADDRESS;
}

if (isHardhatNetwork()) {
  delete rules.RPC_URL;
  delete rules.CHAIN_ID;
}

export const validateEnv = () => {
  console.log('NODE_ENV:', process.env.NODE_ENV);
  console.log(
    'env file:',
    process.env.NODE_ENV ? '.env.' + process.env.NODE_ENV : '.env',
  );

  const validationRes = z.object(rules).safeParse(process.env);

  if ('error' in validationRes) {
    const errors = validationRes.error.errors.map((row) => {
      return row.path.join('.') + ' | ' + row.message;
    });

    throw new Error('Env validation errors:\n' + errors.join('\n'));
  }
};

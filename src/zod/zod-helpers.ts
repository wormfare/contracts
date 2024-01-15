import { RefinementCtx, ZodType, z } from 'zod';

export type ZodRules = {
  [key: string]: ZodType;
};

export const addError = (
  ctx: RefinementCtx,
  message: string,
  fatal = true,
): void =>
  ctx.addIssue({
    code: z.ZodIssueCode.custom,
    message,
    fatal,
  });

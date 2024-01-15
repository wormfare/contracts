export type StakeInfo = {
  tier: bigint;
  unstakedAmount: bigint;
  amount: bigint;
  amountUsdt: bigint;
  apyPercent: bigint;
  claimedAmount: bigint;
  lastUpdateTimestamp: bigint;
  startTimestamp: bigint;
  unstakeTimestamp: bigint;
};

export type FlexStakeInfo = {
  periodMonths: bigint;
  amount: bigint;
  amountUsdt: bigint;
  apyPercent: bigint;
  earnedReward: bigint;
  lastUpdateTimestamp: bigint;
  startTimestamp: bigint;
  endTimestamp: bigint;
  penaltyPercent: bigint;
};

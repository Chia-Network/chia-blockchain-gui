import type BigNumber from 'bignumber.js';

type AutoClaim = {
  enabled: boolean;
  txFee: number | BigNumber;
  minAmount: number | BigNumber;
  batchSize: number;
};

export default AutoClaim;

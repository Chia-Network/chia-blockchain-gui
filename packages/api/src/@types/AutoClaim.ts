import type BigNumber from 'bignumber.js';

export type AutoClaimSet = {
  enabled: boolean;
  txFee: number | BigNumber;
  minAmount: number | BigNumber;
  batchSize: number;
};

export type AutoClaimGet = {
  autoClaim: boolean;
  autoClaimTxFee: number | BigNumber;
  autoClaimMinAmount: number | BigNumber;
  autoClaimBatchSize: number;
};

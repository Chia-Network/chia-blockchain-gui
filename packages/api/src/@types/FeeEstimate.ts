import type BigNumber from 'bignumber.js';

type FeeEstimate = {
  currentFeeRate: BigNumber;
  estimates: BigNumber[];
  feeRateLastBlock: BigNumber;
  feesLastBlock: number;
  fullNodeSynced: boolean;
  lastBlockCost: number;
  lastPeakTimestamp: number;
  lastTxBlockHeight: number;
  mempoolFees: number;
  mempoolMaxSize: number;
  mempoolSize: number;
  nodeTimeUtc: number;
  numSpends: number;
  peakHeight: number;
  targetTimes: number[];
};

export default FeeEstimate;

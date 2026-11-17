import BigNumber from 'bignumber.js';

import FeeTxType from './FeeTxType';

// Mirrors DEFAULT_MINIMUM_BLOCK_FEE_PER_COST in chia-blockchain (chia/full_node/mempool_manager.py).
export const MINIMUM_FEE_MOJOS_PER_COST = 4;

// Marks the option that is cheaper than every estimate, so it has no target time.
export const NO_TARGET_TIME = -1;

// Mirrors _get_spendbundle_type_cost in chia-blockchain (chia/full_node/full_node_rpc_api.py).
// get_fee_estimate does not return the cost and wallet mode has no full node to ask.
const TX_COST_ESTIMATES: Record<FeeTxType, number> = {
  [FeeTxType.walletSendXCH]: 9_401_710,
  [FeeTxType.spendCATtx]: 36_382_111,
  [FeeTxType.acceptOffer]: 721_393_265,
  [FeeTxType.cancelOffer]: 212_443_993,
  [FeeTxType.assignDIDToNFT]: 115_540_006,
  [FeeTxType.transferNFT]: 74_385_541,
  [FeeTxType.createPlotNFT]: 18_055_407,
  [FeeTxType.claimPoolingReward]: 82_668_466,
  [FeeTxType.createDID]: 57_360_396,
};

export type FeeOption = {
  minutes: number;
  estimate: BigNumber;
};

// Bulk actions put `count` spends of the same type into one transaction that pays a single fee.
export function getMinimumFee(txType: FeeTxType, count = 1): BigNumber {
  return new BigNumber(TX_COST_ESTIMATES[txType]).times(count).times(MINIMUM_FEE_MOJOS_PER_COST);
}

// Raises every estimate to the minimum fee, drops slower options that cost the same as a faster one
// and always ends with the minimum fee. Estimates are priced for one spend, so they scale with `count`.
export function getFeeOptions(
  estimates: (number | string | BigNumber)[] | undefined,
  targetTimes: number[],
  minimumFee: BigNumber,
  count = 1,
): FeeOption[] {
  const options: FeeOption[] = [];

  (estimates ?? []).forEach((value, index) => {
    const estimate = BigNumber.max(new BigNumber(value).times(count), minimumFee);
    if (!options.some((option) => option.estimate.eq(estimate))) {
      options.push({ minutes: targetTimes[index] / 60, estimate });
    }
  });

  if (!options.some((option) => option.estimate.eq(minimumFee))) {
    options.push({ minutes: NO_TARGET_TIME, estimate: minimumFee });
  }

  return options;
}

// Estimates refresh while the form is open, so the selected target time can be merged into a faster
// option with the same fee. Resolve it to the option that now carries that fee.
export function findFeeOption<T extends FeeOption>(options: T[], minutes: number): T | undefined {
  const exact = options.find((option) => option.minutes === minutes);
  if (exact) {
    return exact;
  }

  const faster = options.filter((option) => option.minutes !== NO_TARGET_TIME && option.minutes < minutes);
  if (minutes !== NO_TARGET_TIME && faster.length) {
    return faster[faster.length - 1];
  }

  return options[options.length - 1];
}

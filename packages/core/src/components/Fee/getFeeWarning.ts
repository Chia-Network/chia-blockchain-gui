import type BigNumber from 'bignumber.js';

const HIGH_FEE_MOJOS = '100000000000';

export type FeeWarning = 'high' | 'incorrect' | 'belowMinimum';

// Fee and minimumFee are in mojos.
export default function getFeeWarning(mojo: BigNumber, minimumFee?: BigNumber): FeeWarning | undefined {
  if (mojo.gte(HIGH_FEE_MOJOS)) {
    return 'high';
  }

  if (mojo.gt(0) && mojo.lt(1)) {
    return 'incorrect';
  }

  if (minimumFee && mojo.lt(minimumFee)) {
    return 'belowMinimum';
  }

  return undefined;
}

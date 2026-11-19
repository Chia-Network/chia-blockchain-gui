import BigNumber from 'bignumber.js';

import FeeTxType from './FeeTxType';
import {
  MINIMUM_FEE_EXPIRATION,
  NO_TARGET_TIME,
  findFeeOption,
  getFeeOptions,
  getMinimumFee,
  isMinimumFeeExpired,
} from './minimumFee';

const TARGET_TIMES = [60, 120, 300];
const BEFORE_EXPIRATION = MINIMUM_FEE_EXPIRATION - 1;

function toPlain(options: { minutes: number; estimate: BigNumber }[]) {
  return options.map(({ minutes, estimate }) => [minutes, estimate.toFixed()]);
}

describe('minimumFee', () => {
  describe('#getMinimumFee', () => {
    it('should be 5 mojos per CLVM cost', () => {
      expect(getMinimumFee(FeeTxType.walletSendXCH, 1, BEFORE_EXPIRATION).toFixed()).toBe('47008550');
      expect(getMinimumFee(FeeTxType.spendCATtx, 1, BEFORE_EXPIRATION).toFixed()).toBe('181910555');
      expect(getMinimumFee(FeeTxType.transferNFT, 1, BEFORE_EXPIRATION).toFixed()).toBe('371927705');
    });
    it('should scale with the number of spends in a bulk transaction', () => {
      expect(getMinimumFee(FeeTxType.transferNFT, 1, BEFORE_EXPIRATION).toFixed()).toBe('371927705');
      expect(getMinimumFee(FeeTxType.transferNFT, 25, BEFORE_EXPIRATION).toFixed()).toBe('9298192625');
      expect(getMinimumFee(FeeTxType.assignDIDToNFT, 3, BEFORE_EXPIRATION).toFixed()).toBe('1733100090');
    });
    it('should apply until the expiration and be zero from then on', () => {
      expect(MINIMUM_FEE_EXPIRATION).toBe(Date.UTC(2027, 10, 3) / 1000);
      expect(getMinimumFee(FeeTxType.walletSendXCH, 1, MINIMUM_FEE_EXPIRATION - 1).toFixed()).toBe('47008550');
      expect(getMinimumFee(FeeTxType.walletSendXCH, 1, MINIMUM_FEE_EXPIRATION).toFixed()).toBe('0');
      expect(getMinimumFee(FeeTxType.transferNFT, 25, MINIMUM_FEE_EXPIRATION + 1).toFixed()).toBe('0');
    });
    it('should cover every transaction type', () => {
      Object.values(FeeTxType).forEach((txType) => {
        expect(getMinimumFee(txType, 1, BEFORE_EXPIRATION).gt(0)).toBe(true);
      });
    });
  });

  describe('#getFeeOptions', () => {
    const minimumFee = new BigNumber(100);

    it('should return only the minimum fee without estimates', () => {
      expect(toPlain(getFeeOptions(undefined, TARGET_TIMES, minimumFee))).toEqual([[NO_TARGET_TIME, '100']]);
    });
    it('should collapse estimates below the minimum into the fastest option', () => {
      expect(toPlain(getFeeOptions([0, 0, 0], TARGET_TIMES, minimumFee))).toEqual([[1, '100']]);
      expect(toPlain(getFeeOptions([50, 20, 0], TARGET_TIMES, minimumFee))).toEqual([[1, '100']]);
    });
    it('should keep higher estimates and raise the rest to the minimum', () => {
      expect(toPlain(getFeeOptions([500, 300, 0], TARGET_TIMES, minimumFee))).toEqual([
        [1, '500'],
        [2, '300'],
        [5, '100'],
      ]);
      expect(toPlain(getFeeOptions([500, 50, 0], TARGET_TIMES, minimumFee))).toEqual([
        [1, '500'],
        [2, '100'],
      ]);
    });
    it('should append the minimum fee when every estimate is higher', () => {
      expect(toPlain(getFeeOptions([500, 300, new BigNumber(200)], TARGET_TIMES, minimumFee))).toEqual([
        [1, '500'],
        [2, '300'],
        [5, '200'],
        [NO_TARGET_TIME, '100'],
      ]);
    });
  });

  describe('#isMinimumFeeExpired', () => {
    it('should expire at the expiration time', () => {
      expect(isMinimumFeeExpired(MINIMUM_FEE_EXPIRATION - 1)).toBe(false);
      expect(isMinimumFeeExpired(MINIMUM_FEE_EXPIRATION)).toBe(true);
      expect(isMinimumFeeExpired(MINIMUM_FEE_EXPIRATION + 1)).toBe(true);
    });
  });

  describe('#getFeeOptions after the minimum fee expired', () => {
    const minimumFee = getMinimumFee(FeeTxType.walletSendXCH, 1, MINIMUM_FEE_EXPIRATION);
    const defaultOptions = [
      [1, '6000000'],
      [2, '5000000'],
      [5, '0'],
    ];

    it('should offer the default fees without estimates', () => {
      expect(toPlain(getFeeOptions(undefined, TARGET_TIMES, minimumFee))).toEqual(defaultOptions);
    });
    it('should offer the default fees when every estimate is zero', () => {
      expect(toPlain(getFeeOptions([0, 0, 0], TARGET_TIMES, minimumFee))).toEqual(defaultOptions);
    });
    it('should not scale the default fees for a bulk transaction', () => {
      expect(toPlain(getFeeOptions([0, 0, 0], TARGET_TIMES, minimumFee, 25))).toEqual(defaultOptions);
    });
    it('should keep estimates as they are and end with a zero fee', () => {
      expect(toPlain(getFeeOptions([500, 300, 0], TARGET_TIMES, minimumFee))).toEqual([
        [1, '500'],
        [2, '300'],
        [5, '0'],
      ]);
      expect(toPlain(getFeeOptions([500, 300, 200], TARGET_TIMES, minimumFee))).toEqual([
        [1, '500'],
        [2, '300'],
        [5, '200'],
        [NO_TARGET_TIME, '0'],
      ]);
    });
    it('should select the zero fee by default', () => {
      const options = getFeeOptions(undefined, TARGET_TIMES, minimumFee);
      expect(options.find((option) => option.estimate.eq(minimumFee))?.minutes).toBe(5);
    });
  });

  describe('#getFeeOptions while the minimum fee applies', () => {
    it('should not offer the default fees', () => {
      const minimumFee = getMinimumFee(FeeTxType.walletSendXCH, 1, BEFORE_EXPIRATION);
      expect(toPlain(getFeeOptions(undefined, TARGET_TIMES, minimumFee))).toEqual([[NO_TARGET_TIME, '47008550']]);
      expect(toPlain(getFeeOptions([0, 0, 0], TARGET_TIMES, minimumFee))).toEqual([[1, '47008550']]);
    });
  });

  describe('#getFeeOptions for a bulk transaction', () => {
    const count = 25;
    const minimumFee = getMinimumFee(FeeTxType.transferNFT, count, BEFORE_EXPIRATION);

    it('should return the bulk minimum when estimates are below it', () => {
      expect(toPlain(getFeeOptions([0, 0, 0], TARGET_TIMES, minimumFee, count))).toEqual([[1, '9298192625']]);
    });
    it('should scale estimates priced for one spend before comparing them to the minimum', () => {
      // 400,000,000 for one NFT is above the single minimum and 25 times that is above the bulk one
      expect(toPlain(getFeeOptions([400_000_000, 0, 0], TARGET_TIMES, minimumFee, count))).toEqual([
        [1, '10000000000'],
        [2, '9298192625'],
      ]);
    });
    it('should not scale anything for a single spend', () => {
      const singleMinimumFee = getMinimumFee(FeeTxType.transferNFT, 1, BEFORE_EXPIRATION);
      expect(toPlain(getFeeOptions([400_000_000, 0, 0], TARGET_TIMES, singleMinimumFee))).toEqual([
        [1, '400000000'],
        [2, '371927705'],
      ]);
    });
  });

  describe('#findFeeOption', () => {
    const minimumFee = new BigNumber(100);

    it('should return the option for the selected time', () => {
      const options = getFeeOptions([500, 300, 0], TARGET_TIMES, minimumFee);
      expect(findFeeOption(options, 2)?.estimate.toFixed()).toBe('300');
    });
    it('should fall back to the faster option the selected time was merged into', () => {
      const options = getFeeOptions([500, 50, 0], TARGET_TIMES, minimumFee);
      expect(findFeeOption(options, 5)).toBe(options[1]);
    });
    it('should fall back to the minimum fee when its own option was merged', () => {
      const options = getFeeOptions([500, 300, 0], TARGET_TIMES, minimumFee);
      expect(findFeeOption(options, NO_TARGET_TIME)).toBe(options[2]);
    });
    it('should keep the minimum fee selected once estimates load', () => {
      // The minimum is selected before the first estimates arrive, when it is the only option.
      const selected = getFeeOptions(undefined, TARGET_TIMES, minimumFee)[0];
      expect(selected.minutes).toBe(NO_TARGET_TIME);

      [
        [0, 0, 0],
        [50, 20, 0],
        [500, 50, 0],
        [500, 300, 0],
        [500, 300, 200],
      ].forEach((estimates) => {
        const options = getFeeOptions(estimates, TARGET_TIMES, minimumFee);
        expect(findFeeOption(options, selected.minutes)?.estimate.toFixed()).toBe('100');
      });
    });
    it('should fall back to the minimum fee when estimates are gone', () => {
      const options = getFeeOptions(undefined, TARGET_TIMES, minimumFee);
      expect(findFeeOption(options, 1)).toBe(options[0]);
    });
  });
});

import BigNumber from 'bignumber.js';

import FeeTxType from './FeeTxType';
import { NO_TARGET_TIME, findFeeOption, getFeeOptions, getMinimumFee } from './minimumFee';

const TARGET_TIMES = [60, 120, 300];

function toPlain(options: { minutes: number; estimate: BigNumber }[]) {
  return options.map(({ minutes, estimate }) => [minutes, estimate.toFixed()]);
}

describe('minimumFee', () => {
  describe('#getMinimumFee', () => {
    it('should be 4 mojos per CLVM cost', () => {
      expect(getMinimumFee(FeeTxType.walletSendXCH).toFixed()).toBe('37606840');
      expect(getMinimumFee(FeeTxType.spendCATtx).toFixed()).toBe('145528444');
      expect(getMinimumFee(FeeTxType.transferNFT).toFixed()).toBe('297542164');
    });
    it('should cover every transaction type', () => {
      Object.values(FeeTxType).forEach((txType) => {
        expect(getMinimumFee(txType).gt(0)).toBe(true);
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
    it('should fall back to the minimum fee when estimates are gone', () => {
      const options = getFeeOptions(undefined, TARGET_TIMES, minimumFee);
      expect(findFeeOption(options, 1)).toBe(options[0]);
    });
  });
});

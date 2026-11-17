import BigNumber from 'bignumber.js';

import chiaToMojo from '../../utils/chiaToMojo';
import FeeTxType from '../EstimatedFee/FeeTxType';
import { getMinimumFee } from '../EstimatedFee/minimumFee';

import getFeeWarning from './getFeeWarning';

describe('getFeeWarning', () => {
  describe('without a minimum fee', () => {
    it('should not warn about an empty or zero fee', () => {
      expect(getFeeWarning(chiaToMojo(''))).toBeUndefined();
      expect(getFeeWarning(new BigNumber(0))).toBeUndefined();
    });
    it('should not warn about a regular fee', () => {
      expect(getFeeWarning(new BigNumber(5_000_000))).toBeUndefined();
    });
    it('should warn about a high fee', () => {
      expect(getFeeWarning(new BigNumber('100000000000'))).toBe('high');
    });
    it('should reject a fee smaller than one mojo', () => {
      expect(getFeeWarning(new BigNumber('0.5'))).toBe('incorrect');
    });
  });

  describe('with a minimum fee', () => {
    const minimumFee = getMinimumFee(FeeTxType.walletSendXCH);

    it('should warn about an empty or zero fee', () => {
      expect(getFeeWarning(chiaToMojo(''), minimumFee)).toBe('belowMinimum');
      expect(getFeeWarning(new BigNumber(0), minimumFee)).toBe('belowMinimum');
    });
    it('should warn about a fee below the minimum', () => {
      expect(getFeeWarning(minimumFee.minus(1), minimumFee)).toBe('belowMinimum');
      expect(getFeeWarning(chiaToMojo('0.000005'), minimumFee)).toBe('belowMinimum');
    });
    it('should accept the minimum fee and anything above it', () => {
      expect(getFeeWarning(minimumFee, minimumFee)).toBeUndefined();
      expect(getFeeWarning(minimumFee.plus(1), minimumFee)).toBeUndefined();
    });
    it('should still warn about a high fee', () => {
      expect(getFeeWarning(new BigNumber('100000000000'), minimumFee)).toBe('high');
    });
    it('should reject a fee smaller than one mojo before comparing it to the minimum', () => {
      expect(getFeeWarning(new BigNumber('0.5'), minimumFee)).toBe('incorrect');
    });
  });
});

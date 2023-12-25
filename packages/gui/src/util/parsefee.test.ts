import BigNumber from 'bignumber.js';

import parseFee from './parseFee';

describe('parseFee', () => {
  it('should return empty string if value is null', () => {
    expect(parseFee(null)).toEqual('');
  });
  it('should return empty string if value is undefined', () => {
    expect(parseFee(undefined)).toEqual('');
  });
  it('should return value if value is a string', () => {
    expect(parseFee('123')).toEqual('123');
  });
  it('should return value if value is a number', () => {
    expect(parseFee(123)).toEqual('123');
  });
  it('should return value if value is a BigNumber', () => {
    expect(parseFee(new BigNumber(123))).toEqual('123');
  });
  it('should return empty string if value is NaN', () => {
    expect(parseFee(NaN)).toEqual('');
  });
});

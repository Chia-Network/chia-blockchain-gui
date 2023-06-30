import BigNumber from 'bignumber.js';

import toSafeNumber from './toSafeNumber';

describe('toSafeNumber', () => {
  it('returns an empty object if the input object is empty', () => {
    const input = {};
    const output = toSafeNumber(input);
    expect(output).toEqual({});
  });

  it('converts BigNumber values to numbers if they are integers and less than or equal to Number.MAX_SAFE_INTEGER', () => {
    const input = {
      a: new BigNumber(123),
      b: new BigNumber(456),
      c: new BigNumber(Number.MAX_SAFE_INTEGER),
      d: new BigNumber(Number.MAX_SAFE_INTEGER + 1),
      e: 'hello',
      f: null,
      g: undefined,
    };
    const output = toSafeNumber(input);
    expect(output).toEqual({
      a: 123,
      b: 456,
      c: Number.MAX_SAFE_INTEGER,
      d: new BigNumber(Number.MAX_SAFE_INTEGER + 1),
      e: 'hello',
      f: null,
      g: undefined,
    });
  });

  it('does not modify non-BigNumber values', () => {
    const input = {
      a: 123,
      b: 'hello',
      c: null,
      d: undefined,
    };
    const output = toSafeNumber(input);
    expect(output).toEqual({
      a: 123,
      b: 'hello',
      c: null,
      d: undefined,
    });
  });
});

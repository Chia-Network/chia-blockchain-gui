import { isNumericKey } from './isNumericKey';

describe('isNumericKey', () => {
  it.each([
    { key: '1', expected: true },
    { key: '0', expected: true },
    { key: '1234567890', expected: true },
    { key: '', expected: false },
    { key: 'xch', expected: false },
    { key: '123abc', expected: false },
    { key: ' 123', expected: false },
    { key: '123 ', expected: false },
    { key: '12345678901', expected: false },
    { key: '1234567890123456789012345678901234567890123456789012345678901234', expected: false },
  ])('returns $expected for "$key"', ({ key, expected }) => {
    expect(isNumericKey(key)).toBe(expected);
  });
});

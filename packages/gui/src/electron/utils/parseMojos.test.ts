import BigNumber from 'bignumber.js';
import JSONBig from 'json-bigint';

import { parseMojos } from './parseMojos';

describe('parseMojos', () => {
  describe('valid values', () => {
    it('accepts bigint mojos without losing precision', () => {
      const huge = '999999999999999999999999999999999999';
      const hugeBigInt = BigInt('999999999999999999999999999999999999');

      expect(parseMojos(0n)).toBe(0n);
      expect(parseMojos(1n)).toBe(1n);
      expect(parseMojos(huge)).toBe(hugeBigInt);
    });

    it('accepts safe integer numbers', () => {
      expect(parseMojos(0)).toBe(0n);
      expect(parseMojos(-0)).toBe(0n);
      expect(parseMojos(1)).toBe(1n);
      expect(parseMojos(Number.MAX_SAFE_INTEGER)).toBe(BigInt(Number.MAX_SAFE_INTEGER));
    });

    it('accepts canonical decimal strings', () => {
      expect(parseMojos('0')).toBe(0n);
      expect(parseMojos('1')).toBe(1n);
    });

    it('accepts decimal strings beyond the JavaScript safe integer range', () => {
      expect(parseMojos('9007199254740993')).toBe(BigInt('9007199254740993'));
      expect(parseMojos('1844674407370955161518446744073709551615')).toBe(
        BigInt('1844674407370955161518446744073709551615'),
      );
    });

    it('accepts BigNumber mojos without losing precision', () => {
      expect(parseMojos(new BigNumber('9007199254740993'))).toBe(BigInt('9007199254740993'));
      expect(parseMojos(new BigNumber('1844674407370955161518446744073709551615'))).toBe(
        BigInt('1844674407370955161518446744073709551615'),
      );
    });

    it('accepts unsafe integer values parsed by json-bigint', () => {
      const parsed = JSONBig.parse('{"mojos":9007199254740993}') as { mojos: unknown };

      expect(parseMojos(parsed.mojos)).toBe(BigInt('9007199254740993'));
    });

    it('accepts negative values only when explicitly allowed', () => {
      expect(parseMojos(-1n, true)).toBe(-1n);
      expect(parseMojos(-1, true)).toBe(-1n);
      expect(parseMojos('-1', true)).toBe(-1n);
      expect(parseMojos(new BigNumber('-1'), true)).toBe(-1n);
    });
  });

  describe('required input', () => {
    it('rejects nullish values', () => {
      expect(() => parseMojos(null)).toThrow('Mojos is required');
      expect(() => parseMojos(undefined)).toThrow('Mojos is required');
    });

    it('rejects empty strings after trimming', () => {
      expect(() => parseMojos('')).toThrow('Mojos cannot be empty');
      expect(() => parseMojos(' \n\t ')).toThrow('Mojos cannot be empty');
    });
  });

  describe('number safety', () => {
    it('rejects NaN before attempting BigInt conversion', () => {
      expect(() => parseMojos(Number.NaN)).toThrow('Mojos cannot be NaN');
    });

    it('rejects fractional and non-finite numbers', () => {
      expect(() => parseMojos(1.1)).toThrow('Mojos must be an integer, got: 1.1');
      expect(() => parseMojos(Number.POSITIVE_INFINITY)).toThrow('Mojos must be an integer, got: Infinity');
      expect(() => parseMojos(Number.NEGATIVE_INFINITY)).toThrow('Mojos must be an integer, got: -Infinity');
    });

    it('rejects unsafe integer numbers to avoid silent precision loss', () => {
      expect(() => parseMojos(Number.MAX_SAFE_INTEGER + 1)).toThrow(
        'Mojos exceeds safe integer range: 9007199254740992',
      );
      expect(() => parseMojos(Number.MIN_SAFE_INTEGER - 1, true)).toThrow(
        'Mojos exceeds safe integer range: -9007199254740992',
      );
    });

    it('rejects non-canonical number rendering', () => {
      const toStringSpy = jest.spyOn(Number.prototype, 'toString').mockReturnValue('01');

      try {
        expect(() => parseMojos(1)).toThrow('Mojos has non-canonical format: "01"');
      } finally {
        toStringSpy.mockRestore();
      }
    });
  });

  describe('BigNumber safety', () => {
    it('rejects non-finite values', () => {
      expect(() => parseMojos(new BigNumber(Number.NaN))).toThrow('Mojos must be finite, got: NaN');
      expect(() => parseMojos(new BigNumber(Number.POSITIVE_INFINITY))).toThrow('Mojos must be finite, got: Infinity');
      expect(() => parseMojos(new BigNumber(Number.NEGATIVE_INFINITY))).toThrow('Mojos must be finite, got: -Infinity');
    });

    it('rejects fractional values', () => {
      expect(() => parseMojos(new BigNumber('1.1'))).toThrow('Mojos must be an integer, got: 1.1');
    });
  });

  describe('string safety', () => {
    it('rejects strings that BigInt cannot parse as integers', () => {
      expect(() => parseMojos('abc')).toThrow('Mojos is not a valid integer: "abc"');
      expect(() => parseMojos('1.0')).toThrow('Mojos is not a valid integer: "1.0"');
      expect(() => parseMojos('1e3')).toThrow('Mojos is not a valid integer: "1e3"');
    });

    it('rejects non-canonical numeric string formats', () => {
      expect(() => parseMojos(' 123 ')).toThrow('Mojos has non-canonical format: " 123 "');
      expect(() => parseMojos('\n42\t')).toThrow('Mojos has non-canonical format: "\n42\t"');
      expect(() => parseMojos('00')).toThrow('Mojos has non-canonical format: "00"');
      expect(() => parseMojos('01')).toThrow('Mojos has non-canonical format: "01"');
      expect(() => parseMojos('+0')).toThrow('Mojos has non-canonical format: "+0"');
      expect(() => parseMojos('+1')).toThrow('Mojos has non-canonical format: "+1"');
      expect(() => parseMojos('-0', true)).toThrow('Mojos has non-canonical format: "-0"');
      expect(() => parseMojos('-01', true)).toThrow('Mojos has non-canonical format: "-01"');
      expect(() => parseMojos('0x10')).toThrow('Mojos has non-canonical format: "0x10"');
      expect(() => parseMojos('0b10')).toThrow('Mojos has non-canonical format: "0b10"');
      expect(() => parseMojos('0o10')).toThrow('Mojos has non-canonical format: "0o10"');
    });
  });

  describe('negative values', () => {
    it('rejects negative bigint, number, and string values by default', () => {
      expect(() => parseMojos(-1n)).toThrow('Mojos must be non-negative, got: -1');
      expect(() => parseMojos(-1)).toThrow('Mojos must be non-negative, got: -1');
      expect(() => parseMojos('-1')).toThrow('Mojos must be non-negative, got: -1');
      expect(() => parseMojos(new BigNumber('-1'))).toThrow('Mojos must be non-negative, got: -1');
    });
  });

  describe('type safety', () => {
    it('rejects unsupported primitive and object values', () => {
      expect(() => parseMojos(true)).toThrow('Mojos has invalid type: boolean');
      expect(() => parseMojos({ value: '1' })).toThrow('Mojos has invalid type: object');
      expect(() => parseMojos(['1'])).toThrow('Mojos has invalid type: object');
      expect(() => parseMojos(Symbol('1'))).toThrow('Mojos has invalid type: symbol');
      expect(() => parseMojos(() => '1')).toThrow('Mojos has invalid type: function');
    });
  });
});

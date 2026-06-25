import BigNumber from 'bignumber.js';

export function parseMojos(value: unknown, allowNegative: boolean = false): bigint {
  if (value === null || value === undefined) {
    throw new Error('Mojos is required');
  }

  if (BigNumber.isBigNumber(value)) {
    if (!value.isFinite()) {
      throw new Error(`Mojos must be finite, got: ${value.toString()}`);
    }

    if (!value.isInteger()) {
      throw new Error(`Mojos must be an integer, got: ${value.toString()}`);
    }

    const valueString = value.toFixed(0);
    const result = BigInt(valueString);

    if (!allowNegative && result < 0n) {
      throw new Error(`Mojos must be non-negative, got: ${valueString}`);
    }

    return result;
  }

  if (typeof value === 'bigint') {
    if (!allowNegative && value < 0n) {
      throw new Error(`Mojos must be non-negative, got: ${value}`);
    }

    return value;
  }

  if (typeof value === 'number') {
    if (Number.isNaN(value)) {
      throw new Error('Mojos cannot be NaN');
    }

    if (!Number.isInteger(value)) {
      throw new Error(`Mojos must be an integer, got: ${value}`);
    }

    if (!Number.isSafeInteger(value)) {
      throw new Error(`Mojos exceeds safe integer range: ${value}`);
    }

    const result = BigInt(value);

    if (result.toString() !== value.toString()) {
      throw new Error(`Mojos has non-canonical format: "${value.toString()}"`);
    }

    if (!allowNegative && result < 0n) {
      throw new Error(`Mojos must be non-negative, got: ${value}`);
    }

    return result;
  }

  if (typeof value === 'string') {
    const trimmed = value.trim();

    if (trimmed === '') {
      throw new Error('Mojos cannot be empty');
    }

    let result: bigint;

    try {
      result = BigInt(trimmed);
    } catch {
      throw new Error(`Mojos is not a valid integer: "${value}"`);
    }

    if (result.toString() !== value) {
      throw new Error(`Mojos has non-canonical format: "${value}"`);
    }

    if (!allowNegative && result < 0n) {
      throw new Error(`Mojos must be non-negative, got: ${value}`);
    }

    return result;
  }

  throw new Error(`Mojos has invalid type: ${typeof value}`);
}

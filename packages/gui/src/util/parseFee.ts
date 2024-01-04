import BigNumber from 'bignumber.js';

export default function parseFee(value: any) {
  if (value === null || value === undefined) {
    return '';
  }

  if (typeof value === 'string') {
    return value;
  }

  if (typeof value === 'number') {
    if (Number.isNaN(value)) {
      return '';
    }

    return value.toString();
  }

  if (value instanceof BigNumber) {
    if (value.isNaN()) {
      return '';
    }

    return value.toFixed();
  }

  return value;
}

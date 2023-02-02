import BigNumber from 'bignumber.js';
import { transform } from 'lodash';

export default function toSafeNumber(object: Object): { [key: string]: unknown } {
  return transform(object, (acc, value, key) => {
    if (value instanceof BigNumber && value.isInteger() && value.isLessThanOrEqualTo(Number.MAX_SAFE_INTEGER)) {
      acc[key] = value.toNumber();
    } else {
      acc[key] = value;
    }
  });
}

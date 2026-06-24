import { camelCase, transform, isArray, isObject } from 'lodash';

type CaseOptions = {
  deep?: boolean;
};

export default function toCamelCase(
  object: Record<string, unknown>,
  options: CaseOptions = {},
): Record<string, unknown> {
  const { deep = true } = options;

  if (typeof object !== 'object' || object === null) {
    return object;
  }

  return transform(object, (acc, value, key, target) => {
    const newKey = isArray(target) || key.indexOf('_') === -1 ? key : camelCase(key);

    acc[newKey] = deep && isObject(value) ? toCamelCase(value as Record<string, unknown>, options) : value;
  });
}

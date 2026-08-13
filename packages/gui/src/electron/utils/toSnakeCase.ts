import { snakeCase, transform, isArray, isObject } from 'lodash';

type CaseOptions = {
  deep?: boolean;
};

export default function toSnakeCase(
  object: Record<string, unknown>,
  options: CaseOptions = {},
): Record<string, unknown> {
  const { deep = true } = options;

  if (typeof object !== 'object' || object === null) {
    return object;
  }

  return transform(object, (acc, value, key, target) => {
    const newKey = isArray(target) ? key : snakeCase(key);

    acc[newKey] = deep && isObject(value) ? toSnakeCase(value as Record<string, unknown>, options) : value;
  });
}

import { snakeCase, transform, isArray, isObject } from 'lodash';

export default function toSnakeCase(object: Object): { [key: string]: unknown } {
  return transform(object, (acc, value, key, target) => {
    const newKey = isArray(target) ? key : snakeCase(key);

    acc[newKey] = isObject(value) ? toSnakeCase(value) : value;
  });
}

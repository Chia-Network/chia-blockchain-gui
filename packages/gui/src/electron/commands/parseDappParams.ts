import JSONbig from 'json-bigint';

import toSnakeCase from '../utils/toSnakeCase';

import { type ParamSchema } from './Commands';
import { getDappCommandSchema } from './getDappCommandSchema';

export function parseDappParams(dappCommand: string, params: string): Record<string, unknown> {
  const dappCommandSchema = getDappCommandSchema(dappCommand);

  // snake-case before any field read so case-folding can't dodge the gate.
  const parsedParams = toSnakeCase(JSONbig({ useNativeBigInt: true }).parse(params), {
    deep: !dappCommandSchema.preserveNestedDataKeys,
  });
  const dappParams = dappCommandSchema.params;

  // fast searching of params
  const dappParamsMap = new Map<string, ParamSchema>();
  for (const param of dappParams) {
    dappParamsMap.set(param.name, param);
  }

  // remove fingerprint from params if it is not allowed for the dapp
  if ('fingerprint' in parsedParams && !dappParamsMap.has('fingerprint')) {
    delete parsedParams.fingerprint;
  }

  // add default values if they are not provided (aliases can use them)
  const nextParams = {
    ...parsedParams,
  };

  // validate via assert if all params are allowed for the dapp
  Object.keys(nextParams).forEach((key) => {
    if (!dappParamsMap.has(key)) {
      throw new Error(`param not allowed for dapp: ${key}`);
    }
  });

  // apply all default values if they are not provided (aliases can use them)
  // devs can apply default values that are not in params list
  if (dappCommandSchema.defaults) {
    for (const [key, value] of Object.entries(dappCommandSchema.defaults)) {
      if (nextParams[key] === undefined) {
        nextParams[key] = value;
      }
    }
  }

  // validate if all required params are provided and set the correct types
  for (const param of dappParams) {
    const { name, type, isOptional } = param;

    const value = nextParams[name];

    // verify if all isOptional !== true params are provided
    if (isOptional !== true && value === undefined) {
      throw new Error(`param is required: ${name}`);
    }

    // parse value to the correct types
    if (value !== undefined) {
      if (type === 'string') {
        nextParams[name] = String(value);
      } else if (type === 'number') {
        nextParams[name] = Number(value);
        if (Number.isNaN(nextParams[name])) {
          throw new Error(`Invalid number value for argument ${name}. Value: ${value}`);
        }
      } else if (type === 'bool') {
        if (typeof value !== 'boolean') {
          throw new Error(`Invalid boolean value for argument ${name}. Value: ${value}`);
        }
        nextParams[name] = value;
      } else if (type === 'bigint') {
        if (typeof value !== 'string' && typeof value !== 'number' && typeof value !== 'bigint') {
          throw new Error(`Invalid bigint value for argument ${name}. Value: ${value}`);
        }

        if (typeof value === 'number' && !Number.isSafeInteger(value)) {
          throw new Error(`Invalid bigint value for argument ${name}. Value: ${value}`);
        }

        if (typeof value === 'string') {
          const trimmed = value.trim();
          if (trimmed === '') {
            throw new Error(`Invalid bigint value for argument ${name}. Value: ${value}`);
          }
        }

        const bigintValue = BigInt(value);
        if (bigintValue.toString() !== value.toString()) {
          throw new Error(`Invalid bigint value for argument ${name}. Value: ${value}`);
        }

        nextParams[name] = bigintValue;
      }
    }
  }

  return nextParams;
}

import JSONBig from 'json-bigint';

import { i18n } from '../../config/locales';
// import { lookupCat } from '../utils/dappEnrichment';
import mojoToCatLocaleString from '../utils/mojoToCATLocaleString';
import mojoToChiaLocaleString from '../utils/mojoToChiaLocaleString';
import { parseMojos } from '../utils/parseMojos';

import { type ParamSchema } from './Commands';

function formatMojoXch(amount: unknown, networkPrefix?: string): string {
  const formatted = mojoToChiaLocaleString(amount as string | number);
  return networkPrefix ? `${formatted} ${networkPrefix.toUpperCase()}` : formatted;
}

async function formatMojoCat(amount: unknown, data: Record<string, unknown>): Promise<string> {
  const mojo = parseMojos(amount);

  const formatted = mojoToCatLocaleString(mojo);
  const walletIdRaw = data.wallet_id;

  if (walletIdRaw === undefined || walletIdRaw === null) {
    return formatted;
  }

  return formatted;

  // TODO add lookupCat
  // const cat = await lookupCat(walletIdRaw as number | string);
  // return cat?.displayName ? `${formatted} ${cat.displayName}` : formatted;
}

export async function humanizeParamValue(
  param: ParamSchema,
  value: unknown,
  data: Record<string, unknown>,
  networkPrefix?: string,
): Promise<string> {
  if (value === null || value === undefined) {
    return i18n._(/* i18n */ { id: 'Not provided' });
  }

  const { type, humanize } = param;

  if (humanize) {
    switch (humanize) {
      case 'mojo-to-xch':
        return formatMojoXch(value, networkPrefix);
      case 'mojo-to-cat':
        return formatMojoCat(value, data);
      default:
        throw new Error('Unhandled humanize type');
    }
  }

  switch (type) {
    case 'string':
    case 'number':
      return String(value);
    case 'bigint':
      return BigInt(value as string | number | bigint).toString();
    case 'bool':
      return value === true ? i18n._(/* i18n */ { id: 'Yes' }) : i18n._(/* i18n */ { id: 'No' });
    case 'json':
      try {
        return JSONBig.stringify(value, null, 2);
      } catch {
        return String(value);
      }
    default: {
      throw new Error('Unhandled param type');
    }
  }
}

/*
if (value === undefined && !isOptional) {
  throw new Error(`Missing required argument ${name}`);
}

if (value !== undefined) {
  if (type === 'BigNumber') {
    parsedValues[name] = new BigNumber(value);

    if (parsedValues[name].isNaN()) {
      throw new Error(`Invalid BigNumber value for argument ${name}. Value: ${value}`);
    }
  } else if (type === 'number') {
    parsedValues[name] = Number(value);

    if (Number.isNaN(parsedValues[name])) {
      throw new Error(`Invalid number value for argument ${name}. Value: ${value}`);
    }
  } else if (type === 'boolean') {
    parsedValues[name] = Boolean(value);
  } else if (type === 'string') {
    parsedValues[name] = String(value);
  } else {
    parsedValues[name] = value;
  }

  */

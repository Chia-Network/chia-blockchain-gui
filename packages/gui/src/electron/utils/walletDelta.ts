import { isNumericKey } from './isNumericKey';
import { isPlainObject } from './isPlainObject';
import { parseMojos } from './parseMojos';

export type WalletDelta = {
  spending: Record<string, bigint>;
  receiving: Record<string, bigint>;
};

type OfferSummary = {
  offered: Record<string, unknown>;
  requested: Record<string, unknown>;
};

function parseKey(key: string, allowWalletId: boolean = false): string {
  if (typeof key !== 'string') {
    throw new Error('Key is not a string');
  }

  // Key names should be stable.
  if (key !== key.toLowerCase().trim()) {
    throw new Error('Key is not a valid asset ID');
  }

  // take offer summary is using xch but never direct wallet id
  if (!allowWalletId && isNumericKey(key)) {
    throw new Error('Key is not a valid asset ID');
  }

  // create_offer_for_ids is using 1 for chia
  if (allowWalletId && key === 'xch') {
    throw new Error('XCH is not a valid asset ID');
  }

  if (key === 'xch') {
    return '1';
  }

  return key;
}

export function createOfferToWalletDelta(offer: Record<string, unknown>): WalletDelta {
  const walletDelta: WalletDelta = {
    spending: {},
    receiving: {},
  };

  if (!isPlainObject(offer)) {
    throw new Error('Offer is not valid');
  }

  for (const [key, value] of Object.entries(offer)) {
    const amount = parseMojos(value, true);

    const parsedKey = parseKey(key, true);

    if (amount < 0) {
      if (parsedKey in walletDelta.spending) {
        throw new Error('Offer is not valid');
      }

      walletDelta.spending[parsedKey] = -amount;
    } else {
      if (parsedKey in walletDelta.receiving) {
        throw new Error('Offer is not valid');
      }

      walletDelta.receiving[parsedKey] = amount;
    }
  }

  return walletDelta;
}

export function offerSummaryToWalletDelta(summary: OfferSummary): WalletDelta {
  const walletDelta: WalletDelta = {
    spending: {},
    receiving: {},
  };

  if (!isPlainObject(summary) || !isPlainObject(summary.offered) || !isPlainObject(summary.requested)) {
    throw new Error('Offer is not valid');
  }

  for (const [key, value] of Object.entries(summary.requested)) {
    const parsedKey = parseKey(key);
    walletDelta.spending[parsedKey] = parseMojos(value);
  }

  for (const [key, value] of Object.entries(summary.offered)) {
    const parsedKey = parseKey(key);
    walletDelta.receiving[parsedKey] = parseMojos(value);
  }

  return walletDelta;
}

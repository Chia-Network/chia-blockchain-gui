import { toBech32m, WalletType } from '@chia-network/api';
import { mojoToChia, mojoToCAT } from '@chia-network/core';
import BigNumber from 'bignumber.js';

import OfferBuilderData from '../@types/OfferBuilderData';
import createDefaultValues from '../components/offers2/utils/createDefaultValues';
import { AssetIdMapEntry } from '../hooks/useAssetIdName';

import parseCreateOfferForIdsKey from './parseCreateOfferForIdsKey';

export default function createOfferForIdsToOfferBuilderData(
  walletIdsAndAmounts: Record<string, number>,
  lookupByWalletId: (walletId: string | number) => AssetIdMapEntry | undefined,
  fee?: string,
): OfferBuilderData {
  const offerBuilderData: OfferBuilderData = createDefaultValues();
  Object.entries(walletIdsAndAmounts).forEach(([walletOrAssetId, amount]) => {
    const numericValue = new BigNumber(amount);

    if (numericValue.isNaN()) {
      if (amount === null) {
        throw new Error(`Amount is not set for walletId(assetId):${walletOrAssetId}`);
      }
      throw new Error(`Invalid amount '${amount}' for walletId(assetId):${walletOrAssetId}`);
    }

    const parsedKey = parseCreateOfferForIdsKey(walletOrAssetId);

    const section = numericValue.isPositive() ? offerBuilderData.requested : offerBuilderData.offered;

    try {
      if (parsedKey.type === 'walletId') {
        const asset = lookupByWalletId(parsedKey.walletId);

        if (asset) {
          switch (asset.walletType) {
            case WalletType.STANDARD_WALLET:
              section.xch.push({ amount: mojoToChia(numericValue.abs()).toFixed() });
              break;
            case WalletType.CAT:
            case WalletType.RCAT:
              section.tokens.push({ amount: mojoToCAT(numericValue.abs()).toFixed(), assetId: asset.assetId });
              break;
            default:
              break;
          }
        }
      } else {
        const nftId = toBech32m(parsedKey.normalizedHex, 'nft');
        section.nfts.push({ nftId });
      }
    } catch (e) {
      console.error(e);
    }
  });

  if (fee) {
    offerBuilderData.offered.fee = [{ amount: mojoToChia(fee).toFixed() }];
  }

  return offerBuilderData;
}

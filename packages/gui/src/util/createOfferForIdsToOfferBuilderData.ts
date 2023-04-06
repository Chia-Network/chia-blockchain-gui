import { toBech32m, WalletType } from '@chia-network/api';
import { mojoToChia, mojoToCAT } from '@chia-network/core';
import BigNumber from 'bignumber.js';

import OfferBuilderData from '../@types/OfferBuilderData';
import createDefaultValues from '../components/offers2/utils/createDefaultValues';
import { AssetIdMapEntry } from '../hooks/useAssetIdName';

export default function createOfferForIdsToOfferBuilderData(
  walletIdsAndAmounts: Record<string, number>,
  lookupByWalletId: (walletId: string) => AssetIdMapEntry | undefined
): OfferBuilderData {
  const offerBuilderData: OfferBuilderData = createDefaultValues();
  Object.entries(walletIdsAndAmounts).forEach(([walletOrAssetId, amount]) => {
    const numericValue = new BigNumber(amount);

    if (numericValue.isNaN()) {
      throw new Error(`Invalid value for ${walletOrAssetId}: ${amount}`);
    }

    const section = numericValue.isPositive() ? offerBuilderData.requested : offerBuilderData.offered;

    try {
      const asset = lookupByWalletId(walletOrAssetId);

      if (asset) {
        switch (asset.walletType) {
          case WalletType.STANDARD_WALLET:
            section.xch.push({ amount: mojoToChia(numericValue.abs()).toFixed() });
            break;
          case WalletType.CAT:
            section.tokens.push({ amount: mojoToCAT(numericValue.abs()).toFixed(), assetId: asset.assetId });
            break;
          default:
            break;
        }
      } else {
        const nftId = toBech32m(walletOrAssetId, 'nft');
        section.nfts.push({ nftId });
      }
    } catch (e) {
      console.error(e);
    }
  });

  return offerBuilderData;
}

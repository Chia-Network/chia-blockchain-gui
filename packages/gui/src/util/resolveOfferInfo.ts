import { OfferSummaryRecord } from '@chia-network/api';
import { t } from '@lingui/macro';

import OfferAsset from '../components/offers/OfferAsset';
import { offerAssetTypeForAssetId, formatAmountForWalletType } from '../components/offers/utils';
import { launcherIdToNFTId } from './nfts';

export default function resolveOfferInfo(
  summary: OfferSummaryRecord,
  summaryKey: string,
  lookupByAssetId: (assetId: string) => any | undefined
) {
  const resolvedOfferInfo = Object.entries(summary[summaryKey]).map(([assetId, amount]) => {
    const assetType = offerAssetTypeForAssetId(assetId, summary);
    const assetIdInfo = assetType === OfferAsset.NFT ? undefined : lookupByAssetId(assetId);
    const displayAmount = assetIdInfo ? formatAmountForWalletType(amount as number, assetIdInfo.walletType) : amount;
    let displayName = '';
    if (assetType === OfferAsset.NFT) {
      displayName = launcherIdToNFTId(assetId);
    } else {
      displayName = assetIdInfo?.displayName ?? t`Unknown CAT`;
    }
    return {
      displayAmount,
      displayName,
      assetType,
    };
  });
  return resolvedOfferInfo;
}

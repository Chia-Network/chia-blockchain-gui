import { AssetStatusForOffer } from 'util/offerBuilderDataToOffer';

import { OfferSummaryRecord, WalletType } from '@chia-network/api';
import { Flex, TooltipIcon } from '@chia-network/core';
import { t, Trans } from '@lingui/macro';
import { Chip } from '@mui/material';
import BigNumber from 'bignumber.js';
import { OfferTradeRecordFormatted } from 'hooks/useWalletOffers';
import React from 'react';

import OfferAsset from '../components/offers/OfferAsset';
import { offerAssetTypeForAssetId, formatAmountForWalletType } from '../components/offers/utils';
import type { AssetIdMapEntry } from '../hooks/useAssetIdName';

import { launcherIdToNFTId } from './nfts';

export type PendingAsset = {
  type: AssetStatusForOffer['type'];
  assetId?: string;
  amount: BigNumber;
};

/**
 * Compiling pending asset type/id/amount from offer dict
 */
export function resolvePendingAssets(offer: OfferTradeRecordFormatted): PendingAsset[] {
  const pendingAssets: PendingAsset[] = [];
  const pendingAssetIds = Object.keys(offer.pending) as string[];
  for (let m = 0; m < pendingAssetIds.length; m++) {
    const assetId = pendingAssetIds[m];
    const amount = new BigNumber(offer.pending[assetId]);
    let type: AssetStatusForOffer['type'] | undefined;
    if (assetId.toUpperCase() === 'XCH' || assetId.toUpperCase() === 'UNKNOWN') {
      type = 'XCH';
    } else {
      const info = offer.summary.infos[assetId];
      type = info.type.toUpperCase() as 'CAT' | 'SINGLETON';
    }
    pendingAssets.push({ type, assetId, amount });
  }

  return pendingAssets;
}

export default function resolveOfferInfo(
  summary: OfferSummaryRecord,
  summaryKey: 'offered' | 'requested',
  lookupByAssetId: (assetId: string) => AssetIdMapEntry | undefined,
) {
  return Object.entries(summary[summaryKey]).map(([assetId, amount]) => {
    const assetType = offerAssetTypeForAssetId(assetId, summary);

    function getTokenDisplayName(tokenAssetId: string) {
      const info = lookupByAssetId(tokenAssetId);

      const displayName = info?.displayName ?? t`Unknown CAT`;

      if (info?.walletType === WalletType.RCAT) {
        return (
          <>
            {displayName}
            &nbsp;
            <Chip
              label={
                <Flex alignItems="center" gap={1}>
                  <Trans>Revocable</Trans>
                  <TooltipIcon>
                    <Trans>This token can be revoked by the issuer</Trans>
                  </TooltipIcon>
                </Flex>
              }
              variant="outlined"
              size="small"
            />
          </>
        );
      }

      return displayName;
    }

    switch (assetType) {
      case OfferAsset.CHIA:
        return {
          displayAmount: formatAmountForWalletType(amount, WalletType.STANDARD_WALLET),
          displayName: lookupByAssetId(assetId)?.displayName ?? assetId.toUpperCase(),
          assetType,
        };
      case OfferAsset.TOKEN:
        return {
          displayAmount: formatAmountForWalletType(amount, WalletType.CAT),
          displayName: getTokenDisplayName(assetId),
          assetType,
        };
      case OfferAsset.NFT:
        return {
          displayAmount: amount,
          displayName: launcherIdToNFTId(assetId),
          assetType,
        };
      default:
        return {
          displayAmount: amount,
          displayName: t`Unknown Asset`,
          assetType,
        };
    }
  });
}

export function resolveOfferInfoWithPendingAmounts(
  offer: OfferTradeRecordFormatted,
  summaryKey: 'offered' | 'requested',
  lookupByAssetId: (assetId: string) => AssetIdMapEntry | undefined,
) {
  const { summary } = offer;
  const pendingAssets = resolvePendingAssets(offer);

  const resolvedOfferInfo = Object.entries(summary[summaryKey]).map(([assetId, amount]) => {
    const assetType = offerAssetTypeForAssetId(assetId, summary);
    const isNFT = assetType === OfferAsset.NFT;
    const assetIdInfo = isNFT ? undefined : lookupByAssetId(assetId);
    let pendingAmount = new BigNumber(0);
    for (let i = 0; i < pendingAssets.length; i++) {
      const pa = pendingAssets[i];
      if (pa.type === 'XCH' && ['XCH', 'UNKNOWN'].includes(assetId.toUpperCase())) {
        // assetId: unknown likely to be fee
        pendingAmount = pendingAmount.plus(pa.amount);
      } else if (pa.assetId === assetId) {
        pendingAmount = pendingAmount.plus(pa.amount);
      }
    }
    const displayPendingAmount = assetIdInfo
      ? formatAmountForWalletType(pendingAmount.toNumber(), assetIdInfo.walletType)
      : pendingAmount.toNumber();
    const displayAmount = assetIdInfo ? formatAmountForWalletType(amount, assetIdInfo.walletType) : amount;
    let displayName = '';
    if (isNFT) {
      displayName = launcherIdToNFTId(assetId);
    } else {
      displayName = assetIdInfo?.displayName ?? t`Unknown CAT`;
    }
    return {
      displayAmount,
      displayPendingAmount,
      displayName,
      assetType,
    };
  });
  return resolvedOfferInfo;
}

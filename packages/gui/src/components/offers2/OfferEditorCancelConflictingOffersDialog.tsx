import { ConfirmDialog, Flex } from '@chia-network/core';
import { Trans } from '@lingui/macro';
import { Typography, Divider } from '@mui/material';
import BigNumber from 'bignumber.js';
import { OfferTradeRecordFormatted } from 'hooks/useWalletOffers';
import React, { useMemo, useState, useCallback } from 'react';

import { AssetStatusForOffer } from '../../util/offerBuilderDataToOffer';
import { PendingAsset, resolvePendingAssets } from '../../util/resolveOfferInfo';
import CancelOfferList from './CancelOfferList';

/* ========================================================================== */
/*                      Offer Editor Conflict Resolver Dialog                 */
/* ========================================================================== */

/**
 * When pending assets locked by open offers are unlocked (meaning that open offers are canceled),
 * spendable balance for the asset will be refilled.
 * This function calculates the refilling amount for an offer status dict.
 * Note that offer status dict is constructed from all open offers and grouped by asset id.
 */
function getSpendableAmountUponUnlockingAssets(assetStatus: AssetStatusForOffer, assetsToBeUnlocked: PendingAsset[]) {
  let { spendableAmount } = assetStatus;
  for (let s = 0; s < assetsToBeUnlocked.length; s++) {
    const lockedAsset = assetsToBeUnlocked[s];
    if (lockedAsset.type === 'XCH' && assetStatus.type === 'XCH') {
      // assetId might be either 'XCH' or 'UNKNOWN'(maybe fee) but here both are treated as just a XCH spending
      spendableAmount = spendableAmount.plus(lockedAsset.amount);
    } else if (lockedAsset.type === assetStatus.type && lockedAsset.assetId === assetStatus.assetId) {
      if (assetStatus.type === 'CAT') {
        spendableAmount = spendableAmount.plus(lockedAsset.amount);
      }
      // We don't care spendable amount for (offerToModify.type === 'SINGLETON') (NFT)
    }
  }

  return spendableAmount;
}

export type OfferEditorCancelConflictingOffersDialogProps = {
  assetsToUnlock: AssetStatusForOffer[];
  assetsBetterUnlocked: AssetStatusForOffer[];
  allowSecureCancelling?: boolean;
};

export default function OfferEditorCancelConflictingOffersDialog(props: OfferEditorCancelConflictingOffersDialogProps) {
  const {
    assetsToUnlock: initialAssetsToUnlock,
    assetsBetterUnlocked: initialAssetsBetterUnlocked,
    allowSecureCancelling,
    ...rest
  } = props;
  const [assetsToUnlock, setAssetsToUnlock] = useState(initialAssetsToUnlock);
  const [assetsBetterUnlocked, setAssetsBetterUnlocked] = useState(initialAssetsBetterUnlocked);

  const offersRequiredToBeCanceled = useMemo(() => {
    const offerRecords = new Set<OfferTradeRecordFormatted>();
    for (let i = 0; i < assetsToUnlock.length; i++) {
      const item = assetsToUnlock[i];
      for (let k = 0; k < item.relevantOffers.length; k++) {
        const o = item.relevantOffers[k];
        offerRecords.add(o);
      }
    }
    return Array.from(offerRecords);
  }, [assetsToUnlock]);

  const offersBetterToBeCanceled = useMemo(() => {
    const offerRecords = new Set<OfferTradeRecordFormatted>();
    for (let i = 0; i < assetsBetterUnlocked.length; i++) {
      const item = assetsBetterUnlocked[i];
      for (let k = 0; k < item.relevantOffers.length; k++) {
        const o = item.relevantOffers[k];
        if (!offersRequiredToBeCanceled.find((o2) => o2 === o)) {
          offerRecords.add(o);
        }
      }
    }
    return Array.from(offerRecords);
  }, [assetsBetterUnlocked, offersRequiredToBeCanceled]);

  const onCancelOffer1 = useCallback(
    (tradeId: string, _secure: boolean, _fee: BigNumber) => {
      let isAssetsToUnlockUpdated = false;
      let isAssetsBetterUnlockUpdated = false;

      const assetsToUnlockUpdated: AssetStatusForOffer[] = [];
      const assetsBetterUnlockedAdded: AssetStatusForOffer[] = [];
      let lockedAssetsFoundIndex = -1;
      let lockedAssets: PendingAsset[] = [];

      for (let i = 0; i < assetsToUnlock.length; i++) {
        const atu = { ...assetsToUnlock[i] };
        const newRelevantOffers = [];
        for (let k = 0; k < atu.relevantOffers.length; k++) {
          const ro = atu.relevantOffers[k];
          if (ro.tradeId === tradeId) {
            const relevantOfferNotFoundYet = lockedAssetsFoundIndex === -1;
            // Assuming that an offer is unique by its tradeId.
            // When canceled offer is already identified by tradeId in previous loop,
            // no need to investigate locked assets anymore because we already know what they are
            // in previous loop.
            if (relevantOfferNotFoundYet) {
              // The code in this block only runs 0 or 1 time for the loop indexed by `i`
              lockedAssetsFoundIndex = i;
              lockedAssets = resolvePendingAssets(ro);

              // Modify values in assetsToUnlockUpdated before this loop.
              for (let p = 0; p < lockedAssetsFoundIndex; p++) {
                const assetToModify = assetsToUnlockUpdated[p];
                const newSpendableAmount = getSpendableAmountUponUnlockingAssets(assetToModify, lockedAssets);
                if (!newSpendableAmount.eq(assetToModify.spendableAmount)) {
                  isAssetsToUnlockUpdated = true;
                  assetsToUnlockUpdated[p] = { ...assetToModify, spendableAmount: newSpendableAmount };
                }

                if (assetsToUnlockUpdated[p].spendableAmount.gte(assetsToUnlockUpdated[p].spendingAmount)) {
                  isAssetsToUnlockUpdated = true;
                  assetsToUnlockUpdated[p] = {
                    ...assetsToUnlockUpdated[p],
                    status: 'alsoUsedInNewOfferWithoutConflict',
                  };
                }
              }
            }
          } else {
            newRelevantOffers.push(ro);
          }
        }

        const wasOfferRemoved = newRelevantOffers.length !== atu.relevantOffers.length;
        // Update relevant offers (Canceled offer is removed from original array)
        atu.relevantOffers = newRelevantOffers;

        // Modify spendableAmount in atc
        atu.spendableAmount = getSpendableAmountUponUnlockingAssets(atu, lockedAssets);
        const notRequiredToCancelAnymore = atu.spendableAmount.gte(atu.spendingAmount);

        if (notRequiredToCancelAnymore) {
          // If spending amount is less than or equal to spendable amount for assetType/assetId,
          // then the offer for the asset is not required to cancel anymore.
          isAssetsToUnlockUpdated = true;
          if (newRelevantOffers.length > 0) {
            isAssetsBetterUnlockUpdated = true;
            // The priority of canceling the offer goes down.
            assetsBetterUnlockedAdded.push({
              ...atu,
              status: 'alsoUsedInNewOfferWithoutConflict',
            });
          }
        } else if (wasOfferRemoved) {
          isAssetsToUnlockUpdated = true;
          assetsToUnlockUpdated.push(atu); // Will re-render since otc !== offersToCancel[i]. Remember that otc = {...offersToCancel[i]}.
        } else {
          assetsToUnlockUpdated.push(assetsToUnlock[i]); // Will NOT re-render since object keeps the same reference
        }
      }

      // Check whether `assetsBetterUnlocked` contains cancelling offer
      const newAssetsBetterUnlocked: AssetStatusForOffer[] = [];
      for (let i = 0; i < assetsBetterUnlocked.length; i++) {
        const abu = assetsBetterUnlocked[i];
        const newRelevantOffers: OfferTradeRecordFormatted[] = [];
        for (let k = 0; k < abu.relevantOffers.length; k++) {
          const ro = abu.relevantOffers[k];
          if (ro.tradeId === tradeId) {
            isAssetsBetterUnlockUpdated = true;
          } else {
            newRelevantOffers.push(ro);
          }
        }

        // When one of the relevantOffers is deleted, reflect it
        if (newRelevantOffers.length !== abu.relevantOffers.length) {
          if (newRelevantOffers.length > 0) {
            isAssetsBetterUnlockUpdated = true;
            // When newRelevantOffers.length === 0, the abu will be technically deleted by not pushing it into `newAssetsBetterUnlocked`
            newAssetsBetterUnlocked.push({
              ...abu,
              relevantOffers: newRelevantOffers,
            });
          }
        } else {
          newAssetsBetterUnlocked.push(abu);
        }
      }

      // Avoiding unnecessary re-render
      if (isAssetsToUnlockUpdated) {
        setAssetsToUnlock(assetsToUnlockUpdated);
      }
      if (isAssetsBetterUnlockUpdated) {
        if (assetsBetterUnlockedAdded.length > 0) {
          setAssetsBetterUnlocked([...assetsBetterUnlockedAdded, ...newAssetsBetterUnlocked]);
        } else {
          setAssetsBetterUnlocked(newAssetsBetterUnlocked);
        }
      }
    },
    [assetsToUnlock, setAssetsToUnlock, assetsBetterUnlocked, setAssetsBetterUnlocked]
  );

  const onCancelOffer2 = useCallback(
    (tradeId: string, _secure: boolean, _fee: BigNumber) => {
      let isAssetsBetterUnlockedUpdated = false;
      let isAssetsToUnlockUpdated = false;

      const assetsBetterUnlockedUpdated: AssetStatusForOffer[] = [];
      let lockedAssetsFoundIndex = -1;
      let lockedAssets: PendingAsset[] = [];

      for (let i = 0; i < assetsBetterUnlocked.length; i++) {
        const abu = { ...assetsBetterUnlocked[i] };
        const newRelevantOffers = [];
        for (let k = 0; k < abu.relevantOffers.length; k++) {
          const ro = abu.relevantOffers[k];
          if (ro.tradeId === tradeId) {
            const relevantOfferNotFoundYet = lockedAssetsFoundIndex === -1;
            // Assuming that an offer is unique by its tradeId.
            // When canceled offer is already identified by tradeId in previous loop,
            // no need to investigate locked assets anymore because we already know what they are
            // in previous loop.
            if (relevantOfferNotFoundYet) {
              // The code in this block only runs 0 or 1 time for the loop indexed by `i`
              lockedAssetsFoundIndex = i;
              lockedAssets = resolvePendingAssets(ro);

              // Modify values in assetsBetterUnlockedUpdated before this loop.
              for (let p = 0; p < lockedAssetsFoundIndex; p++) {
                const assetToModify = assetsBetterUnlockedUpdated[p];
                const newSpendableAmount = getSpendableAmountUponUnlockingAssets(assetToModify, lockedAssets);
                if (!newSpendableAmount.eq(assetToModify.spendableAmount)) {
                  assetsBetterUnlockedUpdated[p] = { ...assetToModify, spendableAmount: newSpendableAmount };
                }
              }
            }
          } else {
            newRelevantOffers.push(ro);
          }
        }

        const wasOfferRemoved = newRelevantOffers.length !== abu.relevantOffers.length;
        // Update relevant offers (Canceled offer is removed from original array)
        abu.relevantOffers = newRelevantOffers;

        // Modify spendableAmount in obc
        abu.spendableAmount = getSpendableAmountUponUnlockingAssets(abu, lockedAssets);

        if (wasOfferRemoved) {
          isAssetsBetterUnlockedUpdated = true;
          assetsBetterUnlockedUpdated.push(abu); // Will re-render since obc !== offersBetterCanceled[i]. Remember that obc = {...offersBetterCanceled[i]}.
        } else {
          assetsBetterUnlockedUpdated.push(assetsBetterUnlocked[i]); // Will NOT re-render since object keeps the same reference
        }
      }

      // Check whether `assetsToUnlock` contains cancelling offer
      const newAssetsToUnlock: AssetStatusForOffer[] = [];
      for (let i = 0; i < assetsToUnlock.length; i++) {
        const atu = assetsToUnlock[i];
        const newRelevantOffers: OfferTradeRecordFormatted[] = [];
        for (let k = 0; k < atu.relevantOffers.length; k++) {
          const ro = atu.relevantOffers[k];
          if (ro.tradeId === tradeId) {
            isAssetsToUnlockUpdated = true;
          } else {
            newRelevantOffers.push(ro);
          }
        }

        // When one of the relevantOffers is deleted, reflect it
        if (newRelevantOffers.length !== atu.relevantOffers.length) {
          if (newRelevantOffers.length > 0) {
            isAssetsToUnlockUpdated = true;
            // When newRelevantOffers.length === 0, the abu will be technically deleted by not pushing it into `newAssetsBetterUnlocked`
            newAssetsToUnlock.push({
              ...atu,
              relevantOffers: newRelevantOffers,
            });
          }
        } else {
          newAssetsToUnlock.push(atu);
        }
      }

      // Avoiding unnecessary re-render
      if (isAssetsBetterUnlockedUpdated) {
        setAssetsBetterUnlocked(assetsBetterUnlockedUpdated);
      }
      if (isAssetsToUnlockUpdated) {
        setAssetsToUnlock(newAssetsToUnlock);
      }
    },
    [assetsBetterUnlocked, setAssetsBetterUnlocked, assetsToUnlock, setAssetsToUnlock]
  );

  const CancelList1 = useMemo(() => {
    if (offersRequiredToBeCanceled.length === 0) {
      return null;
    }
    return (
      <Flex flexDirection="column" gap={2}>
        <Typography>
          <Trans>
            You have coins/assets locked for your open offers thus the spendable balance is not sufficient for the
            amounts you are offering. You need to cancel open offers to unlock coins/asset for the new offer.
          </Trans>
        </Typography>
        <CancelOfferList
          offers={offersRequiredToBeCanceled}
          title={<Trans>Open offers required to be canceled to refill spendable amount</Trans>}
          onOfferCanceled={onCancelOffer1}
          allowSecureCancelling={allowSecureCancelling}
        />
      </Flex>
    );
  }, [offersRequiredToBeCanceled, onCancelOffer1, allowSecureCancelling]);

  const CancelList2 = useMemo(() => {
    if (offersBetterToBeCanceled.length === 0) {
      return null;
    }
    return (
      <Flex flexDirection="column" gap={2}>
        <Typography>
          <Trans>
            You have open offers which lock the same assets as your new offer. You may want to cancel those offers if
            they are no longer needed.
          </Trans>
        </Typography>
        <CancelOfferList
          offers={offersBetterToBeCanceled}
          title={<Trans>Open offers which lock the same assets as the new offer</Trans>}
          onOfferCanceled={onCancelOffer2}
          allowSecureCancelling={allowSecureCancelling}
        />
      </Flex>
    );
  }, [offersBetterToBeCanceled, onCancelOffer2, allowSecureCancelling]);

  const needDivider = initialAssetsToUnlock.length > 0 && initialAssetsBetterUnlocked.length > 0;
  const divider = useMemo(() => {
    if (needDivider) {
      return <Divider orientation="horizontal" flexItem />;
    }
    return undefined;
  }, [needDivider]);

  const offerAllCleared = useMemo(() => {
    if (offersRequiredToBeCanceled.length + offersBetterToBeCanceled.length > 0) {
      return null;
    }
    return (
      <Flex>
        <Typography>
          <Trans>All offers which lock coins/assets quoted by the new offer have been cleared!</Trans>
        </Typography>
      </Flex>
    );
  }, [offersRequiredToBeCanceled, offersBetterToBeCanceled]);

  return (
    <ConfirmDialog
      title={<Trans>Remove Conflicting Offer</Trans>}
      confirmTitle={<Trans>Proceed</Trans>}
      confirmColor="primary"
      cancelTitle={<Trans>Cancel</Trans>}
      fullWidth
      maxWidth="md"
      disableConfirmButton={offersRequiredToBeCanceled.length > 0}
      {...rest}
    >
      <Flex flexDirection="column" gap={2} divider={divider}>
        {CancelList1}
        {CancelList2}
        {offerAllCleared}
      </Flex>
    </ConfirmDialog>
  );
}

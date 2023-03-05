import { OfferStatus } from 'util/offerBuilderDataToOffer';

import { ConfirmDialog, Flex } from '@chia-network/core';
import { Trans } from '@lingui/macro';
import { Typography, Divider } from '@mui/material';
import BigNumber from 'bignumber.js';
import { OfferTradeRecordFormatted } from 'hooks/useWalletOffers';
import React, { useMemo, useState, useCallback } from 'react';

import CancelOfferList from './CancelOfferList';

/* ========================================================================== */
/*                      Offer Editor Conflict Resolver Dialog                 */
/* ========================================================================== */

export type OfferEditorCancelConflictingOffersDialogProps = {
  offersToCancel: OfferStatus[];
  offersBetterCanceled: OfferStatus[];
};

export default function OfferEditorCancelConflictingOffersDialog(props: OfferEditorCancelConflictingOffersDialogProps) {
  const { offersToCancel: initialOffersToCancel, offersBetterCanceled: initialOffersBetterCanceled, ...rest } = props;
  const [offersToCancel, setOffersToCancel] = useState(initialOffersToCancel);
  const [offersBetterCanceled, setOffersBetterCanceled] = useState(initialOffersBetterCanceled);

  const offersRequiredToBeCanceled = useMemo(() => {
    let offerRecords: OfferTradeRecordFormatted[] = [];
    for (let i = 0; i < offersToCancel.length; i++) {
      const item = offersToCancel[i];
      offerRecords = offerRecords.concat(item.relevantOffers);
    }
    return offerRecords;
  }, [offersToCancel]);

  const offersBetterToBeCanceled = useMemo(() => {
    let offerRecords: OfferTradeRecordFormatted[] = [];
    for (let i = 0; i < offersBetterCanceled.length; i++) {
      const item = offersBetterCanceled[i];
      offerRecords = offerRecords.concat(item.relevantOffers);
    }
    return offerRecords;
  }, [offersBetterCanceled]);

  const onCancelOffer1 = useCallback(
    (tradeId: string, _secure: boolean, _fee: BigNumber) => {
      let isUpdated = false;

      const offersToCancelUpdated: OfferStatus[] = [];
      const offersBetterCanceledAdded: OfferStatus[] = [];
      let lockedAssetsFoundIndex = -1;
      const lockedAssets: Array<{ type: OfferStatus['type']; assetId?: string; amount: BigNumber }> = [];

      for (let i = 0; i < offersToCancel.length; i++) {
        const otc = { ...offersToCancel[i] };
        const offers = [];
        for (let k = 0; k < otc.relevantOffers.length; k++) {
          const ro = otc.relevantOffers[k];
          if (ro.tradeId === tradeId) {
            const relevantOfferNotFoundYet = lockedAssetsFoundIndex === -1;
            // Assuming that an offer is unique by its tradeId.
            // When canceled offer is already identified by tradeId in previous loop,
            // no need to investigate locked assets anymore because we already know what they are
            // in previous loop.
            if (relevantOfferNotFoundYet) {
              // The code in this block only runs 0 or 1 time for the loop indexed by `i`
              lockedAssetsFoundIndex = i;
              const lockedAssetIds = Object.keys(ro.pending) as string[];
              for (let m = 0; m < lockedAssetIds.length; m++) {
                const assetId = lockedAssetIds[m];
                const amount = new BigNumber(ro.pending[assetId]);
                let type: OfferStatus['type'] | undefined;
                if (assetId.toUpperCase() === 'XCH' || assetId.toUpperCase() === 'UNKNOWN') {
                  type = 'XCH';
                } else {
                  const info = ro.summary.infos[assetId];
                  type = info.type.toUpperCase() as 'CAT' | 'SINGLETON';
                }
                lockedAssets.push({ type, assetId, amount });
              }
              // Modify values in offersToCancelUpdated before this loop.
              for (let p = 0; p < lockedAssetsFoundIndex; p++) {
                const offerToModify = offersToCancelUpdated[p];
                for (let s = 0; s < lockedAssets.length; s++) {
                  const lockedAsset = lockedAssets[s];
                  if (lockedAsset.type === 'XCH' && offerToModify.type === 'XCH') {
                    // assetId might be either 'XCH' or 'UNKNOWN'(maybe fee) but here both are treated as just a XCH spending
                    const spendableAmount = offerToModify.spendableAmount.plus(lockedAsset.amount);
                    offersToCancelUpdated[p] = { ...offerToModify, spendableAmount };
                  } else if (lockedAsset.type === offerToModify.type && lockedAsset.assetId === offerToModify.assetId) {
                    if (offerToModify.type === 'CAT') {
                      const spendableAmount = offerToModify.spendableAmount.plus(lockedAsset.amount);
                      offersToCancelUpdated[p] = { ...offerToModify, spendableAmount };
                    }
                    // We don't care spendable amount for (offerToModify.type === 'SINGLETON') (NFT)
                  }
                }
              }
            }
          } else {
            offers.push(ro);
          }
        }

        // Modify values in otc
        for (let s = 0; s < lockedAssets.length; s++) {
          const lockedAsset = lockedAssets[s];
          if (lockedAsset.type === 'XCH' && otc.type === 'XCH') {
            // assetId might be either 'XCH' or 'UNKNOWN'(maybe fee) but here both are treated as just a XCH spending
            otc.spendableAmount = otc.spendableAmount.plus(lockedAsset.amount);
          } else if (lockedAsset.type === otc.type && lockedAsset.assetId === otc.assetId) {
            if (otc.type === 'CAT') {
              otc.spendableAmount = otc.spendableAmount.plus(lockedAsset.amount);
            }
            // We don't care spendable amount for (otc.type === 'SINGLETON') (NFT)
          }
        }

        if (otc.spendableAmount.gte(otc.spendingAmount)) {
          // If spending amount is less than or equal to spendable amount for assetType/assetId,
          // then the offer for the asset is not required to cancel anymore.
          isUpdated = true;
          // The priority of canceling the offer goes down.
          offersBetterCanceledAdded.push(otc);
        } else if (offers.length !== otc.relevantOffers.length) {
          isUpdated = true;
          otc.relevantOffers = offers;
          offersToCancelUpdated.push(otc); // Will re-render since otc !== offersToCancel[i]. Remember that otc = {...offersToCancel[i]}.
        } else {
          offersToCancelUpdated.push(offersToCancel[i]); // Will NOT re-render since object keeps the same reference
        }
      }

      // Avoiding unnecessary re-render
      if (isUpdated) {
        setOffersToCancel(offersToCancelUpdated);
        if (offersBetterCanceledAdded.length > 0) {
          setOffersBetterCanceled([...offersBetterCanceledAdded, ...offersBetterCanceled]);
        }
      }
    },
    [offersToCancel, setOffersToCancel, offersBetterCanceled, setOffersBetterCanceled]
  );

  const onCancelOffer2 = useCallback(
    (tradeId: string, _secure: boolean, _fee: BigNumber) => {
      let isUpdated = false;
      const offersBetterCanceledUpdated = offersBetterCanceled.map((otc) => {
        const offers = [];
        for (let i = 0; i < otc.relevantOffers.length; i++) {
          const o = otc.relevantOffers[i];
          if (o.tradeId !== tradeId) {
            offers.push(o);
          }
        }
        if (offers.length !== otc.relevantOffers.length) {
          isUpdated = true;
          return { ...otc, relevantOffers: offers };
        }
        return otc;
      });
      // Avoiding unnecessary re-render
      if (isUpdated) {
        setOffersBetterCanceled(offersBetterCanceledUpdated);
      }
    },
    [offersBetterCanceled, setOffersBetterCanceled]
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
          title={<Trans>Offers required to be canceled to refill spendable amount</Trans>}
          onOfferCanceled={onCancelOffer1}
        />
      </Flex>
    );
  }, [offersRequiredToBeCanceled, onCancelOffer1]);

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
          title={<Trans>Offers which lock the same assets as the new offer</Trans>}
          onOfferCanceled={onCancelOffer2}
        />
      </Flex>
    );
  }, [offersBetterToBeCanceled, onCancelOffer2]);

  const needDivider = initialOffersToCancel.length > 0 && initialOffersBetterCanceled.length > 0;
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

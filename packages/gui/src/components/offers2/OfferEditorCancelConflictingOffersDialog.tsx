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
      const offersToCancelUpdated = offersToCancel.map((otc) => {
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
        setOffersToCancel(offersToCancelUpdated);
      }
    },
    [offersToCancel, setOffersToCancel]
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
    if (offersRequiredToBeCanceled.length > 0) {
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
    }
    return null;
  }, [offersRequiredToBeCanceled, onCancelOffer1]);

  const CancelList2 = useMemo(() => {
    if (offersBetterToBeCanceled.length > 0) {
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
    }
    return null;
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

import type { OfferSummaryRecord, Wallet } from '@chia-network/api';
import { useTakeOfferMutation } from '@chia-network/api-react';
import { AlertDialog, chiaToMojo, useOpenDialog, useShowError } from '@chia-network/core';
import { Trans, t } from '@lingui/macro';
import BigNumber from 'bignumber.js';
import React from 'react';

import OfferAcceptConfirmationDialog from '../components/offers/OfferAcceptConfirmationDialog';
import OfferAsset from '../components/offers/OfferAsset';
import { offerAssetTypeForAssetId } from '../components/offers/utils';
import OfferEditorConflictAlertDialog from '../components/offers2/OfferEditorCancelConflictingOffersDialog';
import offerBuilderDataToOffer from '../util/offerBuilderDataToOffer';
import offerToOfferBuilderData from '../util/offerToOfferBuilderData';
import useAssetIdName from './useAssetIdName';
import { OfferTradeRecordFormatted } from './useWalletOffers';

export type AcceptOfferHook = (
  offerData: string,
  offerSummary: OfferSummaryRecord,
  fee: string | undefined,
  wallets: Wallet[],
  offers: OfferTradeRecordFormatted[],
  onUpdate: (accepting: boolean) => void,
  onSuccess: () => void
) => Promise<void>;

export default function useAcceptOfferHook(): [AcceptOfferHook] {
  const openDialog = useOpenDialog();
  const showError = useShowError();
  const { lookupByAssetId } = useAssetIdName();
  const [takeOffer] = useTakeOfferMutation();

  async function acceptOffer(
    offerData: string,
    offerSummary: OfferSummaryRecord,
    fee: string | undefined,
    wallets: Wallet[],
    offers: OfferTradeRecordFormatted[],
    onUpdate?: (accepting: boolean) => void,
    onSuccess?: () => void
  ): Promise<void> {
    const offerBuilderData = offerToOfferBuilderData(offerSummary, true);
    const { assetsToUnlock } = await offerBuilderDataToOffer({
      data: offerBuilderData,
      wallets,
      offers: offers || [],
      validateOnly: false,
      considerNftRoyalty: true,
      allowEmptyOfferColumn: true, // When accepting a one-sided offer, nothing is required in the offer column
    });

    const assetsRequiredToBeUnlocked = [];
    const assetsBetterToBeUnlocked = [];
    for (let i = 0; i < assetsToUnlock.length; i++) {
      const atu = assetsToUnlock[i];
      if (atu.status === 'conflictsWithNewOffer') {
        assetsRequiredToBeUnlocked.push(atu);
      } else if (atu.status === 'alsoUsedInNewOfferWithoutConflict') {
        assetsBetterToBeUnlocked.push(atu);
      }
    }

    if (assetsRequiredToBeUnlocked.length + assetsBetterToBeUnlocked.length > 0) {
      const dialog = (
        <OfferEditorConflictAlertDialog
          assetsToUnlock={assetsRequiredToBeUnlocked}
          // assetsBetterUnlocked={assetsBetterToBeUnlocked}
          assetsBetterUnlocked={[]} // Ignoring assetsBetterToBeUnlocked to avoid displaying the dialog unnecessarily
        />
      );
      const confirmedToProceed = await openDialog(dialog);
      if (!confirmedToProceed) {
        return;
      }
    }

    const feeInMojos: BigNumber = fee ? chiaToMojo(fee) : new BigNumber(0);
    const offeredUnknownCATs: string[] = Object.entries(offerSummary.offered)
      .filter(
        ([assetId]) =>
          offerAssetTypeForAssetId(assetId, offerSummary) !== OfferAsset.NFT && lookupByAssetId(assetId) === undefined
      )
      .map(([assetId]) => assetId);

    const confirmedAccept = await openDialog(<OfferAcceptConfirmationDialog offeredUnknownCATs={offeredUnknownCATs} />);

    if (!confirmedAccept) {
      return;
    }
    try {
      onUpdate?.(true);

      const response = await takeOffer({ offer: offerData, fee: feeInMojos }).unwrap();

      await openDialog(
        <AlertDialog title={<Trans>Success</Trans>}>
          {response.message ?? <Trans>Offer has been accepted and is awaiting confirmation.</Trans>}
        </AlertDialog>
      );

      onSuccess?.();
    } catch (e) {
      let error = e as Error;

      if (error.message.startsWith('insufficient funds')) {
        error = new Error(t`
          Insufficient funds available to accept offer. Ensure that your
          spendable balance is sufficient to cover the offer amount.
        `);
      }
      showError(error);
    } finally {
      onUpdate?.(false);
    }
  }

  return [acceptOffer];
}

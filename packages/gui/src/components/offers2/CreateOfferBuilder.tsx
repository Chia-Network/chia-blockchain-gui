import { WalletType } from '@chia-network/api';
import { useGetWalletsQuery, useCreateOfferForIdsMutation } from '@chia-network/api-react';
import { Flex, ButtonLoading, useOpenDialog, Loading } from '@chia-network/core';
import { t, Trans } from '@lingui/macro';
import { Grid } from '@mui/material';
import React, { useRef, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

import type OfferBuilderData from '../../@types/OfferBuilderData';
import useSuppressShareOnCreate from '../../hooks/useSuppressShareOnCreate';
import useWalletOffers from '../../hooks/useWalletOffers';
import offerBuilderDataToOffer from '../../util/offerBuilderDataToOffer';
import OfferEditorConfirmationDialog from '../offers/OfferEditorConfirmationDialog';
import OfferBuilder from './OfferBuilder';
import OfferEditorConflictAlertDialog from './OfferEditorCancelConflictingOffersDialog';
import OfferNavigationHeader from './OfferNavigationHeader';
import createDefaultValues from './utils/createDefaultValues';

export type CreateOfferBuilderProps = {
  walletType?: WalletType;
  assetId?: string;
  nftId?: string;
  nftWalletId?: number;
  referrerPath?: string;
  onOfferCreated: (obj: { offerRecord: any; offerData: any; address?: string }) => void;
  nftIds?: string[];
  isCounterOffer?: boolean;
  offer?: OfferBuilderData;
  address?: string;
};

export default function CreateOfferBuilder(props: CreateOfferBuilderProps) {
  const {
    referrerPath,
    onOfferCreated,
    walletType,
    assetId,
    nftId,
    nftWalletId,
    nftIds,
    isCounterOffer = false,
    offer,
    address,
  } = props;

  const openDialog = useOpenDialog();
  const navigate = useNavigate();
  const { data: wallets, isLoading: isLoadingWallets } = useGetWalletsQuery();
  const { offers, isLoading: isOffersLoading } = useWalletOffers(-1, 0, true, false, 'RELEVANCE', false);
  const [createOfferForIds] = useCreateOfferForIdsMutation();
  const offerBuilderRef = useRef<{ submit: () => void } | undefined>(undefined);

  const defaultValues = useMemo(() => {
    if (offer) {
      return offer;
    }
    return createDefaultValues({
      walletType,
      assetId,
      nftId,
      nftWalletId,
      nftIds,
    });
  }, [walletType, assetId, nftId, nftWalletId, nftIds, offer]);

  const [suppressShareOnCreate] = useSuppressShareOnCreate();

  const handleCreateOffer = useCallback(() => {
    offerBuilderRef.current?.submit();
  }, []);

  const handleSubmit = useCallback(
    async (values: OfferBuilderData) => {
      const { assetsToUnlock, ...localOffer } = await offerBuilderDataToOffer({
        data: values,
        wallets,
        offers: offers || [],
        validateOnly: false,
        considerNftRoyalty: true,
        allowEmptyOfferColumn: false,
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
            allowSecureCancelling
          />
        );
        const confirmedToProceed = await openDialog(dialog);
        if (!confirmedToProceed) {
          return;
        }
      }

      const confirmedCreation = await openDialog(<OfferEditorConfirmationDialog />);
      if (!confirmedCreation) {
        return;
      }

      try {
        const response = await createOfferForIds({
          offer: localOffer.walletIdsAndAmounts,
          fee: localOffer.feeInMojos,
          driver_dict: localOffer.driverDict, // snake case is intentional since disableJSONFormatting is true
          validate_only: localOffer.validateOnly, // snake case is intentional since disableJSONFormatting is true
          disableJSONFormatting: true, // true to avoid converting driver_dict keys/values to camel case. The camel case conversion breaks the driver_dict and causes offer creation to fail.
        }).unwrap();

        const { offer: offerData, tradeRecord: offerRecord } = response;

        navigate(-1);

        if (!suppressShareOnCreate) {
          onOfferCreated({ offerRecord, offerData, address, nftId });
        }
      } catch (error) {
        if ((error as Error).message.startsWith('insufficient funds')) {
          throw new Error(t`
          Insufficient funds available to create offer. Ensure that your
          spendable balance is sufficient to cover the offer amount.
        `);
        } else {
          throw error;
        }
      }
    },
    [wallets, createOfferForIds, navigate, suppressShareOnCreate, onOfferCreated, address, openDialog, offers, nftId]
  );

  return (
    <Grid container>
      <Flex flexDirection="column" flexGrow={1} gap={4}>
        <Flex alignItems="center" justifyContent="space-between" gap={2}>
          <OfferNavigationHeader referrerPath={referrerPath} />
          <ButtonLoading variant="contained" color="primary" onClick={handleCreateOffer} disableElevation>
            {isCounterOffer ? <Trans>Create Counter Offer</Trans> : <Trans>Create Offer</Trans>}
          </ButtonLoading>
        </Flex>

        {isLoadingWallets || isOffersLoading ? (
          <Loading center />
        ) : (
          <OfferBuilder onSubmit={handleSubmit} defaultValues={defaultValues} ref={offerBuilderRef} />
        )}
      </Flex>
    </Grid>
  );
}

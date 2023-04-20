import { useGetWalletsQuery, useCheckOfferValidityMutation } from '@chia-network/api-react';
import {
  AlertDialog,
  Flex,
  Button,
  ButtonLoading,
  Link,
  Loading,
  useShowError,
  useOpenDialog,
} from '@chia-network/core';
import { useIsWalletSynced } from '@chia-network/wallets';
import { Trans } from '@lingui/macro';
import { Alert, Grid } from '@mui/material';
import React, { useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState, forwardRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

import type OfferBuilderData from '../../@types/OfferBuilderData';
import type OfferSummary from '../../@types/OfferSummary';
import useAcceptOfferHook from '../../hooks/useAcceptOfferHook';
import useWalletOffers from '../../hooks/useWalletOffers';
import getUnknownCATs from '../../util/getUnknownCATs';
import offerToOfferBuilderData from '../../util/offerToOfferBuilderData';
import OfferState from '../offers/OfferState';
import OfferBuilder from './OfferBuilder';
import OfferNavigationHeader from './OfferNavigationHeader';

export type OfferBuilderViewerProps = {
  offerData?: string; // when viewing and existing offer
  offerSummary: OfferSummary;
  offerBuilderData?: OfferBuilderData; // when viewing an offer that hasn't been created yet
  referrerPath?: string;
  state?: OfferState;
  isMyOffer?: boolean;
  imported?: boolean;
  hideHeader?: boolean;
  canCounterOffer?: boolean;
  address?: string; // where to send a counter offer
  fee?: string; // in mojos
};

function OfferBuilderViewer(props: OfferBuilderViewerProps, ref: any) {
  const {
    offerSummary,
    referrerPath,
    offerData,
    offerBuilderData: prepopulatedOfferBuilderData,
    state,
    isMyOffer = false,
    imported = false,
    hideHeader = false,
    canCounterOffer = false,
    address,
    fee,
  } = props;

  const showError = useShowError();
  const navigate = useNavigate();
  const location = useLocation();
  const [acceptOffer] = useAcceptOfferHook();
  const [error, setError] = useState<Error | undefined>();
  const [isAccepting, setIsAccepting] = useState<boolean>(false);
  const { data: wallets, isLoading: isLoadingWallets } = useGetWalletsQuery();
  const { offers, isLoading: isOffersLoading } = useWalletOffers(-1, 0, true, false, 'RELEVANCE', false);
  const offerBuilderRef = useRef<{ submit: () => void; getValues: () => OfferBuilderData } | undefined>(undefined);

  const [checkOfferValidity] = useCheckOfferValidityMutation();
  const [isValidating, setIsValidating] = useState<boolean>(offerData !== undefined);
  const [isValid, setIsValid] = useState<boolean | undefined>();
  const isWalletSynced = useIsWalletSynced();
  const openDialog = useOpenDialog();

  const showInvalid = !isValidating && isValid === false;

  useImperativeHandle(ref, () => ({
    submit: () => offerBuilderRef.current?.submit(),
    getValues: () => offerBuilderRef.current?.getValues(),
  }));

  const validateOfferData = useCallback(async () => {
    try {
      setIsValid(undefined);
      setIsValidating(true);

      const response = await checkOfferValidity(offerData).unwrap();
      setIsValid(response.valid === true);
    } catch (e) {
      setIsValid(false);
      showError(e);
    } finally {
      setIsValidating(false);
    }
  }, [offerData, checkOfferValidity, showError]);

  useEffect(() => {
    if (!offerData || isValid !== undefined || isValidating) {
      return;
    }

    validateOfferData();
  }, [isValid, isValidating, offerData, validateOfferData]);

  const setDefaultOfferedFee = !!imported; // When viewing an imported offer, we want to expand the offered fee section by default
  const offerSummaryStringified = offerSummary ? JSON.stringify(offerSummary) : undefined;
  const computedOfferBuilderData = useMemo(() => {
    if (!offerSummaryStringified) {
      return undefined;
    }

    const offerSummaryParsed = JSON.parse(offerSummaryStringified);
    if (!offerSummaryParsed) {
      return undefined;
    }
    try {
      return offerToOfferBuilderData(offerSummaryParsed, setDefaultOfferedFee, fee);
    } catch (e) {
      setError(e);
      return undefined;
    }
  }, [offerSummaryStringified, setDefaultOfferedFee, fee]);

  const [offeredUnknownCATs, requestedUnknownCATs] = useMemo(() => {
    if (!computedOfferBuilderData || !wallets) {
      return [];
    }

    const offeredUnknownCATsLocal = getUnknownCATs(
      wallets,
      computedOfferBuilderData.offered.tokens.map(({ assetId }) => assetId)
    );
    const requestedUnknownCATsLocal = getUnknownCATs(
      wallets,
      computedOfferBuilderData.requested.tokens.map(({ assetId }) => assetId)
    );

    return [offeredUnknownCATsLocal, requestedUnknownCATsLocal];
  }, [computedOfferBuilderData, wallets]);

  const missingOfferedCATs = !!offeredUnknownCATs?.length;
  const missingRequestedCATs = !!requestedUnknownCATs?.length;

  const canAccept = !!offerData;
  const disableAccept = missingOfferedCATs || showInvalid;

  const isLoading = isLoadingWallets || (!computedOfferBuilderData && !prepopulatedOfferBuilderData) || isOffersLoading;

  async function handleSubmit(values: OfferBuilderData) {
    const { offered } = values;
    const { fee: offeredFee } = offered;

    if (isAccepting || !canAccept) {
      return;
    }

    const feeAmount = offeredFee?.[0]?.amount ?? '0'; // TODO convert to mojo here instead of in hook

    await acceptOffer(
      offerData,
      offerSummary,
      feeAmount,
      wallets,
      offers,
      (accepting: boolean) => setIsAccepting(accepting),
      () => navigate('/dashboard/offers')
    );
  }

  function handleCounterOffer() {
    const offer = offerToOfferBuilderData(offerSummary, false, '');
    navigate('/dashboard/offers/builder', {
      state: {
        referrerPath: location.pathname,
        isCounterOffer: true,
        address,
        offer,
      },
      replace: true,
    });
  }

  async function handleAcceptOffer() {
    if (!isWalletSynced) {
      await openDialog(
        <AlertDialog>
          <Trans>Please wait for wallet synchronization</Trans>
        </AlertDialog>
      );
    } else {
      offerBuilderRef.current?.submit();
    }
  }

  return (
    <Grid container>
      <Flex flexDirection="column" flexGrow={1} gap={4}>
        {!hideHeader && (
          <Flex alignItems="center" justifyContent="space-between" gap={2}>
            <OfferNavigationHeader referrerPath={referrerPath} />
            <Flex flexDirection="row" gap={1}>
              {canCounterOffer && (
                <Button variant="outlined" color="primary" onClick={handleCounterOffer} disableElevation>
                  <Trans>Counter Offer</Trans>
                </Button>
              )}
              {canAccept && (
                <ButtonLoading
                  variant="contained"
                  color="primary"
                  onClick={handleAcceptOffer}
                  isLoading={isAccepting}
                  disableElevation
                  disabled={disableAccept}
                >
                  <Trans>Accept Offer</Trans>
                </ButtonLoading>
              )}
            </Flex>
          </Flex>
        )}
        {error ? (
          <Alert severity="error">{error.message}</Alert>
        ) : showInvalid ? (
          <Alert severity="error">
            <Trans>
              {'This offer is no longer valid. To understand why, click '}
              <Link
                target="_blank"
                href="https://chialisp.com/docs/tutorials/offers_gui_tutorial/#taker-attempts-to-accept-an-invalid-offer"
              >
                here
              </Link>{' '}
              to learn more.
            </Trans>
          </Alert>
        ) : state === OfferState.CONFIRMED ? (
          <Alert severity="success">
            <Trans>This offer has completed successfully</Trans>
          </Alert>
        ) : state === OfferState.CANCELLED ? (
          <Alert severity="warning">
            <Trans>This offer was cancelled</Trans>
          </Alert>
        ) : missingOfferedCATs ? (
          <Alert severity="warning">
            <Trans>Offer cannot be accepted because you don&apos;t possess the requested assets</Trans>
          </Alert>
        ) : missingRequestedCATs ? (
          <Alert severity="warning">
            <Trans>
              One or more unknown tokens are being offered. Be sure to verify that the asset IDs of the offered tokens
              match the asset IDs of the tokens you are expecting.
            </Trans>
          </Alert>
        ) : isMyOffer ? (
          <Alert severity="success">
            <Trans>You created this offer</Trans>
          </Alert>
        ) : null}
        {error ? null : isLoading ? (
          <Loading center />
        ) : (
          <OfferBuilder
            defaultValues={computedOfferBuilderData || prepopulatedOfferBuilderData}
            onSubmit={handleSubmit}
            ref={offerBuilderRef}
            isMyOffer={isMyOffer}
            imported={imported}
            state={state}
            readOnly
            viewer
          />
        )}
      </Flex>
    </Grid>
  );
}

export default forwardRef(OfferBuilderViewer);

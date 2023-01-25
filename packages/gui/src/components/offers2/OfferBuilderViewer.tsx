import { useGetWalletsQuery, useCheckOfferValidityMutation } from '@chia-network/api-react';
import { Flex, ButtonLoading, Link, Loading, useShowError } from '@chia-network/core';
import { Trans } from '@lingui/macro';
import { Alert, Grid } from '@mui/material';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import type OfferBuilderData from '../../@types/OfferBuilderData';
import type OfferSummary from '../../@types/OfferSummary';
import useAcceptOfferHook from '../../hooks/useAcceptOfferHook';
import getUnknownCATs from '../../util/getUnknownCATs';
import offerToOfferBuilderData from '../../util/offerToOfferBuilderData';
import OfferState from '../offers/OfferState';
import OfferBuilder from './OfferBuilder';
import OfferNavigationHeader from './OfferNavigationHeader';

export type OfferBuilderViewerProps = {
  offerData: string;
  offerSummary: OfferSummary;
  referrerPath?: string;
  state?: OfferState;
  isMyOffer?: boolean;
  imported?: boolean;
};

export default function OfferBuilderViewer(props: OfferBuilderViewerProps) {
  const { offerSummary, referrerPath, offerData, state, isMyOffer = false, imported = false } = props;

  const showError = useShowError();
  const navigate = useNavigate();
  const [acceptOffer] = useAcceptOfferHook();
  const [error, setError] = useState<Error | undefined>();
  const [isAccepting, setIsAccepting] = useState<boolean>(false);
  const { data: wallets, isLoading: isLoadingWallets } = useGetWalletsQuery();
  const offerBuilderRef = useRef<{ submit: () => void } | undefined>(undefined);

  const [checkOfferValidity] = useCheckOfferValidityMutation();
  const [isValidating, setIsValidating] = useState<boolean>(offerData !== undefined);
  const [isValid, setIsValid] = useState<boolean | undefined>();

  const showInvalid = !isValidating && isValid === false;

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

  const offerSummaryStringified = JSON.stringify(offerSummary);
  const offerBuilderData = useMemo(() => {
    const offerSummaryParsed = JSON.parse(offerSummaryStringified);
    if (!offerSummaryParsed) {
      return undefined;
    }
    try {
      return offerToOfferBuilderData(offerSummaryParsed);
    } catch (e) {
      setError(e);
      return undefined;
    }
  }, [offerSummaryStringified]);

  const [offeredUnknownCATs, requestedUnknownCATs] = useMemo(() => {
    if (!offerBuilderData || !wallets) {
      return [];
    }

    const offeredUnknownCATsLocal = getUnknownCATs(
      wallets,
      offerBuilderData.offered.tokens.map(({ assetId }) => assetId)
    );
    const requestedUnknownCATsLocal = getUnknownCATs(
      wallets,
      offerBuilderData.requested.tokens.map(({ assetId }) => assetId)
    );

    return [offeredUnknownCATsLocal, requestedUnknownCATsLocal];
  }, [offerBuilderData, wallets]);

  const missingOfferedCATs = !!offeredUnknownCATs?.length;
  const missingRequestedCATs = !!requestedUnknownCATs?.length;

  const canAccept = !!offerData;
  const disableAccept = missingOfferedCATs || showInvalid;

  const isLoading = isLoadingWallets || !offerBuilderData;

  async function handleSubmit(values: OfferBuilderData) {
    const {
      offered: { fee },
    } = values;

    if (isAccepting || !canAccept) {
      return;
    }

    const feeAmount = fee?.[0]?.amount ?? '0'; // TODO convert to mojo here insted of in hook

    await acceptOffer(
      offerData,
      offerSummary,
      feeAmount,
      (accepting: boolean) => setIsAccepting(accepting),
      () => navigate('/dashboard/offers')
    );
  }

  function handleAcceptOffer() {
    offerBuilderRef.current?.submit();
  }

  return (
    <Grid container>
      <Flex flexDirection="column" flexGrow={1} gap={4}>
        <Flex alignItems="center" justifyContent="space-between" gap={2}>
          <OfferNavigationHeader referrerPath={referrerPath} />
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
            defaultValues={offerBuilderData}
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

import { useGetOfferSummaryMutation } from '@chia-network/api-react';
import { DialogActions, Loading, Button } from '@chia-network/core';
import { Trans } from '@lingui/macro';
import CloseIcon from '@mui/icons-material/Close';
import { Alert, Divider, Dialog, DialogContent, DialogTitle, IconButton } from '@mui/material';
import React, { useEffect, useRef } from 'react';

import type OfferBuilderData from '../../@types/OfferBuilderData';
import OfferBuilderViewer from './OfferBuilderViewer';

export type OfferBuilderViewerDialogProps = {
  offer?: string; // when viewing an existing offer
  fee?: string; // fee in mojos
  offerBuilderData?: OfferBuilderData; // when viewing an offer that hasn't been created yet
  onClose?: (values?: OfferBuilderData) => void;
  open?: boolean;
};

export default function OfferBuilderViewerDialog(props: OfferBuilderViewerDialogProps) {
  const { offer, offerBuilderData, fee, onClose, open = false } = props;

  const offerBuilderViewerRef = useRef<{ getValues: () => OfferBuilderData } | undefined>();
  const [getOfferSummary, { isLoading: isLoadingOfferSummary, data, error }] = useGetOfferSummaryMutation();

  useEffect(() => {
    if (offer) {
      getOfferSummary(offer);
    }
  }, [offer, getOfferSummary]);

  function handleClose() {
    const values = offerBuilderViewerRef.current?.getValues();

    onClose?.(values);
  }

  const isLoading = offer && (isLoadingOfferSummary || !data);

  return (
    <Dialog onClose={handleClose} maxWidth="lg" open={open} fullWidth>
      <IconButton
        sx={{
          position: 'absolute',
          right: 8,
          top: 8,
          color: (theme) => theme.palette.grey[500],
        }}
        onClick={handleClose}
      >
        <CloseIcon />
      </IconButton>
      <DialogTitle>
        <Trans>Offer Details</Trans>
      </DialogTitle>
      <DialogContent>
        {error ? (
          <Alert severity="error">{error.message}</Alert>
        ) : isLoading ? (
          <Loading center />
        ) : (
          <OfferBuilderViewer
            ref={offerBuilderViewerRef}
            offerData={offer}
            offerBuilderData={offerBuilderData}
            offerSummary={data?.summary}
            fee={fee}
            hideHeader
            imported
          />
        )}
      </DialogContent>
      <Divider />
      <DialogActions>
        <Button onClick={handleClose} variant="contained" color="primary" disableElevation>
          <Trans>Close</Trans>
        </Button>
      </DialogActions>
    </Dialog>
  );
}

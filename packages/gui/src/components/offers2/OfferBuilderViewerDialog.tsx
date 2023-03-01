import { useGetOfferSummaryMutation } from '@chia-network/api-react';
import { DialogActions, Loading, Button } from '@chia-network/core';
import { Trans } from '@lingui/macro';
import CloseIcon from '@mui/icons-material/Close';
import { Alert, Divider, Dialog, DialogContent, DialogTitle, IconButton } from '@mui/material';
import React, { useMemo, useEffect } from 'react';

import offerToOfferBuilderData from '../../util/offerToOfferBuilderData';
import OfferBuilderViewer from './OfferBuilderViewer';

export type OfferBuilderViewerDialogProps = {
  offer: string;
  onClose?: () => void;
  open?: boolean;
};

export default function OfferBuilderViewerDialog(props: OfferBuilderViewerDialogProps) {
  const { offer, onClose, open = false } = props;

  const [getOfferSummary, { isLoading: isLoadingOfferSummary, data, error }] = useGetOfferSummaryMutation();

  const offerBuilderData = useMemo(() => {
    if (!data) {
      return null;
    }

    const { summary } = data;
    if (!summary) {
      return null;
    }

    return offerToOfferBuilderData(summary, true);
  }, [data]);

  useEffect(() => {
    if (offer) {
      getOfferSummary(offer);
    }
  }, [offer, getOfferSummary]);

  const isLoading = isLoadingOfferSummary || !offerBuilderData;

  return (
    <Dialog onClose={onClose} maxWidth="lg" open={open} fullWidth>
      <IconButton
        sx={{
          position: 'absolute',
          right: 8,
          top: 8,
          color: (theme) => theme.palette.grey[500],
        }}
        onClick={onClose}
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
          <OfferBuilderViewer offerData={offer} offerSummary={data.summary} hideHeader imported />
        )}
      </DialogContent>
      <Divider />
      <DialogActions>
        <Button onClick={onClose} variant="contained" color="primary" disableElevation>
          <Trans>Close</Trans>
        </Button>
      </DialogActions>
    </Dialog>
  );
}

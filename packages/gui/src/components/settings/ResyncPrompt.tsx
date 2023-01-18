import { Button, DialogActions } from '@chia-network/core';
import { Trans } from '@lingui/macro';
import {
  Dialog,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from '@mui/material';
import React from 'react';

type Props = {
  onSuccess: () => void;
  onCancel: () => void;
};

export default function ResyncPrompt(props: Props) {
  const { onSuccess, onCancel } = props;

  async function handleSubmit() {
    console.log("Submit resync request here");
    onSuccess();
  }

  function handleCancel() {
    onCancel();
  }

  return (
    <Dialog
      open
      aria-labelledby="form-dialog-title"
      fullWidth
      maxWidth="xs"
    >
      <DialogTitle id="form-dialog-title">
        <Trans>Resync Wallet DB</Trans>
      </DialogTitle>
      <DialogContent>
        <DialogContentText>
          <Trans>In order to resync, Chia will need to shut down and restart. Are you sure you want to resync?</Trans>
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleCancel} color="secondary" variant="outlined">
          <Trans>Cancel</Trans>
        </Button>
        <Button onClick={handleSubmit} color="primary" variant="contained">
          <Trans>Resync</Trans>
        </Button>
      </DialogActions>
    </Dialog>
  );
}

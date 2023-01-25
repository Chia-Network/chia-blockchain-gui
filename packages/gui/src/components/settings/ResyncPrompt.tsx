import { useResyncWalletMutation } from '@chia-network/api-react';
import { AlertDialog, Button, DialogActions, useOpenDialog } from '@chia-network/core';
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
  const openDialog = useOpenDialog();
  const [resyncWallet] = useResyncWalletMutation();

  async function handleSubmit() {
    try {
      await resyncWallet();
    } catch (error: any) {
      await openDialog(
        <AlertDialog>
          <Trans>Error: {error.message}</Trans>
        </AlertDialog>
      );
    }
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
        <Trans>Resync Wallet</Trans>
      </DialogTitle>
      <DialogContent>
        <DialogContentText>
          <Trans>To initiate a wallet resync, all Chia services must first be shut down. After shutting down, you will be required to restart Chia to begin the resyncing process. Are you sure you want to shut down and resync?</Trans>
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button
          onClick={handleCancel}
          color="secondary"
          variant="outlined"
        >
          <Trans>Cancel</Trans>
        </Button>
        <Button
          onClick={handleSubmit}
          color="primary"
          variant="contained"
        >
          <Trans>Shut down</Trans>
        </Button>
      </DialogActions>
    </Dialog>
  );
}

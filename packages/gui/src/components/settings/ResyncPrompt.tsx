import { useResyncWalletQuery } from '@chia-network/api-react';
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
  const resyncWallet = useResyncWalletQuery();

  async function handleSubmit() {
    try {
      await resyncWallet;
      window.ipcRenderer.invoke('quitGUI');
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
        <Trans>Resync Wallet DB</Trans>
      </DialogTitle>
      <DialogContent>
        <DialogContentText>
          <Trans>To resync, Chia must shut down. After shutting down, please reopen Chia to complete resyncing. Are you sure you want to resync and shut down Chia?</Trans>
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
          <Trans>Resync</Trans>
        </Button>
      </DialogActions>
    </Dialog>
  );
}

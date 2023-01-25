import { Button, DialogActions } from '@chia-network/core';
import { Trans } from '@lingui/macro';
import { Box, Grid, Dialog, DialogTitle, DialogContent, TextField } from '@mui/material';
import React from 'react';

type Props = {
  open: boolean;
  onClose: (offerData?: string) => void;
};

export default function OfferDataEntryDialog(props: Props) {
  const { open, onClose } = props;
  let input: any;

  function handleClose() {
    onClose();
  }

  function handleOK() {
    onClose(input?.value ?? '');
  }

  return (
    <Dialog
      onClose={handleClose}
      aria-labelledby="alert-dialog-title"
      aria-describedby="alert-dialog-description"
      maxWidth="md"
      open={open}
      fullWidth
    >
      <DialogTitle id="alert-dialog-title">
        <Trans>Paste Offer Data</Trans>
      </DialogTitle>

      <DialogContent dividers>
        <Grid item xs={12}>
          <Box display="flex">
            <Box flexGrow={1}>
              <TextField
                variant="filled"
                InputProps={{
                  readOnly: false,
                }}
                minRows={5}
                maxRows={10}
                // eslint-disable-next-line no-return-assign -- Could not trigger this, maybe legacy file?
                inputRef={(ref) => (input = ref)}
                fullWidth
                multiline
              />
            </Box>
          </Box>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} variant="outlined">
          <Trans>Cancel</Trans>
        </Button>
        <Button onClick={handleOK} color="primary" variant="contained">
          <Trans>Import</Trans>
        </Button>
      </DialogActions>
    </Dialog>
  );
}

import { Button, Flex } from '@chia-network/core';
import { Trans } from '@lingui/macro';
import { Dialog, DialogActions, DialogContent, DialogTitle, Grid, TextField } from '@mui/material';
import React from 'react';
import { useCopyToClipboard } from 'react-use';

import useSaveFile from '../../hooks/useSaveFile';

export type SignMessageResultDialogProps = {
  message: string;
  pubkey: string;
  signature: string;
  address?: string;
  open?: boolean;
  onClose?: () => void;
};

export default function SignMessageResultDialog(props: SignMessageResultDialogProps) {
  const { message, pubkey, signature, address, open = false, onClose = () => ({}), ...rest } = props;
  const [, copyToClipboard] = useCopyToClipboard();
  const saveFile = useSaveFile();

  const content = `Message: ${message}
Public Key: ${pubkey}
Signature: ${signature}${
    address
      ? `
Address: ${address}`
      : ''
  }`;

  async function handleSaveToFile() {
    await saveFile({ fileContent: content, suggestedFilename: 'signed_message.chiasig' });
  }

  function handleCopyToClipboard() {
    copyToClipboard(content);
  }

  function handleClose() {
    onClose();
  }

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth {...rest}>
      <DialogTitle>
        <Trans>Signed Message</Trans>
      </DialogTitle>
      <DialogContent>
        <Flex flexDirection="column" gap={2}>
          <Flex flexDirection="column" gap={1}>
            <Grid item xs={12}>
              <TextField
                variant="filled"
                InputProps={{
                  readOnly: true,
                }}
                value={content}
                minRows={7}
                maxRows={12}
                fullWidth
                multiline
              />
            </Grid>
          </Flex>
          <DialogActions>
            <Flex flexDirection="row" flexGrow={1} justifyContent="space-between" gap={2}>
              <Flex flexDirection="row" gap={1}>
                <Button onClick={handleCopyToClipboard} variant="outlined" color="secondary">
                  <Trans>Copy To Clipboard</Trans>
                </Button>
              </Flex>
              <Flex flexDirection="row" gap={1}>
                <Button onClick={handleSaveToFile} variant="contained" color="secondary">
                  <Trans>Save To File</Trans>
                </Button>
                <Button onClick={handleClose} variant="contained" color="primary">
                  <Trans>Close</Trans>
                </Button>
              </Flex>
            </Flex>
          </DialogActions>
        </Flex>
      </DialogContent>
    </Dialog>
  );
}

import { useVerifySignatureMutation } from '@chia-network/api-react';
import { AlertDialog, Button, Card, Flex, Form, TextField, useOpenDialog, useShowError } from '@chia-network/core';
import { Trans } from '@lingui/macro';
import { DialogActions, Typography } from '@mui/material';
import React from 'react';
import { useForm } from 'react-hook-form';

import VerifyMessageImport from './VerifyMessageImport';

type VerifyMessageFormData = {
  message: string;
  pubkey: string;
  signature: string;
};

export type VerifyMessageProps = {
  onComplete: () => void;
};

export default function VerifyMessage(props: VerifyMessageProps) {
  const { onComplete } = props;
  const [verifySignature] = useVerifySignatureMutation();
  const openDialog = useOpenDialog();
  const showError = useShowError();

  const methods = useForm<VerifyMessageFormData>({
    defaultValues: {
      message: '',
      pubkey: '',
      signature: '',
    },
  });

  const { message, pubkey, signature } = methods.watch();

  function importComplete(imported: { message: string; pubkey: string; signature: string }) {
    const { message: importedMessage, pubkey: importedPubkey, signature: importedSignature } = imported;
    methods.setValue('message', importedMessage);
    methods.setValue('pubkey', importedPubkey);
    methods.setValue('signature', importedSignature);
  }

  function handleCancel() {
    onComplete();
  }

  function handleReset() {
    methods.reset();
  }

  async function handleVerify() {
    const messageToVerify = Buffer.from(message).toString('hex');
    let error: Error | undefined;
    const result = await verifySignature({ message: messageToVerify, pubkey, signature, signingMode: 'chip_0002' })
      .unwrap()
      .catch((err: Error) => {
        error = err;
      });

    if (error) {
      showError(error);
      return;
    }

    if (result?.isValid === true) {
      openDialog(
        <AlertDialog title={<Trans>Signature Verified</Trans>}>
          <Trans>The signed message has been verified.</Trans>
        </AlertDialog>
      );
    } else {
      showError(new Error('Signature is not valid'));
    }
  }

  async function handleSubmit() {
    await handleVerify();
  }

  return (
    <Form methods={methods} onSubmit={handleSubmit}>
      <Flex flexDirection="column" gap={3}>
        <VerifyMessageImport onImport={importComplete} />
        <Card>
          <Flex flexDirection="column" gap={2}>
            <Flex flexDirection="column" gap={1}>
              <Typography variant="body1">
                <Trans>Message</Trans>
              </Typography>
              <TextField
                variant="filled"
                InputProps={{
                  readOnly: false,
                }}
                name="message"
                minRows={5}
                maxRows={10}
                fullWidth
                multiline
              />
            </Flex>
            <Flex flexDirection="column" gap={1}>
              <Typography variant="body1">
                <Trans>Public Key</Trans>
              </Typography>
              <TextField
                variant="filled"
                InputProps={{
                  readOnly: false,
                }}
                name="pubkey"
                fullWidth
              />
            </Flex>
            <Flex flexDirection="column" gap={1}>
              <Typography variant="body1">
                <Trans>Signature</Trans>
              </Typography>
              <TextField
                variant="filled"
                InputProps={{
                  readOnly: false,
                }}
                name="signature"
                fullWidth
              />
            </Flex>
          </Flex>
        </Card>
        <DialogActions>
          <Flex flexDirection="row" flexGrow={1} justifyContent="space-between" gap={1}>
            <Flex flexDirection="row" gap={1}>
              <Button onClick={handleReset} color="secondary" variant="outlined">
                <Trans>Reset</Trans>
              </Button>
            </Flex>
            <Flex flexDirection="row" gap={1}>
              <Button onClick={handleCancel} color="secondary" variant="outlined" autoFocus>
                <Trans>Cancel</Trans>
              </Button>
              <Button variant="contained" color="primary" type="submit">
                <Trans>Verify</Trans>
              </Button>
            </Flex>
          </Flex>
        </DialogActions>
      </Flex>
    </Form>
  );
}

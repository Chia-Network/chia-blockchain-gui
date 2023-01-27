import { useVerifySignatureMutation } from '@chia-network/api-react';
import {
  AlertDialog,
  Button,
  Card,
  Flex,
  Form,
  TextField,
  TooltipIcon,
  Truncate,
  useOpenDialog,
  // useShowError,
} from '@chia-network/core';
import { Trans } from '@lingui/macro';
import ArrowForwardIosSharpIcon from '@mui/icons-material/ArrowForwardIosSharp';
import {
  Accordion,
  AccordionSummary as MuiAccordionSummary,
  AccordionSummaryProps,
  AccordionDetails,
  DialogActions,
  CardContent,
  Typography,
} from '@mui/material';
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import styled from 'styled-components';

import VerifyMessageImport from './VerifyMessageImport';

const AccordionSummary = styled((props: AccordionSummaryProps) => (
  <MuiAccordionSummary expandIcon={<ArrowForwardIosSharpIcon sx={{ fontSize: '0.9rem' }} />} {...props} />
))(({ theme }) => ({
  flexDirection: 'row-reverse',
  '& .MuiAccordionSummary-expandIconWrapper.Mui-expanded': {
    transform: 'rotate(90deg)',
  },
  '& .MuiAccordionSummary-content': {
    marginLeft: theme.spacing(1),
  },
}));

type VerifyMessageFormData = {
  message: string;
  pubkey: string;
  signature: string;
  signing_mode: string;
  address: string;
  imported: boolean;
};

export type VerifyMessageProps = {
  onComplete: () => void;
};

export default function VerifyMessage(props: VerifyMessageProps) {
  const { onComplete } = props;
  const [verifySignature] = useVerifySignatureMutation();
  const openDialog = useOpenDialog();
  // const showError = useShowError();
  const [expanded, setExpanded] = useState(false);

  const methods = useForm<VerifyMessageFormData>({
    defaultValues: {
      message: '',
      pubkey: '',
      signature: '',
      signing_mode: '',
      address: '',
      imported: false,
    },
  });

  const { message, pubkey, signature, signing_mode: signingMode, address, imported } = methods.watch();

  function importComplete(data: {
    message: string;
    pubkey: string;
    signature: string;
    signing_mode: string;
    address?: string;
  }) {
    const {
      message: importedMessage,
      pubkey: importedPubkey,
      signature: importedSignature,
      signing_mode: importedSigningMode,
      address: importedAddress = '',
    } = data;
    methods.setValue('message', importedMessage);
    methods.setValue('pubkey', importedPubkey);
    methods.setValue('signature', importedSignature);
    methods.setValue('signing_mode', importedSigningMode);
    methods.setValue('address', importedAddress);
    methods.setValue('imported', true);

    setExpanded(true);
  }

  function handleCancel() {
    onComplete();
  }

  function handleReset() {
    methods.reset();
    setExpanded(false);
  }

  async function handleVerify() {
    let error: Error | undefined;
    const result = await verifySignature({
      message,
      pubkey,
      signature,
      signingMode,
      address: address || undefined,
    })
      .unwrap()
      .catch((err: Error) => {
        error = err;
      });

    const titleElem = result?.isValid === true ? <Trans>Signature Verified</Trans> : <Trans>Verification Failed</Trans>;
    const signerAddressElem =
      result?.isValid === true && address ? (
        <Flex flexDirection="column" gap={1}>
          <Flex flexDirection="row" alignItems="center" gap={1}>
            <Typography variant="body1">
              <Trans>Signed By:</Trans>
            </Typography>
            <Truncate ValueProps={{ variant: 'body1' }} tooltip copyToClipboard>
              {address}
            </Truncate>
            <TooltipIcon>
              <Trans>
                The signature was made by the private key associated with the wallet address. The signer can be assumed
                to be the owner of the private key.
              </Trans>
            </TooltipIcon>
          </Flex>
        </Flex>
      ) : null;
    const errorElem = error ? (
      <Flex flexDirection="row" alignItems="center" gap={1}>
        <Typography variant="body1" color="textPrimary">
          <Trans>Error:</Trans>
        </Typography>
        <Typography variant="body1" color="textSecondary">
          {error.message}
        </Typography>
      </Flex>
    ) : null;

    openDialog(
      <AlertDialog title={titleElem}>
        <Card>
          <CardContent>
            <Flex flexDirection="column" gap={3}>
              <Flex flexDirection="row" gap={1}>
                <Typography variant="body1">
                  <Trans>Signature Status:</Trans>
                </Typography>
                {result?.isValid === true ? (
                  <Typography variant="body1" color="primary">
                    <Trans>Valid</Trans>
                  </Typography>
                ) : (
                  <Typography variant="body1" color="error">
                    <Trans>Invalid</Trans>
                  </Typography>
                )}
              </Flex>
              {signerAddressElem}
              {errorElem}
            </Flex>
          </CardContent>
        </Card>
      </AlertDialog>
    );
  }

  async function handleSubmit() {
    onComplete();
    await handleVerify();
  }

  function handleExpand() {
    setExpanded(!expanded);
  }

  return (
    <Form methods={methods} onSubmit={handleSubmit}>
      <Flex flexDirection="column" gap={3}>
        <VerifyMessageImport onImport={importComplete} />
        <Accordion expanded={expanded} onChange={handleExpand}>
          <AccordionSummary>
            <Trans>Signature Details</Trans>
          </AccordionSummary>
          <AccordionDetails>
            <Flex flexDirection="column" gap={2}>
              <TextField
                variant="filled"
                InputProps={{
                  readOnly: imported,
                }}
                name="message"
                label={<Trans>Message</Trans>}
                minRows={5}
                maxRows={10}
                fullWidth
                multiline
              />
              <TextField
                variant="filled"
                InputProps={{
                  readOnly: imported,
                }}
                name="pubkey"
                label={<Trans>Public Key</Trans>}
                fullWidth
              />
              <TextField
                variant="filled"
                InputProps={{
                  readOnly: imported,
                }}
                name="signature"
                label={<Trans>Signature</Trans>}
                fullWidth
              />
              <TextField
                variant="filled"
                InputProps={{
                  readOnly: imported,
                }}
                name="signing_mode"
                label={<Trans>Signing Mode</Trans>}
                fullWidth
              />
              {(address || !imported) && (
                <>
                  <TextField
                    variant="filled"
                    InputProps={{
                      readOnly: imported,
                    }}
                    name="address"
                    label={<Trans>Signing Address (Optional)</Trans>}
                    fullWidth
                  />
                  <Typography variant="caption" color="textSecondary">
                    <Trans>
                      By providing a signing address, the public key can be validated as being associated with the
                      address used for signing.
                    </Trans>
                  </Typography>
                </>
              )}
            </Flex>
          </AccordionDetails>
        </Accordion>
        <DialogActions>
          <Flex flexDirection="row" flexGrow={1} justifyContent="space-between" gap={1}>
            <Flex flexDirection="row" gap={1}>
              <Button onClick={handleReset} color="secondary" variant="outlined">
                <Trans>Reset</Trans>
              </Button>
            </Flex>
            <Flex flexDirection="row" gap={1}>
              <Button onClick={handleCancel} color="secondary" variant="outlined">
                <Trans>Cancel</Trans>
              </Button>
              <Button variant="contained" color="primary" type="submit" autoFocus>
                <Trans>Verify</Trans>
              </Button>
            </Flex>
          </Flex>
        </DialogActions>
      </Flex>
    </Form>
  );
}

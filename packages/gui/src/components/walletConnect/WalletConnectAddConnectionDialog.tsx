import { ButtonLoading, DialogActions, Flex, TextField, Button, Form } from '@chia-network/core';
import { Trans, t } from '@lingui/macro';
import CloseIcon from '@mui/icons-material/Close';
import { Box, Divider, Dialog, DialogContent, DialogTitle, IconButton, Typography } from '@mui/material';
import React from 'react';
import { useForm } from 'react-hook-form';

import useWalletConnect from '../../hooks/useWalletConnect';

import HeroImage from './images/walletConnectToChia.svg';

type FormData = {
  uri: string;
};

export type WalletConnectAddConnectionDialogProps = {
  onClose?: (topic?: string) => void;
  open?: boolean;
};

export default function WalletConnectAddConnectionDialog(props: WalletConnectAddConnectionDialogProps) {
  const { onClose = () => {}, open = false } = props;
  const { pair } = useWalletConnect();
  const pairAbortControllerRef = React.useRef<AbortController | undefined>(undefined);
  const methods = useForm<FormData>({
    defaultValues: {
      uri: '',
    },
  });

  React.useEffect(
    () => () => {
      pairAbortControllerRef.current?.abort();
    },
    [],
  );

  function handleClose() {
    pairAbortControllerRef.current?.abort();
    onClose();
  }

  async function handleSubmit(values: FormData) {
    const { uri } = values;
    if (!uri) {
      throw new Error(t`Please enter a URI`);
    }

    const controller = new AbortController();
    pairAbortControllerRef.current = controller;

    try {
      await pair(uri, { signal: controller.signal });
    } catch (error) {
      if (controller.signal.aborted) {
        return;
      }

      throw error;
    } finally {
      if (pairAbortControllerRef.current === controller) {
        pairAbortControllerRef.current = undefined;
      }
    }

    onClose();
  }

  const { isSubmitting } = methods.formState;
  const canSubmit = !isSubmitting;

  return (
    <Dialog onClose={handleClose} maxWidth="xs" open={open} fullWidth>
      <DialogTitle>
        <Trans>WalletConnect</Trans>
      </DialogTitle>
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

      <Form methods={methods} onSubmit={handleSubmit}>
        <DialogContent>
          <Flex flexDirection="column" gap={3}>
            <Box alignSelf="center">
              <HeroImage width={240} />
            </Box>
            <Flex flexDirection="column" gap={3} minWidth={0}>
              <Box>
                <Typography variant="h6" textAlign="center">
                  <Trans>WalletConnect Integration</Trans>
                </Typography>
                <Typography variant="body2" textAlign="center" color="textSecondary">
                  <Trans>Paste the address from WalletConnect below.</Trans>
                </Typography>
              </Box>
              <TextField
                name="uri"
                label={<Trans>Paste link</Trans>}
                multiline
                required
                autoFocus
                inputProps={{
                  onKeyDown: (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      (e.currentTarget.form as HTMLFormElement | null)?.requestSubmit();
                    }
                  },
                }}
              />
            </Flex>
          </Flex>
        </DialogContent>
        <Divider />
        <DialogActions>
          <Button onClick={handleClose} variant="outlined" color="primary">
            <Trans>Reject</Trans>
          </Button>
          <ButtonLoading
            type="submit"
            disabled={!canSubmit}
            loading={isSubmitting}
            variant="contained"
            color="primary"
            disableElevation
          >
            <Trans>Continue</Trans>
          </ButtonLoading>
        </DialogActions>
      </Form>
    </Dialog>
  );
}

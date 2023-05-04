import { useGetKeysQuery } from '@chia-network/api-react';
import { ButtonLoading, DialogActions, Flex, Button, Loading, useShowError, CardListItem } from '@chia-network/core';
import { Trans } from '@lingui/macro';
import CloseIcon from '@mui/icons-material/Close';
import { Box, Divider, Dialog, DialogContent, DialogTitle, IconButton, Typography } from '@mui/material';
import React, { useMemo, useState } from 'react';

import useWalletConnectContext from '../../hooks/useWalletConnectContext';
import HeroImage from './images/walletConnectConnected.svg';

export type WalletConnectAddConnectionDialogProps = {
  onClose?: () => void;
  open?: boolean;
  topic: string;
};

export default function WalletConnectConnectedDialog(props: WalletConnectAddConnectionDialogProps) {
  const { topic, onClose = () => {}, open = false } = props;
  const [isProcessing, setIsProcessing] = useState(false);
  const showError = useShowError();
  const { pairs, disconnect, isLoading: isLoadingWallet } = useWalletConnectContext();
  const { data: keys, isLoading: isLoadingPublicKeys } = useGetKeysQuery({});

  const pair = pairs.getPair(topic);

  const selectedKeys = useMemo(() => {
    if (!pair) {
      return [];
    }

    const { fingerprints } = pair;

    return fingerprints
      .map((fingerprint) => {
        const publicKey = keys?.find((key) => key.fingerprint === fingerprint);
        return publicKey;
      })
      .filter(Boolean);
  }, [pair, keys]);

  const isLoading = isLoadingWallet || isLoadingPublicKeys;

  function handleClose() {
    onClose();
  }

  async function handleDisconnect() {
    setIsProcessing(true);

    try {
      await disconnect(topic);
      onClose();
    } catch (e) {
      showError(e);
    } finally {
      setIsProcessing(false);
    }
  }

  const canSubmit = !isLoading || isProcessing;

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

      <DialogContent>
        <Flex flexDirection="column" alignItems="center" gap={3}>
          <HeroImage width={106} />
          <Flex flexDirection="column" gap={3}>
            <Box>
              <Typography variant="h6" textAlign="center">
                <Trans>Connected</Trans>
              </Typography>
              <Typography variant="body2" textAlign="center" color="textSecondary">
                <Trans>You can now connect to {pair?.metadata?.name ?? 'Unknown Application'} in your browser.</Trans>
              </Typography>
            </Box>
            {isLoading ? (
              <Loading center />
            ) : (
              <Flex flexDirection="column" gap={2}>
                {selectedKeys.map((key) => (
                  <CardListItem key={key.fingerprint} gap={1}>
                    <Typography variant="body2" textAlign="center">
                      {key.label ?? key.fingerprint}
                    </Typography>
                    <Typography variant="body2" color="textSecondary" textAlign="center">
                      {key.fingerprint}
                    </Typography>
                  </CardListItem>
                ))}
              </Flex>
            )}
          </Flex>
        </Flex>
      </DialogContent>
      <Divider />
      <DialogActions>
        <ButtonLoading
          onClick={handleDisconnect}
          disabled={!canSubmit}
          loading={isProcessing}
          variant="outlined"
          color="primary"
        >
          <Trans>Disconnect</Trans>
        </ButtonLoading>
        <Button onClick={handleClose} variant="contained" color="primary" disableElevation>
          <Trans>Close</Trans>
        </Button>
      </DialogActions>
    </Dialog>
  );
}

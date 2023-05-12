import { useGetKeysQuery } from '@chia-network/api-react';
import { ButtonLoading, DialogActions, Flex, Button, Loading, useShowError, CardListItem } from '@chia-network/core';
import { Trans } from '@lingui/macro';
import CloseIcon from '@mui/icons-material/Close';
import { Divider, Dialog, DialogContent, DialogTitle, IconButton, Typography } from '@mui/material';
import React, { useMemo, useState } from 'react';

import useWalletConnectContext from '../../hooks/useWalletConnectContext';
import WalletConnectActiveSessions from './WalletConnectActiveSessions';
import WalletConnectMetadata from './WalletConnectMetadata';

export type WalletConnectPairInfoDialogProps = {
  onClose?: () => void;
  open?: boolean;
  topic: string;
};

export default function WalletConnectPairInfoDialog(props: WalletConnectPairInfoDialogProps) {
  const { topic, onClose = () => {}, open = false } = props;
  const [isProcessing, setIsProcessing] = useState(false);
  const showError = useShowError();
  const { pairs, disconnect, isLoading: isLoadingWallet } = useWalletConnectContext();
  const { data: keys, isLoading: isLoadingPublicKeys } = useGetKeysQuery({});

  const pair = useMemo(() => pairs.getPair(topic), [topic, pairs]);

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
  const canDisconnect = !isProcessing && !isLoading;

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

  return (
    <Dialog onClose={handleClose} maxWidth="xs" open={open} fullWidth>
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
      <DialogTitle>
        <Trans>Pair Information</Trans>
      </DialogTitle>
      <DialogContent>
        <Flex flexDirection="column" gap={3}>
          <Flex flexDirection="column" gap={3}>
            {isLoading ? (
              <Loading center />
            ) : !pair ? (
              <Typography>
                <Trans>Pair does not exists</Trans>
              </Typography>
            ) : (
              <Flex flexDirection="column" gap={2}>
                <Flex flexDirection="column" gap={1}>
                  <Typography>
                    <Trans>Application</Trans>
                  </Typography>
                  <WalletConnectMetadata metadata={pair.metadata} />
                </Flex>

                <Flex flexDirection="column" gap={1}>
                  <Typography>
                    <Trans>Paired Keys</Trans>
                  </Typography>
                  <Flex flexDirection="column" gap={1}>
                    {selectedKeys.length ? (
                      selectedKeys.map((key) => (
                        <CardListItem key={key.fingerprint} gap={1}>
                          <Typography variant="body2" textAlign="center">
                            {key.label ?? key.fingerprint}
                          </Typography>
                          <Typography variant="body2" color="textSecondary" textAlign="center">
                            {key.fingerprint}
                          </Typography>
                        </CardListItem>
                      ))
                    ) : (
                      <Typography variant="body2" color="textSecondary">
                        <Trans>No Paired Keys</Trans>
                      </Typography>
                    )}
                  </Flex>
                </Flex>
                <WalletConnectActiveSessions topic={topic} />
              </Flex>
            )}
          </Flex>
        </Flex>
      </DialogContent>
      <Divider />
      <DialogActions>
        <ButtonLoading
          onClick={handleDisconnect}
          disabled={!canDisconnect}
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

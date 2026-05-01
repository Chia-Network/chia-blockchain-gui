import { useGetKeysQuery } from '@chia-network/api-react';
import { Flex, Loading, useOpenDialog, More, MenuItem, useShowError } from '@chia-network/core';
import { Trans } from '@lingui/macro';
import {
  CheckCircleTwoTone as CheckCircleTwoToneIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
} from '@mui/icons-material';
import { Button, ListItemIcon, Typography, Divider } from '@mui/material';
import React, { useCallback } from 'react';

import useWalletConnectContext from '../../hooks/useWalletConnectContext';
import useWalletConnectPreferences from '../../hooks/useWalletConnectPreferences';

import WalletConnectAddConnectionDialog from './WalletConnectAddConnectionDialog';
import WalletConnectPairInfoDialog from './WalletConnectPairInfoDialog';

async function waitForPairMetadata(
  getPair: (topic: string) => { metadata?: { name?: string } } | undefined,
  topic: string,
  timeoutMs = 8000,
): Promise<void> {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const pair = getPair(topic);
    if (pair?.metadata?.name) return;
    // eslint-disable-next-line no-await-in-loop -- intentional poll
    await new Promise((resolve) => {
      setTimeout(resolve, 200);
    });
  }
}

export type WalletConnectConnectionsProps = {
  onClose?: () => void;
};

export default function WalletConnectConnections(props: WalletConnectConnectionsProps) {
  const { onClose } = props;
  const openDialog = useOpenDialog();
  const showError = useShowError();
  const { enabled, setEnabled } = useWalletConnectPreferences();
  const { disconnect, pairs, isLoading } = useWalletConnectContext();
  const { data: keys } = useGetKeysQuery({});

  const handleAddConnection = useCallback(async () => {
    onClose?.();
    const topic = await openDialog(<WalletConnectAddConnectionDialog />);

    if (!topic) {
      return;
    }

    try {
      await waitForPairMetadata(pairs.getPair.bind(pairs), topic);
      const pair = pairs.getPair(topic);
      if (!pair) return;

      const selected = pair.fingerprints ?? [];
      const availableWallets =
        selected.length > 0
          ? selected.map((fingerprint) => {
              const key = keys?.find((k: any) => k.fingerprint === fingerprint);
              return { fingerprint, name: key?.label ?? undefined };
            })
          : (keys ?? []).map((key: any) => ({ fingerprint: key.fingerprint, name: key.label ?? undefined }));

      const result = await window.permissionsAPI.registerPair({
        topic,
        metadata: {
          name: pair.metadata?.name ?? 'Unknown application',
          url: pair.metadata?.url,
          icon: pair.metadata?.icons?.[0],
          description: pair.metadata?.description,
        },
        availableWallets,
        defaultFingerprints: selected.length > 0 ? selected : (keys ?? []).map((k: any) => k.fingerprint),
      });

      if (!result) {
        // User rejected. Disconnect the WC pair so the dapp loses access immediately.
        try {
          await disconnect(topic);
        } catch (disconnectErr) {
          console.warn('Failed to disconnect rejected pair', disconnectErr);
        }
      }
    } catch (err) {
      showError(err);
    }
  }, [onClose, openDialog, pairs, keys, disconnect, showError]);

  async function handleDisconnect(topic: string) {
    try {
      onClose?.();
      await disconnect(topic);
    } catch (error) {
      showError(error);
    }
  }

  function handleEnableWalletConnect() {
    setEnabled(true);
  }

  const handleShowMoreInfo = useCallback(
    (topic: string) => {
      onClose?.();
      openDialog(<WalletConnectPairInfoDialog topic={topic} />);
    },
    [onClose, openDialog],
  );

  const pairsList = pairs.get();

  return (
    <Flex flexDirection="column" gap={1}>
      <Flex flexDirection="column" gap={1} paddingX={2} paddingY={1.5}>
        <Typography variant="h6">
          <Trans>Connected Applications</Trans>
        </Typography>
        {isLoading ? (
          <Loading center />
        ) : enabled && pairsList.length ? (
          <Flex flexDirection="column">
            {pairsList.map((pair) => (
              <Flex alignItems="center" key={pair.topic} justifyContent="space-between">
                <Flex alignItems="center" gap={1}>
                  <CheckCircleTwoToneIcon color={pair.sessions.length ? 'primary' : 'secondary'} />
                  <Typography>{pair.metadata?.name ?? <Trans>Unknown Application</Trans>}</Typography>
                </Flex>
                <More>
                  <MenuItem onClick={() => handleShowMoreInfo(pair.topic)} close>
                    <ListItemIcon>
                      <EditIcon fontSize="small" color="info" />
                    </ListItemIcon>
                    <Typography variant="inherit" noWrap>
                      <Trans>More Info</Trans>
                    </Typography>
                  </MenuItem>
                  <MenuItem onClick={() => handleDisconnect(pair.topic)} close>
                    <ListItemIcon>
                      <DeleteIcon fontSize="small" color="info" />
                    </ListItemIcon>
                    <Typography variant="inherit" noWrap>
                      <Trans>Disconnect</Trans>
                    </Typography>
                  </MenuItem>
                </More>
              </Flex>
            ))}
          </Flex>
        ) : null}
      </Flex>

      <Divider />

      <Flex justifyContent="flex-end" paddingX={2} paddingY={1.5}>
        {enabled ? (
          <Button onClick={handleAddConnection} variant="outlined" color="primary" size="small" disabled={isLoading}>
            <Trans>Add Connection</Trans>
          </Button>
        ) : (
          <Button onClick={handleEnableWalletConnect} variant="outlined" color="primary" size="small">
            <Trans>Enable WalletConnect</Trans>
          </Button>
        )}
      </Flex>
    </Flex>
  );
}

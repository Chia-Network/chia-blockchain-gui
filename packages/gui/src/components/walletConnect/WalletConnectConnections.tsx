import { useGetKeysQuery, useGetLoggedInFingerprintQuery } from '@chia-network/api-react';
import { Flex, Loading, useOpenDialog, More, MenuItem, useShowError } from '@chia-network/core';
import { Trans } from '@lingui/macro';
import {
  CheckCircleTwoTone as CheckCircleTwoToneIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
} from '@mui/icons-material';
import { Button, ListItemIcon, Typography, Divider } from '@mui/material';
import React, { useCallback } from 'react';

import type Pair from '../../@types/Pair';
import useWalletConnectContext from '../../hooks/useWalletConnectContext';
import useWalletConnectPreferences from '../../hooks/useWalletConnectPreferences';

import WalletConnectAddConnectionDialog from './WalletConnectAddConnectionDialog';
import WalletConnectPairInfoDialog from './WalletConnectPairInfoDialog';

async function waitForPendingProposal(
  getPair: (topic: string) => Pair | undefined,
  topic: string,
  timeoutMs = 15_000,
): Promise<Pair | undefined> {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const pair = getPair(topic);
    if (pair?.pendingProposal) return pair;
    // eslint-disable-next-line no-await-in-loop -- intentional poll
    await new Promise((resolve) => {
      setTimeout(resolve, 200);
    });
  }
  return getPair(topic);
}

export type WalletConnectConnectionsProps = {
  onClose?: () => void;
};

export default function WalletConnectConnections(props: WalletConnectConnectionsProps) {
  const { onClose } = props;
  const openDialog = useOpenDialog();
  const showError = useShowError();
  const { enabled, setEnabled } = useWalletConnectPreferences();
  const { disconnect, approveSession, rejectSession, pairs, isLoading } = useWalletConnectContext();
  const { data: keys } = useGetKeysQuery({});
  const { data: loggedInFingerprint } = useGetLoggedInFingerprintQuery();

  const handleAddConnection = useCallback(async () => {
    onClose?.();
    const topic = await openDialog(<WalletConnectAddConnectionDialog />);

    if (!topic) {
      return;
    }

    try {
      const pair = await waitForPendingProposal(pairs.getPair.bind(pairs), topic);
      if (!pair?.pendingProposal) {
        // No proposal arrived in time - dapp dropped or never sent it. Tear down.
        await disconnect(topic);
        showError(new Error('No session proposal received from the application'));
        return;
      }

      const availableWallets = (keys ?? []).map((key: any) => ({
        fingerprint: key.fingerprint,
        name: key.label ?? undefined,
      }));

      const defaultFingerprints =
        loggedInFingerprint && availableWallets.some((w) => w.fingerprint === loggedInFingerprint)
          ? [loggedInFingerprint]
          : [];

      const grant = await window.permissionsAPI.registerPair({
        topic,
        metadata: {
          name: pair.metadata?.name ?? 'Unknown application',
          url: pair.metadata?.url,
          icon: pair.metadata?.icons?.[0],
          description: pair.metadata?.description,
        },
        availableWallets,
        defaultFingerprints,
      });

      if (!grant) {
        // User rejected. Reject the WC proposal cleanly so the dapp gets the right signal.
        try {
          await rejectSession(topic);
        } catch (rejectErr) {
          console.warn('Failed to reject WC session', rejectErr);
        }
        return;
      }

      try {
        await approveSession(topic, grant.fingerprints);
      } catch (approveErr) {
        // Approval failed (network, dapp dropped, etc). Roll back the main-process grant.
        await window.permissionsAPI.revokePair(topic);
        await disconnect(topic);
        throw approveErr;
      }
    } catch (err) {
      showError(err);
    }
  }, [onClose, openDialog, pairs, keys, loggedInFingerprint, approveSession, rejectSession, disconnect, showError]);

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

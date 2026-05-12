import { Flex, Loading, useCurrencyCode, useOpenDialog, More, MenuItem, useShowError } from '@chia-network/core';
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
  const mainnet = useCurrencyCode() === 'XCH';

  const handleAddConnection = useCallback(async () => {
    onClose?.();
    const topic = await openDialog(<WalletConnectAddConnectionDialog />);

    if (!topic) {
      return;
    }

    try {
      const pair = await waitForPendingProposal(pairs.getPair.bind(pairs), topic);
      if (!pair?.pendingProposal) {
        await disconnect(topic);
        showError(new Error('No session proposal received from the application'));
        return;
      }

      // Reject before opening the Pair dialog if the dapp's requested chains
      // don't include the user's current network. Otherwise the user would
      // grant permissions and `approveSessionProposal` would still throw and
      // we'd `revokePair` immediately after.
      const currentChain = mainnet ? 'chia:mainnet' : 'chia:testnet';
      if (!pair.pendingProposal.chains.includes(currentChain)) {
        await disconnect(topic);
        showError(
          new Error(
            `This application does not support ${mainnet ? 'mainnet' : 'testnet'}. Switch networks and try again.`,
          ),
        );
        return;
      }

      let grant;
      try {
        grant = await window.permissionsAPI.registerPair({
          topic,
          mainnet,
          metadata: {
            name: pair.metadata?.name ?? 'Unknown application',
            url: pair.metadata?.url,
            icon: pair.metadata?.icons?.[0],
            description: pair.metadata?.description,
          },
          // Forwarded as-is from the WC SDK's proposal; main re-derives the allowed subset.
          requestedCommands: pair.pendingProposal.methods,
        });
      } catch (registerErr) {
        // Tear down the WC pair we created in the dialog. Without this the
        // pair lingers as a zombie entry (no sessions, stale pendingProposal)
        // in localStorage and in the "Connected Applications" list.
        // `rejectSession` sends USER_REJECTED to the dapp and then disconnects,
        // matching the cleanup the user-rejected path performs.
        try {
          await rejectSession(topic);
        } catch (rejectErr) {
          console.warn('Failed to reject WC session after registerPair failure', rejectErr);
        }
        throw registerErr;
      }

      if (!grant) {
        // User rejected — tell the dapp cleanly.
        try {
          await rejectSession(topic);
        } catch (rejectErr) {
          console.warn('Failed to reject WC session', rejectErr);
        }
        return;
      }

      try {
        await approveSession(topic, grant.fingerprints, grant.mainnet, grant.commands);
      } catch (approveErr) {
        // Roll back main's grant if the WC approve fails. Each cleanup step
        // runs independently so a failure in one doesn't skip the other or
        // mask the original approval error surfaced to the user.
        try {
          await window.permissionsAPI.revokePair(topic);
        } catch (revokeErr) {
          console.warn('Failed to revoke pair after approve failure', revokeErr);
        }
        try {
          await disconnect(topic);
        } catch (disconnectErr) {
          console.warn('Failed to disconnect after approve failure', disconnectErr);
        }
        throw approveErr;
      }
    } catch (err) {
      showError(err);
    }
  }, [onClose, openDialog, pairs, mainnet, approveSession, rejectSession, disconnect, showError]);

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

  const handleEdit = useCallback(
    async (topic: string) => {
      onClose?.();
      try {
        await window.permissionsAPI.editPair({ topic });
      } catch (err) {
        showError(err);
      }
    },
    [onClose, showError],
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
                  <MenuItem onClick={() => handleEdit(pair.topic)} close>
                    <ListItemIcon>
                      <EditIcon fontSize="small" color="info" />
                    </ListItemIcon>
                    <Typography variant="inherit" noWrap>
                      <Trans>Edit</Trans>
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

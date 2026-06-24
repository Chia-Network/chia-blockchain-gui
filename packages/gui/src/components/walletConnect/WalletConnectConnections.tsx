import { Flex, Loading, useOpenDialog, More, MenuItem, useShowError } from '@chia-network/core';
import { Trans } from '@lingui/macro';
import {
  CheckCircleTwoTone as CheckCircleTwoToneIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
} from '@mui/icons-material';
import { Button, ListItemIcon, Typography, Divider } from '@mui/material';
import React, { useCallback } from 'react';

import useWalletConnect from '../../hooks/useWalletConnect';
import useWalletConnectPreferences from '../../hooks/useWalletConnectPreferences';

import WalletConnectAddConnectionDialog from './WalletConnectAddConnectionDialog';

export type WalletConnectConnectionsProps = {
  onClose?: () => void;
};

export default function WalletConnectConnections(props: WalletConnectConnectionsProps) {
  const { onClose } = props;
  const openDialog = useOpenDialog();
  const showError = useShowError();
  const { enabled, setEnabled } = useWalletConnectPreferences();
  const { disconnectPair, pairs, isLoading } = useWalletConnect();

  function handleEnableWalletConnect() {
    setEnabled(true);
  }

  const handleAddConnection = useCallback(async () => {
    try {
      onClose?.();
      await openDialog(<WalletConnectAddConnectionDialog />);
    } catch (err) {
      showError(err);
    }
  }, [onClose, showError, openDialog]);

  async function handleDisconnectPair(topic: string) {
    try {
      onClose?.();
      await disconnectPair(topic);
    } catch (error) {
      showError(error);
    }
  }

  const handleEdit = useCallback(
    async (topic: string) => {
      onClose?.();
      try {
        await window.permissionsAPI.editPair(topic);
      } catch (err) {
        showError(err);
      }
    },
    [onClose, showError],
  );

  return (
    <Flex flexDirection="column" gap={1}>
      <Flex flexDirection="column" gap={1} paddingX={2} paddingY={1.5}>
        <Typography variant="h6">
          <Trans>Connected Applications</Trans>
        </Typography>
        {isLoading ? (
          <Loading center />
        ) : enabled && pairs.length > 0 ? (
          <Flex flexDirection="column">
            {pairs.map((pair) => (
              <Flex alignItems="center" key={pair.topic} justifyContent="space-between">
                <Flex alignItems="center" gap={1}>
                  <CheckCircleTwoToneIcon color={pair.sessions > 0 ? 'primary' : 'secondary'} />
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
                  <MenuItem onClick={() => handleDisconnectPair(pair.topic)} close>
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

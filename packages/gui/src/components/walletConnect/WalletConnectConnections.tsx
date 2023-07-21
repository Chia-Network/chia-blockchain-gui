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
import WalletConnectConnectedDialog from './WalletConnectConnectedDialog';
import WalletConnectPairInfoDialog from './WalletConnectPairInfoDialog';

export type WalletConnectConnectionsProps = {
  onClose?: () => void;
};

export default function WalletConnectConnections(props: WalletConnectConnectionsProps) {
  const { onClose } = props;
  const openDialog = useOpenDialog();
  const showError = useShowError();
  const { enabled, setEnabled } = useWalletConnectPreferences();
  const { disconnect, pairs, isLoading } = useWalletConnectContext();

  const handleAddConnection = useCallback(async () => {
    onClose?.();
    const topic = await openDialog(<WalletConnectAddConnectionDialog />);

    if (topic) {
      await openDialog(<WalletConnectConnectedDialog topic={topic} />);
    }
  }, [onClose, openDialog]);

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
    [onClose, openDialog]
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

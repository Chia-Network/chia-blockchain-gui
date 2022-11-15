import React from 'react';
import { Trans } from '@lingui/macro';
import { Flex, Loading, useOpenDialog, More, MenuItem } from '@chia/core';
import {
  CheckCircleTwoTone as CheckCircleTwoToneIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
} from '@mui/icons-material';
import { useGetKeysQuery } from '@chia/api-react';
import { Button, ListItemIcon, Typography, Divider } from '@mui/material';
import WalletConnectAddConnectionDialog from './WalletConnectAddConnectionDialog';
import useWalletConnectContext from '../../hooks/useWalletConnectContext';
import useWalletConnectPrefs from '../../hooks/useWalletConnectPrefs';
import WalletConnectConnectedDialog from './WalletConnectConnectedDialog';
import WalletConnectPairInfoDialog from './WalletConnectPairInfoDialog';
import type Pair from '../../@types/Pair';

export type WalletConnectConnectionsProps = {
  onClose?: () => void;
};

export default function WalletConnectConnections(
  props: WalletConnectConnectionsProps,
) {
  const { onClose } = props;
  const openDialog = useOpenDialog();
  const { enabled, setEnabled } = useWalletConnectPrefs();
  const {
    disconnect,
    pairs,
    isLoading: isLoadingWalletConnect,
  } = useWalletConnectContext();
  const { data: publicKeyFingerprints, isLoading: isLoadingPublicKeys } =
    useGetKeysQuery();

  const isLoading = isLoadingWalletConnect || isLoadingPublicKeys;

  function getName(pair: Pair) {
    const { fingerprints } = pair;

    const value = publicKeyFingerprints
      ?.filter((key) => fingerprints.includes(key.fingerprint))
      .map((key) => key.label ?? key.fingerprint)
      .join(',');

    return value ?? 'No keys';
  }

  async function handleAddConnection() {
    console.log('handleAddConnection');
    onClose?.();
    const topic = await openDialog(<WalletConnectAddConnectionDialog />);
    console.log('topic', topic);

    if (topic) {
      await openDialog(<WalletConnectConnectedDialog topic={topic} />);
    }
  }

  function handleDisconnect(topic: string) {
    disconnect(topic);
    onClose?.();
  }

  function handleEnableWalletConnect() {
    setEnabled(true);
  }

  function handleShowMoreInfo(topic: string) {
    onClose?.();
    openDialog(<WalletConnectPairInfoDialog topic={topic} />);
  }

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
              <Flex
                alignItems="center"
                key={pair.topic}
                justifyContent="space-between"
              >
                <Flex alignItems="center" gap={1}>
                  <CheckCircleTwoToneIcon
                    color={pair.sessions.length ? 'primary' : 'secondary'}
                  />
                  <Typography>
                    {pair.metadata?.name ?? <Trans>Unknown Application</Trans>}
                  </Typography>
                </Flex>
                <More>
                  <MenuItem
                    onClick={() => handleShowMoreInfo(pair.topic)}
                    close
                  >
                    <ListItemIcon>
                      <EditIcon fontSize="small" />
                    </ListItemIcon>
                    <Typography variant="inherit" noWrap>
                      <Trans>More Info</Trans>
                    </Typography>
                  </MenuItem>
                  <MenuItem onClick={() => handleDisconnect(pair.topic)} close>
                    <ListItemIcon>
                      <DeleteIcon fontSize="small" />
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
          <Button
            onClick={handleAddConnection}
            variant="outlined"
            color="primary"
            size="small"
            disabled={isLoading}
          >
            <Trans>Add Connection</Trans>
          </Button>
        ) : (
          <Button
            onClick={handleEnableWalletConnect}
            variant="outlined"
            color="primary"
            size="small"
          >
            <Trans>Enable Wallet Connect</Trans>
          </Button>
        )}
      </Flex>
    </Flex>
  );
}

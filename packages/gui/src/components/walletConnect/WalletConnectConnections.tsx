import React from 'react';
import { Trans } from '@lingui/macro';
import { Flex, Loading, useOpenDialog } from '@chia/core';
import { CheckCircleTwoTone as CheckCircleTwoToneIcon } from '@mui/icons-material';
import { useGetKeysQuery } from '@chia/api-react';
import { Button, Typography, Table, TableRow, TableCell } from '@mui/material';
import WalletConnectAddConnectionDialog from './WalletConnectAddConnectionDialog';
import useWalletConnectContext from '../../hooks/useWalletConnectContext';
import WalletConnectConnectedDialog from './WalletConnectConnectedDialog';
import type Pair from '../../@types/Pair';

export type WalletConnectConnectionsProps = {
  onClose?: () => void;
};

export default function WalletConnectConnections(
  props: WalletConnectConnectionsProps,
) {
  const { onClose } = props;
  const openDialog = useOpenDialog();
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

  const pairsList = pairs.get();

  return (
    <Flex flexDirection="column" gap={2} paddingX={2} paddingY={1.5}>
      <Typography variant="h6">
        <Trans>Wallet Connect Connections</Trans>
      </Typography>
      {isLoading ? (
        <Loading center />
      ) : pairsList.length ? (
        <Table>
          {pairsList.map((pair) => (
            <TableRow key={pair.topic}>
              <TableCell>
                <Flex alignItems="center" gap={1}>
                  <CheckCircleTwoToneIcon
                    color={pair.sessions.length ? 'primary' : 'secondary'}
                  />
                  <Typography sx={{ fontWeight: 'bold' }}>
                    {pair.application ?? <Trans>Unknown Application</Trans>}
                  </Typography>
                </Flex>
              </TableCell>
              <TableCell>{getName(pair)}</TableCell>
              <TableCell>
                <Button
                  size="small"
                  onClick={() => handleDisconnect(pair.topic)}
                >
                  <Trans>Disconnect</Trans>
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </Table>
      ) : null}

      <Flex justifyContent="flex-end">
        <Button
          onClick={handleAddConnection}
          variant="outlined"
          color="secondary"
          size="small"
          disabled={isLoading}
        >
          <Trans>Add Connection</Trans>
        </Button>
      </Flex>
    </Flex>
  );
}

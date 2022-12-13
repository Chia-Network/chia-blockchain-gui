import { Connection, ServiceConnectionName } from '@chia-network/api';
import { useGetWalletConnectionsQuery } from '@chia-network/api-react';
import { Card, FormatBytes, Loading, Table } from '@chia-network/core';
import { Trans } from '@lingui/macro';
import { Tooltip } from '@mui/material';
import React from 'react';

const cols = [
  {
    minWidth: '200px',
    field(row: Connection) {
      return (
        <Tooltip title={row.nodeId}>
          <span>{row.nodeId}</span>
        </Tooltip>
      );
    },
    title: <Trans>Node ID</Trans>,
  },
  {
    field: 'peerHost',
    title: <Trans>IP address</Trans>,
  },
  {
    field(row: Connection) {
      return `${row.peerPort}/${row.peerServerPort}`;
    },
    title: <Trans>Port</Trans>,
  },
  {
    field(row: Connection) {
      return (
        <>
          <FormatBytes value={row.bytesWritten} unit="MiB" removeUnit fixedDecimals />
          /
          <FormatBytes value={row.bytesRead} unit="MiB" removeUnit fixedDecimals />
        </>
      );
    },
    title: <Trans>MiB Up/Down</Trans>,
  },
  {
    field(row: Connection) {
      // @ts-ignore
      return ServiceConnectionName[row.type];
    },
    title: <Trans>Connection type</Trans>,
  },
];

export type WalletConnectionsProps = {
  walletId: number;
};

export default function WalletConnections(props: WalletConnectionsProps) {
  const { walletId } = props;
  const { data: connections, isLoading } = useGetWalletConnectionsQuery(
    {
      walletId,
    },
    {
      pollingInterval: 10_000,
    }
  );

  return (
    <Card title={<Trans>Wallet Connections</Trans>}>
      {isLoading ? (
        <Loading center />
      ) : !connections?.length ? (
        <Trans>List of connections is empty</Trans>
      ) : (
        <Table cols={cols} rows={connections} />
      )}
    </Card>
  );
}

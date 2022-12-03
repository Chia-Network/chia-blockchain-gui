import { Connection } from '@chia-network/api';
import { useGetFullNodeConnectionsQuery } from '@chia-network/api-react';
import { Card, FormatBytes, FormatLargeNumber, IconButton, Loading, Table, useOpenDialog } from '@chia-network/core';
import { Trans } from '@lingui/macro';
import { Button, Tooltip } from '@mui/material';
import { Delete as DeleteIcon } from '@mui/icons-material';
import styled from 'styled-components';
import FullNodeAddConnection from './FullNodeAddConnection';
import FullNodeCloseConnection from './FullNodeCloseConnection';
import React from 'react';

import { service_connection_types } from '../../util/service_names';

const StyledIconButton = styled(IconButton)`
  padding: 0.2rem;
`;

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
      return service_connection_types[row.type];
    },
    title: <Trans>Connection type</Trans>,
  },
  {
    field: (row: Connection) => <FormatLargeNumber value={row.peakHeight} />,
    title: <Trans>Height</Trans>,
  },
  {
    title: <Trans>Actions</Trans>,
    field(row: Connection) {
      return (
        <FullNodeCloseConnection nodeId={row.nodeId}>
          {({ onClose }) => (
            <StyledIconButton onClick={onClose}>
              <DeleteIcon />
            </StyledIconButton>
          )}
        </FullNodeCloseConnection>
      );
    },
  },
];

export default function Connections() {
  const openDialog = useOpenDialog();
  const { data: connections, isLoading } = useGetFullNodeConnectionsQuery();

  function handleAddPeer() {
    openDialog(<FullNodeAddConnection />);
  }

  return (
    <Card
      title={<Trans>Full Node Connections</Trans>}
      action={
        <Button onClick={handleAddPeer} variant="outlined">
          <Trans>Connect to other peers</Trans>
        </Button>
      }
    >
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

import React from 'react';
import { Trans } from '@lingui/macro';
import styled from 'styled-components';
import { Link, Typography, Tooltip, IconButton } from '@material-ui/core';
import { Delete as DeleteIcon } from '@material-ui/icons';
import {
  Flex,
  Table,
  Card,
  FormatBytes,
  FormatConnectionStatus,
  Loading,
} from '@chia/core';
import { useGetFarmerFullNodeConnectionsQuery, useIsServiceRunningQuery } from '@chia/api-react';
import type { Connection } from '@chia/api';
import { ServiceName } from '@chia/api';
import FarmCloseConnection from './FarmCloseConnection';

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
    title: <Trans>Host Name</Trans>,
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
          <FormatBytes
            value={row.bytesWritten}
            unit="kiB"
            removeUnit
            fixedDecimals
          />
          /
          <FormatBytes
            value={row.bytesRead}
            unit="kiB"
            removeUnit
            fixedDecimals
          />
        </>
      );
    },
    title: <Trans>KiB Up/Down</Trans>,
  },
  {
    title: <Trans>Actions</Trans>,
    field(row: Connection) {
      return (
        <FarmCloseConnection nodeId={row.nodeId}>
          {({ onClose }) => (
            <StyledIconButton onClick={() => onClose()}>
              <DeleteIcon />
            </StyledIconButton>
          )}
        </FarmCloseConnection>
      );
    },
  },
];

export default function FarmFullNodeConnections() {
  const { data: connections = [] } = useGetFarmerFullNodeConnectionsQuery();
  const { data: isRunning, isLoading } = useIsServiceRunningQuery({
    service: ServiceName.FARMER,
  }, {
    pollingInterval: 1000,
  });

  return (
    <Card
      title={<Trans>Your Full Node Connection</Trans>}
      tooltip={
        <Trans>
          {'The full node that your farmer is connected to is below. '}
          <Link
            target="_blank"
            href="https://github.com/Chia-Network/chia-blockchain/wiki/Network-Architecture"
          >
            Learn more
          </Link>
        </Trans>
      }
      interactive
    >
      <Flex justifyContent="flex-end" gap={1}>
        <Typography variant="caption" color="textSecondary">
          <Trans>Connection Status:</Trans>
        </Typography>
        <FormatConnectionStatus connected={isRunning} />
      </Flex>
      {isLoading ? (
        <Loading center />
      ) : (
        <Table cols={cols} rows={connections} />
      )}
    </Card>
  );
}

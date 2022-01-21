import React from 'react';
import { Trans } from '@lingui/macro';
import styled from 'styled-components';
import { Typography, Tooltip, IconButton } from '@material-ui/core';
import { Delete as DeleteIcon } from '@material-ui/icons';
import {
  Flex,
  Table,
  FormatBytes,
  FormatConnectionStatus,
  Card,
} from '@chia/core';
import { useIsServiceRunningQuery, useGetHarvesterConnectionsQuery } from '@chia/api-react';
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

export default function FarmYourHarvesterNetwork() {
  const { data: connections = [] } = useGetHarvesterConnectionsQuery();

  const { data: isRunning, isLoading } = useIsServiceRunningQuery({
    service: ServiceName.HARVESTER,
  }, {
    pollingInterval: 1000,
  });

  return (
    <Card
      gap={1}
      title={<Trans>Your Harvester Network</Trans>}
      tooltip={
        <Trans>
          A harvester is a service running on a machine where plot(s) are
          actually stored. A farmer and harvester talk to a full node to see the
          state of the chain. View your network of connected harvesters below
          Learn more
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

      <Table cols={cols} rows={connections} />
    </Card>
  );
}

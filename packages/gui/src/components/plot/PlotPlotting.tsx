import { useGetThrottlePlotQueueQuery, useRefreshPlotsMutation } from '@chia-network/api-react';
import { Card, Table } from '@chia-network/core';
import { Trans } from '@lingui/macro';
import { TableRow } from '@mui/material';
import React, { useEffect, useMemo } from 'react';
import styled from 'styled-components';

import PlotQueueActions from './queue/PlotQueueActions';
import PlotQueueIndicator from './queue/PlotQueueIndicator';
import PlotQueueSize from './queue/PlotQueueSize';

export const StyledTableRow = styled(({ odd, ...rest }) => <TableRow {...rest} />)`
  ${({ odd, theme }) => (odd ? `background-color: ${theme.palette.action.hover};` : undefined)}
`;

const cols = [
  {
    title: <Trans>K-Size</Trans>,
    field: (queueItem) => <PlotQueueSize queueItem={queueItem} />,
  },
  {
    title: <Trans>Queue Name</Trans>,
    field: 'queue',
  },
  {
    title: <Trans>Status</Trans>,
    field: (queueItem) => <PlotQueueIndicator queueItem={queueItem} />,
  },
  {
    title: <Trans>Action</Trans>,
    field: (queueItem) => <PlotQueueActions queueItem={queueItem} />,
  },
];

export default function PlotPlotting() {
  const { isLoading, queue } = useGetThrottlePlotQueueQuery();
  const [refreshPlots] = useRefreshPlotsMutation();

  const nonFinished = useMemo(() => queue?.filter((item) => item.state !== 'FINISHED'), [queue]);
  const finished = useMemo(() => queue?.filter((item) => item.state === 'FINISHED'), [queue]);

  const finishedLength = finished?.length || 0;

  useEffect(() => {
    if (finishedLength > 0) {
      refreshPlots().unwrap();
    }
  }, [finishedLength, refreshPlots]);

  if (isLoading || !nonFinished?.length) {
    return null;
  }

  return (
    <Card title={<Trans>Plotting</Trans>} titleVariant="h6" transparent>
      <Table cols={cols} rows={nonFinished} isLoading={isLoading} />
    </Card>
  );
}

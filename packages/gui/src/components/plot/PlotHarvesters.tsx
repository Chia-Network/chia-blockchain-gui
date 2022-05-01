import React from 'react';
import { useGetHarvestersSummaryQuery } from '@chia/api-react';
import { Trans } from '@lingui/macro';
import { Loading, Flex } from '@chia/core';
import { Typography } from '@mui/material';
import PlotHarvester from './PlotHarvester';

export default function PlotHarvesters() {
  const { isLoading, data } = useGetHarvestersSummaryQuery();

  if (isLoading) {
    return (
      <Loading center />
    );
  }

  return (

    <Flex flexDirection="column" gap={1}>
      <Typography variant="h6">
        <Trans>Harvesters</Trans>
      </Typography>
      <Flex flexDirection="column" gap={3}>
        {data?.map((harvester) => (
          <PlotHarvester
            peerId={harvester.connection.nodeId}
            key={harvester.connection.nodeId}
            host={harvester.connection.host}
            port={harvester.connection.port}
            expanded={data?.length === 1}
          />
        ))}
        {data?.map((harvester) => (
          <PlotHarvester
            peerId={harvester.connection.nodeId}
            key={harvester.connection.nodeId}
            host={'23.5.6.8'}
            port={harvester.connection.port}
            expanded={data?.length === 1}
          />
        ))}
      </Flex>
    </Flex>
  );
}

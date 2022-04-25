import React from 'react';
import { useGetHarvestersSummaryQuery } from '@chia/api-react';
import { Loading, Flex } from '@chia/core';
import PlotHarvester from './PlotHarvester';

export default function PlotHarvesters() {
  const { isLoading, data } = useGetHarvestersSummaryQuery();

  if (isLoading) {
    return (
      <Loading center />
    );
  }

  return (
    <Flex flexDirecton="column" gap={3}>
      {data?.map((harvester) => (
        <PlotHarvester
          peerId={harvester.connection.nodeId}
          key={harvester.connection.nodeId}
          host={harvester.connection.host}
          port={harvester.connection.port}
        />
      ))}
    </Flex>
  );
}

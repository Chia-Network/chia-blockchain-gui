import { useGetThrottlePlotQueueQuery, useGetTotalHarvestersSummaryQuery } from '@chia-network/api-react';
import { Loading, Flex } from '@chia-network/core';
import { Grid } from '@mui/material';
import React from 'react';

import PlotHero from './PlotOverviewHero';
import PlotOverviewPlots from './PlotOverviewPlots';

export default function PlotOverview() {
  const { isLoading: isLoadingQueue, hasQueue } = useGetThrottlePlotQueueQuery();
  const { isLoading: isLoadingTotalHarvestrSummary, harvesters } = useGetTotalHarvestersSummaryQuery();

  const isLoading = isLoadingQueue || isLoadingTotalHarvestrSummary;
  const hasData = hasQueue || !!harvesters;

  return (
    <Flex flexDirection="column" gap={3}>
      {isLoading ? (
        <Loading center />
      ) : hasData ? (
        <PlotOverviewPlots />
      ) : (
        <Grid container spacing={3}>
          <Grid xs={12} item>
            <PlotHero />
          </Grid>
        </Grid>
      )}
    </Flex>
  );
}

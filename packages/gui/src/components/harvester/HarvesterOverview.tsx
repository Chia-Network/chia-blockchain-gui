import { useGetHarvestersQuery, useGetNewFarmingInfoQuery } from '@chia-network/api-react';
import { Flex, FormatBytes, FormatLargeNumber, CardSimple } from '@chia-network/core';
import { Trans } from '@lingui/macro';
import { Grid, Typography } from '@mui/material';
import React from 'react';

import isLocalhost from '../../util/isLocalhost';
import { UI_ACTUAL_SPACE_CONSTANT_FACTOR, expectedPlotSize } from '../../util/plot';
import HarvesterDetail from './HarvesterDetail';

export default function HarvesterOverview() {
  const { isLoading: isLoadingHarvesters, data: harvesters } = useGetHarvestersQuery();
  const { isLoading: isLoadingFarmingInfo, data } = useGetNewFarmingInfoQuery();

  const newFarmingInfo = data?.newFarmingInfo;
  const latencyData = data?.latencyData;

  const totalFarmSizeRaw = React.useMemo(() => {
    if (!harvesters) {
      return 0;
    }
    let size = 0;
    for (let i = 0; i < harvesters.length; i++) {
      const h = harvesters[i];
      size += h.totalPlotSize;
    }
    return size;
  }, [harvesters]);

  const totalFarmSizeEffective = React.useMemo(() => {
    if (!harvesters) {
      return 0;
    }
    let size = 0;
    for (let i = 0; i < harvesters.length; i++) {
      const h = harvesters[i];
      for (let k = 0; k < h.plots.length; k++) {
        const p = h.plots[k];
        size += expectedPlotSize(p.size) * UI_ACTUAL_SPACE_CONSTANT_FACTOR;
      }
    }
    return size;
  }, [harvesters]);

  const numberOfPlots = React.useMemo(() => {
    if (!harvesters) {
      return 'N/A';
    }
    let plots = 0;
    for (let i = 0; i < harvesters.length; i++) {
      const h = harvesters[i];
      plots += h.plots.length;
    }
    return <FormatLargeNumber value={plots} />;
  }, [harvesters]);

  const eligiblePlots = React.useMemo(() => {
    if (!newFarmingInfo || newFarmingInfo.length === 0) {
      return 'N/A';
    }
    let totalPlots = 0;
    let totalPassedFilter = 0;
    if (newFarmingInfo.length > 0) {
      const info = newFarmingInfo[0]; // Only cares the latest farming info
      totalPlots += info.totalPlots;
      totalPassedFilter += info.passedFilter;
    }
    return `${totalPassedFilter} / ${totalPlots}`;
  }, [newFarmingInfo]);

  const duplicatePlots = React.useMemo(() => {
    if (!harvesters) {
      return 'N/A';
    }
    let plots = 0;
    for (let i = 0; i < harvesters.length; i++) {
      const h = harvesters[i];
      plots += h.duplicates.length;
    }
    return <FormatLargeNumber value={plots} />;
  }, [harvesters]);

  const harvesterSummaries = React.useMemo(() => {
    if (!harvesters) {
      return undefined;
    }
    const elements: React.ReactElement[] = [];
    for (let i = 0; i < harvesters.length; i++) {
      const h = harvesters[i];
      if (isLocalhost(h.connection.host)) {
        elements.push(
          <Grid xs={12} sm={12} md={6} item>
            <HarvesterDetail
              key={h.connection.nodeId}
              loading={isLoadingFarmingInfo}
              harvester={h}
              latencyData={latencyData}
              totalFarmSizeRaw={totalFarmSizeRaw}
              totalFarmSizeEffective={totalFarmSizeEffective}
            />
          </Grid>
        );
      }
    }
    return elements;
  }, [harvesters, isLoadingFarmingInfo, latencyData, totalFarmSizeRaw, totalFarmSizeEffective]);

  return (
    <Flex flexDirection="column" gap={2}>
      <Typography variant="h5" gutterBottom>
        <Trans>Harvester Summary</Trans>
      </Typography>
      <Flex flexDirection="column" gap={1}>
        <Typography variant="h6" gutterBottom>
          <Trans>Space</Trans>
        </Typography>
        <Grid spacing={2} alignItems="stretch" container>
          <Grid xs={12} sm={6} md={4} item>
            <CardSimple
              loading={isLoadingHarvesters}
              valueColor="primary"
              title={<Trans>Total farm size raw</Trans>}
              value={<FormatBytes value={totalFarmSizeRaw} precision={3} />}
            />
          </Grid>
          <Grid xs={12} sm={6} md={4} item>
            <CardSimple
              loading={isLoadingHarvesters}
              valueColor="primary"
              title={<Trans>Total farm size effective</Trans>}
              value={<FormatBytes value={totalFarmSizeEffective} precision={3} />}
            />
          </Grid>
          <Grid xs={12} sm={6} md={4} item>
            <CardSimple
              loading={isLoadingHarvesters}
              valueColor="primary"
              title={<Trans>Number of plots</Trans>}
              value={numberOfPlots}
            />
          </Grid>
        </Grid>
      </Flex>
      <Flex direction="column" gap={1}>
        <Typography variant="h6" gutterBottom>
          <Trans>Harvesting Effectiveness</Trans>
        </Typography>
        <Grid spacing={2} alignItems="stretch" container>
          <Grid xs={12} sm={6} md={4} item>
            <CardSimple
              loading={isLoadingFarmingInfo}
              valueColor="primary"
              title={<Trans>Eligible plots per signage point</Trans>}
              value={eligiblePlots}
            />
          </Grid>
          <Grid xs={12} sm={6} md={4} item>
            <CardSimple
              loading={isLoadingHarvesters}
              valueColor="primary"
              title={<Trans>Duplicate plots</Trans>}
              value={duplicatePlots}
            />
          </Grid>
        </Grid>
      </Flex>
      <Flex direction="column" gap={1}>
        <Typography variant="h6" gutterBottom>
          <Trans>Harvesters</Trans>
        </Typography>
        <Grid spacing={2} alignItems="stretch" container>
          {harvesterSummaries}
        </Grid>
      </Flex>
    </Flex>
  );
}

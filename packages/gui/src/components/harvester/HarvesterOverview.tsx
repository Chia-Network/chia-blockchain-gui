import { useGetHarvestersQuery, useGetNewFarmingInfoQuery } from '@chia-network/api-react';
import { Flex, FormatBytes, FormatLargeNumber, CardSimple } from '@chia-network/core';
import { Trans } from '@lingui/macro';
import { Grid, Typography } from '@mui/material';
import React from 'react';

import { UI_ACTUAL_SPACE_CONSTANT_FACTOR, expectedPlotSize, PLOT_FILTER } from '../../util/plot';
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
      const totalPlotSize = +h.totalPlotSize;
      if (!Number.isNaN(totalPlotSize)) {
        size += totalPlotSize;
      }
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
        const kSize = +p.size;
        if (!Number.isNaN(kSize)) {
          size += expectedPlotSize(kSize) * UI_ACTUAL_SPACE_CONSTANT_FACTOR;
        }
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
      return {
        tooltip: <Trans>The average number of plots which passed filter over last 64 signage points</Trans>,
        value: 'N/A',
      };
    }

    const eligiblePlotsPerSp: Record<string, { totalPlots: number; passedFilter: number }> = {};
    for (let i = 0; i < newFarmingInfo.length; i++) {
      const nfi = newFarmingInfo[i];
      eligiblePlotsPerSp[nfi.signagePoint] = eligiblePlotsPerSp[nfi.signagePoint] || {
        totalPlots: 0,
        passedFilter: 0,
      };
      eligiblePlotsPerSp[nfi.signagePoint].totalPlots += nfi.totalPlots;
      eligiblePlotsPerSp[nfi.signagePoint].passedFilter += nfi.passedFilter;
      if (Object.keys(eligiblePlotsPerSp).length > 64) {
        // Only cares last 64 sps
        break;
      }
    }

    let sumTotalPlots = 0;
    let sumPassedFilter = 0;
    const sps = Object.keys(eligiblePlotsPerSp);
    for (let i = 0; i < sps.length; i++) {
      const sp = sps[i];
      const { totalPlots, passedFilter } = eligiblePlotsPerSp[sp];
      sumTotalPlots += totalPlots;
      sumPassedFilter += passedFilter;
    }

    const expectedAvgPassedFilter = Math.round((sumTotalPlots / PLOT_FILTER / sps.length) * 1000) / 1000;
    const avgPassedFilter = Math.round((sumPassedFilter / sps.length) * 1000) / 1000;
    return {
      tooltip: (
        <Trans>
          The average number of plots which passed filter over the last 64 signage points. It is expected to be{' '}
          {expectedAvgPassedFilter} for total {sumTotalPlots} plots
        </Trans>
      ),
      value: avgPassedFilter,
    };
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
      elements.push(
        <Grid key={h.connection.nodeId} xs={12} sm={12} md={6} item>
          <HarvesterDetail
            harvester={h}
            latencyData={latencyData}
            totalFarmSizeRaw={totalFarmSizeRaw}
            totalFarmSizeEffective={totalFarmSizeEffective}
          />
        </Grid>
      );
    }
    return elements;
  }, [harvesters, latencyData, totalFarmSizeRaw, totalFarmSizeEffective]);

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
              tooltip={eligiblePlots.tooltip}
              value={eligiblePlots.value}
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

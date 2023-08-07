import { useGetBlockchainStateQuery, useGetHarvestersQuery, useGetNewFarmingInfoQuery } from '@chia-network/api-react';
import { Flex, FormatBytes, FormatLargeNumber, CardSimple, useCurrencyCode } from '@chia-network/core';
import { Trans } from '@lingui/macro';
import { Grid, Typography } from '@mui/material';
import BigNumber from 'bignumber.js';
import React from 'react';

import { getPlotFilter } from '../../util/plot';
import HarvesterDetail from './HarvesterDetail';

export default function HarvesterOverview() {
  const { isLoading: isLoadingBlockchainState, data: blockChainState } = useGetBlockchainStateQuery();
  const { isLoading: isLoadingHarvesters, data: harvesters } = useGetHarvestersQuery();
  const { isLoading: isLoadingFarmingInfo, data } = useGetNewFarmingInfoQuery();
  const isTestnet = (useCurrencyCode() ?? 'XCH').toUpperCase() === 'TXCH';

  const newFarmingInfo = data?.newFarmingInfo;
  const latencyData = data?.latencyData;

  const totalFarmSizeRaw = React.useMemo(() => {
    if (!harvesters) {
      return new BigNumber(0);
    }
    let size = new BigNumber(0);
    for (let i = 0; i < harvesters.length; i++) {
      const h = harvesters[i];
      const totalPlotSize = new BigNumber(h.totalPlotSize);
      size = size.plus(totalPlotSize);
    }
    return size;
  }, [harvesters]);

  const totalFarmSizeEffective = React.useMemo(() => {
    if (!harvesters) {
      return new BigNumber(0);
    }
    let size = new BigNumber(0);
    for (let i = 0; i < harvesters.length; i++) {
      const h = harvesters[i];
      const totalEffectivePlotSize = new BigNumber(h.totalEffectivePlotSize);
      size = size.plus(totalEffectivePlotSize);
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
        value: '0',
      };
    }

    const eligiblePlotsPerSp: Record<string, { totalPlots: number; passedFilter: number }> = {};
    let latestTotalPlots = 0;
    for (let i = 0; i < newFarmingInfo.length; i++) {
      const nfi = newFarmingInfo[i];
      eligiblePlotsPerSp[nfi.signagePoint] = eligiblePlotsPerSp[nfi.signagePoint] || {
        totalPlots: 0,
        passedFilter: 0,
      };
      eligiblePlotsPerSp[nfi.signagePoint].totalPlots += nfi.totalPlots;
      eligiblePlotsPerSp[nfi.signagePoint].passedFilter += nfi.passedFilter;
      if (i === 0) {
        latestTotalPlots = nfi.totalPlots;
      }
      if (Object.keys(eligiblePlotsPerSp).length > 64) {
        // Only cares last 64 sps
        break;
      }
    }

    let sumPassedFilter = 0;
    const sps = Object.keys(eligiblePlotsPerSp);
    for (let i = 0; i < sps.length; i++) {
      const sp = sps[i];
      const { passedFilter } = eligiblePlotsPerSp[sp];
      sumPassedFilter += passedFilter;
    }

    const peak = !isLoadingBlockchainState && blockChainState ? blockChainState.peak.height : 0;
    const plotFilter = getPlotFilter(peak, isTestnet);
    const expectedAvgPassedFilter = Math.round((latestTotalPlots / plotFilter) * 1000) / 1000;
    const avgPassedFilter = sps.length > 0 ? Math.round((sumPassedFilter / sps.length) * 1000) / 1000 : 0;
    return {
      tooltip: (
        <Trans>
          The average number of plots which passed filter over the last 64 signage points. It is expected to be{' '}
          {expectedAvgPassedFilter} for total {latestTotalPlots} plots. (Current plot filter: 1 / {plotFilter})
        </Trans>
      ),
      value: avgPassedFilter,
    };
  }, [newFarmingInfo, isTestnet, blockChainState, isLoadingBlockchainState]);

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
      // When there're only 1 harvester, occupy the entire width of the page.
      const md = harvesters.length === 1 ? 12 : 6;
      elements.push(
        <Grid key={h.connection.nodeId} xs={12} sm={12} md={md} item>
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
              value={<FormatBytes value={totalFarmSizeEffective} precision={3} effectiveSize />}
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

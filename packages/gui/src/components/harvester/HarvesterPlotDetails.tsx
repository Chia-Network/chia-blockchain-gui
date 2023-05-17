import { HarvesterInfo } from '@chia-network/api';
import { Flex } from '@chia-network/core';
import { Trans } from '@lingui/macro';
import { Box, Paper, Typography } from '@mui/material';
import * as React from 'react';

import {
  ColorCodesForCompressions,
  ColorCodesForKSizes,
  DoughnutChartData,
  PurePlotDetailsChart,
} from './PlotDetailsChart';

export type HarvesterPlotDetailsProps = {
  harvester?: HarvesterInfo;
};

export default React.memo(HarvesterPlotDetails);
function HarvesterPlotDetails(props: HarvesterPlotDetailsProps) {
  const { harvester } = props;

  const plotSummary = React.useMemo(() => {
    if (!harvester) {
      return { totalPlots: 0, totalOg: 0, totalPlotNft: 0 };
    }

    const totalPlots = harvester.plots.length;
    let totalOg = 0;
    let totalPlotNft = 0;

    for (let i = 0; i < harvester.plots.length; i++) {
      const p = harvester.plots[i];
      if (p.poolContractPuzzleHash) {
        totalPlotNft++;
      } else {
        totalOg++;
      }
    }

    return { totalPlots, totalOg, totalPlotNft };
  }, [harvester]);

  const plotStats = React.useMemo(() => {
    if (!harvester) {
      return { compressionRecords: undefined, compressionData: undefined, sizeRecords: undefined, sizeData: undefined };
    }
    const { plots } = harvester;
    const totalPlots = plots.length;
    const plotsByCompression: Record<number, number> = {};
    const plotsBySize: Record<number, number> = {};
    const plotsByCompressionAndSize: Record<number, Record<number, number>> = {};
    for (let i = 0; i < plots.length; i++) {
      const p = plots[i];
      const cl = p.compressionLevel || 0;
      const s = +p.size;

      plotsByCompression[cl] = (plotsByCompression[cl] || 0) + 1;
      plotsBySize[s] = (plotsBySize[s] || 0) + 1;
      plotsByCompressionAndSize[cl] = plotsByCompressionAndSize[cl] || {};
      plotsByCompressionAndSize[cl][s] = (plotsByCompressionAndSize[cl][s] || 0) + 1;
    }

    const compressionLevels = Object.keys(plotsByCompression).sort((a, b) => +a - +b);
    const compressionRecords: React.ReactElement[] = [];
    const compressionData: DoughnutChartData = { data: [], colors: [] };
    const compressionAndSizeData: DoughnutChartData = { data: [], colors: [] };
    for (let i = 0; i < compressionLevels.length; i++) {
      const cl = +compressionLevels[i];
      const count = plotsByCompression[cl];
      const percentage = (count / totalPlots) * 100;
      const bgColor = ColorCodesForCompressions[cl] || ColorCodesForCompressions[9];
      compressionData.data.push(percentage);
      compressionData.colors.push(bgColor);
      compressionRecords.push(
        <Box key={i} sx={{ marginTop: 1 }}>
          <Typography variant="body2">
            <Box
              sx={{
                backgroundColor: bgColor,
                width: '10px',
                height: '10px',
                display: 'inline-block',
                marginRight: 1,
                borderRadius: '3px',
              }}
            />
            C{cl} {count} {Math.round(percentage)}%
          </Typography>
        </Box>
      );

      const sizes = plotsByCompressionAndSize[cl] ? Object.keys(plotsByCompressionAndSize[cl]) : [];
      for (let k = 0; k < sizes.length; k++) {
        const size = +sizes[k];
        const countSize = plotsByCompressionAndSize[cl][size];
        const percentageSize = percentage * (countSize / count);
        const bgColorSize = ColorCodesForKSizes[size] || ColorCodesForKSizes[35];
        compressionAndSizeData.data.push(percentageSize);
        compressionAndSizeData.colors.push(bgColorSize);
      }
    }

    const sizes = Object.keys(plotsBySize).sort((a, b) => +a - +b);
    const sizeRecords: React.ReactElement[] = [];
    const sizeData: DoughnutChartData = { data: [], colors: [] };
    for (let i = 0; i < sizes.length; i++) {
      const s = +sizes[i];
      const count = plotsBySize[s];
      const percentage = (count / totalPlots) * 100;
      const bgColor = ColorCodesForKSizes[s] || ColorCodesForKSizes[35];
      sizeData.data.push(percentage);
      sizeData.colors.push(bgColor);
      sizeRecords.push(
        <Box key={i} sx={{ marginTop: 1 }}>
          <Typography variant="body2">
            <Box
              sx={{
                backgroundColor: ColorCodesForKSizes[s],
                width: '10px',
                height: '10px',
                display: 'inline-block',
                marginRight: 1,
                borderRadius: '3px',
              }}
            />
            K{s} {count} {Math.round(percentage)}%
          </Typography>
        </Box>
      );
    }

    return { compressionRecords, compressionData, sizeRecords, sizeData, compressionAndSizeData };
  }, [harvester]);

  const plotDetailsChart = React.useMemo(() => {
    if (!plotStats.compressionData || !plotStats.sizeData) {
      return undefined;
    }

    return (
      <PurePlotDetailsChart compressionData={plotStats.compressionData} sizeData={plotStats.compressionAndSizeData} />
    );
  }, [plotStats]);

  return (
    <Paper variant="outlined">
      <Box sx={{ p: 1.5 }}>
        <Flex direction="column" gap={1}>
          <Typography sx={{ fontWeight: 500 }}>
            <Trans>Plot details</Trans>
          </Typography>
          <Box>
            <Typography color="primary" sx={{ display: 'inline-block' }} variant="body2">
              <Trans>Total plots</Trans>: {plotSummary.totalPlots}
            </Typography>
            <Typography sx={{ display: 'inline-block', marginLeft: 2 }} variant="body2">
              <Trans>Total OG</Trans>: {plotSummary.totalOg}
            </Typography>
            <Typography sx={{ display: 'inline-block', marginLeft: 2 }} variant="body2">
              <Trans>Total plotNFT</Trans>: {plotSummary.totalPlotNft}
            </Typography>
          </Box>
          <Flex sx={{ marginTop: 2 }}>
            <Box sx={{ width: '50%' }}>
              <Flex gap={2}>
                <Box>
                  <Typography>
                    <Trans>Compression</Trans>
                  </Typography>
                  {plotStats.compressionRecords}
                </Box>
                <Box>
                  <Typography>
                    <Trans>Plot Sizes</Trans>
                  </Typography>
                  {plotStats.sizeRecords}
                </Box>
              </Flex>
            </Box>
            <Box sx={{ width: '50%', padding: 1 }}>{plotDetailsChart}</Box>
          </Flex>
        </Flex>
      </Box>
    </Paper>
  );
}

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
    const plotsBySizeAndCompression: Record<number, Record<number, number>> = {};
    for (let i = 0; i < plots.length; i++) {
      const p = plots[i];
      const cl = p.compressionLevel || 0;
      const s = +p.size;

      plotsByCompression[cl] = (plotsByCompression[cl] || 0) + 1;
      plotsBySize[s] = (plotsBySize[s] || 0) + 1;
      plotsBySizeAndCompression[s] = plotsBySizeAndCompression[s] || {};
      plotsBySizeAndCompression[s][cl] = (plotsBySizeAndCompression[s][cl] || 0) + 1;
    }

    const kSizes = Object.keys(plotsBySize).sort((a, b) => +a - +b);
    const breakDown: React.ReactElement[] = [];
    const kSizeData: DoughnutChartData = { data: [], colors: [], labels: [] };
    const kSizeAndCompressionData: DoughnutChartData = { data: [], colors: [], labels: [] };
    for (let i = 0; i < kSizes.length; i++) {
      const kSize = +kSizes[i];
      const count = plotsBySize[kSize];
      const percentage = (count / totalPlots) * 100;
      const bgColor = ColorCodesForKSizes[kSize] || ColorCodesForKSizes[35];
      kSizeData.labels.push(`K${kSize}`);
      kSizeData.data.push(count);
      kSizeData.colors.push(bgColor);

      const kSizeAndCompressionBreakDown: React.ReactElement[] = [];
      const compressions = plotsBySizeAndCompression[kSize] ? Object.keys(plotsBySizeAndCompression[kSize]) : [];
      for (let k = 0; k < compressions.length; k++) {
        const cl = +compressions[k];
        const countCompression = plotsBySizeAndCompression[kSize][cl];
        const percentageCompression = Math.round((countCompression / count) * 100);
        const bgColorSize = ColorCodesForCompressions[cl] || ColorCodesForCompressions[9];
        kSizeAndCompressionData.labels.push(`C${cl}`);
        kSizeAndCompressionData.data.push(countCompression);
        kSizeAndCompressionData.colors.push(bgColorSize);

        kSizeAndCompressionBreakDown.push(
          <Typography variant="body2" key={`${kSize}-${cl}`} sx={{ whiteSpace: 'nowrap' }}>
            <Box
              sx={{
                backgroundColor: ColorCodesForCompressions[cl],
                width: '10px',
                height: '10px',
                display: 'inline-block',
                marginRight: 1,
                borderRadius: '3px',
              }}
            />
            C{cl} {countCompression} {percentageCompression}%
          </Typography>
        );
      }

      breakDown.push(
        <Box key={kSize} sx={{ marginTop: 1 }}>
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
            K{kSize} {count} {Math.round(percentage)}%
          </Typography>
          <Box sx={{ paddingLeft: 2, position: 'relative' }}>
            <div
              style={{
                position: 'absolute',
                height: 14,
                width: 6,
                top: 0,
                left: 4,
                borderLeft: '1px solid #ccc',
                borderBottom: '1px solid #ccc',
              }}
            />
            <Typography sx={{ fontWeight: 500 }} variant="caption">
              <Trans>Compression</Trans>
            </Typography>
            {kSizeAndCompressionBreakDown}
          </Box>
        </Box>
      );
    }

    return { breakDown, kSizeData, kSizeAndCompressionData };
  }, [harvester]);

  const plotDetailsChart = React.useMemo(() => {
    if (!plotStats.kSizeData || !plotStats.kSizeAndCompressionData) {
      return undefined;
    }
    if (plotStats.kSizeData.data.length <= 1 && plotStats.kSizeAndCompressionData.data.length <= 1) {
      return undefined;
    }

    return <PurePlotDetailsChart kSizeData={plotStats.kSizeData} compressionData={plotStats.kSizeAndCompressionData} />;
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
            <Box sx={{ width: '55%' }}>
              <Typography sx={{ fontWeight: 500 }}>
                <Trans>Plot Sizes</Trans>
              </Typography>
              <Flex gap={2} sx={{ flexWrap: 'wrap' }}>
                {plotStats.breakDown}
              </Flex>
            </Box>
            <Box sx={{ width: '45%', padding: 1 }}>{plotDetailsChart}</Box>
          </Flex>
        </Flex>
      </Box>
    </Paper>
  );
}

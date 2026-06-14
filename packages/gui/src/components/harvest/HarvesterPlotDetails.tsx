import { HarvesterInfo } from '@chia-network/api';
import { Flex } from '@chia-network/core';
import { Trans } from '@lingui/macro';
import { Box, Paper, Typography } from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import * as React from 'react';

import { DoughnutChartData, PurePlotDetailsChart } from './PlotDetailsChart';

export type HarvesterPlotDetailsProps = {
  harvester?: HarvesterInfo;
};

export default React.memo(HarvesterPlotDetails);
function HarvesterPlotDetails(props: HarvesterPlotDetailsProps) {
  const { harvester } = props;
  const theme = useTheme();
  const palette = theme.palette as typeof theme.palette & {
    highlight: { main: string };
  };

  const chartColors = React.useMemo(() => {
    const compression = [
      palette.primary.main,
      palette.primary.dark,
      palette.highlight.main,
      palette.info.main,
      palette.secondary.main,
      alpha(palette.primary.main, 0.72),
      alpha(palette.highlight.main, 0.72),
      alpha(palette.info.main, 0.72),
      alpha(palette.text.primary, 0.42),
      alpha(palette.text.primary, 0.24),
    ];

    const kSize = [
      alpha(palette.text.primary, 0.24),
      alpha(palette.info.main, 0.72),
      palette.info.main,
      palette.primary.main,
      palette.highlight.main,
      palette.secondary.main,
    ];

    return { compression, kSize };
  }, [
    palette.highlight.main,
    palette.info.main,
    palette.primary.dark,
    palette.primary.main,
    palette.secondary.main,
    palette.text.primary,
  ]);

  const getCompressionColor = React.useCallback(
    (compressionLevel: number) => chartColors.compression[compressionLevel] ?? chartColors.compression[9],
    [chartColors.compression],
  );

  const getKSizeColor = React.useCallback(
    (kSize: number) => chartColors.kSize[[25, 31, 32, 33, 34, 35].indexOf(kSize)] ?? chartColors.kSize[5],
    [chartColors.kSize],
  );

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
      const bgColor = getKSizeColor(kSize);
      kSizeData.labels.push(`K${kSize}`);
      kSizeData.data.push(count);
      kSizeData.colors.push(bgColor);

      const kSizeAndCompressionBreakDown: React.ReactElement[] = [];
      const compressions = plotsBySizeAndCompression[kSize] ? Object.keys(plotsBySizeAndCompression[kSize]) : [];
      for (let k = 0; k < compressions.length; k++) {
        const cl = +compressions[k];
        const countCompression = plotsBySizeAndCompression[kSize][cl];
        const percentageCompression = Math.round((countCompression / count) * 100);
        const bgColorSize = getCompressionColor(cl);
        kSizeAndCompressionData.labels.push(`C${cl}`);
        kSizeAndCompressionData.data.push(countCompression);
        kSizeAndCompressionData.colors.push(bgColorSize);

        kSizeAndCompressionBreakDown.push(
          <Typography variant="body2" key={`${kSize}-${cl}`} sx={{ whiteSpace: 'nowrap' }}>
            <Box
              sx={{
                backgroundColor: bgColorSize,
                width: '10px',
                height: '10px',
                display: 'inline-block',
                marginRight: 1,
                borderRadius: '3px',
              }}
            />
            C{cl} {countCompression} {percentageCompression}%
          </Typography>,
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
                borderLeft: `1px solid ${alpha(palette.text.primary, 0.24)}`,
                borderBottom: `1px solid ${alpha(palette.text.primary, 0.24)}`,
              }}
            />
            <Typography sx={{ fontWeight: 500 }} variant="caption">
              <Trans>Compression</Trans>
            </Typography>
            {kSizeAndCompressionBreakDown}
          </Box>
        </Box>,
      );
    }

    return { breakDown, kSizeData, kSizeAndCompressionData };
  }, [getCompressionColor, getKSizeColor, harvester, palette.text.primary]);

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

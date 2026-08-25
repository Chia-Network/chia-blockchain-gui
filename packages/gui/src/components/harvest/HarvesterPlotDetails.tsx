import { HarvesterInfo } from '@chia-network/api';
import { Flex, getSemanticColors } from '@chia-network/core';
import { Trans } from '@lingui/macro';
import { Box, Paper, Typography } from '@mui/material';
import { alpha, useTheme, type Palette } from '@mui/material/styles';
import * as React from 'react';

import { DoughnutChartData, PurePlotDetailsChart } from './PlotDetailsChart';

function plotDetailSwatches(palette: Palette) {
  const semantic = getSemanticColors(palette);
  const primary = palette.primary.main;
  const primaryDark = palette.primary.dark ?? primary;
  const primaryLight = palette.primary.light ?? alpha(primary, 0.55);
  const secondary = palette.secondary.main;
  const info = palette.info?.main ?? semantic.highlight;
  const muted = alpha(palette.text.primary, palette.mode === 'dark' ? 0.28 : 0.16);
  const mutedStrong = alpha(palette.text.primary, palette.mode === 'dark' ? 0.45 : 0.28);

  const kSizeColors: Record<number, string> = {
    25: muted,
    31: mutedStrong,
    32: primaryDark,
    33: alpha(primary, 0.55),
    34: info,
    35: palette.text.secondary,
  };

  const compressionColors = [
    primary,
    primaryDark,
    alpha(primary, 0.78),
    semantic.highlight,
    primaryLight,
    alpha(info, 0.9),
    alpha(secondary, 0.85),
    info,
    mutedStrong,
    muted,
  ];

  return {
    kSize: (kSize: number) => kSizeColors[kSize] ?? kSizeColors[35],
    compression: (level: number) => {
      const index = Number.isFinite(level) ? Math.min(9, Math.max(0, Math.round(level))) : 9;
      return compressionColors[index] ?? compressionColors[9];
    },
    branch: palette.border?.main ?? mutedStrong,
  };
}

export type HarvesterPlotDetailsProps = {
  harvester?: HarvesterInfo;
};

export default React.memo(HarvesterPlotDetails);
function HarvesterPlotDetails(props: HarvesterPlotDetailsProps) {
  const { harvester } = props;
  const { palette } = useTheme();
  const swatches = React.useMemo(() => plotDetailSwatches(palette), [palette]);

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
      const bgColor = swatches.kSize(kSize);
      kSizeData.labels.push(`K${kSize}`);
      kSizeData.data.push(count);
      kSizeData.colors.push(bgColor);

      const kSizeAndCompressionBreakDown: React.ReactElement[] = [];
      const compressions = plotsBySizeAndCompression[kSize] ? Object.keys(plotsBySizeAndCompression[kSize]) : [];
      for (let k = 0; k < compressions.length; k++) {
        const cl = +compressions[k];
        const countCompression = plotsBySizeAndCompression[kSize][cl];
        const percentageCompression = Math.round((countCompression / count) * 100);
        const bgColorSize = swatches.compression(cl);
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
                borderLeft: `1px solid ${swatches.branch}`,
                borderBottom: `1px solid ${swatches.branch}`,
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
  }, [harvester, swatches]);

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

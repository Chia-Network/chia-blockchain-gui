import { HarvesterInfo } from '@chia-network/api';
import { Flex } from '@chia-network/core';
import { Trans } from '@lingui/macro';
import { Box, Paper, Typography } from '@mui/material';
import * as React from 'react';

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
  return (
    <Paper variant="outlined">
      <Box sx={{ p: 1.5 }}>
        <Flex direction="column" gap={1}>
          <Typography>
            <Trans>Plot details</Trans>
          </Typography>
          <Box>
            <Typography color="primary" sx={{ display: 'inline-block' }}>
              <Trans>Total plots</Trans> {plotSummary.totalPlots}
            </Typography>
            <Typography sx={{ display: 'inline-block', marginLeft: 2 }}>
              <Trans>Total OG</Trans> {plotSummary.totalOg}
            </Typography>
            <Typography color="primary" sx={{ display: 'inline-block' }}>
              <Trans>Total plots</Trans> {plotSummary.totalPlots}
            </Typography>
            <Typography sx={{ display: 'inline-block', marginLeft: 2 }}>
              <Trans>Total plotNFT</Trans> {plotSummary.totalPlotNft}
            </Typography>
          </Box>
        </Flex>
      </Box>
    </Paper>
  );
}

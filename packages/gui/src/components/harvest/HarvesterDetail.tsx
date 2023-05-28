import { HarvesterInfo, LatencyData } from '@chia-network/api';
import { Flex, FormatBytes, Tooltip } from '@chia-network/core';
import { Trans } from '@lingui/macro';
import { Box, Paper, Typography, LinearProgress, Chip } from '@mui/material';
import BigNumber from 'bignumber.js';
import * as React from 'react';

import isLocalhost from '../../util/isLocalhost';
import HarvesterLatency from './HarvesterLatency';
import HarvesterPlotDetails from './HarvesterPlotDetails';

export type HarvesterLatencyGraphProps = {
  harvester?: HarvesterInfo;
  latencyData?: LatencyData;
  totalFarmSizeRaw?: BigNumber;
  totalFarmSizeEffective?: BigNumber;
};

export default React.memo(HarvesterLatencyGraph);

function HarvesterLatencyGraph(props: HarvesterLatencyGraphProps) {
  const { harvester, latencyData, totalFarmSizeRaw, totalFarmSizeEffective } = props;
  // const { isDarkMode } = useDarkMode();
  const nodeId = harvester?.connection.nodeId;
  const host = harvester?.connection.host;
  // const latencyRecords = latencyData && nodeId ? latencyData[nodeId] : undefined;
  const isLocal = host ? isLocalhost(host) : undefined;
  const simpleNodeId = nodeId ? `${nodeId.substring(0, 6)}...${nodeId.substring(nodeId.length - 6)}` : undefined;
  const harvestingMode = harvester?.harvestingMode;

  const cardTitle = React.useMemo(() => {
    let chip;
    if (harvestingMode === 2) {
      chip = <Chip label="GPU" color="primary" />;
    } else if (typeof harvestingMode !== 'number') {
      chip = <Chip label="OLD" />;
    }

    return (
      <Box marginBottom={2}>
        <Flex flexDirection="column">
          <Flex alignItems="center" justifyContent="space-between" sx={{ width: '100%' }}>
            <Flex alignItems="baseline">
              <Typography variant="h6">
                {isLocal ? <Trans>Local Harvester</Trans> : <Trans>Remote Harvester</Trans>}
              </Typography>
              &nbsp;
              <Tooltip title={nodeId}>
                <Typography variant="body2" color="textSecondary">
                  {simpleNodeId}
                </Typography>
              </Tooltip>
            </Flex>
            <Box>{chip}</Box>
          </Flex>
          <Flex alignItems="center" gap={2}>
            <Typography variant="body2" color="textSecondary">
              {host}
            </Typography>
          </Flex>
        </Flex>
      </Box>
    );
  }, [isLocal, nodeId, simpleNodeId, host, harvestingMode]);

  const space = React.useMemo(() => {
    const effectiveSpace = harvester ? new BigNumber(harvester.totalEffectivePlotSize) : undefined;
    const totalSpaceOccupation =
      harvester && totalFarmSizeRaw
        ? new BigNumber(harvester.totalPlotSize).div(totalFarmSizeRaw).multipliedBy(100)
        : undefined;
    const effectiveSpaceOccupation =
      effectiveSpace && totalFarmSizeEffective
        ? effectiveSpace.div(totalFarmSizeEffective).multipliedBy(100)
        : undefined;

    const earnedSpacePercentage: React.ReactElement | string =
      harvester && totalFarmSizeRaw && effectiveSpace ? (
        <Tooltip
          title={<FormatBytes value={effectiveSpace.minus(new BigNumber(harvester.totalPlotSize))} precision={3} />}
        >
          {Math.round(effectiveSpace.minus(totalFarmSizeRaw).div(totalFarmSizeRaw).multipliedBy(1000).toNumber()) / 10}{' '}
          %
        </Tooltip>
      ) : (
        '-'
      );

    return (
      <Paper variant="outlined">
        <Box sx={{ p: 1.5 }}>
          <Flex direction="column" gap={1}>
            <Typography sx={{ fontWeight: 500 }}>
              <Trans>Space</Trans>
            </Typography>
            <table style={{ width: '100%' }}>
              <tbody>
                <tr>
                  <td colSpan={2}>
                    <Typography variant="body2" color="textSecondary">
                      <Trans>Total Space</Trans>
                    </Typography>
                  </td>
                  <td rowSpan={5} style={{ width: 1, whiteSpace: 'nowrap' }}>
                    <Box sx={{ paddingLeft: 2 }}>
                      <Paper variant="outlined">
                        <Box sx={{ p: 1.5 }}>
                          <Typography variant="body2" color="textSecondary">
                            <Trans>Earned</Trans>
                          </Typography>
                          <Typography variant="h6" color="textSecondary" sx={{ textAlign: 'center' }}>
                            {earnedSpacePercentage}
                          </Typography>
                          <Typography variant="body2" color="textSecondary">
                            <Trans>more space</Trans>
                          </Typography>
                        </Box>
                      </Paper>
                    </Box>
                  </td>
                </tr>
                <tr>
                  <td style={{ width: 1, whiteSpace: 'nowrap' }}>
                    <FormatBytes value={harvester?.totalPlotSize} precision={3} />
                  </td>
                  <td>
                    <Box sx={{ paddingLeft: 2 }}>
                      <LinearProgress
                        variant="determinate"
                        value={totalSpaceOccupation?.toNumber()}
                        sx={{ height: 20, '& > span': { backgroundColor: '#1a8284' } }}
                      />
                    </Box>
                  </td>
                </tr>
                <tr>
                  <td colSpan={2}>
                    <Box sx={{ height: 1 }} />
                  </td>
                </tr>
                <tr>
                  <td colSpan={2}>
                    <Typography variant="body2" color="textSecondary">
                      <Trans>Effective Space</Trans>
                    </Typography>
                  </td>
                </tr>
                <tr>
                  <td style={{ width: 1, whiteSpace: 'nowrap' }}>
                    <FormatBytes value={effectiveSpace} precision={3} effectiveSize />
                  </td>
                  <td>
                    <Box sx={{ paddingLeft: 2 }}>
                      <LinearProgress
                        variant="determinate"
                        value={effectiveSpaceOccupation?.toNumber()}
                        sx={{ height: 20, '& > span': { backgroundColor: '#5ece71' } }}
                      />
                    </Box>
                  </td>
                </tr>
              </tbody>
            </table>
          </Flex>
        </Box>
      </Paper>
    );
  }, [harvester, totalFarmSizeRaw, totalFarmSizeEffective]);

  const harvesterLatency = React.useMemo(
    () => <HarvesterLatency latencyInfo={latencyData && nodeId ? latencyData[nodeId] : undefined} />,
    [latencyData, nodeId]
  );

  const plotDetails = React.useMemo(() => <HarvesterPlotDetails harvester={harvester} />, [harvester]);

  return (
    <Paper variant="outlined" sx={{ p: 2 }}>
      {cardTitle}
      <Flex direction="column" gap={3}>
        {space}
        {harvesterLatency}
        {plotDetails}
      </Flex>
    </Paper>
  );
}

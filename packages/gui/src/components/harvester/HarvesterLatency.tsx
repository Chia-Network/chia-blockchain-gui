import { LatencyInfo } from '@chia-network/api';
import { Flex } from '@chia-network/core';
import { Trans } from '@lingui/macro';
import { Box, Paper, Typography, Select, MenuItem, FormControl, SelectChangeEvent } from '@mui/material';
import * as React from 'react';

import { PureLatencyBarChart, getSliceOfLatency, formatTime } from './LatencyCharts';

export type HarvesterLatencyProps = {
  latencyInfo?: LatencyInfo;
};

export default React.memo(HarvesterLatency);
function HarvesterLatency(props: HarvesterLatencyProps) {
  const { latencyInfo } = props;
  const [period, setPeriod] = React.useState<'1h' | '12h' | '24h' | '64sp'>('64sp'); // in Hour

  const slice = React.useMemo(() => {
    if (!latencyInfo || latencyInfo.latency.length === 0) {
      return [];
    }
    return getSliceOfLatency(latencyInfo.latency, period);
  }, [latencyInfo, period]);

  const stat = React.useMemo(() => {
    if (!latencyInfo || latencyInfo.latency.length === 0 || Number.isNaN(latencyInfo.max)) {
      return { avg: 0, max: 0, avgEl: <Trans>N/A</Trans>, maxEl: <Trans>N/A</Trans> };
    }
    if (period === '24h') {
      const avg = Math.round((latencyInfo.avg / 1000) * 100) / 100;
      const max = Math.round((latencyInfo.max / 1000) * 100) / 100;
      return {
        avg,
        max,
        avgEl: formatTime(avg),
        maxEl: formatTime(max),
      };
    }
    let sum = 0;
    let max = 0;
    for (let i = 0; i < slice.length; i++) {
      const latency = slice[i][1];
      sum += latency;
      max = max < latency ? latency : max;
    }
    const avg = Math.round((sum / 1000 / slice.length) * 100) / 100;
    max = Math.round((max / 1000) * 100) / 100;
    return {
      avg,
      max,
      avgEl: formatTime(avg),
      maxEl: formatTime(max),
    };
  }, [slice, latencyInfo, period]);

  const unit = stat.avg > 2000 ? 's' : 'ms';

  const onChangePeriod = React.useCallback((e: SelectChangeEvent) => {
    const selectEl = e.target as HTMLSelectElement;
    if (!selectEl) {
      return;
    }
    setPeriod(selectEl.value as '1h' | '12h' | '24h' | '64sp');
  }, []);

  return (
    <Paper variant="outlined">
      <Box sx={{ p: 1.5 }}>
        <Flex direction="column" gap={1}>
          <table>
            <tbody>
              <tr>
                <td>
                  <Typography sx={{ fontWeight: 500 }}>
                    <Trans>Harvester latency</Trans>
                  </Typography>
                </td>
                <td rowSpan={2} style={{ verticalAlign: 'top', width: 1, whiteSpace: 'nowrap' }}>
                  <FormControl size="small">
                    <Select value={period.toString()} onChange={onChangePeriod}>
                      <MenuItem value="1h">
                        <Typography color="primary">
                          <Trans>LAST 1 HOUR</Trans>
                        </Typography>
                      </MenuItem>
                      <MenuItem value="12h">
                        <Typography color="primary">
                          <Trans>LAST 12 HOURS</Trans>
                        </Typography>
                      </MenuItem>
                      <MenuItem value="24h">
                        <Typography color="primary">
                          <Trans>LAST 24 HOURS</Trans>
                        </Typography>
                      </MenuItem>
                      <MenuItem value="64sp">
                        <Typography color="primary">
                          <Trans>Last 64 SPs</Trans>
                        </Typography>
                      </MenuItem>
                    </Select>
                  </FormControl>
                </td>
              </tr>
              <tr>
                <td>
                  <Typography color="primary" sx={{ display: 'inline-block' }}>
                    <Trans>Ave</Trans> {stat.avgEl}
                  </Typography>
                  <Typography sx={{ display: 'inline-block', marginLeft: 2 }}>
                    <Trans>Max</Trans> {stat.maxEl}
                  </Typography>
                </td>
              </tr>
            </tbody>
          </table>
          <PureLatencyBarChart latency={slice} period={period} unit={unit} />
        </Flex>
      </Box>
    </Paper>
  );
}

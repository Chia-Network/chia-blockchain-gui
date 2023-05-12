import { LatencyInfo, LatencyRecord } from '@chia-network/api';
import { Flex } from '@chia-network/core';
import { Trans } from '@lingui/macro';
import { Box, Paper, Typography, Select, MenuItem, FormControl, SelectChangeEvent } from '@mui/material';
import * as React from 'react';

function getSliceOfLatency(data: LatencyRecord[], periodInHours: number) {
  const now = Date.now();
  const periodInMs = 3_600_000 * periodInHours;

  // @TODO Replace below with better algorithm for performance
  for (let i = 0; i < data.length; i++) {
    const d = data[i][0];
    if (now - d < periodInMs) {
      return data.slice(i);
    }
  }
  return [] as LatencyRecord[];
}

export type HarvesterLatencyProps = {
  latencyInfo?: LatencyInfo;
};

export default React.memo(HarvesterLatency);
function HarvesterLatency(props: HarvesterLatencyProps) {
  const { latencyInfo } = props;
  const [period, setPeriod] = React.useState<1 | 12 | 24>(24); // in Hour

  const slice = React.useMemo(() => {
    if (!latencyInfo || latencyInfo.latency.length === 0) {
      return [];
    }
    return getSliceOfLatency(latencyInfo.latency, period);
  }, [latencyInfo, period]);

  const stat = React.useMemo(() => {
    if (!latencyInfo || latencyInfo.latency.length === 0) {
      return { avg: 0, max: 0, min: 0 };
    }
    if (period === 24) {
      return {
        avg: Math.round((latencyInfo.avg / 1000) * 100) / 100,
        max: Math.round((latencyInfo.max / 1000) * 100) / 100,
        min: Math.round((latencyInfo.min / 1000) * 100) / 100,
      };
    }
    let sum = 0;
    let max = 0;
    let min = 0;
    for (let i = 0; i < slice.length; i++) {
      const latency = slice[i][1];
      sum += latency;
      max = max < latency ? latency : max;
      min = min > latency ? latency : min;
    }
    return {
      avg: Math.round((sum / 1000 / slice.length) * 100) / 100,
      max: Math.round((max / 1000) * 100) / 100,
      min: Math.round((min / 1000) * 100) / 100,
    };
  }, [slice, latencyInfo, period]);

  const onChangePeriod = React.useCallback((e: SelectChangeEvent) => {
    const selectEl = e.target as HTMLSelectElement;
    if (!selectEl) {
      return;
    }
    setPeriod(+selectEl.value as 1 | 12 | 24);
  }, []);

  return (
    <Paper variant="outlined">
      <Box sx={{ p: 1.5 }}>
        <Flex direction="column" gap={1}>
          <table>
            <tbody>
              <tr>
                <td>
                  <Typography>
                    <Trans>Harvester latency</Trans>
                  </Typography>
                </td>
                <td rowSpan={2} style={{ verticalAlign: 'top', width: 1, whiteSpace: 'nowrap' }}>
                  <FormControl size="small">
                    <Select value={period.toString()} onChange={onChangePeriod}>
                      <MenuItem value={1}>
                        <Typography color="primary">
                          1 <Trans>HOURS</Trans>
                        </Typography>
                      </MenuItem>
                      <MenuItem value={12}>
                        <Typography color="primary">
                          12 <Trans>HOURS</Trans>
                        </Typography>
                      </MenuItem>
                      <MenuItem value={24}>
                        <Typography color="primary">
                          24 <Trans>HOURS</Trans>
                        </Typography>
                      </MenuItem>
                    </Select>
                  </FormControl>
                </td>
              </tr>
              <tr>
                <td>
                  <Typography color="primary" sx={{ display: 'inline-block' }}>
                    <Trans>Ave</Trans> {stat.avg} ms
                  </Typography>
                  <Typography sx={{ display: 'inline-block', marginLeft: 2 }}>
                    <Trans>Max</Trans> {stat.max} ms
                  </Typography>
                </td>
              </tr>
            </tbody>
          </table>
        </Flex>
      </Box>
    </Paper>
  );
}

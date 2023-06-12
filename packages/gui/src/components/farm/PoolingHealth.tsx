import { useGetPoolStateQuery } from '@chia-network/api-react';
import { Flex, StateIndicator, State, Tooltip } from '@chia-network/core';
import { Trans } from '@lingui/macro';
import { Box, Paper, Typography, CircularProgress } from '@mui/material';
import React from 'react';

const indicatorStyle = {
  marginTop: 1,
  '> div > div': {
    display: 'inline-flex',
  },
  '.cancel-icon': {
    g: {
      circle: {
        stroke: '#D32F2F',
        fill: '#D32F2F',
      },
    },
  },
  '.checkmark-icon': {
    g: {
      circle: {
        stroke: '#3AAC59',
        fill: '#3AAC59',
      },
      path: {
        stroke: '#3AAC59',
        fill: '#3AAC59',
      },
    },
  },
  '.reload-icon': {
    g: {
      circle: {
        stroke: '#FF9800',
        fill: '#FF9800',
      },
      path: {
        fill: '#FF9800',
      },
    },
  },
};

export default React.memo(PoolingHealth);
function PoolingHealth() {
  const { data, isLoading } = useGetPoolStateQuery();

  const totalPartials = React.useMemo(() => {
    if (!data) {
      return 0;
    }
    let value = 0;
    for (let i = 0; i < data.length; i++) {
      const d = data[i];
      value +=
        d.validPartialsSinceStart +
        d.invalidPartialsSinceStart +
        d.missingPartialsSinceStart +
        d.stalePartialsSinceStart;
    }
    return value;
  }, [data]);

  const validPartials = React.useMemo(() => {
    if (isLoading || !data) {
      return <CircularProgress color="secondary" size={14} />;
    }
    if (!data || data.length === 0) {
      return (
        <StateIndicator state={State.SUCCESS} indicator reversed>
          <Trans>None</Trans>
        </StateIndicator>
      );
    }

    let value = 0;
    for (let i = 0; i < data.length; i++) {
      const d = data[i];
      value += d.validPartialsSinceStart;
    }

    const rate = Math.floor((value / totalPartials) * 1000) / 10;
    if (value === totalPartials) {
      return (
        <StateIndicator state={State.SUCCESS} indicator reversed>
          100% {value} / {totalPartials}
        </StateIndicator>
      );
    }

    return (
      <StateIndicator state={State.WARNING} indicator reversed>
        {rate}% {value} / {totalPartials}
      </StateIndicator>
    );
  }, [isLoading, data, totalPartials]);

  const invalidPartials = React.useMemo(() => {
    if (isLoading || !data) {
      return <CircularProgress color="secondary" size={14} />;
    }
    if (!data || data.length === 0) {
      return (
        <StateIndicator state={State.SUCCESS} indicator reversed>
          <Trans>None</Trans>
        </StateIndicator>
      );
    }

    let value = 0;
    for (let i = 0; i < data.length; i++) {
      const d = data[i];
      value += d.invalidPartialsSinceStart;
    }

    const rate = Math.floor((value / totalPartials) * 1000) / 10;
    if (value === 0) {
      return (
        <StateIndicator state={State.SUCCESS} indicator reversed>
          None {value} / {totalPartials}
        </StateIndicator>
      );
    }

    return (
      <StateIndicator state={State.WARNING} indicator reversed>
        {rate}% {value} / {totalPartials}
      </StateIndicator>
    );
  }, [isLoading, data, totalPartials]);

  const missingPartials = React.useMemo(() => {
    if (isLoading || !data) {
      return <CircularProgress color="secondary" size={14} />;
    }
    if (!data || data.length === 0) {
      return (
        <StateIndicator state={State.SUCCESS} indicator reversed>
          <Trans>None</Trans>
        </StateIndicator>
      );
    }

    let value = 0;
    for (let i = 0; i < data.length; i++) {
      const d = data[i];
      value += d.missingPartialsSinceStart;
    }

    const rate = Math.floor((value / totalPartials) * 1000) / 10;
    if (value === 0) {
      return (
        <StateIndicator state={State.SUCCESS} indicator reversed>
          None {value} / {totalPartials}
        </StateIndicator>
      );
    }

    return (
      <StateIndicator state={State.WARNING} indicator reversed>
        {rate}% {value} / {totalPartials}
      </StateIndicator>
    );
  }, [isLoading, data, totalPartials]);

  const stalePartials = React.useMemo(() => {
    if (isLoading || !data) {
      return <CircularProgress color="secondary" size={14} />;
    }
    if (!data || data.length === 0) {
      return (
        <StateIndicator state={State.SUCCESS} indicator reversed>
          <Trans>None</Trans>
        </StateIndicator>
      );
    }

    let value = 0;
    for (let i = 0; i < data.length; i++) {
      const d = data[i];
      value += d.stalePartialsSinceStart;
    }

    const rate = Math.floor((value / totalPartials) * 1000) / 10;
    if (value === 0) {
      return (
        <StateIndicator state={State.SUCCESS} indicator reversed>
          None {value} / {totalPartials}
        </StateIndicator>
      );
    }

    return (
      <StateIndicator state={State.WARNING} indicator reversed>
        {rate}% {value} / {totalPartials}
      </StateIndicator>
    );
  }, [isLoading, data, totalPartials]);

  return (
    <Box>
      <Typography variant="h5" sx={{ marginBottom: 1 }}>
        <Trans>Pooling</Trans>
      </Typography>
      <Paper sx={{ padding: 2 }} variant="outlined">
        <Box>
          <Typography variant="h6">
            <Trans>Pooling Health</Trans>
          </Typography>
        </Box>
        <Flex justifyContent="space-between" sx={indicatorStyle}>
          <Tooltip title={<Trans>Partials successfully sent and acknowledged by pools</Trans>}>
            <Box>
              <Typography variant="body2" color="textSecondary">
                <Trans>Valid Partials</Trans>
              </Typography>
              {validPartials}
            </Box>
          </Tooltip>
          <Tooltip title={<Trans>Partials sent to pools but too late</Trans>}>
            <Box>
              <Typography variant="body2">
                <Trans>Stale Partials</Trans>
              </Typography>
              {stalePartials}
            </Box>
          </Tooltip>
          <Tooltip title={<Trans>Partials not good enough or rejected by pools</Trans>}>
            <Box>
              <Typography variant="body2">
                <Trans>Invalid partials</Trans>
              </Typography>
              {invalidPartials}
            </Box>
          </Tooltip>
          <Tooltip
            title={
              <Trans>
                Partials found but not sent to pools. This usually happens when a partial is found before connections to
                pools are established
              </Trans>
            }
          >
            <Box>
              <Typography variant="body2">
                <Trans>Missing partials</Trans>
              </Typography>
              {missingPartials}
            </Box>
          </Tooltip>
        </Flex>
      </Paper>
    </Box>
  );
}

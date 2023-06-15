import {
  useGetFilterChallengeStatQuery,
  useGetMissingSignagePointsQuery,
  useGetPoolStateQuery,
  useResetMissingSignagePointsMutation,
  useResetFilterChallengeStatMutation,
} from '@chia-network/api-react';
import { Flex, StateIndicator, State, Tooltip } from '@chia-network/core';
import { Trans } from '@lingui/macro';
import { Box, Button, Paper, Typography, CircularProgress } from '@mui/material';
import React from 'react';
import styled from 'styled-components';

import FarmerStatus from '../../constants/FarmerStatus';
import useFarmerStatus from '../../hooks/useFarmerStatus';

const StyledTable = styled.table`
  border-collapse: collapse;
  tr:not(:last-child) td:first-child {
    padding-right: 8px;
  }
  td {
    vertical-align: top;
  }
  tr:not(:first-child) td {
    border-top: 1px solid #ddd;
  }
  tr:last-child td {
    padding-top: 4px;
    & > div {
      display: flex;
      justify-content: flex-end;
    }
  }
`;

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

const ln2pi = Math.log(2 * Math.PI);
// Compute ln(n!) - natural logarithm of the factorial of n
function lnFact(m: number) {
  let k = m;
  if (m === 0 || m === 1) {
    return 0;
  }
  if (m < 10) {
    // Compute factorial directly for small n
    let f = 2;
    for (let i = 3; i <= m; i++) {
      f *= i;
    }
    return Math.log(f);
  }
  // Log-Gamma function approximation
  k++;
  const lnN = Math.log(k);
  const one810 = 0.001_234_567_901_234_567_9;
  let ret = ln2pi - lnN;
  let k6 = k * k * k;
  k6 *= k6;
  ret += k * (2 * lnN + Math.log(k * Math.sinh(1 / k) + one810 / k6) - 2);
  ret /= 2;
  return ret;
}

// Compute ln(C(n, k)) - natural logarithm of the binomial coefficient C(n, k)
function lnComb(m: number, k: number, lnFactM: number) {
  return lnFactM - lnFact(k) - lnFact(m - k);
}

// Compute probability P(X <= t) where X has binomial distribution with n
// trials and success probability p.
function binomialProb(n: number, p: number, t: number) {
  let s = 0;
  const lnP = Math.log(p);
  const lnPInv = Math.log(1 - p);
  const lnFactN = lnFact(n);

  for (let i = 0; i <= t; i++) {
    const c = lnComb(n, i, lnFactN);
    const lnProb = c + i * lnP + (n - i) * lnPInv;
    s += Math.exp(lnProb);
  }

  return s;
}

export default React.memo(FarmHealth);
function FarmHealth() {
  const { farmerStatus, blockchainState } = useFarmerStatus();
  const { data: missingSpsData, isLoading: isLoadingMissingSps } = useGetMissingSignagePointsQuery();
  const [resetMissingSps] = useResetMissingSignagePointsMutation();
  const { data: poolStateData, isLoading: isLoadingPoolStateData } = useGetPoolStateQuery();
  const { data: filterChallengeStat, isLoading: isLoadingFilterChallengeStat } = useGetFilterChallengeStatQuery(
    blockchainState?.peak.height || 0
  );
  const [resetFilterChallengeStat] = useResetFilterChallengeStatMutation();
  const significantLevel = 0.01; // 1%

  const famSyncStatus = React.useMemo(() => {
    if (farmerStatus === FarmerStatus.SYNCHING) {
      return (
        <StateIndicator state={State.WARNING} indicator reversed>
          <Trans>Syncing</Trans>
        </StateIndicator>
      );
    }

    if (farmerStatus === FarmerStatus.NOT_AVAILABLE) {
      return (
        <StateIndicator state={State.ERROR} indicator reversed>
          <Trans>Not available</Trans>
        </StateIndicator>
      );
    }

    if (farmerStatus === FarmerStatus.NOT_CONNECTED) {
      return (
        <StateIndicator state={State.ERROR} indicator reversed>
          <Trans>Not connected</Trans>
        </StateIndicator>
      );
    }

    if (farmerStatus === FarmerStatus.NOT_RUNNING) {
      return (
        <StateIndicator state={State.ERROR} indicator reversed>
          <Trans>Not running</Trans>
        </StateIndicator>
      );
    }

    return (
      <StateIndicator state={State.SUCCESS} indicator reversed>
        <Trans>Synced</Trans>
      </StateIndicator>
    );
  }, [farmerStatus]);

  const cumulativeBinomialProbability = React.useMemo(() => {
    if (!filterChallengeStat) {
      return null;
    }
    return binomialProb(filterChallengeStat.n, 1 / 2 ** filterChallengeStat.fb, filterChallengeStat.x);
  }, [filterChallengeStat]);

  const plotsPassingFilter = React.useMemo(() => {
    if (farmerStatus === FarmerStatus.SYNCHING) {
      return (
        <StateIndicator state={State.WARNING} indicator reversed>
          <Trans>Syncing</Trans>
        </StateIndicator>
      );
    }

    if (farmerStatus === FarmerStatus.NOT_AVAILABLE || isLoadingFilterChallengeStat || !blockchainState) {
      return (
        <StateIndicator state={State.ERROR} indicator reversed>
          <Trans>Not available</Trans>
        </StateIndicator>
      );
    }

    if (farmerStatus === FarmerStatus.NOT_CONNECTED) {
      return (
        <StateIndicator state={State.ERROR} indicator reversed>
          <Trans>Not connected</Trans>
        </StateIndicator>
      );
    }

    if (farmerStatus === FarmerStatus.NOT_RUNNING) {
      return (
        <StateIndicator state={State.ERROR} indicator reversed>
          <Trans>Not running</Trans>
        </StateIndicator>
      );
    }

    if (isLoadingFilterChallengeStat || cumulativeBinomialProbability === null) {
      return (
        <StateIndicator state={State.ERROR} indicator reversed>
          <Trans>Not available</Trans>
        </StateIndicator>
      );
    }

    if (cumulativeBinomialProbability < significantLevel) {
      return (
        <StateIndicator state={State.WARNING} indicator reversed>
          <Trans>Warning</Trans>
        </StateIndicator>
      );
    }

    return (
      <StateIndicator state={State.SUCCESS} indicator reversed>
        <Trans>OK</Trans>
      </StateIndicator>
    );
  }, [farmerStatus, isLoadingFilterChallengeStat, blockchainState, cumulativeBinomialProbability]);

  const plotPassingFilterWithTooltip = React.useMemo(() => {
    if (isLoadingFilterChallengeStat || !filterChallengeStat) {
      return (
        <Box>
          <Typography variant="body2" color="textSecondary">
            <Trans>Plots passing filter</Trans>
          </Typography>
          {plotsPassingFilter}
        </Box>
      );
    }
    const displayPercentage =
      cumulativeBinomialProbability !== null ? (cumulativeBinomialProbability * 100).toFixed(3) : '-';
    const tooltipTitle = (
      <StyledTable>
        <tbody>
          <tr>
            <td>
              <Trans>Total plot filter challenges</Trans>
            </td>
            <td>{filterChallengeStat.n}</td>
          </tr>
          <tr>
            <td>
              <Trans>Total plots passing filter</Trans>
            </td>
            <td>{filterChallengeStat.x}</td>
          </tr>
          <tr>
            <td>
              <Trans>Plot pass ratio</Trans>
            </td>
            <td>1 / {2 ** filterChallengeStat.fb}</td>
          </tr>
          <tr>
            <td>
              <Trans>Expected Total plots passing filter</Trans>
            </td>
            <td>{filterChallengeStat.n * (1 / 2 ** filterChallengeStat.fb)}</td>
          </tr>
          <tr>
            <td>
              <Trans>Significant level</Trans>
            </td>
            <td>{(significantLevel * 100).toFixed(3)} %</td>
          </tr>
          <tr>
            <td>
              Probability where {filterChallengeStat.x} or fewer plots
              <br />
              passing filter in {filterChallengeStat.n} challenges
            </td>
            <td>{displayPercentage} %</td>
          </tr>
          <tr>
            <td colSpan={2}>
              <div>
                <Button size="small" onClick={() => resetFilterChallengeStat()}>
                  <Trans>Reset</Trans>
                </Button>
              </div>
            </td>
          </tr>
        </tbody>
      </StyledTable>
    );

    return (
      <Tooltip title={tooltipTitle}>
        <Box>
          <Typography variant="body2" color="textSecondary">
            <Trans>Plots passing filter</Trans>
          </Typography>
          {plotsPassingFilter}
        </Box>
      </Tooltip>
    );
  }, [
    plotsPassingFilter,
    isLoadingFilterChallengeStat,
    filterChallengeStat,
    cumulativeBinomialProbability,
    resetFilterChallengeStat,
  ]);

  const missingSpsWithTooltip = React.useMemo(() => {
    if (isLoadingMissingSps) {
      return <CircularProgress color="secondary" size={14} />;
    }
    if (!missingSpsData?.totalMissingSps) {
      return (
        <Box>
          <Typography variant="body2">
            <Trans>Missing signage point</Trans>
          </Typography>
          <StateIndicator state={State.SUCCESS} indicator reversed>
            <Trans>None</Trans>
          </StateIndicator>
        </Box>
      );
    }

    const tooltipTitle = (
      <Button size="small" onClick={() => resetMissingSps()}>
        <Trans>Reset</Trans>
      </Button>
    );

    return (
      <Tooltip title={tooltipTitle}>
        <Box>
          <Typography variant="body2">
            <Trans>Missing signage point</Trans>
          </Typography>
          <StateIndicator state={State.WARNING} indicator reversed>
            {missingSpsData.totalMissingSps}
          </StateIndicator>
        </Box>
      </Tooltip>
    );
  }, [missingSpsData, isLoadingMissingSps, resetMissingSps]);

  const stalePartials = React.useMemo(() => {
    if (isLoadingPoolStateData) {
      return <CircularProgress color="secondary" size={14} />;
    }
    if (!poolStateData || poolStateData.length === 0) {
      return (
        <StateIndicator state={State.SUCCESS} indicator reversed>
          <Trans>None</Trans>
        </StateIndicator>
      );
    }

    let stalePartialsSinceStart = 0;
    for (let i = 0; i < poolStateData.length; i++) {
      const d = poolStateData[i];
      stalePartialsSinceStart += d.stalePartialsSinceStart;
    }

    if (stalePartialsSinceStart === 0) {
      return (
        <StateIndicator state={State.SUCCESS} indicator reversed>
          <Trans>None</Trans>
        </StateIndicator>
      );
    }

    return (
      <StateIndicator state={State.WARNING} indicator reversed>
        {stalePartialsSinceStart}
      </StateIndicator>
    );
  }, [poolStateData, isLoadingPoolStateData]);

  return (
    <Paper sx={{ padding: 2 }} variant="outlined">
      <Box>
        <Typography variant="h6">
          <Trans>Farm Health</Trans>
        </Typography>
      </Box>
      <Flex justifyContent="space-between" sx={indicatorStyle}>
        <Box>
          <Typography variant="body2" color="textSecondary">
            <Trans>Sync status</Trans>
          </Typography>
          {famSyncStatus}
        </Box>
        {plotPassingFilterWithTooltip}
        {missingSpsWithTooltip}
        <Box>
          <Typography variant="body2">
            <Trans>Stale partials</Trans>
          </Typography>
          {stalePartials}
        </Box>
      </Flex>
    </Paper>
  );
}

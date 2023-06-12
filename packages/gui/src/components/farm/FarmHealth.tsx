import {
  useGetFilterChallengeStatQuery,
  useGetMissingSignagePointsQuery,
  useGetPoolStateQuery,
} from '@chia-network/api-react';
import { Flex, StateIndicator, State, Tooltip } from '@chia-network/core';
import { Trans } from '@lingui/macro';
import { Box, Paper, Typography, CircularProgress } from '@mui/material';
import BigNumber from 'bignumber.js';
import React from 'react';
import styled from 'styled-components';

import FarmerStatus from '../../constants/FarmerStatus';
import useFarmerStatus from '../../hooks/useFarmerStatus';

const StyledTable = styled.table`
  border-collapse: collapse;
  td:first-child {
    padding-right: 8px;
  }
  td {
    vertical-align: top;
  }
  tr:not(:first-child) td {
    border-top: 1px solid #ddd;
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

function factorial(n: number) {
  let k = n;
  let f = new BigNumber(1);
  while (k > 1) {
    f = f.multipliedBy(k);
    k--;
  }
  return f;
}

function permute(n: number, k: number) {
  let i = 0;
  let m = n;
  let f = new BigNumber(1);
  while (i < k) {
    f = f.multipliedBy(m);
    m--;
    i++;
  }
  return f;
}

function combination(n: number, k: number) {
  if (k > n / 2) {
    return permute(n, n - k).dividedBy(factorial(n - k));
  }
  return permute(n, k).dividedBy(factorial(k));
}

function getCumulativeBinomialProb(n: number, x: number, p: number) {
  let P = new BigNumber(0);
  for (let i = 0; i <= x; i++) {
    P = P.plus(
      combination(n, i)
        .multipliedBy(new BigNumber(p).exponentiatedBy(i))
        .multipliedBy(new BigNumber(1 - p).exponentiatedBy(n - i))
    );
  }
  return P.toNumber();
}

export default React.memo(FarmHealth);
function FarmHealth() {
  const { farmerStatus, blockchainState } = useFarmerStatus();
  const { data: missingSpsData, isLoading: isLoadingMissingSps } = useGetMissingSignagePointsQuery();
  const { data: poolStateData, isLoading: isLoadingPoolStateData } = useGetPoolStateQuery();
  const { data: filterChallengeStat, isLoading: isLoadingFilterChallengeStat } = useGetFilterChallengeStatQuery(
    blockchainState?.peak.height || 0
  );
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
    return getCumulativeBinomialProb(filterChallengeStat.n, filterChallengeStat.x, 1 / 2 ** filterChallengeStat.fb);
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
  }, [plotsPassingFilter, isLoadingFilterChallengeStat, filterChallengeStat, cumulativeBinomialProbability]);

  const missingSps = React.useMemo(() => {
    if (isLoadingMissingSps) {
      return <CircularProgress color="secondary" size={14} />;
    }
    if (!missingSpsData?.totalMissingSps) {
      return (
        <StateIndicator state={State.SUCCESS} indicator reversed>
          <Trans>None</Trans>
        </StateIndicator>
      );
    }

    return (
      <StateIndicator state={State.WARNING} indicator reversed>
        {missingSpsData.totalMissingSps}
      </StateIndicator>
    );
  }, [missingSpsData, isLoadingMissingSps]);

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
        <Box>
          <Typography variant="body2">
            <Trans>Missing signage point</Trans>
          </Typography>
          {missingSps}
        </Box>
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

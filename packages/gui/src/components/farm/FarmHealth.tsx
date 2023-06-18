import {
  useGetFilterChallengeStatQuery,
  useGetMissingSignagePointsQuery,
  useGetPoolStateQuery,
  useResetMissingSignagePointsMutation,
  useResetFilterChallengeStatMutation,
  useGetPartialStatsOffsetQuery,
} from '@chia-network/api-react';
import { Flex, StateIndicator, State, Tooltip } from '@chia-network/core';
import { Trans } from '@lingui/macro';
import { Box, Button, Paper, Typography, CircularProgress } from '@mui/material';
import React from 'react';
import styled from 'styled-components';

import FarmerStatus from '../../constants/FarmerStatus';
import useFarmerStatus from '../../hooks/useFarmerStatus';
import { binomialProb } from '../../util/math';

const StyledTable = styled.table`
  border-collapse: collapse;
  tr:not(:last-child) td:first-child {
    padding-right: 8px;
  }
  td {
    vertical-align: top;
  }
  tr:not(:first-child) td {
    border-top: 1px solid #ccc;
  }
  tr:not(:last-child) td {
    padding: 4px 8px;
  }
  tr:last-child td {
    padding-top: 4px;
    & > div {
      display: flex;
      justify-content: flex-end;
    }
  }
`;

const StyledInput = styled.input`
  font-size: 0.6875rem;
  color: #fff;
  width: 38px;
  background: transparent;
  border: none;
  padding: 0;
  display: inline-block;
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
  const { data: partialStatsOffset, isLoading: isLoadingPartialStatsOffset } = useGetPartialStatsOffsetQuery();
  const [significantLevel, setSignificantLevel] = React.useState(1); // 1%

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

    if (cumulativeBinomialProbability < significantLevel / 100.0) {
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
  }, [farmerStatus, isLoadingFilterChallengeStat, blockchainState, cumulativeBinomialProbability, significantLevel]);

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
    const expectedPlotsPassingFilter =
      Math.round(filterChallengeStat.n * (1 / 2 ** filterChallengeStat.fb) * 1000) / 1000;
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
            <td>{expectedPlotsPassingFilter}</td>
          </tr>
          <tr>
            <td>
              <Trans>Significant level</Trans>
            </td>
            <td>
              <StyledInput
                type="number"
                value={significantLevel}
                max={100}
                min={0}
                step={1}
                onChange={(e) => {
                  setSignificantLevel(+e.target.value);
                }}
              />
              %
            </td>
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
    significantLevel,
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

    if (!isLoadingPartialStatsOffset && partialStatsOffset) {
      stalePartialsSinceStart -= partialStatsOffset.stale;
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
  }, [poolStateData, isLoadingPoolStateData, isLoadingPartialStatsOffset, partialStatsOffset]);

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

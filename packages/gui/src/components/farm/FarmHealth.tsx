import { useGetMissingSignagePointsQuery, useGetPoolStateQuery } from '@chia-network/api-react';
import { Flex, StateIndicator, State } from '@chia-network/core';
import { Trans } from '@lingui/macro';
import { Box, Paper, Typography, CircularProgress } from '@mui/material';
import React from 'react';

import FarmerStatus from '../../constants/FarmerStatus';
import useFarmerStatus from '../../hooks/useFarmerStatus';

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
  const farmerStatus = useFarmerStatus();
  const { data: missingSpsData, isLoading: isLoadingMissingSps } = useGetMissingSignagePointsQuery();
  const { data: poolStateData, isLoading: isLoadingPoolStateData } = useGetPoolStateQuery();

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
          <Trans>Farmer state is not available</Trans>
        </StateIndicator>
      );
    }

    if (farmerStatus === FarmerStatus.NOT_CONNECTED) {
      return (
        <StateIndicator state={State.ERROR} indicator reversed>
          <Trans>Farmer is not connected</Trans>
        </StateIndicator>
      );
    }

    if (farmerStatus === FarmerStatus.NOT_RUNNING) {
      return (
        <StateIndicator state={State.ERROR} indicator reversed>
          <Trans>Farmer is not running</Trans>
        </StateIndicator>
      );
    }

    return (
      <StateIndicator state={State.SUCCESS} indicator reversed>
        <Trans>Synced</Trans>
      </StateIndicator>
    );
  }, [farmerStatus]);

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

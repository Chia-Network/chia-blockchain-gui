import React from 'react';
import { Trans } from '@lingui/macro';
import { Flex, More, useOpenDialog } from '@chia/core';
import {
  Box,
  MenuItem,
  CircularProgress,
  ListItemIcon,
  Typography,
} from '@material-ui/core';
import { useGetCombinedPlotsQuery } from '@chia/api-react';
import { Settings as SettingsIcon } from '@material-ui/icons';
import FarmOverviewHero from './FarmOverviewHero';
import FarmOverviewCards from './FarmOverviewCards';
import FarmManageFarmingRewards from '../FarmManageFarmingRewards';

export default function FarmOverview() {
  const openDialog = useOpenDialog();
  const { data: plots, isLoading } = useGetCombinedPlotsQuery();

  const hasPlots = plots?.length > 0;

  function handleManageFarmingRewards() {
    // @ts-ignore
    openDialog(<FarmManageFarmingRewards />);
  }

  return (
    <>
      <Flex gap={2} alignItems="center">
        <Flex flexGrow={1}>
          <Typography variant="h5" gutterBottom>
            <Trans>Your Farm Overview</Trans>
          </Typography>
        </Flex>
        <More>
          {({ onClose }) => (
            <Box>
              <MenuItem
                onClick={() => {
                  onClose();
                  handleManageFarmingRewards();
                }}
              >
                <ListItemIcon>
                  <SettingsIcon fontSize="small" />
                </ListItemIcon>
                <Typography variant="inherit" noWrap>
                  <Trans>Manage Farming Rewards</Trans>
                </Typography>
              </MenuItem>
            </Box>
          )}
        </More>
      </Flex>

      {isLoading ? (
        <CircularProgress />
      ) : hasPlots ? (
        <FarmOverviewCards />
      ) : (
        <FarmOverviewHero />
      )}
    </>
  );
}

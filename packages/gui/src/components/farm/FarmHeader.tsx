import { Flex, More, useOpenDialog, MenuItem } from '@chia-network/core';
import { Trans } from '@lingui/macro';
import { Settings as SettingsIcon } from '@mui/icons-material';
import { ListItemIcon, Typography } from '@mui/material';
import React from 'react';

import FarmManageFarmingRewards from './FarmManageFarmingRewards';

export default function FarmHeader() {
  const openDialog = useOpenDialog();

  function handleManageFarmingRewards() {
    // @ts-ignore
    openDialog(<FarmManageFarmingRewards />);
  }

  return (
    <Flex gap={2} alignItems="center">
      <Flex flexGrow={1}>
        <Typography variant="h5">
          <Trans>Farm Summary</Trans>
        </Typography>
      </Flex>
      <More>
        <MenuItem onClick={handleManageFarmingRewards} close>
          <ListItemIcon>
            <SettingsIcon fontSize="small" />
          </ListItemIcon>
          <Typography variant="inherit" noWrap>
            <Trans>Manage Farming Rewards</Trans>
          </Typography>
        </MenuItem>
      </More>
    </Flex>
  );
}

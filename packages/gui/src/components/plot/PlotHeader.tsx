import { useRefreshPlotsMutation } from '@chia-network/api-react';
import { Button, Flex, More, useOpenDialog, MenuItem } from '@chia-network/core';
import { Trans } from '@lingui/macro';
import { Refresh as RefreshIcon, Folder as FolderIcon, Add as AddIcon } from '@mui/icons-material';
import { ListItemIcon, Typography } from '@mui/material';
import React, { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { createTeleporter } from 'react-teleporter';

import PlotAddDirectoryDialog from './PlotAddDirectoryDialog';

export type PlotHeaderProps = {
  children?: ReactNode;
};

const PlotHeaderTeleporter = createTeleporter();

export const PlotHeaderSource = PlotHeaderTeleporter.Source;

export const PlotHeaderTarget = PlotHeaderTeleporter.Target;

export default function PlotHeader(props: PlotHeaderProps) {
  const { children } = props;

  const navigate = useNavigate();
  const openDialog = useOpenDialog();
  const [refreshPlots] = useRefreshPlotsMutation();

  async function handleRefreshPlots() {
    await refreshPlots().unwrap();
  }

  function handleAddPlot() {
    navigate('/dashboard/plot/add');
  }

  function handleAddPlotDirectory() {
    openDialog(<PlotAddDirectoryDialog />);
  }

  return (
    <div>
      <Flex alignItems="center">
        <Flex flexGrow={1}>{children}</Flex>
        <div>
          <Button color="primary" variant="outlined" onClick={handleAddPlot} startIcon={<AddIcon />}>
            <Trans>Add a Plot</Trans>
          </Button>{' '}
          <More>
            <MenuItem onClick={handleRefreshPlots} close>
              <ListItemIcon>
                <RefreshIcon fontSize="small" />
              </ListItemIcon>
              <Typography variant="inherit" noWrap>
                <Trans>Refresh Plots</Trans>
              </Typography>
            </MenuItem>
            <MenuItem onClick={handleAddPlotDirectory} close>
              <ListItemIcon>
                <FolderIcon fontSize="small" />
              </ListItemIcon>
              <Typography variant="inherit" noWrap>
                <Trans>Add Plot Directory</Trans>
              </Typography>
            </MenuItem>
          </More>
        </div>
      </Flex>
    </div>
  );
}

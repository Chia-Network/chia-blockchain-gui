import React from 'react';
import { Trans } from '@lingui/macro';
import { useNavigate } from 'react-router';
import {
  Button,
  Flex,
} from '@chia/core';
import {
  Typography,
} from '@mui/material';
import PlotOverviewCards from './PlotOverviewCards';
import PlotHarvesters from '../PlotHarvesters';
import PlotPlotting from '../PlotPlotting';

export default function PlotOverviewPlots() {
  const navigate = useNavigate();

  function handleAddPlot() {
    navigate('/dashboard/plot/add');
  }

  return (
    <Flex flexDirection="column" gap={4}>
      <Flex flexDirection="column" gap={2}>
        <Flex flexGrow={1} justifyContent="space-between">
          <Typography variant="h5">
            <Trans>Plotting Manager</Trans>
          </Typography>
          <Button variant="outlined" color="primary" onClick={handleAddPlot}>
            <Trans>+ Add a Plot</Trans>
          </Button>
        </Flex>
        <PlotOverviewCards />
      </Flex>
      <PlotPlotting />
      <PlotHarvesters />
    </Flex>
  );
}

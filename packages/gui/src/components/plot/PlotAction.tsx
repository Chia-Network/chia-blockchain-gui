import type { Plot } from '@chia-network/api';
import { useDeletePlotMutation } from '@chia-network/api-react';
import { More, MenuItem, useShowError } from '@chia-network/core';
import { Trans } from '@lingui/macro';
import { DeleteForever as DeleteForeverIcon } from '@mui/icons-material';
import { ListItemIcon, Typography } from '@mui/material';
import React from 'react';

export type PlotActionProps = {
  plot: Plot;
};

export default function PlotAction(props: PlotActionProps) {
  const {
    plot: { filename },
  } = props;

  const showError = useShowError();
  const [deletePlot] = useDeletePlotMutation();

  async function handleDeletePlot() {
    try {
      await deletePlot({ filename }).unwrap();
    } catch (error) {
      showError(error);
    }
  }

  return (
    <More>
      <MenuItem onClick={handleDeletePlot} close>
        <ListItemIcon>
          <DeleteForeverIcon fontSize="small" />
        </ListItemIcon>
        <Typography variant="inherit" noWrap>
          <Trans>Delete</Trans>
        </Typography>
      </MenuItem>
    </More>
  );
}

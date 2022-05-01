import React from 'react';
import { Box, Typography, LinearProgress, type LinearProgressProps } from '@mui/material';
import { useGetHarvesterStats } from '@chia/api-react';

function LinearProgressWithLabel(props: LinearProgressProps & { value: number }) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', minWidth: '120px' }}>
      <Box sx={{ width: '100%', mr: 1 }}>
        <LinearProgress variant="determinate" {...props} />
      </Box>
      <Box sx={{ minWidth: 35 }}>
        <Typography variant="caption" color="text.secondary">{`${Math.round(
          props.value,
        )}%`}</Typography>
      </Box>
    </Box>
  );
}

export type PlotHarvesterStateProps = {
  peerId: string;
};

export default function PlotHarvesterState(props: PlotHarvesterStateProps) {
  const { peerId } = props;
  /*
  const { harvester } = useGetHarvesterStats(peerId);

  if (!harvester?.syncing?.initial) {
    return null;
  }
*/
const harvester = {
  syncing: {
    plotFilesProcessed: 100,
    plotsTotal: 120,
  },
};
  const progress = Math.floor(harvester.syncing.plotFilesProcessed / harvester.syncing.plotsTotal * 100);

  return (
    <LinearProgressWithLabel value={progress} />
  );
}

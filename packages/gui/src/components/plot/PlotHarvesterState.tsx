import { useGetHarvesterStats } from '@chia-network/api-react';
import React from 'react';

import LinearProgressWithLabel from '../helpers/LinearProgressWithLabel';

export type PlotHarvesterStateProps = {
  nodeId: string;
};

export default function PlotHarvesterState(props: PlotHarvesterStateProps) {
  const { nodeId } = props;
  const { harvester } = useGetHarvesterStats(nodeId);

  if (harvester?.syncing?.initial !== true) {
    return null;
  }

  const progress = Math.floor((harvester.syncing.plotFilesProcessed / harvester.syncing.plotFilesTotal) * 100);

  return <LinearProgressWithLabel value={progress} />;
}

import { PlotQueueItem } from '@chia-network/api';
import { useEffect, useMemo } from 'react';

import { useRefreshPlotsMutation } from '../services/harvester';
import { useGetPlotQueueQuery } from '../services/plotter';
import useThrottleQuery from './useThrottleQuery';

export default function useGetThrottlePlotQueueQuery(wait = 5000): {
  isLoading: boolean;
  queue?: PlotQueueItem[];
  hasQueue: boolean;
  error?: Error;
} {
  const {
    data: queue,
    isLoading,
    error,
  } = useThrottleQuery(useGetPlotQueueQuery, undefined, undefined, {
    wait,
  });
  const [refreshPlots] = useRefreshPlotsMutation();

  const finished = useMemo(() => queue?.filter((item: PlotQueueItem) => item.state === 'FINISHED'), [queue]);

  const finishedLength = finished?.length || 0;

  // refetch plots query when new plot is finished plotting
  useEffect(() => {
    if (finishedLength > 0) {
      refreshPlots().unwrap();
    }
  }, [finishedLength, refreshPlots]);

  return {
    queue,
    isLoading,
    hasQueue: !!queue?.length,
    error,
  };
}

import BigNumber from 'bignumber.js';
import { useMemo } from 'react';

import { useGetHarvestersSummaryQuery } from '../services/farmer';

export default function useGetTotalHarvestersSummaryQuery() {
  const { data, isLoading, error } = useGetHarvestersSummaryQuery();

  const memoized = useMemo(() => {
    let duplicates = new BigNumber(0);
    let failedToOpenFilenames = new BigNumber(0);
    let noKeyFilenames = new BigNumber(0);
    let plots = new BigNumber(0);
    let plotsProcessed = new BigNumber(0);
    let totalPlotSize = new BigNumber(0);
    let totalEffectivePlotSize = new BigNumber(0);
    let plotFilesTotal = new BigNumber(0);
    let initialized = !!data?.length;
    let initializedHarvesters = 0;

    data?.forEach((harvester) => {
      duplicates = duplicates.plus(harvester.duplicates);
      failedToOpenFilenames = failedToOpenFilenames.plus(harvester.failedToOpenFilenames);
      noKeyFilenames = noKeyFilenames.plus(harvester.noKeyFilenames);
      totalPlotSize = totalPlotSize.plus(harvester.totalPlotSize);
      totalEffectivePlotSize = totalEffectivePlotSize.plus(harvester.totalEffectivePlotSize);
      plots = plots.plus(harvester.plots);

      if (harvester.syncing) {
        plotsProcessed = plotsProcessed.plus(harvester.syncing.plotFilesProcessed);
        plotFilesTotal = plotFilesTotal.plus(harvester.syncing.plotFilesTotal);

        if (harvester.syncing?.initial === true) {
          initialized = false;
        }
      }

      if (harvester?.syncing?.initial !== true) {
        initializedHarvesters += 1;
      }
    });

    return {
      duplicates,
      failedToOpenFilenames,
      noKeyFilenames,
      plots,
      plotsProcessed,
      totalPlotSize,
      totalEffectivePlotSize,
      plotFilesTotal,
      initialized,
      initializedHarvesters,
    };
  }, [data]);

  return {
    isLoading,
    initialized: memoized.initialized,
    error,
    hasPlots: memoized.plots.gt(0),
    plots: memoized.plots,
    noKeyFilenames: memoized.noKeyFilenames,
    failedToOpenFilenames: memoized.failedToOpenFilenames,
    duplicates: memoized.duplicates,
    harvesters: data?.length ?? 0,
    plotsProcessed: memoized.plotsProcessed,
    totalPlotSize: memoized.totalPlotSize,
    totalEffectivePlotSize: memoized.totalEffectivePlotSize,
    plotFilesTotal: memoized.plotFilesTotal,
    initializedHarvesters: memoized.initializedHarvesters,
  };
}

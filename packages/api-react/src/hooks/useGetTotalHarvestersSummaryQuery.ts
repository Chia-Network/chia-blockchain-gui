import BigNumber from 'bignumber.js';
import { useMemo } from 'react';
import { useGetHarvestersSummaryQuery } from '../services/farmer';

export default function useGetTotalHarvestersSummaryQuery(): {
  isLoading: boolean;
  initialized: boolean;
  error?: Error;
  harvesters: number;
  hasPlots: boolean;
  plots: BigNumber; // number of used plots without the plots that are not used (duplicate, failed, no keys)
  noKeyFilenames: BigNumber;
  failedToOpenFilenames: BigNumber;
  duplicates: BigNumber;
  plotsProcessed: BigNumber;
  totalPlotSize: BigNumber;
  plotFilesTotal: BigNumber;
} {
  const { data, isLoading, error } = useGetHarvestersSummaryQuery();

  const { plots, duplicates, noKeyFilenames, failedToOpenFilenames, plotsProcessed, totalPlotSize, plotFilesTotal, initialized } = useMemo(() => {
    let duplicates = new BigNumber(0);
    let failedToOpenFilenames = new BigNumber(0);
    let noKeyFilenames = new BigNumber(0);
    let plots = new BigNumber(0);
    let plotsProcessed = new BigNumber(0);
    let totalPlotSize = new BigNumber(0);
    let plotFilesTotal = new BigNumber(0);
    let initialized = !!data?.length;

    data?.forEach((harvester) => {
      console.log('harvester', harvester);
      duplicates = duplicates.plus(harvester.duplicates);
      failedToOpenFilenames = failedToOpenFilenames.plus(harvester.failedToOpenFilenames);
      noKeyFilenames = noKeyFilenames.plus(harvester.noKeyFilenames);
      totalPlotSize = totalPlotSize.plus(harvester.totalPlotSize);
      plots = plots.plus(harvester.plots);

      if (harvester.syncing) {
        plotsProcessed = plotsProcessed.plus(harvester.syncing.plotFilesProcessed);
        plotFilesTotal = plotFilesTotal.plus(harvester.syncing.plotFilesTotal);

        if (harvester.syncing.initial) {
          initialized = false;
        }
      }
    });

    return {
      duplicates,
      failedToOpenFilenames,
      noKeyFilenames,
      plots,
      plotsProcessed,
      totalPlotSize,
      plotFilesTotal,
      initialized,
    };

  }, [data]);

  console.log('isLoading plots', isLoading, initialized, plots.gt(0));

  return {
    isLoading,
    initialized,
    error,
    hasPlots: plots.gt(0),
    plots,
    noKeyFilenames,
    failedToOpenFilenames,
    duplicates,
    harvesters: data?.length ?? 0,
    plotsProcessed,
    totalPlotSize,
    plotFilesTotal,
  };
}

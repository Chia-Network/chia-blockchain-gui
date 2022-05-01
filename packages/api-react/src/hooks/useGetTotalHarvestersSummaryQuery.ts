import BigNumber from 'bignumber.js';
import { useMemo } from 'react';
import { useGetHarvestersSummaryQuery } from '../services/farmer';

export default function useGetTotalHarvestersSummaryQuery(): {
  isLoading: boolean;
  error?: Error;
  harvesters: number;
  hasPlots: boolean;
  plots: BigNumber; // number of used plots without the plots that are not used (duplicate, failed, no keys)
  noKeyFilenames: BigNumber;
  failedToOpenFilenames: BigNumber;
  duplicates: BigNumber;
  plotsProcessed: BigNumber;
  totalPlotSize: BigNumber;
  plotsTotal: BigNumber;
} {
  const { data, isLoading, error } = useGetHarvestersSummaryQuery();

  const { plots, duplicates, noKeyFilenames, failedToOpenFilenames, harvesters, plotsProcessed, totalPlotSize, plotsTotal } = useMemo(() => {
    let duplicates = new BigNumber(0);
    let failedToOpenFilenames = new BigNumber(0);
    let noKeyFilenames = new BigNumber(0);
    let plots = new BigNumber(0);
    let plotsProcessed = new BigNumber(0);
    let totalPlotSize = new BigNumber(0);
    let plotsTotal = new BigNumber(0);

    if (data) {
      data.forEach((harvester) => {
        duplicates = duplicates.plus(harvester.duplicates);
        failedToOpenFilenames = failedToOpenFilenames.plus(harvester.failedToOpenFilenames);
        noKeyFilenames = noKeyFilenames.plus(harvester.noKeyFilenames);
        totalPlotSize = totalPlotSize.plus(harvester.totalPlotSize);
        plots = plots.plus(harvester.plots);

        if (harvester.syncing?.initial) {
          plotsProcessed = plotsProcessed.plus(harvester.syncing.plotFilesProcessed);
          plotsTotal = plotsTotal.plus(harvester.syncing.plotsTotal);
        }
      });
    }

    return {
      duplicates,
      failedToOpenFilenames,
      noKeyFilenames,
      plots,
      harvesters: data?.length ?? 0,
      plotsProcessed,
      totalPlotSize,
      plotsTotal,
    };

  }, [data]);

  return {
    isLoading,
    error,
    hasPlots: plots.gt(0),
    plots,
    noKeyFilenames,
    failedToOpenFilenames,
    duplicates,
    harvesters,
    plotsProcessed,
    totalPlotSize,
    plotsTotal,
  };
}

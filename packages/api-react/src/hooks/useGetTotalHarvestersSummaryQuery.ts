import { useMemo } from 'react';
import { useGetHarvestersSummaryQuery } from '../services/farmer';

export default function useGetTotalHarvestersSummaryQuery(): {
  isLoading: boolean;
  error?: Error;
  hasPlots: boolean;
  plots: number;
  uniquePlots: number;
  noKeyFilenames: number;
  failedToOpenFilenames: number;
  duplicates: number;
  harvesters: number;
  plotsProcessed: number;
  totalPlotSize: number;
  plotsTotal: number;
} {
  const { data, isLoading, error } = useGetHarvestersSummaryQuery();

  console.log('data', data);

  const { plots, duplicates, noKeyFilenames, failedToOpenFilenames, harvesters, plotsProcessed, totalPlotSize, plotsTotal } = useMemo(() => {
    let duplicates = 0;
    let failedToOpenFilenames = 0;
    let noKeyFilenames = 0;
    let plots = 0;
    let plotsProcessed = 0;
    let totalPlotSize = 0;
    let plotsTotal = 0;

    if (data) {
      data.forEach((harvester) => {
        duplicates += harvester.duplicates;
        failedToOpenFilenames += harvester.failedToOpenFilenames;
        noKeyFilenames += harvester.noKeyFilenames;
        totalPlotSize += harvester.totalPlotSize;
        plots += harvester.plots;

        if (harvester.syncing?.initial) {
          plotsProcessed += harvester.syncing.plotFilesProcessed;
          plotsTotal += harvester.syncing.plotsTotal;
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

  const hasPlots = plots > 0;
  const uniquePlots = plots - duplicates;

  return {
    isLoading,
    error,
    hasPlots,
    plots,
    uniquePlots,
    noKeyFilenames,
    failedToOpenFilenames,
    duplicates,
    harvesters,
    plotsProcessed,
    totalPlotSize,
    plotsTotal,
  };
}


/*
            "connection": {
                "node_id": self._connection.peer_node_id,
                "host": self._connection.peer_host,
                "port": self._connection.peer_port,
            },
            "plots": get_list_or_len(list(self._plots.values()), counts_only),
            "failed_to_open_filenames": get_list_or_len(self._invalid, counts_only),
            "no_key_filenames": get_list_or_len(self._keys_missing, counts_only),
            "duplicates": get_list_or_len(self._duplicates, counts_only),
            "total_plot_size": self._total_plot_size,
            "syncing": {
                "initial": self.initial_sync(),
                "plot_files_processed": self.current_sync().plots_processed,
                "plot_files_total": self.current_sync().plots_total,
            }
            if self._current_sync.in_progress()
            else None,
            "last_sync_time": self._last_sync.time_done,
*/

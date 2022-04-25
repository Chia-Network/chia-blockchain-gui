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
  plotsLoaded: number;
} {
  const { data, isLoading, error } = useGetHarvestersSummaryQuery();

  console.log('data', data);

  const { plots, duplicates, noKeyFilenames, failedToOpenFilenames, harvesters, plotsProcessed, plotsLoaded } = useMemo(() => {
    let duplicates = 0;
    let failedToOpenFilenames = 0;
    let noKeyFilenames = 0;
    let plots = 0;
    let plotsProcessed = 0;
    let plotsLoaded = 0;

    if (data) {
      data.forEach((harvester) => {
        duplicates += harvester.duplicates;
        failedToOpenFilenames += harvester.failedToOpenFilenames;
        noKeyFilenames += harvester.noKeyFilenames;
        plots += harvester.plots ?? harvester.plotsTotal;

        if (harvester.initialSync) {
          plotsProcessed += harvester.initialSync.plotsProcessed;
          plotsLoaded += harvester.initialSync.plotsLoaded;

          if (harvester.initialSync.plotsTotal && !harvester.plots) {
            plots += harvester.initialSync.plotsTotal;
          }
        } else {
          plotsProcessed += harvester.plots;
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
      plotsLoaded,
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
    plotsLoaded,
  };
}


/*
  result: Dict[str, Any] = {
      "connection": {
          "node_id": self._connection.peer_node_id,
          "host": self._connection.peer_host,
          "port": self._connection.peer_port,
      },
      "plots": get_list_or_len(list(self._plots.values()), counts_only),
      "failed_to_open_filenames": get_list_or_len(self._invalid, counts_only),
      "no_key_filenames": get_list_or_len(self._keys_missing, counts_only),
      "duplicates": get_list_or_len(self._duplicates, counts_only),
  }
  if self._last_sync.time_done != 0:
      result["last_sync_time"] = self._last_sync.time_done
  if self.initial_sync():
      result["initial_sync"] = {
          "plots_processed": self._current_sync.plots_processed,
          "plots_loaded": len(self._current_sync.delta.valid.additions),
          "plots_keys_missing": len(self._current_sync.delta.keys_missing.additions),
          "plots_keys_invalid": len(self._current_sync.delta.invalid.additions),
          "plots_total": self._current_sync.plots_total,
      }
*/

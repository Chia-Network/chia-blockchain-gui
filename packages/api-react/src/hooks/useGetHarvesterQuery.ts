import { useMemo } from 'react';
import { useGetHarvestersSummaryQuery } from '../services/farmer';

export default function useGetHarvesterQuery({
  peerId,
}: {
  peerId: string
}): {
  isLoading: boolean;
  error?: Error;
  plots?: number;
  noKeyFilenames?: number;
  failedToOpenFilenames?: number;
  connection?: {
    nodeId: string;
    host: string;
    port: number;
  },
} {
  const { data, isLoading: isLoadingHarvesterSummary, error } = useGetHarvestersSummaryQuery();

  const harvester = useMemo(() => {
    return data?.find((harvester) => harvester.connection.nodeId === peerId);
  }, [data, peerId]);

  const isLoading = isLoadingHarvesterSummary;

  return {
    isLoading,
    error,
    connection: harvester?.connection,
    plots: harvester?.plots,
    noKeyFilenames: harvester?.noKeyFilenames,
    failedToOpenFilenames: harvester?.failedToOpenFilenames,
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

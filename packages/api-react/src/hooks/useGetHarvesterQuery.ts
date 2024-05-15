import { useMemo } from 'react';

import { useGetHarvestersSummaryQuery } from '../services/farmer';

export default function useGetHarvesterQuery({ nodeId }: { nodeId: string }) {
  const { data, isLoading: isLoadingHarvesterSummary, error } = useGetHarvestersSummaryQuery();

  const harvester = useMemo(
    () => data?.find((harvesterItem) => harvesterItem.connection.nodeId === nodeId),
    [data, nodeId],
  );

  const isLoading = isLoadingHarvesterSummary;

  return {
    isLoading,
    error,
    connection: harvester?.connection,
    plots: harvester?.plots,
    noKeyFilenames: harvester?.noKeyFilenames,
    failedToOpenFilenames: harvester?.failedToOpenFilenames,
    duplicates: harvester?.duplicates,
    totalPlotSize: harvester?.totalPlotSize,
    initialized: harvester?.syncing?.initial !== true,
  };
}

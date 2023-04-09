import { useMemo } from 'react';

import { useGetHarvestersSummaryQuery } from '../services/farmer';

export default function useGetHarvesterStats(nodeId: string) {
  const { data, isLoading, error } = useGetHarvestersSummaryQuery();

  const harvester = useMemo(
    () => data?.find((harvesterItem) => harvesterItem.connection.nodeId === nodeId),
    [data, nodeId]
  );

  return {
    isLoading,
    error,
    harvester,
  };
}

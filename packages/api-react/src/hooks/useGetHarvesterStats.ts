import { useMemo } from 'react';

import { useGetHarvestersSummaryQuery } from '../services/farmer';

export default function useGetHarvesterStats(nodeId: string): {
  isLoading: boolean;
  error?: unknown;
  harvester: any;
} {
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

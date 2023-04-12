import { useMemo } from 'react';

import { useGetFarmerConnectionsQuery } from '../services/farmer';

export default function useGetHarvesterConnectionsQuery() {
  const { data: connections, ...rest } = useGetFarmerConnectionsQuery(undefined, {
    pollingInterval: 10_000,
  });
  const data = useMemo(() => connections?.filter((connection) => connection.type === 2), [connections]);

  return {
    data,
    ...rest,
  };
}

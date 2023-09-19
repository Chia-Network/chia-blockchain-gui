import { ServiceNameValue } from '@chia-network/api';
import { useRunningServicesQuery } from '@chia-network/api-react';
import { useMemo } from 'react';

export default function useIsServiceRunning(service: ServiceNameValue, pollingInterval: number = 10_000) {
  const {
    data: runningServices,
    isLoading,
    error,
  } = useRunningServicesQuery(undefined, {
    pollingInterval,
    selectFromResult: (state) => ({
      data: state.data,
      error: state.error,
      isLoading: state.isLoading,
    }),
  });

  const isRunning = useMemo(() => !!runningServices?.includes(service), [runningServices, service]);

  return {
    isRunning,
    isLoading,
    error,
  };
}

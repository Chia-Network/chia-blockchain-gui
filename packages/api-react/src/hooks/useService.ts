import { ServiceNameValue } from '@chia-network/api';
import { useEffect, useState, useMemo, useCallback } from 'react';

import { useClientStartServiceMutation } from '../services/client';
import { useStopServiceMutation, useRunningServicesQuery } from '../services/daemon';

export type ServiceState = 'starting' | 'running' | 'stopping' | 'stopped';

type Options = {
  keepState?: ServiceState;
  disabled?: boolean;
  disableWait?: boolean; // Don't wait for ping when starting service
};

export default function useService(
  service: ServiceNameValue,
  options: Options = {}
): {
  isLoading: boolean;
  isProcessing: boolean;
  isRunning: boolean;
  state: ServiceState;
  start: () => Promise<void>;
  stop: () => Promise<void>;
  error?: Error | unknown;
  service: ServiceNameValue;
} {
  const { keepState, disabled = false, disableWait = false } = options;

  const [isStarting, setIsStarting] = useState<boolean>(false);
  const [isStopping, setIsStopping] = useState<boolean>(false);
  const [startService] = useClientStartServiceMutation();
  const [stopService] = useStopServiceMutation();
  const [latestIsProcessing, setLatestIsProcessing] = useState<boolean>(false);

  // isRunning is not working when stopService is called (backend issue)
  const {
    data: runningServices,
    isLoading,
    refetch,
    error,
  } = useRunningServicesQuery(undefined, {
    pollingInterval: latestIsProcessing ? 1000 : 10_000,
    skip: disabled,
    selectFromResult: (state) => ({
      data: state.data,
      error: state.error,
      isLoading: state.isLoading,
    }),
  });

  const isRunning = useMemo(
    () => !!(runningServices && runningServices?.includes(service)),
    [runningServices, service]
  );

  const isProcessing = isStarting || isStopping;

  useEffect(() => {
    setLatestIsProcessing(isProcessing);
  }, [isProcessing]);

  let state: ServiceState = 'stopped';
  if (isRunning) {
    state = 'running';
  } else if (isStarting) {
    state = 'starting';
  } else if (isStopping) {
    state = 'stopping';
  }

  const handleStart = useCallback(async () => {
    if (isProcessing) {
      return;
    }

    try {
      setIsStarting(true);
      await startService({
        service,
        disableWait,
      }).unwrap();

      refetch();
    } catch (e) {
      console.error(e);
    } finally {
      setIsStarting(false);
    }
  }, [disableWait, isProcessing, refetch, service, startService]);

  const handleStop = useCallback(async () => {
    if (isProcessing) {
      return;
    }

    try {
      setIsStopping(true);
      await stopService({
        service,
      }).unwrap();

      refetch();
    } catch (e) {
      console.error(e);
    } finally {
      setIsStopping(false);
    }
  }, [isProcessing, refetch, service, stopService]);

  useEffect(() => {
    if (disabled || !runningServices) {
      return;
    }

    if (keepState === 'running' && keepState !== state && !isProcessing && isRunning === false) {
      handleStart();
    } else if (keepState === 'stopped' && keepState !== state && !isProcessing && isRunning === true) {
      handleStop();
    }
  }, [runningServices, keepState, service, state, isProcessing, disabled, isRunning, handleStart, handleStop]);

  return {
    state,
    isLoading,
    isProcessing,
    isRunning,
    error,
    start: handleStart,
    stop: handleStop,
    service,
  };
}

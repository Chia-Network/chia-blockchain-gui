import { ServiceNameValue } from '@chia-network/api';
import { useEffect, useState, useCallback } from 'react';

import { useStartServiceMutation, useStopServiceMutation } from '../services/daemon';

export enum ServiceState {
  STARTING = 'starting',
  RUNNING = 'running',
  STOPPING = 'stopping',
  STOPPED = 'stopped',
}

type Options = {
  keepState?: ServiceState;
  disabled?: boolean;
};

export default function useService(
  service: ServiceNameValue,
  options: Options = {}
): {
  isLoading: boolean;
  isRunning: boolean;
  state: ServiceState;
  start: () => Promise<void>;
  stop: () => Promise<void>;
  error: Error | undefined;
  service: ServiceNameValue;
} {
  const { keepState, disabled = false } = options;

  const [error, setError] = useState<Error | undefined>();
  const [state, setState] = useState<ServiceState>(ServiceState.STOPPED);

  const [startService] = useStartServiceMutation();
  const [stopService] = useStopServiceMutation();

  const isLoading = [ServiceState.STARTING, ServiceState.STOPPING].includes(state);

  const handleStart = useCallback(async () => {
    if (isLoading || disabled || state === ServiceState.RUNNING) {
      return;
    }

    try {
      setState(ServiceState.STARTING);

      await startService({
        service,
      }).unwrap();

      setState(ServiceState.RUNNING);
    } catch (e) {
      setState(ServiceState.STOPPED);
      setError(e as Error);
      console.error(e);
    }
  }, [isLoading, service, startService, disabled, state]);

  const handleStop = useCallback(async () => {
    if (isLoading || disabled || state === ServiceState.STOPPED) {
      return;
    }

    try {
      setState(ServiceState.STOPPING);
      await stopService({
        service,
      }).unwrap();

      setState(ServiceState.STOPPED);
    } catch (e) {
      setState(ServiceState.RUNNING);
      setError(e as Error);
      console.error(e);
    }
  }, [isLoading, service, stopService, disabled, state]);

  useEffect(() => {
    if (disabled || isLoading) {
      return;
    }

    if (keepState === 'running' && keepState !== state) {
      handleStart();
    } else if (keepState === 'stopped' && keepState !== state) {
      handleStop();
    }
  }, [keepState, service, state, isLoading, disabled, handleStart, handleStop]);

  return {
    state,
    isLoading,
    isRunning: state === ServiceState.RUNNING,
    start: handleStart,
    stop: handleStop,
    service,
    error,
  };
}

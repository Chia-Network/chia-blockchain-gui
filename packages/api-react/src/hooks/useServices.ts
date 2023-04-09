import { type ServiceNameValue, ServiceName } from '@chia-network/api';
import { useMemo } from 'react';

import useService, { ServiceState } from './useService';

type Options = {
  keepRunning?: ServiceNameValue[];
  keepStopped?: ServiceNameValue[];
  disabled?: boolean;
};

function getServiceKeepState(service: ServiceNameValue, options: Options): ServiceState | undefined {
  const { keepRunning, keepStopped } = options;
  if (keepRunning && keepRunning.includes(service)) {
    return 'running';
  }
  if (keepStopped && keepStopped.includes(service)) {
    return 'stopped';
  }
  return undefined;
}

function getServiceDisabled(service: ServiceNameValue, services: ServiceNameValue[], options: Options) {
  const { disabled } = options;
  return disabled || !services.includes(service);
}

function getServiceOptions(service: ServiceNameValue, services: ServiceNameValue[], options: Options) {
  const keepState = getServiceKeepState(service, options);
  const disabled = getServiceDisabled(service, services, options);

  return {
    keepState,
    disabled,
  };
}

export default function useMonitorServices(
  services: ServiceNameValue[],
  options: Options = {}
): {
  isLoading: boolean;
  error?: Error | unknown;
  starting: ServiceNameValue[];
  stopping: ServiceNameValue[];
  running: ServiceNameValue[];
} {
  const walletState = useService(ServiceName.WALLET, getServiceOptions(ServiceName.WALLET, services, options));

  const fullNodeState = useService(ServiceName.FULL_NODE, getServiceOptions(ServiceName.FULL_NODE, services, options));

  const farmerState = useService(ServiceName.FARMER, getServiceOptions(ServiceName.FARMER, services, options));

  const harvesterState = useService(ServiceName.HARVESTER, getServiceOptions(ServiceName.HARVESTER, services, options));

  const simulatorState = useService(ServiceName.SIMULATOR, getServiceOptions(ServiceName.SIMULATOR, services, options));

  const plotterState = useService(ServiceName.PLOTTER, getServiceOptions(ServiceName.PLOTTER, services, options));

  const timelordState = useService(ServiceName.TIMELORD, getServiceOptions(ServiceName.TIMELORD, services, options));

  const introducerState = useService(
    ServiceName.INTRODUCER,
    getServiceOptions(ServiceName.INTRODUCER, services, options)
  );

  const datalayerState = useService(ServiceName.DATALAYER, getServiceOptions(ServiceName.DATALAYER, services, options));

  const datalayerServerState = useService(ServiceName.DATALAYER_SERVER, {
    ...getServiceOptions(ServiceName.DATALAYER_SERVER, services, options),
    disableWait: true,
  });

  const states = [
    walletState,
    fullNodeState,
    farmerState,
    harvesterState,
    simulatorState,
    plotterState,
    timelordState,
    introducerState,
    datalayerState,
    datalayerServerState,
  ];

  const isLoading = !!states.find((state) => state.isLoading);
  const error = states.find((state) => state.error)?.error;

  const starting = states.filter((state) => state.state === 'starting').map((state) => state.service);
  const stopping = states.filter((state) => state.state === 'stopping').map((state) => state.service);
  const running = states.filter((state) => state.state === 'running').map((state) => state.service);

  const objectToReturn = {
    isLoading,
    error,
    starting,
    stopping,
    running,
  };
  const stringifiedObjectToReturn = JSON.stringify(objectToReturn);
  const toReturn = useMemo(() => JSON.parse(stringifiedObjectToReturn), [stringifiedObjectToReturn]);
  return toReturn;
}

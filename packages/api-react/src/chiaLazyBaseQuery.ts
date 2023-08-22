import Client from '@chia-network/api';

import type ServiceConstructor from './@types/ServiceConstructor';
import { selectApiConfig } from './slices/api';

const instances = new Map<ServiceConstructor, InstanceType<ServiceConstructor>>();

async function getInstance<TService extends ServiceConstructor>(
  service: TService,
  api: any
): Promise<InstanceType<TService>> {
  if (!instances.has(service)) {
    if (service.isClient) {
      const config = selectApiConfig(api.getState());
      if (!config) {
        throw new Error('Client API config is not defined. Dispatch initializeConfig first');
      }
      const clientInstance = new Client(config);

      instances.set(service, clientInstance);
    } else {
      const client = await getInstance(Client, api);

      if (service.isDaemon) {
        return client.daemon as InstanceType<TService>;
      }

      const Service = service;
      // client is async operation, so we need to check if instance is already set
      if (!instances.has(Service)) {
        instances.set(service, new Service(client));
      }
    }
  }

  return instances.get(service) as InstanceType<TService>;
}

const chiaLazyBaseQuery = async <
  TService extends ServiceConstructor,
  TMethod extends keyof InstanceType<TService> & string,
  // TParameter extends Parameters<InstanceType<TService>[TMethod]>[0],
  TResult extends ReturnType<InstanceType<TService>[TMethod]>
>(
  options: {
    service: TService;
    command: TMethod;
    // args?: TParameter;
    args?: any;
    mockResponse?: any;
  },
  api: any
) => {
  const { service, command, args = [], mockResponse } = options;

  const meta = {
    timestamp: Date.now(),
    service,
    command,
    args,
  };

  if (mockResponse) {
    return {
      data: mockResponse,
      meta,
    };
  }

  try {
    const instance = await getInstance(service, api);
    const arrayArgs = Array.isArray(args) ? args : [args];

    const data = (await instance[command](...arrayArgs)) as TResult;

    return {
      data: data ?? null,
      meta,
    };
  } catch (error) {
    return {
      error,
      meta,
    };
  }
};

export default chiaLazyBaseQuery;

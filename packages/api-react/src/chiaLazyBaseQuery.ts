import Client, { Service, FullNode, WalletService, Harvester, Farmer, Daemon } from '@chia-network/api';
import { BaseQueryApi } from '@reduxjs/toolkit/dist/query/baseQueryTypes';
import type { BaseQueryFn } from '@reduxjs/toolkit/query/react';

import { selectApiConfig } from './slices/api';

type ServiceConstructor<T extends Service> = new (client: Client) => T;

let clientInstance: Client;

async function getClientInstance(api: BaseQueryApi): Promise<Client> {
  if (!clientInstance) {
    const config = selectApiConfig(api.getState());
    if (!config) {
      throw new Error('Client API config is not defined. Dispatch initializeConfig first');
    }
    clientInstance = new Client(config);
  }

  return clientInstance;
}

const services = new Map<typeof Service, Service>();

async function getServiceInstance<TService extends Service>(
  api: BaseQueryApi,
  ServiceClass: ServiceConstructor<TService>
) {
  if (!services.has(ServiceClass.prototype.constructor)) {
    const client = await getClientInstance(api);
    const serviceInstance = new ServiceClass(client);
    services.set(ServiceClass.prototype.constructor, serviceInstance);
  }

  return services.get(ServiceClass.prototype.constructor) as TService;
}

type ServiceQuery<TService extends Service> = {
  service: ServiceConstructor<TService>;
  command: keyof InstanceType<ServiceConstructor<TService>>;
  args?: unknown[];
  mockResponse?: any;
};

type ServiceArg =
  | ServiceQuery<WalletService>
  | ServiceQuery<FullNode>
  | ServiceQuery<Harvester>
  | ServiceQuery<Farmer>
  | ServiceQuery<Daemon>;

type ClientArg = {
  command: keyof InstanceType<typeof Client>;
  client: true;
  args?: unknown[];
  mockResponse?: any;
};

type Metadata = {
  timestamp: number;
  command: string;
  client?: boolean;
  args?: unknown[];
};

const chiaLazyBaseQuery: BaseQueryFn<ServiceArg | ClientArg, unknown, unknown, unknown, Metadata> = async (
  options,
  api
) => {
  const { command, args = [], mockResponse } = options;

  const meta = {
    timestamp: Date.now(),
    command,
    args,
  };
  const newArgs = Array.isArray(args) ? args : [args];

  if (mockResponse) {
    return {
      data: mockResponse,
      meta,
    };
  }

  if ('client' in options) {
    try {
      const instance = await getClientInstance(api);
      if (!(command in instance)) {
        throw new Error(`Command "${command}" not found on Client`);
      }

      return {
        data: (await instance[command](...newArgs)) ?? null,
        meta,
      };
    } catch (error) {
      return {
        error,
        meta,
      };
    }
  }

  try {
    const { service } = options;
    const instance = await getServiceInstance(api, service);
    if (!(command in instance)) {
      throw new Error(`Command "${command}" not found on Client`);
    }

    return {
      data: (await instance[command](...newArgs)) ?? null,
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

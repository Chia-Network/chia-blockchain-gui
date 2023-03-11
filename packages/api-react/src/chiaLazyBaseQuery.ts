import Client, { FullNode, WalletService, Harvester, Farmer, Daemon } from '@chia-network/api';
import { BaseQueryApi } from '@reduxjs/toolkit/dist/query/baseQueryTypes';
import type { BaseQueryFn } from '@reduxjs/toolkit/query/react';

import { selectApiConfig } from './slices/api';

const serviceClasses = {
  FullNode,
  Wallet: WalletService,
  Harvester,
  Farmer,
  Daemon,
};

export const allClasses = {
  ...serviceClasses,
  Client,
};

type BaseServiceClass = typeof FullNode | typeof WalletService | typeof Harvester | typeof Farmer | typeof Daemon;
type ServiceClass = BaseServiceClass | typeof Client;

type ServiceQuery<Service extends ServiceClass> = {
  service: Service;
  command: keyof InstanceType<Service>;
  args?: any[];
  mockResponse?: any;
};

type Metadata = {
  timestamp: number;
  service: ServiceClass;
  command: string;
  args?: any[];
};

const instances = new Map<ServiceClass, InstanceType<ServiceClass>>();

async function getInstance<Service extends ServiceClass>(
  service: Service,
  api: BaseQueryApi
): Promise<InstanceType<Service>> {
  if (!instances.has(service)) {
    if (service === Client) {
      const config = selectApiConfig(api.getState());
      if (!config) {
        throw new Error('Client API config is not defined. Dispatch initializeConfig first');
      }
      const clientInstance = new Client(config);

      instances.set(service, clientInstance);
    } else {
      const client = await getInstance(Client, api);

      const serviceInstance = new (service as BaseServiceClass)(client);
      instances.set(service, serviceInstance);
    }
  }

  return instances.get(service) as InstanceType<Service>;
}

type BaseQueryArgs =
  | ServiceQuery<typeof FullNode>
  | ServiceQuery<typeof WalletService>
  | ServiceQuery<typeof Harvester>
  | ServiceQuery<typeof Farmer>
  | ServiceQuery<typeof Daemon>
  | ServiceQuery<typeof Client>;

const chiaLazyBaseQuery: BaseQueryFn<BaseQueryArgs, unknown, unknown, unknown, Metadata> = async (options, api) => {
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
    const data = await instance[command](...arrayArgs);

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

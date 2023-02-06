import Client, { Service } from '@chia-network/api';
import { BaseQueryApi } from '@reduxjs/toolkit/dist/query/baseQueryTypes';
import { BaseQueryFn } from '@reduxjs/toolkit/query/react';

import { selectApiConfig } from './slices/api';

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

type ServiceClassType = typeof Service;
const services = new Map<ServiceClassType, Service>();

async function getServiceInstance(api: BaseQueryApi, ServiceClass: ServiceClassType): Promise<Service> {
  if (!services.has(ServiceClass)) {
    const client = await getClientInstance(api);
    const serviceInstance = new ServiceClass(client);
    services.set(ServiceClass, serviceInstance);
  }

  return services.get(ServiceClass) as Service;
}

type Options = {
  service?: Service;
};

export default function chiaLazyBaseQuery(options: Options = {}): BaseQueryFn<
  | {
      command: string;
      service: Service;
      args?: any[];
      mockResponse?: any;
    }
  | {
      command: string;
      client: boolean;
      args?: any[];
      mockResponse?: any;
    },
  unknown,
  unknown,
  {},
  {
    timestamp: number;
    command: string;
    client?: boolean;
    args?: any[];
  }
> {
  const { service: DefaultService } = options;
  // @ts-ignore -- Destructuring potentionally non-existing properties will be soon allowed in TS
  // https://github.com/microsoft/TypeScript/issues/46318
  return async ({ command, service: ServiceClass = DefaultService, client = false, args = [], mockResponse }, api) => {
    const instance = client ? await getClientInstance(api) : await getServiceInstance(api, ServiceClass);

    const meta = {
      timestamp: Date.now(),
      command,
      client,
      args,
    };

    try {
      return {
        data: mockResponse ?? (await instance[command](...args)) ?? null,
        meta,
      };
    } catch (error) {
      return {
        error,
        meta,
      };
    }
  };
}

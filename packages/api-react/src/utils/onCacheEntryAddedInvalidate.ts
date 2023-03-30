import { type ServiceClassWithoutClient, type ServiceClassWithoutClientMethods } from '@chia-network/api';

import { baseQuery } from '../api';

type BaseQuery = typeof baseQuery;

type Invalidate =
  | {
      service: ServiceClassWithoutClient;
      command: ServiceClassWithoutClientMethods;
      endpoint: string | (() => Object);
      skip?: (draft: any, data: any, args: any) => boolean;
    }
  | {
      service: ServiceClassWithoutClient;
      command: ServiceClassWithoutClientMethods;
      onUpdate: (draft: any, data: any, args: any) => void;
      skip?: (draft: any, data: any, args: any) => boolean;
    };

export default function onCacheEntryAddedInvalidate(rtkQuery: BaseQuery, api: any, invalidates: Invalidate[]) {
  return async (args: any, mutationApi: any) => {
    const { cacheDataLoaded, cacheEntryRemoved, updateCachedData, dispatch } = mutationApi;
    const unsubscribes: Function[] = [];
    try {
      await cacheDataLoaded;

      await Promise.all(
        invalidates.map(async (invalidate) => {
          // @ts-ignore -- Destructuring potentionally non-existing properties will be soon allowed in TS
          // https://github.com/microsoft/TypeScript/issues/46318
          const { command, service, endpoint, onUpdate, skip } = invalidate;

          const response = await rtkQuery(
            {
              command,
              service,
              args: [
                async (data: any) => {
                  updateCachedData((draft: any) => {
                    if (skip?.(draft, data, args)) {
                      return;
                    }

                    if (onUpdate) {
                      onUpdate(draft, data, args);
                    }

                    if (endpoint) {
                      if (typeof endpoint === 'string') {
                        dispatch(
                          api.endpoints[endpoint].initiate(args, {
                            subscribe: false,
                            forceRefetch: true,
                          })
                        );
                      } else {
                        const currentEndpoint = endpoint();

                        dispatch(
                          currentEndpoint.initiate(args, {
                            subscribe: false,
                            forceRefetch: true,
                          })
                        );
                      }
                    }
                  });
                },
              ],
            },
            mutationApi
          );

          if (response.data) {
            unsubscribes.push(response.data);
          }
        })
      );
    } finally {
      await cacheEntryRemoved;
      unsubscribes.forEach((unsubscribe) => unsubscribe());
    }
  };
}

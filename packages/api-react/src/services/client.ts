import Client, { ConnectionState, ServiceNameValue } from '@chia-network/api';

import MethodFirstParameter from '../@types/MethodFirstParameter';
import MethodReturnType from '../@types/MethodReturnType';
import api, { baseQuery } from '../api';

const apiWithTag = api.enhanceEndpoints({ addTagTypes: [] });

export const clientApi = apiWithTag.injectEndpoints({
  endpoints: (build) => ({
    close: build.mutation<MethodReturnType<typeof Client, 'close'>, MethodFirstParameter<typeof Client, 'close'>>({
      query: (args) => ({
        command: 'close',
        client: true,
        args: [args],
      }),
    }),

    getState: build.query<
      {
        state: ConnectionState;
        attempt: number;
        serviceName?: ServiceNameValue;
      },
      undefined
    >({
      query: () => ({
        command: 'getState',
        client: true,
      }),
      async onCacheEntryAdded(_arg, apiLocal) {
        const { updateCachedData, cacheDataLoaded, cacheEntryRemoved } = apiLocal;
        let unsubscribe;
        try {
          await cacheDataLoaded;

          const response = await baseQuery(
            {
              command: 'onStateChange',
              client: true,
              args: [
                (data: any) => {
                  updateCachedData((draft) => {
                    Object.assign(draft, {
                      ...data,
                    });
                  });
                },
              ],
            },
            apiLocal,
            {}
          );

          unsubscribe = response.data;
        } finally {
          await cacheEntryRemoved;
          if (unsubscribe) {
            unsubscribe();
          }
        }
      },
    }),

    clientStartService: build.mutation<
      boolean,
      {
        service?: ServiceNameValue;
        disableWait?: boolean;
      }
    >({
      query: ({ service, disableWait }) => ({
        command: 'startService',
        args: [service, disableWait],
        client: true,
      }),
    }),
  }),
});

export const { useCloseMutation, useGetStateQuery, useClientStartServiceMutation } = clientApi;

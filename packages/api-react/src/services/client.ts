import Client from '@chia-network/api';

import api, { baseQuery } from '../api';
import { query, mutation } from '../utils/reduxToolkitEndpointAbstractions';

const apiWithTag = api.enhanceEndpoints({ addTagTypes: [] });

export const clientApi = apiWithTag.injectEndpoints({
  endpoints: (build) => ({
    close: mutation(build, Client, 'close'),

    getState: query(build, Client, 'getState', {
      onCacheEntryAdded: async (_arg, apiLocal) => {
        const { updateCachedData, cacheDataLoaded, cacheEntryRemoved } = apiLocal;
        let unsubscribe;
        try {
          await cacheDataLoaded;

          const response = await baseQuery(
            {
              command: 'onStateChange',
              service: Client,
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
            apiLocal
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

    clientStartService: mutation(build, Client, 'startService'),

    clientStopService: mutation(build, Client, 'stopService'),
  }),
});

export const { useCloseMutation, useGetStateQuery, useClientStartServiceMutation, useClientStopServiceMutation } =
  clientApi;

import { Daemon, Farmer, FullNode, PlotterService, WalletService } from '@chia-network/api';

type Service = typeof Daemon | typeof Farmer | typeof FullNode | typeof PlotterService | typeof WalletService;

type Invalidate =
  | {
      command: string;
      service: Service;
      endpoint: () => Object;
      skip?: (draft: any, data: any, args: any) => boolean;
    }
  | {
      command: string;
      service: Service;
      onUpdate: (draft: any, data: any, args: any) => void;
      skip?: (draft: any, data: any, args: any) => boolean;
    };

export default function onCacheEntryAddedInvalidate(rtkQuery, invalidates: Invalidate[]) {
  return async (args: any, api) => {
    const { cacheDataLoaded, cacheEntryRemoved, updateCachedData, dispatch } = api;
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
                      const currentEndpoint = endpoint();
                      dispatch(
                        currentEndpoint.initiate(args, {
                          subscribe: false,
                          forceRefetch: true,
                        })
                      );
                    }
                  });
                },
              ],
            },
            api,
            {}
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

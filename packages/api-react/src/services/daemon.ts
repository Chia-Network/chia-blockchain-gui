import { Daemon, optionsForPlotter, defaultsForPlotter, PlotterName } from '@chia-network/api';
import type { Plotter, PlotterMap, PlotterApi } from '@chia-network/api';

import api, { baseQuery } from '../api';
import onCacheEntryAddedInvalidate from '../utils/onCacheEntryAddedInvalidate';
import { query, mutation } from '../utils/reduxToolkitEndpointAbstractions';

const apiWithTag = api.enhanceEndpoints({
  addTagTypes: ['KeyringStatus', 'ServiceRunning', 'DaemonKey', 'RunningServices', 'WalletAddress'],
});

export const daemonApi = apiWithTag.injectEndpoints({
  endpoints: (build) => ({
    addPrivateKey: mutation(build, Daemon, 'addPrivateKey', {
      transformResponse: (response) => response.fingerprint,
      invalidatesTags: [
        { type: 'DaemonKey', id: 'LIST' },
        { type: 'WalletAddress', id: 'LIST' },
      ],
    }),

    getKey: query(build, Daemon, 'getKey', {
      transformResponse: (response) => response.key,
      providesTags: (key) => (key ? [{ type: 'DaemonKey', id: key.fingerprint }] : []),
    }),

    getKeys: query(build, Daemon, 'getKeys', {
      transformResponse: (response) => response.keys,
      providesTags: (keys) =>
        keys
          ? [
              ...keys.map((key) => ({ type: 'DaemonKey', id: key.fingerprint } as const)),
              { type: 'DaemonKey', id: 'LIST' },
            ]
          : [{ type: 'DaemonKey', id: 'LIST' }],
    }),

    getWalletAddresses: query(build, Daemon, 'getWalletAddresses', {
      transformResponse: (response) => response.walletAddresses,
      providesTags: (walletAddresses) =>
        walletAddresses
          ? [
              ...Object.keys(walletAddresses).flatMap((fingerprint) =>
                walletAddresses[fingerprint].map((address) => ({
                  type: 'WalletAddress',
                  id: `${fingerprint}:${address.hdPath}`,
                }))
              ),
              { type: 'WalletAddress', id: 'LIST' },
            ]
          : [{ type: 'WalletAddress', id: 'LIST' }],
    }),

    setLabel: mutation(build, Daemon, 'setLabel', {
      invalidatesTags: () => ['DaemonKey'],
    }),

    deleteLabel: mutation(build, Daemon, 'deleteLabel', {
      invalidatesTags: () => ['DaemonKey'],
    }),

    daemonPing: query(build, Daemon, 'ping'),

    getKeyringStatus: query(build, Daemon, 'keyringStatus', {
      providesTags: ['KeyringStatus'],
      onCacheEntryAdded: onCacheEntryAddedInvalidate(baseQuery, api, [
        {
          command: 'onKeyringStatusChanged',
          service: Daemon,
          onUpdate: (draft, data) => {
            Object.assign(draft, data);
          },
        },
      ]),
    }),

    startService: mutation(build, Daemon, 'startService'),

    stopService: mutation(build, Daemon, 'stopService'),

    isServiceRunning: query(build, Daemon, 'isRunning', {
      transformResponse: (response) => response.isRunning,
      providesTags: (_result, _err, { service }) => [{ type: 'ServiceRunning', id: service }],
    }),

    runningServices: query(build, Daemon, 'runningServices', {
      transformResponse: (response) => response.runningServices,
      providesTags: [{ type: 'RunningServices', id: 'LIST' }],
    }),

    setKeyringPassphrase: mutation(build, Daemon, 'setKeyringPassphrase', {
      invalidatesTags: () => ['KeyringStatus'],
    }),

    removeKeyringPassphrase: mutation(build, Daemon, 'removeKeyringPassphrase', {
      invalidatesTags: () => ['KeyringStatus'],
    }),

    migrateKeyring: mutation(build, Daemon, 'migrateKeyring', {
      invalidatesTags: () => ['KeyringStatus'],
    }),

    unlockKeyring: mutation(build, Daemon, 'unlockKeyring', {
      invalidatesTags: () => ['KeyringStatus'],
    }),

    getPlotters: query(build, Daemon, 'getPlotters', {
      transformResponse: (response) => {
        const { plotters } = response;
        const plotterNames = Object.keys(plotters) as PlotterName[];
        const availablePlotters: PlotterMap<PlotterName, Plotter> = {};

        plotterNames.forEach((plotterName) => {
          const {
            displayName = plotterName,
            version,
            installed,
            canInstall,
            bladebitMemoryWarning,
            cudaSupport,
          } = plotters[plotterName] as PlotterApi;

          if (!plotterName.startsWith('bladebit')) {
            availablePlotters[plotterName] = {
              displayName,
              version,
              options: optionsForPlotter(plotterName),
              defaults: defaultsForPlotter(plotterName),
              installInfo: {
                installed,
                canInstall,
                bladebitMemoryWarning,
              },
            };
            return;
          }

          // if (plotterName.startsWith('bladebit'))
          const majorVersion = typeof version === 'string' ? +version.split('.')[0] : 0;
          if (majorVersion <= 1) {
            const bbRam = PlotterName.BLADEBIT_RAM;
            availablePlotters[bbRam] = {
              displayName,
              version: typeof version === 'string' ? `${version} (RAM plot)` : version,
              options: optionsForPlotter(bbRam),
              defaults: defaultsForPlotter(bbRam),
              installInfo: {
                installed,
                canInstall,
                bladebitMemoryWarning,
              },
            };
            return;
          }
          const bbDisk = PlotterName.BLADEBIT_DISK;
          availablePlotters[bbDisk] = {
            displayName,
            version: `${version} (Disk plot)`,
            options: optionsForPlotter(bbDisk),
            defaults: defaultsForPlotter(bbDisk),
            installInfo: {
              installed,
              canInstall,
              bladebitMemoryWarning,
            },
          };

          const bbRam = PlotterName.BLADEBIT_RAM;
          availablePlotters[bbRam] = {
            displayName,
            version: `${version} (RAM plot)`,
            options: optionsForPlotter(bbRam),
            defaults: defaultsForPlotter(bbRam),
            installInfo: {
              installed,
              canInstall,
              bladebitMemoryWarning,
            },
          };
          if (cudaSupport) {
            const bbCuda = PlotterName.BLADEBIT_CUDA;
            availablePlotters[bbCuda] = {
              displayName,
              version: `${version} (CUDA plot)`,
              options: optionsForPlotter(bbCuda),
              defaults: defaultsForPlotter(bbCuda),
              installInfo: {
                installed,
                canInstall,
                bladebitMemoryWarning,
                cudaSupport,
              },
            };
          }
        });

        return availablePlotters;
      },
    }),

    stopPlotting: mutation(build, Daemon, 'stopPlotting'),

    startPlotting: mutation(build, Daemon, 'startPlotting'),

    getVersion: query(build, Daemon, 'getVersion', {
      transformResponse: (response) => response.version,
      providesTags: [{ type: 'RunningServices', id: 'LIST' }],
    }),

    getKeysForPlotting: query(build, Daemon, 'getKeysForPlotting'),
  }),
});

export const {
  useDaemonPingQuery,
  useGetKeyringStatusQuery,
  useStartServiceMutation,
  useStopServiceMutation,
  useIsServiceRunningQuery,
  useRunningServicesQuery,
  useSetKeyringPassphraseMutation,
  useRemoveKeyringPassphraseMutation,
  useMigrateKeyringMutation,
  useUnlockKeyringMutation,
  useGetVersionQuery,
  useGetKeysForPlottingQuery,

  useGetPlottersQuery,
  useStopPlottingMutation,
  useStartPlottingMutation,

  useAddPrivateKeyMutation,
  useGetKeyQuery,
  useGetKeysQuery,
  useGetWalletAddressesQuery,
  useSetLabelMutation,
  useDeleteLabelMutation,
} = daemonApi;

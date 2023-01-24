import { Daemon, optionsForPlotter, defaultsForPlotter } from '@chia-network/api';
import type { KeyringStatus, ServiceName, KeyData } from '@chia-network/api';

import api, { baseQuery } from '../api';
import onCacheEntryAddedInvalidate from '../utils/onCacheEntryAddedInvalidate';

const apiWithTag = api.enhanceEndpoints({
  addTagTypes: ['KeyringStatus', 'ServiceRunning', 'DaemonKey', 'RunningServices'],
});

export const daemonApi = apiWithTag.injectEndpoints({
  endpoints: (build) => ({
    addPrivateKey: build.mutation<number, { mnemonic: string; label?: string }>({
      query: ({ mnemonic, label }) => ({
        command: 'addPrivateKey',
        service: Daemon,
        args: [mnemonic, label],
      }),
      transformResponse: (response: any) => response?.fingerprint,
      invalidatesTags: [{ type: 'DaemonKey', id: 'LIST' }],
    }),

    getKey: build.query<
      KeyData,
      {
        fingerprint: number;
        includeSecrets?: boolean;
      }
    >({
      query: ({ fingerprint, includeSecrets }) => ({
        command: 'getKey',
        service: Daemon,
        args: [fingerprint, includeSecrets],
      }),
      transformResponse: (response: any) => response?.key,
      providesTags: (key) => (key ? [{ type: 'DaemonKey', id: key.fingerprint }] : []),
    }),

    getKeys: build.query<
      KeyData[],
      {
        includeSecrets?: boolean;
      }
    >({
      query: ({ includeSecrets } = {}) => ({
        command: 'getKeys',
        service: Daemon,
        args: [includeSecrets],
      }),
      transformResponse: (response: any) => response?.keys,
      providesTags: (keys) =>
        keys
          ? [
              ...keys.map((key) => ({ type: 'DaemonKey', id: key.fingerprint } as const)),
              { type: 'DaemonKey', id: 'LIST' },
            ]
          : [{ type: 'DaemonKey', id: 'LIST' }],
    }),

    setLabel: build.mutation<
      boolean,
      {
        fingerprint: number;
        label: string;
      }
    >({
      query: ({ fingerprint, label }) => ({
        command: 'setLabel',
        service: Daemon,
        args: [fingerprint, label],
      }),
      invalidatesTags: () => ['DaemonKey'],
      transformResponse: (response: any) => response?.success,
    }),

    deleteLabel: build.mutation<
      boolean,
      {
        fingerprint: number;
      }
    >({
      query: ({ fingerprint }) => ({
        command: 'deleteLabel',
        service: Daemon,
        args: [fingerprint],
      }),
      invalidatesTags: () => ['DaemonKey'],
      transformResponse: (response: any) => response?.success,
    }),

    daemonPing: build.query<boolean, {}>({
      query: () => ({
        command: 'ping',
        service: Daemon,
      }),
      transformResponse: (response: any) => response?.success,
    }),

    getKeyringStatus: build.query<KeyringStatus, {}>({
      query: () => ({
        command: 'keyringStatus',
        service: Daemon,
      }),
      transformResponse: (response: any) => {
        const { status, ...rest } = response;

        return {
          ...rest,
        };
      },
      providesTags: ['KeyringStatus'],
      onCacheEntryAdded: onCacheEntryAddedInvalidate(baseQuery, [
        {
          command: 'onKeyringStatusChanged',
          service: Daemon,
          onUpdate: (draft, data) => {
            // empty base array
            draft.splice(0);

            const { status, ...rest } = data;

            // assign new items
            Object.assign(draft, rest);
          },
        },
      ]),
    }),

    startService: build.mutation<
      boolean,
      {
        service: ServiceName;
        testing?: boolean;
      }
    >({
      query: ({ service, testing }) => ({
        command: 'startService',
        service: Daemon,
        args: [service, testing],
      }),
    }),

    stopService: build.mutation<
      boolean,
      {
        service: ServiceName;
      }
    >({
      query: ({ service }) => ({
        command: 'stopService',
        service: Daemon,
        args: [service],
      }),
    }),

    isServiceRunning: build.query<
      KeyringStatus,
      {
        service: ServiceName;
      }
    >({
      query: ({ service }) => ({
        command: 'isRunning',
        service: Daemon,
        args: [service],
      }),
      transformResponse: (response: any) => response?.isRunning,
      providesTags: (_result, _err, { service }) => [{ type: 'ServiceRunning', id: service }],
    }),

    runningServices: build.query<KeyringStatus, {}>({
      query: () => ({
        command: 'runningServices',
        service: Daemon,
      }),
      transformResponse: (response: any) => response?.runningServices,
      providesTags: [{ type: 'RunningServices', id: 'LIST' }],
    }),

    setKeyringPassphrase: build.mutation<
      boolean,
      {
        currentPassphrase?: string;
        newPassphrase?: string;
        passphraseHint?: string;
        savePassphrase?: boolean;
      }
    >({
      query: ({ currentPassphrase, newPassphrase, passphraseHint, savePassphrase }) => ({
        command: 'setKeyringPassphrase',
        service: Daemon,
        args: [currentPassphrase, newPassphrase, passphraseHint, savePassphrase],
      }),
      invalidatesTags: () => ['KeyringStatus'],
      transformResponse: (response: any) => response?.success,
    }),

    removeKeyringPassphrase: build.mutation<
      boolean,
      {
        currentPassphrase: string;
      }
    >({
      query: ({ currentPassphrase }) => ({
        command: 'removeKeyringPassphrase',
        service: Daemon,
        args: [currentPassphrase],
      }),
      invalidatesTags: () => ['KeyringStatus'],
      transformResponse: (response: any) => response?.success,
    }),

    migrateKeyring: build.mutation<
      boolean,
      {
        passphrase: string;
        passphraseHint: string;
        savePassphrase: boolean;
        cleanupLegacyKeyring: boolean;
      }
    >({
      query: ({ passphrase, passphraseHint, savePassphrase, cleanupLegacyKeyring }) => ({
        command: 'migrateKeyring',
        service: Daemon,
        args: [passphrase, passphraseHint, savePassphrase, cleanupLegacyKeyring],
      }),
      invalidatesTags: () => ['KeyringStatus'],
      transformResponse: (response: any) => response?.success,
    }),

    unlockKeyring: build.mutation<
      boolean,
      {
        key: string;
      }
    >({
      query: ({ key }) => ({
        command: 'unlockKeyring',
        service: Daemon,
        args: [key],
      }),
      invalidatesTags: () => ['KeyringStatus'],
      transformResponse: (response: any) => response?.success,
    }),

    getPlotters: build.query<Object, undefined>({
      query: () => ({
        command: 'getPlotters',
        service: Daemon,
      }),
      transformResponse: (response: any) => {
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
          } = plotters[plotterName];

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
          if (majorVersion > 1) {
            const bbDisk = 'bladebit_disk';
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

            const bbRam = 'bladebit_ram';
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
          } else {
            const bbRam = 'bladebit_ram';
            availablePlotters[bbRam] = {
              displayName,
              version: `${version} (RAM plot)`,
              options: optionsForPlotter(bbRam),
              defaults: defaultsForPlotter(bbRam),
              installInfo: {
                installed: false,
                canInstall: false,
                bladebitMemoryWarning,
              },
            };
          }
        });

        return availablePlotters;
      },
      // providesTags: (_result, _err, { service }) => [{ type: 'ServiceRunning', id: service }],
    }),

    stopPlotting: build.mutation<
      boolean,
      {
        id: string;
      }
    >({
      query: ({ id }) => ({
        command: 'stopPlotting',
        service: Daemon,
        args: [id],
      }),
      transformResponse: (response: any) => response?.success,
      // providesTags: (_result, _err, { service }) => [{ type: 'ServiceRunning', id: service }],
    }),
    startPlotting: build.mutation<boolean, PlotAdd>({
      query: ({
        bladebitDisableNUMA,
        bladebitWarmStart,
        bladebitNoCpuAffinity,
        bladebitDiskCache,
        bladebitDiskF1Threads,
        bladebitDiskFpThreads,
        bladebitDiskCThreads,
        bladebitDiskP2Threads,
        bladebitDiskP3Threads,
        bladebitDiskAlternate,
        bladebitDiskNoT1Direct,
        bladebitDiskNoT2Direct,
        c,
        delay,
        disableBitfieldPlotting,
        excludeFinalDir,
        farmerPublicKey,
        finalLocation,
        fingerprint,
        madmaxNumBucketsPhase3,
        madmaxTempToggle,
        madmaxThreadMultiplier,
        maxRam,
        numBuckets,
        numThreads,
        overrideK,
        parallel,
        plotCount,
        plotSize,
        plotterName,
        plotType,
        poolPublicKey,
        queue,
        workspaceLocation,
        workspaceLocation2,
      }) => ({
        command: 'startPlotting',
        service: Daemon,
        args: [
          plotterName,
          plotSize,
          plotCount,
          workspaceLocation,
          workspaceLocation2 || workspaceLocation,
          finalLocation,
          maxRam,
          numBuckets,
          numThreads,
          queue,
          fingerprint,
          parallel,
          delay,
          disableBitfieldPlotting,
          excludeFinalDir,
          overrideK,
          farmerPublicKey,
          poolPublicKey,
          c,
          madmaxNumBucketsPhase3,
          madmaxTempToggle,
          madmaxThreadMultiplier,
          plotType,
          bladebitDisableNUMA,
          bladebitWarmStart,
          bladebitNoCpuAffinity,
          bladebitDiskCache,
          bladebitDiskF1Threads,
          bladebitDiskFpThreads,
          bladebitDiskCThreads,
          bladebitDiskP2Threads,
          bladebitDiskP3Threads,
          bladebitDiskAlternate,
          bladebitDiskNoT1Direct,
          bladebitDiskNoT2Direct,
        ],
      }),
      transformResponse: (response: any) => response?.success,
      // providesTags: (_result, _err, { service }) => [{ type: 'ServiceRunning', id: service }],
    }),
    getVersion: build.query<string, {}>({
      query: () => ({
        command: 'getVersion',
        service: Daemon,
      }),
      transformResponse: (response: any) => response?.version,
    }),
    resyncWallet: build.mutation<
      boolean,
      {
        enable?: boolean;
      }
      >({
        query: ({ enable }) => ({
          command: 'resyncWallet',
          service: Daemon,
          args: [enable],
        }),
        transformResponse: (response: any) => response?.success,
      }),
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
  useResyncWalletMutation,

  useGetPlottersQuery,
  useStopPlottingMutation,
  useStartPlottingMutation,

  useAddPrivateKeyMutation,
  useGetKeyQuery,
  useGetKeysQuery,
  useSetLabelMutation,
  useDeleteLabelMutation,
} = daemonApi;

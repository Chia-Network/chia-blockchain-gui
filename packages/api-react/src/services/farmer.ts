/* eslint-disable no-param-reassign -- This file use Immer */
import { Farmer, type HarvesterSummary } from '@chia-network/api';

import api, { baseQuery } from '../api';
import onCacheEntryAddedInvalidate from '../utils/onCacheEntryAddedInvalidate';
import { query, mutation } from '../utils/reduxToolkitEndpointAbstractions';

const MAX_SIGNAGE_POINTS = 500;
export const apiWithTag = api.enhanceEndpoints({
  addTagTypes: [
    'Harvesters',
    'RewardTargets',
    'FarmerConnections',
    'SignagePoints',
    'PoolLoginLink',
    'Pools',
    'PayoutInstructions',
    'HarvesterPlots',
    'HarvesterPlotsInvalid',
    'HarvestersSummary',
    'HarvesterPlotsKeysMissing',
    'HarvesterPlotsDuplicates',
  ],
});

export const farmerApi = apiWithTag.injectEndpoints({
  endpoints: (build) => ({
    farmerPing: query(build, Farmer, 'ping'),

    getHarvesters: query(build, Farmer, 'getHarvesters', {
      transformResponse: (response) => response.harvesters,
      providesTags: [{ type: 'Harvesters', id: 'LIST' }],
      onCacheEntryAdded: onCacheEntryAddedInvalidate(baseQuery, api, [
        {
          command: 'onHarvesterUpdated',
          service: Farmer,
          endpoint: 'getHarvesters',
        },
        {
          command: 'onHarvesterRemoved',
          service: Farmer,
          endpoint: 'getHarvesters',
        },
      ]),
    }),

    getHarvestersSummary: query(build, Farmer, 'getHarvestersSummary', {
      transformResponse: (response) => response.harvesters,
      providesTags: [{ type: 'HarvestersSummary', id: 'LIST' }],
      onCacheEntryAdded: onCacheEntryAddedInvalidate(baseQuery, api, [
        {
          command: 'onHarvesterUpdated',
          service: Farmer,
          onUpdate(draft: HarvesterSummary[], data) {
            const {
              connection: { nodeId },
            } = data;

            const index = draft.findIndex((harvester) => harvester.connection.nodeId === nodeId);
            if (index !== -1) {
              draft[index] = data;
            } else {
              draft.push(data);
            }
          },
        },
        {
          command: 'onHarvesterRemoved',
          service: Farmer,
          onUpdate(draft: HarvesterSummary[], data) {
            const { nodeId } = data;

            const index = draft.findIndex((harvester) => harvester.connection.nodeId === nodeId);
            if (index !== -1) {
              draft.splice(index, 1);
            }
          },
        },
      ]),
    }),

    getHarvesterPlotsValid: query(build, Farmer, 'getHarvesterPlotsValid', {
      transformResponse: (response) => response.plots,
      providesTags: (plots) =>
        plots
          ? [
              ...plots.map(({ plotId }) => ({ type: 'HarvesterPlots', plotId } as const)),
              { type: 'HarvesterPlots', id: 'LIST' },
            ]
          : [{ type: 'HarvesterPlots', id: 'LIST' }],
      onCacheEntryAdded: onCacheEntryAddedInvalidate(baseQuery, api, [
        {
          command: 'onHarvesterUpdated',
          service: Farmer,
          endpoint: 'getHarvesterPlotsValid',
          skip: (_draft, data, args) => args.nodeId !== data?.connection?.nodeId,
        },
      ]),
    }),

    getHarvesterPlotsInvalid: query(build, Farmer, 'getHarvesterPlotsInvalid', {
      transformResponse: (response) => response.plots,
      providesTags: (plots) =>
        plots
          ? [
              ...plots.map((filename) => ({ type: 'HarvesterPlotsInvalid', filename } as const)),
              { type: 'HarvesterPlotsInvalid', id: 'LIST' },
            ]
          : [{ type: 'HarvesterPlotsInvalid', id: 'LIST' }],
      onCacheEntryAdded: onCacheEntryAddedInvalidate(baseQuery, api, [
        {
          command: 'onHarvesterUpdated',
          service: Farmer,
          endpoint: 'getHarvesterPlotsInvalid',
          skip: (_draft, data, args) => args.nodeId !== data?.connection?.nodeId,
        },
      ]),
    }),

    getHarvesterPlotsKeysMissing: query(build, Farmer, 'getHarvesterPlotsKeysMissing', {
      transformResponse: (response) => response.plots,
      providesTags: (plots) =>
        plots
          ? [
              ...plots.map((filename) => ({ type: 'HarvesterPlotsKeysMissing', filename } as const)),
              { type: 'HarvesterPlotsKeysMissing', id: 'LIST' },
            ]
          : [{ type: 'HarvesterPlotsKeysMissing', id: 'LIST' }],
      onCacheEntryAdded: onCacheEntryAddedInvalidate(baseQuery, api, [
        {
          command: 'onHarvesterUpdated',
          service: Farmer,
          endpoint: 'getHarvesterPlotsKeysMissing',
          skip: (_draft, data, args) => args.nodeId !== data?.connection?.nodeId,
        },
      ]),
    }),

    getHarvesterPlotsDuplicates: query(build, Farmer, 'getHarvesterPlotsDuplicates', {
      transformResponse: (response) => response.plots,
      providesTags: (plots) =>
        plots
          ? [
              ...plots.map((filename) => ({ type: 'HarvesterPlotsDuplicates', filename } as const)),
              { type: 'HarvesterPlotsDuplicates', id: 'LIST' },
            ]
          : [{ type: 'HarvesterPlotsDuplicates', id: 'LIST' }],
      onCacheEntryAdded: onCacheEntryAddedInvalidate(baseQuery, api, [
        {
          command: 'onHarvesterUpdated',
          service: Farmer,
          endpoint: 'getHarvesterPlotsDuplicates',
          skip: (_draft, data, args) => args.nodeId !== data?.connection?.nodeId,
        },
      ]),
    }),

    getRewardTargets: query(build, Farmer, 'getRewardTargets', {
      providesTags: ['RewardTargets'],
    }),

    setRewardTargets: mutation(build, Farmer, 'setRewardTargets', {
      invalidatesTags: ['RewardTargets'],
    }),

    getFarmerConnections: query(build, Farmer, 'getConnections', {
      transformResponse: (response) => response.connections,
      providesTags: (connections) =>
        connections
          ? [
              ...connections.map(({ nodeId }) => ({ type: 'FarmerConnections', id: nodeId } as const)),
              { type: 'FarmerConnections', id: 'LIST' },
            ]
          : [{ type: 'FarmerConnections', id: 'LIST' }],
      onCacheEntryAdded: onCacheEntryAddedInvalidate(baseQuery, api, [
        {
          command: 'onConnections',
          service: Farmer,
          onUpdate: (draft, data) => {
            // empty base array
            draft.splice(0);

            // assign new items
            Object.assign(draft, data.connections);
          },
        },
      ]),
    }),

    openFarmerConnection: mutation(build, Farmer, 'openConnection', {
      invalidatesTags: [{ type: 'FarmerConnections', id: 'LIST' }],
    }),

    closeFarmerConnection: mutation(build, Farmer, 'closeConnection', {
      invalidatesTags: (_result, _error, { nodeId }) => [
        { type: 'FarmerConnections', id: 'LIST' },
        { type: 'FarmerConnections', id: nodeId },
      ],
    }),

    getPoolLoginLink: query(build, Farmer, 'getPoolLoginLink', {
      transformResponse: (response) => response.loginLink,
      providesTags: (launcherId) => [{ type: 'PoolLoginLink', id: launcherId }],
      // TODO invalidate when join pool/change pool
    }),

    getSignagePoints: query(build, Farmer, 'getSignagePoints', {
      transformResponse: (response) => response.signagePoints,
      providesTags: (signagePoints) =>
        signagePoints
          ? [
              ...signagePoints.map(({ challengeHash }) => ({ type: 'SignagePoints', id: challengeHash } as const)),
              { type: 'SignagePoints', id: 'LIST' },
            ]
          : [{ type: 'SignagePoints', id: 'LIST' }],
      onCacheEntryAdded: onCacheEntryAddedInvalidate(baseQuery, api, [
        {
          command: 'onNewSignagePoint',
          service: Farmer,
          onUpdate: (draft, data) => {
            draft.unshift(data);
            if (draft.length > MAX_SIGNAGE_POINTS) {
              draft.splice(MAX_SIGNAGE_POINTS, draft.length - MAX_SIGNAGE_POINTS);
            }
          },
        },
      ]),
    }),

    getPoolState: query(build, Farmer, 'getPoolState', {
      transformResponse: (response) => response.poolState,
      providesTags: (poolsList) =>
        poolsList
          ? [
              ...poolsList.map(({ p2SingletonPuzzleHash }) => ({ type: 'Pools', id: p2SingletonPuzzleHash } as const)),
              { type: 'Pools', id: 'LIST' },
            ]
          : [{ type: 'Pools', id: 'LIST' }],
    }),

    setPayoutInstructions: mutation(build, Farmer, 'setPayoutInstructions', {
      invalidatesTags: (_result, _error, { launcherId }) => [{ type: 'PayoutInstructions', id: launcherId }],
    }),

    getNewFarmingInfo: query(build, Farmer, 'getNewFarmingInfo', {
      onCacheEntryAdded: onCacheEntryAddedInvalidate(baseQuery, api, [
        {
          command: 'onFarmingInfoChanged',
          service: Farmer,
          endpoint: 'getNewFarmingInfo',
        },
      ]),
    }),

    getMissingSignagePoints: query(build, Farmer, 'getMissingSignagePoints', {
      onCacheEntryAdded: onCacheEntryAddedInvalidate(baseQuery, api, [
        {
          command: 'onNewSignagePoint',
          service: Farmer,
          endpoint: 'getMissingSignagePoints',
        },
      ]),
    }),
  }),
});

// TODO add new farming info query and event for last_attempt_proofs

export const {
  useFarmerPingQuery,
  useGetHarvestersQuery,
  useGetHarvestersSummaryQuery,
  useGetHarvesterPlotsValidQuery,
  useGetHarvesterPlotsDuplicatesQuery,
  useGetHarvesterPlotsInvalidQuery,
  useGetHarvesterPlotsKeysMissingQuery,
  useGetRewardTargetsQuery,
  useSetRewardTargetsMutation,
  useGetFarmerConnectionsQuery,
  useOpenFarmerConnectionMutation,
  useCloseFarmerConnectionMutation,
  useGetPoolLoginLinkQuery,
  useGetSignagePointsQuery,
  useGetPoolStateQuery,
  useSetPayoutInstructionsMutation,
  useGetNewFarmingInfoQuery,
  useGetMissingSignagePointsQuery,
} = farmerApi;

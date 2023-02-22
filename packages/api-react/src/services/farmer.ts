/* eslint-disable no-param-reassign -- This file use Immer */
import { Farmer } from '@chia-network/api';

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
      providesTags: (harvesters) =>
        harvesters
          ? [...harvesters.map(({ id }) => ({ type: 'Harvesters', id } as const)), { type: 'Harvesters', id: 'LIST' }]
          : [{ type: 'Harvesters', id: 'LIST' }],
      onCacheEntryAdded: onCacheEntryAddedInvalidate(baseQuery, [
        {
          command: 'onHarvesterChanged',
          service: Farmer,
          endpoint: () => farmerApi.endpoints.getHarvesters,
        },
      ]),
    }),

    getHarvestersSummary: query(build, Farmer, 'getHarvestersSummary', {
      transformResponse: (response) => response.harvesters,
      providesTags: (harvesters) =>
        harvesters
          ? [
              ...harvesters.map(({ id }) => ({ type: 'HarvestersSummary', id } as const)),
              { type: 'HarvestersSummary', id: 'LIST' },
            ]
          : [{ type: 'HarvestersSummary', id: 'LIST' }],
      onCacheEntryAdded: onCacheEntryAddedInvalidate(baseQuery, [
        {
          command: 'onHarvesterUpdated',
          service: Farmer,
          onUpdate(draft, data) {
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
          onUpdate(draft, data) {
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
      onCacheEntryAdded: onCacheEntryAddedInvalidate(baseQuery, [
        {
          command: 'onHarvesterUpdated',
          service: Farmer,
          endpoint: () => farmerApi.endpoints.getHarvesterPlotsValid,
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
      onCacheEntryAdded: onCacheEntryAddedInvalidate(baseQuery, [
        {
          command: 'onHarvesterUpdated',
          service: Farmer,
          endpoint: () => farmerApi.endpoints.getHarvesterPlotsInvalid,
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
      onCacheEntryAdded: onCacheEntryAddedInvalidate(baseQuery, [
        {
          command: 'onHarvesterUpdated',
          service: Farmer,
          endpoint: () => farmerApi.endpoints.getHarvesterPlotsKeysMissing,
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
      onCacheEntryAdded: onCacheEntryAddedInvalidate(baseQuery, [
        {
          command: 'onHarvesterUpdated',
          service: Farmer,
          endpoint: () => farmerApi.endpoints.getHarvesterPlotsDuplicates,
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

    getConnections: query(build, Farmer, 'getConnections', {
      transformResponse: (response) => response.connections,
      providesTags: (connections) =>
        connections
          ? [
              ...connections.map(({ nodeId }) => ({ type: 'FarmerConnections', id: nodeId } as const)),
              { type: 'FarmerConnections', id: 'LIST' },
            ]
          : [{ type: 'FarmerConnections', id: 'LIST' }],
      onCacheEntryAdded: onCacheEntryAddedInvalidate(baseQuery, [
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
              ...signagePoints.map(
                ({ signagePoint }) => ({ type: 'SignagePoints', id: signagePoint?.challengeHash } as const)
              ),
              { type: 'SignagePoints', id: 'LIST' },
            ]
          : [{ type: 'SignagePoints', id: 'LIST' }],
      onCacheEntryAdded: onCacheEntryAddedInvalidate(baseQuery, [
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

    getFarmingInfo: query(build, Farmer, 'getFarmingInfo', {
      onCacheEntryAdded: onCacheEntryAddedInvalidate(baseQuery, [
        {
          command: 'onFarmingInfoChanged',
          service: Farmer,
          endpoint: () => farmerApi.endpoints.getFarmingInfo,
        },
      ]),
    }),
  }),
});

// TODO add new farming info query and event for last_attepmtp_proofs

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
  useGetFarmingInfoQuery,
} = farmerApi;

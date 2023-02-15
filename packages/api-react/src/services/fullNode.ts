import { FullNode, Service } from '@chia-network/api';
import type { Block, BlockRecord, BlockHeader, BlockchainState, FullNodeConnection } from '@chia-network/api';
// import MethodReturnType from '../@types/MethodReturnType'
// import MethodFirstParameter from '../@types/MethodFirstParameter'

import api, { baseQuery } from '../api';
import onCacheEntryAddedInvalidate from '../utils/onCacheEntryAddedInvalidate';
import query from '../utils/query';

const apiWithTag = api.enhanceEndpoints({ addTagTypes: ['BlockchainState', 'FeeEstimate', 'FullNodeConnections'] });

// export const myTestApi = apiWithTag.injectEndpoints({
//   endpoints: (build) => ({

//     fullNodePing: build.query<
//       MethodReturnType<typeof FullNode, 'getBlockRecords'>,
//       MethodFirstParameter<typeof FullNode, 'getBlockRecords'>
//     >({
//       query: () => ({
//         command: 'ping',
//         service: FullNode,
//       }),
//       transformResponse: (response: any) => response?.success,
//     }),

//     testFunction: query(build, FullNode, 'getBlockRecords', {
//       transformResponse: (response) => response?.success,
//     }),
//   }),
// });

// const { useFullNodePingQuery: useFullNodePingQuery2, useTestFunctionQuery } = myTestApi;

// function ReactComponent() {
//   const { data } = useFullNodePingQuery2({
//     start: 12,
//     end: 'pmg',
//   });

//   const result = data?.responseField2;
//   console.log('result', result);

//   const { data: data2 } = useTestFunctionQuery({
//     start: 12,
//     end: '13',
//   });

//   const result2 = data2?.responseField2;
//   console.log('result2', result2);
// }

export const fullNodeApi = apiWithTag.injectEndpoints({
  endpoints: (build) => ({
    fullNodePing: build.query<Awaited<ReturnType<FullNode['ping']>>['success'], Parameters<FullNode['ping']>>({
      query: () => ({
        command: 'ping',
        service: FullNode,
      }),
      transformResponse: (response: any) => response?.success,
    }),

    getBlockRecords: build.query<
      BlockRecord[],
      {
        start?: number;
        end?: number;
      }
    >({
      query: ({ start, end }) => ({
        command: 'getBlockRecords',
        service: FullNode,
        args: [start, end],
      }),
      transformResponse: (response: any) => response?.blockRecords,
    }),
    getUnfinishedBlockHeaders: build.query<BlockHeader[], undefined>({
      query: () => ({
        command: 'getUnfinishedBlockHeaders',
        service: FullNode,
      }),
      transformResponse: (response: any) => response?.headers,
      onCacheEntryAdded: onCacheEntryAddedInvalidate(baseQuery, [
        {
          command: 'onBlockchainState',
          service: FullNode,
          endpoint: () => fullNodeApi.endpoints.getUnfinishedBlockHeaders,
        },
      ]),
    }),
    getBlockchainState: build.query<BlockchainState, undefined>({
      query: () => ({
        command: 'getBlockchainState',
        service: FullNode,
      }),
      providesTags: ['BlockchainState'],
      transformResponse: (response: any) => response?.blockchainState,
      onCacheEntryAdded: onCacheEntryAddedInvalidate(baseQuery, [
        {
          command: 'onBlockchainState',
          service: FullNode,
          onUpdate: (draft, data) =>
            Object.assign(draft, {
              ...data.blockchainState,
            }),
        },
      ]),
    }),
    getFullNodeConnections: build.query<FullNodeConnection[], undefined>({
      query: () => ({
        command: 'getConnections',
        service: FullNode,
      }),
      transformResponse: (response: any) => response?.connections,
      providesTags: (connections) =>
        connections
          ? [
              ...connections.map(({ nodeId }) => ({ type: 'FullNodeConnections', id: nodeId } as const)),
              { type: 'FullNodeConnections', id: 'LIST' },
            ]
          : [{ type: 'FullNodeConnections', id: 'LIST' }],
      onCacheEntryAdded: onCacheEntryAddedInvalidate(baseQuery, [
        {
          command: 'onConnections',
          service: FullNode,
          onUpdate: (draft, data) => {
            // empty base array
            draft.splice(0);

            // assign new items
            Object.assign(draft, data.connections);
          },
        },
      ]),
    }),
    openFullNodeConnection: build.mutation<
      FullNodeConnection,
      {
        host: string;
        port: number;
      }
    >({
      query: ({ host, port }) => ({
        command: 'openConnection',
        service: FullNode,
        args: [host, port],
      }),
      invalidatesTags: [{ type: 'FullNodeConnections', id: 'LIST' }],
    }),
    closeFullNodeConnection: build.mutation<
      FullNodeConnection,
      {
        nodeId: string;
      }
    >({
      query: ({ nodeId }) => ({
        command: 'closeConnection',
        service: FullNode,
        args: [nodeId],
      }),
      invalidatesTags: (_result, _error, { nodeId }) => [
        { type: 'FullNodeConnections', id: 'LIST' },
        { type: 'FullNodeConnections', id: nodeId },
      ],
    }),
    getBlock: build.query<
      Block,
      {
        headerHash: string;
      }
    >({
      query: ({ headerHash }) => ({
        command: 'getBlock',
        service: FullNode,
        args: [headerHash],
      }),
      transformResponse: (response: any) => response?.block,
    }),

    getBlockRecord: query(build, FullNode, 'getBlockRecord', {
      transformResponse: (response) => response.blockRecord,
    }),

    getFeeEstimate: build.query<
      string,
      {
        targetTimes: number[];
        spendType: string;
      }
    >({
      query: ({ targetTimes, spendType }) => ({
        command: 'getFeeEstimate',
        service: FullNode,
        args: [targetTimes, spendType],
      }),
      providesTags: [{ type: 'FeeEstimate' }],
    }),
  }),
});

export const {
  useFullNodePingQuery,
  useGetBlockRecordsQuery,
  useGetUnfinishedBlockHeadersQuery,
  useGetBlockchainStateQuery,
  useGetFullNodeConnectionsQuery,
  useOpenFullNodeConnectionMutation,
  useCloseFullNodeConnectionMutation,
  useGetBlockQuery,
  useGetBlockRecordQuery,
  useGetFeeEstimateQuery,
} = fullNodeApi;

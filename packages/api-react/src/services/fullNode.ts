import { FullNode } from '@chia-network/api';

// import MethodReturnType from '../@types/MethodReturnType'
// import MethodFirstParameter from '../@types/MethodFirstParameter'

import api, { baseQuery } from '../api';
import onCacheEntryAddedInvalidate from '../utils/onCacheEntryAddedInvalidate';
import { query, mutation } from '../utils/reduxToolkitEndpointAbstractions';

const apiWithTag = api.enhanceEndpoints({ addTagTypes: ['BlockchainState', 'FeeEstimate', 'FullNodeConnections'] });

// // Examples with levels of abstraction
// export const myTestApi = apiWithTag.injectEndpoints({
//   endpoints: (build) => ({
//     // # No abstraction, completely custom

//     fullNodePing: build.query<Awaited<ReturnType<FullNode['ping']>>['success'], Parameters<FullNode['ping']>>({
//       query: () => ({
//         command: 'ping',
//         service: FullNode,
//       }),
//       transformResponse: (response: any) => response?.success,
//     }),

//     // # Types helpers abstraction
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

//     // # Full abstraction <- Most commonly used

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
    fullNodePing: query(build, FullNode, 'ping'),

    getBlockRecords: query(build, FullNode, 'getBlockRecords', {
      transformResponse: (response) => response.blockRecords,
    }),

    getUnfinishedBlockHeaders: query(build, FullNode, 'getUnfinishedBlockHeaders', {
      transformResponse: (response) => response.headers,
      onCacheEntryAdded: onCacheEntryAddedInvalidate(baseQuery, [
        {
          command: 'onBlockchainState',
          service: FullNode,
          endpoint: () => fullNodeApi.endpoints.getUnfinishedBlockHeaders,
        },
      ]),
    }),

    getBlockchainState: query(build, FullNode, 'getBlockchainState', {
      transformResponse: (response) => response.blockchainState,
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

    getFullNodeConnections: query(build, FullNode, 'getConnections', {
      transformResponse: (response) => response.connections,
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

    openFullNodeConnection: mutation(build, FullNode, 'openConnection', {
      invalidatesTags: [{ type: 'FullNodeConnections', id: 'LIST' }],
    }),

    closeFullNodeConnection: mutation(build, FullNode, 'closeConnection', {
      invalidatesTags: (_result, _error, { nodeId }) => [
        { type: 'FullNodeConnections', id: 'LIST' },
        { type: 'FullNodeConnections', id: nodeId },
      ],
    }),

    getBlock: query(build, FullNode, 'getBlock', {
      transformResponse: (response) => response.block,
    }),

    getBlockRecord: query(build, FullNode, 'getBlockRecord', {
      transformResponse: (response) => response.blockRecord,
    }),

    getFeeEstimate: query(build, FullNode, 'getFeeEstimate', {
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

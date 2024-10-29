import { DataLayer } from '@chia-network/api';

import api from '../api';
import { query, mutation } from '../utils/reduxToolkitEndpointAbstractions';

export const apiWithTag = api.enhanceEndpoints({
  addTagTypes: [
    'OwnedDataStores',
    'Roots',
    'RootHistories',
    'LocalRoots',
    'Mirrors',
    'Keys',
    'KeysValues',
    'Values',
    'Ancestors',
    'SyncStatus',
    'KvDiff',
    'Subscriptions',
    'Offers',
    'StoreMirrors',
    'PendingRoots',
    'Plugins',
    'Files',
  ],
});
export const dataLayerApi = apiWithTag.injectEndpoints({
  endpoints: (build) => ({
    addMirror: mutation(build, DataLayer, 'addMirror', {
      invalidatesTags: (_result, _error, { id }) => [
        { type: 'StoreMirrors', id: 'LIST' },
        { type: 'StoreMirrors', id },
      ],
    }),

    addMissingFiles: mutation(build, DataLayer, 'addMissingFiles', {
      invalidatesTags: (_result, _error, { ids }) => ids.map((id: string) => ({ type: 'Files', id })),
    }),

    batchUpdate: mutation(build, DataLayer, 'batchUpdate', {
      invalidatesTags: (_result, _error, { id }) => [
        { type: 'Keys', id },
        { type: 'KeysValues', id },
      ],
    }),

    cancelOffer: mutation(build, DataLayer, 'cancelOffer', {
      invalidatesTags: (_result, _error, { tradeId }) => [{ type: 'Offers', id: tradeId }],
    }),

    checkPlugins: query(build, DataLayer, 'checkPlugins', {
      providesTags: [{ type: 'Plugins' }],
    }),

    clearPendingRoots: mutation(build, DataLayer, 'clearPendingRoots', {
      invalidatesTags: (_result, _error, { storeId }) => [{ type: 'PendingRoots', id: storeId }],
    }),

    createDataStore: mutation(build, DataLayer, 'createDataStore', {
      invalidatesTags: [{ type: 'OwnedDataStores' }],
    }),

    deleteKey: mutation(build, DataLayer, 'deleteKey', {
      invalidatesTags: (_result, _error, { id }) => [
        { type: 'Keys', id },
        { type: 'KeysValues', id },
      ],
    }),

    deleteMirror: mutation(build, DataLayer, 'deleteMirror', {
      invalidatesTags: (_result, _error, { id }) => [{ type: 'Mirrors', id }],
    }),

    getAncestors: query(build, DataLayer, 'getAncestors', {
      providesTags: (_result, _error, { id }) => [{ type: 'Ancestors', id }],
    }),

    getKeys: query(build, DataLayer, 'getKeys', {
      providesTags: (_result, _error, { id }) => [{ type: 'Keys', id }],
    }),

    getKeysValues: query(build, DataLayer, 'getKeysValues', {
      providesTags: (_result, _error, { id }) => [{ type: 'KeysValues', id }],
    }),

    getKvDiff: query(build, DataLayer, 'getKvDiff', {
      providesTags: [{ type: 'KvDiff' }],
    }),

    getLocalRoot: query(build, DataLayer, 'getLocalRoot', {
      providesTags: (_result, _error, { id }) => [{ type: 'LocalRoots', id }],
    }),

    getMirrors: query(build, DataLayer, 'getMirrors', {
      providesTags: (_result, _error, { id }) => [{ type: 'Mirrors', id }],
    }),

    getOwnedStores: query(build, DataLayer, 'getOwnedStores', {
      providesTags: [{ type: 'OwnedDataStores' }],
    }),

    getRoot: query(build, DataLayer, 'getRoot', {
      providesTags: (_result, _error, { id }) => [{ type: 'Roots', id }],
    }),

    getRoots: query(build, DataLayer, 'getRoots', {
      providesTags: [{ type: 'Roots', id: 'LIST' }],
    }),

    getRootHistory: query(build, DataLayer, 'getRootHistory', {
      providesTags: (_result, _error, { id }) => [{ type: 'RootHistories', id }],
    }),

    getSyncStatus: query(build, DataLayer, 'getSyncStatus', {
      providesTags: (_result, _error, { id }) => [{ type: 'SyncStatus', id }],
    }),

    getValue: query(build, DataLayer, 'getValue', {
      providesTags: (_result, _error, { id, key }) => [{ type: 'Values', id: id + key }],
    }),

    insert: mutation(build, DataLayer, 'insert', {
      invalidatesTags: (_result, _error, { id }) => [
        { type: 'Offers', id: 'LIST' },
        { type: 'Offers', id },
      ],
    }),

    makeOffer: mutation(build, DataLayer, 'makeOffer', {
      invalidatesTags: [{ type: 'Offers', id: 'LIST' }],
    }),

    removeSubscriptions: mutation(build, DataLayer, 'removeSubscriptions', {
      invalidatesTags: (_result, _error, { id }) => [
        { type: 'Subscriptions', id: 'LIST' },
        { type: 'Subscriptions', id },
      ],
    }),

    subscribe: mutation(build, DataLayer, 'subscribe', {
      invalidatesTags: (_result, _error, { id }) => [
        { type: 'Subscriptions', id: 'LIST' },
        { type: 'Subscriptions', id },
      ],
    }),

    subscriptions: query(build, DataLayer, 'subscriptions', {
      providesTags: [{ type: 'Subscriptions' }],
    }),

    takeOffer: mutation(build, DataLayer, 'takeOffer', {
      invalidatesTags: [{ type: 'Offers', id: 'LIST' }],
    }),

    unsubscribe: mutation(build, DataLayer, 'unsubscribe', {
      invalidatesTags: (_result, _error, { id }) => [
        { type: 'Subscriptions', id: 'LIST' },
        { type: 'Subscriptions', id },
      ],
    }),

    verifyOffer: query(build, DataLayer, 'verifyOffer', {
      providesTags: [{ type: 'Offers' }],
    }),
  }),
});

export const {
  useAddMirrorMutation,
  useAddMissingFilesMutation,
  useBatchUpdateMutation,
  useCancelOfferMutation,
  useCheckPluginsQuery,
  useClearPendingRootsMutation,
  useCreateDataStoreMutation,
  useDeleteKeyMutation,
  useDeleteMirrorMutation,
  useGetAncestorsQuery,
  useGetKeysQuery,
  useGetKeysValuesQuery,
  useGetKvDiffQuery,
  useGetLocalRootQuery,
  useGetMirrorsQuery,
  useGetOwnedStoresQuery,
  useGetRootQuery,
  useGetRootsQuery,
  useGetRootHistoryQuery,
  useGetSyncStatusQuery,
  useGetValueQuery,
  useInsertMutation,
  useMakeOfferMutation,
  useRemoveSubscriptionsMutation,
  useSubscribeMutation,
  useSubscriptionsQuery,
  useTakeOfferMutation,
  useUnsubscribeMutation,
  useVerifyOfferQuery,
} = dataLayerApi;

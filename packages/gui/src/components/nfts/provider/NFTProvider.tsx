import debug from 'debug';
import React, { useMemo, useCallback, type ReactNode } from 'react';

import useCache from '../../../hooks/useCache';
import NFTFilterProvider from '../NFTFilterProvider';

import NFTProviderContext from './NFTProviderContext';
import useMetadataData from './hooks/useMetadataData';
import useNFTData from './hooks/useNFTData';
import useNFTDataNachos from './hooks/useNFTDataNachos';
import useNFTDataOnDemand from './hooks/useNFTDataOnDemand';
import useNFTPreviewStatuses from './hooks/useNFTPreviewStatuses';

const log = debug('nft:NFTProvider');

export type NFTProviderProps = {
  children?: ReactNode;
  concurrency?: number;
  pageSize?: number;
};

export default function NFTProvider(props: NFTProviderProps) {
  const { children, concurrency = 10, pageSize = 24 } = props;

  const { invalidate } = useCache();

  const {
    nfts,
    isLoading,
    error,
    getNFT: getNFTData,
    refetch,
    count,
    loaded,
    progress,
    subscribeToNFTChanges: subscribeToNFTDataChanges,
    subscribeToChanges: subscribeToDataChanges,
  } = useNFTData({
    concurrency,
    pageSize,
  });

  const {
    nachos,
    getNFT: getNFTNacho,
    subscribeToNFTChanges: subscribeToNFTNachosChanges,
    subscribeToChanges: subscribeToNachosChanges,
    invalidate: invalidateNachos,
  } = useNFTDataNachos();

  const {
    fetchNFT: fetchNFTOnDemand,
    getNFT: getNFTOnDemand,
    subscribeToNFTChanges: subscribeToNFTOnDemandChanges,
    invalidate: invalidateNFTOnDemand,
  } = useNFTDataOnDemand({
    concurrency,
  });

  // immutable function
  const getNFT = useCallback(
    (id: string) => {
      const nftDataState = getNFTData(id);
      if (nftDataState.nft) {
        return nftDataState;
      }

      const nachoNFTState = getNFTNacho(id);
      if (nachoNFTState.nft) {
        return nachoNFTState;
      }

      // must be last because it will try to load data from backend
      return getNFTOnDemand(id);
    },
    [getNFTOnDemand /* immutable */, getNFTNacho /* immutable */, getNFTData /* immutable */],
  );

  // immutable function
  const fetchNFT = useCallback(
    async (id: string) => {
      const nftDataState = getNFTData(id);
      if (nftDataState.nft) {
        return nftDataState.nft;
      }

      const nachoNFTState = getNFTNacho(id);
      if (nachoNFTState.nft) {
        return nachoNFTState.nft;
      }

      // must be last because it will try to load data from backend
      return fetchNFTOnDemand(id);
    },
    [fetchNFTOnDemand /* immutable */, getNFTNacho /* immutable */, getNFTData /* immutable */],
  );

  const {
    getMetadata,
    fetchMetadata,
    subscribeToMetadataChanges,
    subscribeToChanges: subscribeToMetadataDataChanges,
    invalidate: invalidateMetadata,
  } = useMetadataData({
    fetchNFT,
  });

  const subscribeToNFTChanges = useCallback(
    (id: string, callback: (nft: any) => void) => {
      const unsubscribeData = subscribeToNFTDataChanges(id, callback);
      const unsubscribeNachos = subscribeToNFTNachosChanges(id, callback);
      const unsubscribeDemand = subscribeToNFTOnDemandChanges(id, callback);

      return () => {
        unsubscribeData();
        unsubscribeNachos();
        unsubscribeDemand();
      };
    },
    [subscribeToNFTOnDemandChanges, subscribeToNFTNachosChanges, subscribeToNFTDataChanges],
  );

  const subscribeToChanges = useCallback(
    (callback: () => void) => {
      const unsubscribeData = subscribeToDataChanges(callback);
      const unsubscribeNachos = subscribeToNachosChanges(callback);

      return () => {
        unsubscribeData();
        unsubscribeNachos();
      };
    },
    [subscribeToDataChanges, subscribeToNachosChanges],
  );

  const { getPreviewStatus, setPreviewStatus, invalidatePreviewStatus, subscribeToPreviewStatusChanges } =
    useNFTPreviewStatuses({
      nfts,
      nachos,
      getMetadata,
      subscribeToChanges,
      subscribeToMetadataChanges: subscribeToMetadataDataChanges,
    });

  const invalidateNFT = useCallback(
    async (id: string | undefined) => {
      log(`Invalidating ${id}`);
      if (!id) {
        return;
      }

      const nft = await fetchNFT(id);
      if (!nft) {
        return;
      }

      // invalidate nft files
      const promises: Promise<unknown>[] = [];
      const { dataUris, metadataUris } = nft;
      const invalidatedUris: string[] = [...dataUris];

      // Drop the preview verdict right away, together with what is known about
      // the data files: the filter must not keep classifying an NFT that is
      // being refreshed from what its files used to be while the metadata
      // round-trip below is still running. Repeated once the files are gone —
      // the preview uris are only known after that round-trip, and a lookup
      // that overlaps the deletions could memoize outcomes they remove.
      invalidatePreviewStatus(id, invalidatedUris);

      dataUris.forEach((uri) => promises.push(invalidate(uri)));

      // the metadata may have been served by any of its URIs
      metadataUris?.forEach((uri) => promises.push(invalidate(uri)));

      // invalidate metadata files
      try {
        const metadata = await fetchMetadata(id);
        if (metadata) {
          // invalidate all previews
          const { preview_video_uris: previewVideoUris, preview_image_uris: previewImageUris } = metadata;

          if (previewVideoUris) {
            previewVideoUris.forEach((uri: string) => promises.push(invalidate(uri)));
            invalidatedUris.push(...previewVideoUris);
          }

          if (previewImageUris) {
            previewImageUris.forEach((uri: string) => promises.push(invalidate(uri)));
            invalidatedUris.push(...previewImageUris);
          }
        }
      } catch (e) {
        log(`Error loading metadata for ${id}: ${(e as Error).message}`);
      }

      // Wait for every deletion, even when one of them fails (a uri the cache
      // cannot key), so the reset below cannot race a deletion still in
      // flight; the first failure still propagates afterwards as before.
      const results = await Promise.allSettled(promises);
      invalidatePreviewStatus(id, invalidatedUris);

      const failure = results.find((result): result is PromiseRejectedResult => result.status === 'rejected');
      if (failure) {
        throw failure.reason;
      }

      await Promise.all([invalidateNachos(), invalidateMetadata(id), invalidateNFTOnDemand(id)]);
    },
    [
      fetchNFT,
      fetchMetadata,
      invalidate,
      invalidateNachos,
      invalidateMetadata,
      invalidateNFTOnDemand,
      invalidatePreviewStatus,
    ],
  );

  const context = useMemo(
    () => ({
      // immutable state
      nfts,
      nachos,

      getNFT,
      subscribeToNFTChanges,

      getMetadata,
      subscribeToMetadataChanges,

      getPreviewStatus,
      setPreviewStatus,
      subscribeToPreviewStatusChanges,

      subscribeToChanges,

      invalidate: invalidateNFT,
      refetch,

      // mutable state
      isLoading,
      error,

      count,
      loaded,
      progress,
    }),
    [
      nfts,
      nachos,
      isLoading,
      error,
      getNFT,
      subscribeToNFTChanges,
      getMetadata,
      subscribeToMetadataChanges,
      getPreviewStatus,
      setPreviewStatus,
      subscribeToPreviewStatusChanges,
      count,
      loaded,
      progress,
      subscribeToChanges,
      invalidateNFT,
      refetch,
    ],
  );

  return (
    <NFTProviderContext.Provider value={context}>
      <NFTFilterProvider>{children}</NFTFilterProvider>
    </NFTProviderContext.Provider>
  );
}

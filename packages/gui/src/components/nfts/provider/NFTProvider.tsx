import React, { useMemo, useCallback, type ReactNode } from 'react';

import NFTFilterProvider from '../NFTFilterProvider';
import NFTProviderContext from './NFTProviderContext';
import useMetadataData from './hooks/useMetadataData';
import useNFTData from './hooks/useNFTData';
import useNFTDataNachos from './hooks/useNFTDataNachos';
import useNFTDataOnDemand from './hooks/useNFTDataOnDemand';

export type NFTProviderProps = {
  children?: ReactNode;
  concurrency?: number;
  pageSize?: number;
};

export default function NFTProvider(props: NFTProviderProps) {
  const { children, concurrency = 10, pageSize = 24 } = props;

  const { nfts, isLoading, error, getNFTData, onNFTDataChange, count, loaded, progress, onDataChange } = useNFTData({
    concurrency,
    pageSize,
  });
  const { nachos, getNFTNacho, onNFTNachosChange, onNachosChange } = useNFTDataNachos();
  const { fetchNFTOnDemand, getNFTOnDemand, onNFTOnDemandChange } = useNFTDataOnDemand({
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
    [getNFTOnDemand /* immutable */, getNFTNacho /* immutable */, getNFTData /* immutable */]
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
    [fetchNFTOnDemand /* immutable */, getNFTNacho /* immutable */, getNFTData /* immutable */]
  );

  const onNFTChange = useCallback(
    (id: string, callback: (nft: any) => void) => {
      const unsubscribeData = onNFTDataChange(id, callback);
      const unsubscribeNachos = onNFTNachosChange(id, callback);
      const unsubscribeDemand = onNFTOnDemandChange(id, callback);

      return () => {
        unsubscribeData();
        unsubscribeNachos();
        unsubscribeDemand();
      };
    },
    [onNFTOnDemandChange, onNFTNachosChange, onNFTDataChange]
  );

  const onChange = useCallback(
    (callback: () => void) => {
      const unsubscribeData = onDataChange(callback);
      const unsubscribeNachos = onNachosChange(callback);

      return () => {
        unsubscribeData();
        unsubscribeNachos();
      };
    },
    [onDataChange, onNachosChange]
  );

  const { getMetadata, onMetadataChange } = useMetadataData({
    fetchNFT,
  });

  /*
  const invalidateNFT = useCallback(
    async (id: string | undefined, abortSignal: AbortSignal) => {
      log(`Invalidating ${id}`);
      if (!id) {
        return;
      }

      const nftId = getNFTId(id);
      const nft = await fetchById(nftId, abortSignal);
      if (!nft || abortSignal.aborted) {
        return;
      }

      const promises = [];

      const { dataUris, metadataUris } = nft;

      dataUris.forEach((uri) => promises.push(invalidate(uri)));

      const firstMetadataUri = metadataUris && metadataUris[0];
      if (firstMetadataUri) {
        promises.push(invalidate(firstMetadataUri));
      }

      try {
        const metadata = await fetchMetadata(nftId, abortSignal);
        if (abortSignal.aborted) {
          return;
        }

        if (metadata) {
          // invalidate all previews
          const { preview_video_uris: previewVideoUris, preview_image_uris: previewImageUris } = metadata;

          if (previewVideoUris) {
            previewVideoUris.forEach((uri: string) => promises.push(invalidate(uri)));
          }

          if (previewImageUris) {
            previewImageUris.forEach((uri: string) => promises.push(invalidate(uri)));
          }
        }
      } catch (e) {
        log(`Error invalidating metadata for ${nftId}: ${(e as Error).message}`);
      } finally {
        await Promise.all(promises);
      }

      if (abortSignal.aborted) {
        return;
      }

      nftsOnDemand.delete(nftId);
      metadatasOnDemand.delete(nftId);
    },
    [fetchById, fetchMetadata, invalidate, nftsOnDemand, metadatasOnDemand]
  );
  */

  const context = useMemo(
    () => ({
      // immutable state
      nfts,
      nachos,

      getNFT,
      onNFTChange,

      getMetadata,
      onMetadataChange,

      onChange,

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
      onNFTChange,
      getMetadata,
      onMetadataChange,
      count,
      loaded,
      progress,
      onChange,
    ]
  );

  return (
    <NFTProviderContext.Provider value={context}>
      <NFTFilterProvider>{children}</NFTFilterProvider>
    </NFTProviderContext.Provider>
  );
}

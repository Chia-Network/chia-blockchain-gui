import debug from 'debug';
import React, { useMemo, useCallback, useEffect, useRef, useState, type ReactNode } from 'react';

import useCache from '../../../hooks/useCache';
import useIpfsGatewayHealth from '../../../hooks/useIpfsGatewayHealth';
import { MAX_METADATA_URI_ATTEMPTS } from '../../../util/fetchMetadataFromUris';
import { MAX_URIS_PER_CANDIDATE } from '../../../util/getNFTPreviewStatusFromCache';
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

  // The gateway came back after a run of requests that could not reach it
  // (see IpfsGatewayHealth). The failures recorded meanwhile — persisted by
  // the cache, remembered by the metadata store and by the tiles' verifiers —
  // were verdicts on an unreachable host, not on the content; CacheManager
  // retries them on the next access, and everything here that remembers a
  // failure re-runs on the count below, the way it does on a gateway change.
  const ipfsGatewayHealth = useIpfsGatewayHealth();
  const ipfsGatewayRecoveredAt = ipfsGatewayHealth?.reachable ? ipfsGatewayHealth.recoveredAt : undefined;
  const [ipfsGatewayRecoveries, setIpfsGatewayRecoveries] = useState(0);
  const wasIpfsGatewayUnreachableRef = useRef(false);
  useEffect(() => {
    const isUnreachable = ipfsGatewayHealth?.reachable === false;
    if (wasIpfsGatewayUnreachableRef.current && !isUnreachable) {
      setIpfsGatewayRecoveries((count) => count + 1);
    }
    wasIpfsGatewayUnreachableRef.current = isUnreachable;
  }, [ipfsGatewayHealth]);

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
    ipfsGatewayRecoveries,
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
      ipfsGatewayRecoveries,
      ipfsGatewayRecoveredAt,
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
      // The chain's lists are as long as the minter made them; only the first
      // MAX_URIS_PER_CANDIDATE data uris and MAX_METADATA_URI_ATTEMPTS
      // metadata uris are ever fetched, so only those can be cached.
      const consultedDataUris = dataUris.slice(0, MAX_URIS_PER_CANDIDATE);
      const consultedMetadataUris = metadataUris?.slice(0, MAX_METADATA_URI_ATTEMPTS);
      const invalidatedUris: string[] = [...consultedDataUris];

      // Drop the preview verdict right away, together with what is known about
      // the data files: the filter must not keep classifying an NFT that is
      // being refreshed from what its files used to be while the metadata
      // round-trip below is still running. Repeated once the files are gone —
      // the preview uris are only known after that round-trip, and a lookup
      // that overlaps the deletions could memoize outcomes they remove.
      invalidatePreviewStatus(id, invalidatedUris);

      consultedDataUris.forEach((uri) => promises.push(invalidate(uri)));

      // the metadata may have been served by any of its URIs
      consultedMetadataUris?.forEach((uri) => promises.push(invalidate(uri)));

      // invalidate metadata files
      try {
        const metadata = await fetchMetadata(id);
        if (metadata) {
          // invalidate all previews
          const { preview_video_uris: previewVideoUris, preview_image_uris: previewImageUris } = metadata;

          // These lists come from the NFT's metadata and can be as long as
          // its author likes. Only the first MAX_URIS_PER_CANDIDATE of each
          // were ever fetched (the verifier and the gallery sweep stop
          // there), so only those can be cached and only those are
          // invalidated: one cache round-trip per uri, bounded by the same
          // cap, instead of one per entry in an unbounded list.
          [previewVideoUris, previewImageUris].forEach((uris) => {
            uris?.slice(0, MAX_URIS_PER_CANDIDATE).forEach((uri: string) => {
              promises.push(invalidate(uri));
              invalidatedUris.push(uri);
            });
          });
        }
      } catch (e) {
        log(`Error loading metadata for ${id}: ${(e as Error).message}`);
      }

      // Wait for every deletion, even when one of them fails (a uri the cache
      // cannot key), so the reset below cannot race a deletion still in
      // flight. The in-memory records are dropped regardless: every metadata
      // uri is invalidated now, and an NFT whose minter recorded one unusable
      // uri among several must still get its fresh fetch — the first failure
      // propagates afterwards, as before.
      const results = await Promise.allSettled(promises);
      invalidatePreviewStatus(id, invalidatedUris);
      await Promise.all([invalidateNachos(), invalidateMetadata(id), invalidateNFTOnDemand(id)]);

      const failure = results.find((result): result is PromiseRejectedResult => result.status === 'rejected');
      if (failure) {
        throw failure.reason;
      }
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
      ipfsGatewayRecoveries,

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
      ipfsGatewayRecoveries,
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

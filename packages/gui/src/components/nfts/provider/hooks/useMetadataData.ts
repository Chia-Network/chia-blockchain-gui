import { EventEmitter } from 'events';

import { type NFTInfo } from '@chia-network/api';
import debug from 'debug';
import { useState, useCallback, useEffect, useMemo, useRef } from 'react';

import type Metadata from '../../../../@types/Metadata';
import type MetadataOnDemand from '../../../../@types/MetadataOnDemand';
import type MetadataState from '../../../../@types/MetadataState';
import useFetchAndProcessMetadata from '../../../../hooks/useFetchAndProcessMetadata';
import useIpfsGateway from '../../../../hooks/useIpfsGateway';
import { useIpfsGatewayBase } from '../../../../hooks/useIpfsGatewayUrl';
import fetchMetadataFromUris from '../../../../util/fetchMetadataFromUris';
import getNFTId from '../../../../util/getNFTId';

const log = debug('chia-gui:NFTProvider:useMetadataData');

function getChangedEventName(nftId: string) {
  return `metadataChanged:${nftId}`;
}

type UseMetadataDataProps = {
  fetchNFT: (id: string) => Promise<NFTInfo>; // should be immutable
};

// warning: only used by NFTProvider
export default function useMetadataData(props: UseMetadataDataProps) {
  const { fetchNFT } = props;

  const [metadatasOnDemand] = useState(() => new Map<string, MetadataOnDemand>());
  const fetchAndProcessMetadata = useFetchAndProcessMetadata();

  const events = useMemo(() => {
    const eventEmitter = new EventEmitter();
    eventEmitter.setMaxListeners(Infinity);
    return eventEmitter;
  }, []);

  // immutable function
  const setMetadataOnDemand = useCallback(
    (nftId: string, metadataOnDemand: MetadataOnDemand) => {
      log(`Setting metadata on demand for ${nftId}`);

      metadatasOnDemand.set(nftId, metadataOnDemand);

      events.emit(getChangedEventName(nftId), {
        metadata: metadataOnDemand.metadata,
        error: metadataOnDemand.error,
        isLoading: !!metadataOnDemand.promise,
      });

      events.emit('changed');
    },
    [events /* immutable */, metadatasOnDemand /* immutable */],
  );

  // immutable function
  const fetchMetadata = useCallback(
    async (id: string): Promise<Metadata> => {
      const nftId = getNFTId(id);

      const metadataOnDemand = metadatasOnDemand.get(nftId);
      if (metadataOnDemand) {
        if (metadataOnDemand.error) {
          throw metadataOnDemand.error;
        }

        if (metadataOnDemand.metadata) {
          return metadataOnDemand.metadata;
        }

        if (metadataOnDemand.promise) {
          return metadataOnDemand.promise;
        }
      }

      async function limitedFetchMetadata() {
        try {
          log(`Fetching metadata for ${id} from API`);
          const nft = await fetchNFT(nftId);
          const { metadataUris, metadataHash } = nft;

          // Every recorded copy is a fallback for the others: a gateway that
          // is down or challenging the request must not hide metadata that
          // another URI (typically the ipfs:// one) still serves.
          const metadata = await fetchMetadataFromUris(metadataUris, metadataHash, fetchAndProcessMetadata);
          setMetadataOnDemand(nftId, { metadata });
          return metadata;
        } catch (e) {
          setMetadataOnDemand(nftId, { error: e as Error });
          throw e;
        }
      }

      const promise = limitedFetchMetadata();

      setMetadataOnDemand(nftId, { promise });

      return promise;
    },
    [
      fetchAndProcessMetadata /* immutable */,
      fetchNFT /* immutable */,
      metadatasOnDemand /* immutable */,
      setMetadataOnDemand /* immutable */,
    ],
  );

  // immutable function
  const getMetadata = useCallback(
    (id: string | undefined): MetadataState => {
      if (!id) {
        return {
          metadata: undefined,
          isLoading: false,
          error: new Error('Invalid NFT id'),
        };
      }

      const nftId = getNFTId(id);

      const metadataOnDemand = metadatasOnDemand.get(nftId);
      if (metadataOnDemand) {
        return {
          metadata: metadataOnDemand.metadata,
          isLoading: !!metadataOnDemand.promise,
          error: metadataOnDemand.error,
        };
      }

      fetchMetadata(nftId).catch((e) => {
        log(`Error fetching Metadata for nftId: ${nftId}`, e);
      });

      return {
        metadata: undefined,
        isLoading: true,
        error: undefined,
      };
    },
    [fetchMetadata /* immutable */, metadatasOnDemand /* immutable */],
  );

  // immutable function
  const invalidate = useCallback(
    async (id: string) => {
      const nftId = getNFTId(id);

      const metadataOnDemand = metadatasOnDemand.get(nftId);
      if (metadataOnDemand) {
        // wait for the promise to resolve and ignore error
        if (metadataOnDemand.promise) {
          await metadataOnDemand.promise.catch(() => {});
        }

        metadatasOnDemand.delete(nftId);

        // reload metadata
        getMetadata(id);
      }
    },
    [getMetadata /* immutable */, metadatasOnDemand /* immutable */],
  );

  const [ipfsGateway] = useIpfsGateway();
  const ipfsGatewayBase = useIpfsGatewayBase();
  // one key for both gateway preferences: the option and the gateway itself
  const ipfsGatewayKey = ipfsGateway ? ipfsGatewayBase : false;
  const lastIpfsGatewayRef = useRef(ipfsGatewayKey);

  useEffect(() => {
    if (lastIpfsGatewayRef.current === ipfsGatewayKey) {
      return;
    }
    lastIpfsGatewayRef.current = ipfsGatewayKey;

    // Flipping the gateway option or switching gateways changes which URLs
    // the main process will fetch, so cached failures are stale — without this, a failed ipfs
    // metadata fetch stayed cached here and its NFT kept looking broken
    // after enabling the option, until a full app reload. Only failures are
    // retried: successfully fetched metadata is hash-verified content and
    // unaffected by how it was fetched. A fetch that is still in flight
    // started under the old preference and may fail because of it — after
    // this effect has run, nothing else would retry that failure — so it is
    // retried on rejection; a result that arrives successfully is kept.
    //
    // Iterate a snapshot: retrying an errored entry re-inserts its key with a
    // fresh in-flight promise synchronously, and Map.forEach revisits keys
    // re-added during the pass — the live map would attach a rejection retry
    // to the very fetch this effect just started, double-fetching a failure.
    Array.from(metadatasOnDemand.entries()).forEach(([nftId, metadataOnDemand]) => {
      const retry = () =>
        invalidate(nftId).catch((e) => {
          log(`Error retrying metadata for nftId: ${nftId}`, e);
        });

      if (metadataOnDemand.error) {
        retry();
      } else if (metadataOnDemand.promise) {
        metadataOnDemand.promise.catch((e) => {
          // Retry only the failure this handler saw. The fetch's own catch
          // stores its rejection as the entry's error, so anything else here
          // means the entry has moved on — a stacked handler from another
          // toggle already retried it, or a newer fetch succeeded — and a
          // retry would discard that state and fetch again for nothing.
          if (metadatasOnDemand.get(nftId)?.error === e) {
            retry();
          }
        });
      }
    });
  }, [ipfsGatewayKey, invalidate /* immutable */, metadatasOnDemand /* immutable */]);

  // immutable function
  const subscribeToMetadataChanges = useCallback(
    (id: string | undefined, callback: (nftState: MetadataState) => void) => {
      if (!id) {
        return () => {};
      }

      const nftId = getNFTId(id);
      const eventName = getChangedEventName(nftId);
      events.on(eventName, callback);

      return () => {
        events.off(eventName, callback);
      };
    },
    [events /* immutable */],
  );

  // immutable function
  const subscribeToChanges = useCallback(
    (callback: () => void) => {
      events.on('changed', callback);

      return () => {
        events.off('changed', callback);
      };
    },
    [events /* immutable */],
  );

  return {
    getMetadata,
    fetchMetadata,
    subscribeToMetadataChanges,
    subscribeToChanges,
    invalidate,
  } as const;
}

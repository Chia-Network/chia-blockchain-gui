import { EventEmitter } from 'events';

import { type NFTInfo } from '@chia-network/api';
import debug from 'debug';
import { useState, useCallback, useMemo } from 'react';

import type Metadata from '../../../../@types/Metadata';
import type MetadataOnDemand from '../../../../@types/MetadataOnDemand';
import type MetadataState from '../../../../@types/MetadataState';
import useFetchAndProcessMetadata from '../../../../hooks/useFetchAndProcessMetadata';
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
    },
    [events /* immutable */, metadatasOnDemand /* immutable */]
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
          const { metadataUris = [], metadataHash } = nft;

          const [firstUri] = metadataUris;
          if (!firstUri) {
            throw new Error('No metadata URI');
          }

          const metadata = await fetchAndProcessMetadata(firstUri, metadataHash);
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
    ]
  );

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
    [fetchMetadata /* immutable */, metadatasOnDemand /* immutable */]
  );

  // immutable function
  const onChanges = useCallback(
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
    [events /* immutable */]
  );

  return {
    getMetadata,
    fetchMetadata,
    onMetadataChange: onChanges,
  } as const;
}

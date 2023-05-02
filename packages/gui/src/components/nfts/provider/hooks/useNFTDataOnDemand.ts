import { EventEmitter } from 'events';

import { type NFTInfo } from '@chia-network/api';
import { useLazyGetNFTInfoQuery } from '@chia-network/api-react';
import debug from 'debug';
import { useState, useCallback, useMemo } from 'react';

import type NFTOnDemand from '../../../../@types/NFTOnDemand';
import type NFTState from '../../../../@types/NFTState';
import getNFTId from '../../../../util/getNFTId';
import limit from '../../../../util/limit';
import { launcherIdFromNFTId } from '../../../../util/nfts';

const log = debug('chia-gui:NFTProvider:useMetadataData');

export function getChangedEventName(nftId: string) {
  return `nftChanged:${nftId}`;
}

type UseNFTDataOnDemandProps = {
  concurrency?: number;
};

// warning: only used by NFTProvider
export default function useNFTDataOnDemand(props: UseNFTDataOnDemandProps) {
  const { concurrency = 10 } = props;
  const [nftsOnDemand /* immutable */] = useState(() => new Map<string, NFTOnDemand>());
  const [getNFTInfo /* immutable */] = useLazyGetNFTInfoQuery();
  const add /* immutable until concurrency change */ = useMemo(() => limit(concurrency), [concurrency]);

  const events = useMemo(() => {
    const eventEmitter = new EventEmitter();
    eventEmitter.setMaxListeners(Infinity);
    return eventEmitter;
  }, []);

  // immutable function
  const setNFTOnDemand = useCallback(
    (nftId: string, nftOnDemand: NFTOnDemand) => {
      log(`Setting NFT on demand for ${nftId}`);

      nftsOnDemand.set(nftId, nftOnDemand);

      events.emit(getChangedEventName(nftId), {
        nft: nftOnDemand.nft,
        error: nftOnDemand.error,
        isLoading: !!nftOnDemand.promise,
      });

      events.emit('changed');
    },
    [events /* immutable */, nftsOnDemand /* immutable */]
  );

  // immutable function
  const fetchNFTOnDemand = useCallback(
    async (id: string): Promise<NFTInfo> => {
      const nftId = getNFTId(id);

      const nftOnDemand = nftsOnDemand.get(nftId);
      if (nftOnDemand) {
        if (nftOnDemand.error) {
          throw nftOnDemand.error;
        }

        if (nftOnDemand.nft) {
          return nftOnDemand.nft;
        }

        if (nftOnDemand.promise) {
          return nftOnDemand.promise;
        }
      }

      async function limitedFetchNFTById() {
        try {
          log(`Fetching NFT by ID ${id} from API`);
          const coinId = launcherIdFromNFTId(nftId);
          if (!coinId) {
            throw new Error('Invalid NFT ID');
          }

          const nft = await getNFTInfo({
            coinId,
          }).unwrap();

          setNFTOnDemand(nftId, {
            nft,
          });

          return nft;
        } catch (e) {
          setNFTOnDemand(nftId, {
            error: e as Error,
          });

          throw e;
        }
      }

      const promise = add<NFTInfo>(() => limitedFetchNFTById());

      setNFTOnDemand(nftId, {
        promise,
      });

      return promise;
    },
    [getNFTInfo /* immutable */, add /* immutable */, nftsOnDemand /* immutable */, setNFTOnDemand /* immutable */]
  );

  const getNFTOnDemand = useCallback(
    (id: string | undefined): NFTState => {
      if (!id) {
        return {
          nft: undefined,
          isLoading: false,
          error: new Error('Invalid NFT id'),
        };
      }

      const nftId = getNFTId(id);

      const nftOnDemand = nftsOnDemand.get(nftId);
      if (nftOnDemand) {
        return {
          nft: nftOnDemand.nft,
          isLoading: !!nftOnDemand.promise,
          error: nftOnDemand.error,
        };
      }

      fetchNFTOnDemand(nftId).catch((e) => {
        log(`Error fetching nft for nftId: ${nftId}`, e);
      });

      return {
        nft: undefined,
        isLoading: true,
        error: undefined,
      };
    },
    [fetchNFTOnDemand /* immutable */, nftsOnDemand /* immutable */]
  );

  // immutable function
  const onChanges = useCallback(
    (id: string | undefined, callback: (nftState: NFTState) => void) => {
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
    getNFTOnDemand, // immutable
    fetchNFTOnDemand, // immutable
    onNFTOnDemandChange: onChanges, // immutable
  } as const;
}

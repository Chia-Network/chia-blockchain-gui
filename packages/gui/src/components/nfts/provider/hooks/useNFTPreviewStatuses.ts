import { EventEmitter } from 'events';

import { type NFTInfo } from '@chia-network/api';
import debug from 'debug';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import type NFTPreviewStatus from '../../../../@types/NFTPreviewStatus';
import useCache from '../../../../hooks/useCache';
import getNFTPreviewStatusFromCache from '../../../../util/getNFTPreviewStatusFromCache';

const log = debug('chia-gui:NFTProvider:useNFTPreviewStatuses');

// Cache infos are looked up in batches so a large collection does not hand
// the main process thousands of file reads in one IPC call.
const LOOKUP_BATCH_SIZE = 200;

type UseNFTPreviewStatusesProps = {
  nfts: Map<string, NFTInfo>; // should be immutable
  nachos: Map<string, NFTInfo>; // should be immutable
  subscribeToChanges: (callback: () => void) => () => void; // should be immutable
};

// warning: only used by NFTProvider
//
// Tracks, per NFT, whether its gallery tile can show a preview. Tiles report
// what they actually render once they settle; NFTs that are not on screen
// (the gallery is virtualized, so most never mount) are classified from the
// outcomes the cache persisted during earlier visits and sessions, without
// downloading anything. A live report always wins over a cache lookup.
export default function useNFTPreviewStatuses(props: UseNFTPreviewStatusesProps) {
  const { nfts, nachos, subscribeToChanges } = props;

  const { getCacheInfos } = useCache();

  const [statuses /* immutable */] = useState(() => new Map<string, NFTPreviewStatus>());
  // NFTs whose cached outcomes were already looked up. An NFT that never
  // reaches the screen never changes its cache state, so one lookup per
  // session is enough; a tile that does mount reports live instead.
  const [lookedUp /* immutable */] = useState(() => new Set<string>());

  const events = useMemo(() => {
    const eventEmitter = new EventEmitter();
    eventEmitter.setMaxListeners(Infinity);
    return eventEmitter;
  }, []);

  // immutable function
  const getPreviewStatus = useCallback(
    (nftId: string | undefined): NFTPreviewStatus | undefined => (nftId ? statuses.get(nftId) : undefined),
    [statuses /* immutable */],
  );

  // immutable function
  const setPreviewStatus = useCallback(
    (nftId: string, status: NFTPreviewStatus) => {
      lookedUp.add(nftId);

      if (statuses.get(nftId) === status) {
        return;
      }

      statuses.set(nftId, status);
      events.emit('changed');
    },
    [events /* immutable */, statuses /* immutable */, lookedUp /* immutable */],
  );

  // immutable function
  const invalidatePreviewStatus = useCallback(
    (nftId: string) => {
      lookedUp.delete(nftId);

      if (statuses.delete(nftId)) {
        events.emit('changed');
      }
    },
    [events /* immutable */, statuses /* immutable */, lookedUp /* immutable */],
  );

  // immutable function
  const subscribeToPreviewStatusChanges = useCallback(
    (callback: () => void) => {
      events.on('changed', callback);

      return () => {
        events.off('changed', callback);
      };
    },
    [events /* immutable */],
  );

  const isLookingUpRef = useRef(false);
  const lookUpAgainRef = useRef(false);

  // Classifies every NFT not yet looked up from the cache's persisted state.
  // Runs serialized: NFT pages arrive in bursts, and a run that finds the
  // flag set simply sweeps once more when it finishes.
  const lookUpFromCache = useCallback(async () => {
    if (isLookingUpRef.current) {
      lookUpAgainRef.current = true;
      return;
    }

    isLookingUpRef.current = true;
    try {
      do {
        lookUpAgainRef.current = false;

        const pending: [string, NFTInfo][] = [];
        const collect = (nft: NFTInfo, nftId: string) => {
          if (!lookedUp.has(nftId)) {
            pending.push([nftId, nft]);
          }
        };

        nfts.forEach(collect);
        nachos.forEach((nft, nftId) => {
          if (!nfts.has(nftId)) {
            collect(nft, nftId);
          }
        });

        for (let start = 0; start < pending.length; start += LOOKUP_BATCH_SIZE) {
          const batch = pending.slice(start, start + LOOKUP_BATCH_SIZE);
          const urls = Array.from(new Set(batch.flatMap(([, nft]) => nft.dataUris ?? [])));

          // eslint-disable-next-line no-await-in-loop -- batches are sequential on purpose, to pace the main process
          const cacheInfos = urls.length ? await getCacheInfos(urls) : [];
          const cacheInfoByUrl = new Map(cacheInfos.map((cacheInfo) => [cacheInfo.url, cacheInfo]));

          let changed = false;
          batch.forEach(([nftId, nft]) => {
            if (lookedUp.has(nftId)) {
              // a tile reported live while the lookup was in flight
              return;
            }

            lookedUp.add(nftId);

            const status = getNFTPreviewStatusFromCache(nft, (url) => cacheInfoByUrl.get(url));
            if (status) {
              statuses.set(nftId, status);
              changed = true;
            }
          });

          if (changed) {
            events.emit('changed');
          }
        }
      } while (lookUpAgainRef.current);
    } catch (e) {
      log(`Error looking up preview statuses from the cache: ${(e as Error).message}`);
    } finally {
      isLookingUpRef.current = false;
    }
  }, [
    nfts /* immutable */,
    nachos /* immutable */,
    getCacheInfos /* immutable */,
    statuses /* immutable */,
    lookedUp /* immutable */,
    events /* immutable */,
  ]);

  useEffect(() => {
    lookUpFromCache();

    return subscribeToChanges(lookUpFromCache);
  }, [lookUpFromCache, subscribeToChanges]);

  return {
    getPreviewStatus, // immutable
    setPreviewStatus, // immutable
    invalidatePreviewStatus, // immutable
    subscribeToPreviewStatusChanges, // immutable
  } as const;
}

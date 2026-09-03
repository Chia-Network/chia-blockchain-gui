import { EventEmitter } from 'events';

import { type NFTInfo } from '@chia-network/api';
import debug from 'debug';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import type CacheInfo from '../../../../@types/CacheInfo';
import type MetadataState from '../../../../@types/MetadataState';
import type NFTPreviewStatus from '../../../../@types/NFTPreviewStatus';
import CacheState from '../../../../constants/CacheState';
import useCache from '../../../../hooks/useCache';
import useIpfsGateway from '../../../../hooks/useIpfsGateway';
import { useIpfsGatewayBase } from '../../../../hooks/useIpfsGatewayUrl';
import getNFTPreviewStatusFromCache, { getNFTPreviewUrls } from '../../../../util/getNFTPreviewStatusFromCache';
import { isIpfsUrl } from '../../../../util/ipfs';

const log = debug('chia-gui:NFTProvider:useNFTPreviewStatuses');

// Cache infos are looked up in batches so a large collection does not hand
// the main process thousands of file reads in one IPC call.
const LOOKUP_BATCH_SIZE = 200;
// NFT pages and metadata results arrive in bursts; one sweep per window.
const LOOKUP_DELAY = 250;

type UseNFTPreviewStatusesProps = {
  nfts: Map<string, NFTInfo>; // should be immutable
  nachos: Map<string, NFTInfo>; // should be immutable
  getMetadata: (id: string) => MetadataState; // should be immutable
  subscribeToChanges: (callback: () => void) => () => void; // should be immutable
  subscribeToMetadataChanges: (callback: () => void) => () => void; // should be immutable
};

// warning: only used by NFTProvider
//
// Tracks, per NFT, whether its gallery tile can show a preview. Tiles report
// the verdict they settle on; NFTs that are not on screen (the gallery is
// virtualized, so most never mount) are classified from the outcomes the
// cache persisted during earlier visits and sessions, without downloading
// anything. A live report always wins over a cache lookup.
export default function useNFTPreviewStatuses(props: UseNFTPreviewStatusesProps) {
  const { nfts, nachos, getMetadata, subscribeToChanges, subscribeToMetadataChanges } = props;

  const { getCacheInfos } = useCache();

  const [statuses /* immutable */] = useState(() => new Map<string, NFTPreviewStatus>());
  // NFTs that need no further lookup: a tile reported them, the cache settled
  // them, or every input is known and only a download (which a tile would
  // then report) can decide them.
  const [settled /* immutable */] = useState(() => new Set<string>());
  // Persisted outcomes already fetched. A url's outcome only changes through
  // a download — which the tile then reports live — or an invalidation,
  // which forgets it here.
  const [cacheInfos /* immutable */] = useState(() => new Map<string, CacheInfo>());

  // The gateway ipfs:// files are fetched through (empty while the option is
  // off). A persisted ipfs failure is a verdict on the gateway it went
  // through; CacheManager re-requests such an entry as soon as the gateway
  // differs, so here it settles nothing under any other gateway.
  const [ipfsGateway] = useIpfsGateway();
  const ipfsGatewayBase = useIpfsGatewayBase();
  const ipfsGatewayKey = ipfsGateway ? ipfsGatewayBase : '';
  const ipfsGatewayKeyRef = useRef(ipfsGatewayKey);
  ipfsGatewayKeyRef.current = ipfsGatewayKey;

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
      settled.add(nftId);

      if (statuses.get(nftId) === status) {
        return;
      }

      statuses.set(nftId, status);
      events.emit('changed');
    },
    [events /* immutable */, statuses /* immutable */, settled /* immutable */],
  );

  // Bumped by every invalidation. A lookup whose IPC round-trip spans one may
  // have read files the invalidation deleted in the meantime, so it discards
  // its result instead of memoizing it.
  const invalidationGeneration = useRef(0);

  // immutable function
  const invalidatePreviewStatus = useCallback(
    (nftId: string, urls: string[]) => {
      invalidationGeneration.current += 1;
      settled.delete(nftId);
      urls.forEach((url) => cacheInfos.delete(url));

      if (statuses.delete(nftId)) {
        events.emit('changed');
      }
    },
    [events /* immutable */, statuses /* immutable */, settled /* immutable */, cacheInfos /* immutable */],
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

  // Classifies every NFT not yet settled from the cache's persisted state.
  // Runs serialized: a sweep that finds the flag set simply sweeps once more
  // when it finishes.
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
          if (!settled.has(nftId)) {
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
          // The metadata store already fetches every NFT's metadata for the
          // gallery's search and statistics; reading it here adds no requests.
          const batch = pending
            .slice(start, start + LOOKUP_BATCH_SIZE)
            .map(([nftId, nft]) => ({ nftId, nft, metadataState: getMetadata(nftId) }));

          const urls = Array.from(
            new Set(batch.flatMap(({ nft, metadataState }) => getNFTPreviewUrls(nft, metadataState))),
          ).filter((url) => !cacheInfos.has(url));

          if (urls.length) {
            const generation = invalidationGeneration.current;
            // eslint-disable-next-line no-await-in-loop -- batches are sequential on purpose, to pace the main process
            const fetchedInfos = await getCacheInfos(urls);

            if (generation !== invalidationGeneration.current) {
              // an invalidation ran while this lookup was in flight — the
              // outcomes may describe files that are gone now, and the NFTs
              // it reset are unsettled again, so start the sweep over
              lookUpAgainRef.current = true;
              break;
            }

            fetchedInfos.forEach((cacheInfo) => cacheInfos.set(cacheInfo.url, cacheInfo));
          }

          const currentGateway = ipfsGatewayKeyRef.current;
          const getCacheInfo = (url: string): CacheInfo | undefined => {
            const cacheInfo = cacheInfos.get(url);
            if (
              cacheInfo?.state === CacheState.ERROR &&
              currentGateway &&
              isIpfsUrl(url) &&
              cacheInfo.gateway !== undefined &&
              cacheInfo.gateway !== currentGateway
            ) {
              // recorded under another gateway — the next access re-requests it
              return { url: cacheInfo.url, timestamp: cacheInfo.timestamp, state: CacheState.NOT_CACHED };
            }

            return cacheInfo;
          };

          let changed = false;
          batch.forEach(({ nftId, nft, metadataState }) => {
            if (settled.has(nftId)) {
              // a tile reported live while the lookup was in flight
              return;
            }

            const status = getNFTPreviewStatusFromCache(nft, metadataState, getCacheInfo);
            if (status) {
              statuses.set(nftId, status);
              settled.add(nftId);
              changed = true;
            } else if (!metadataState.isLoading) {
              // every input is known and the cache cannot decide — only a
              // download can, and the tile that performs it reports it
              settled.add(nftId);
            }
            // otherwise the metadata is still loading: swept again once it settles
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
    getMetadata /* immutable */,
    getCacheInfos /* immutable */,
    statuses /* immutable */,
    settled /* immutable */,
    cacheInfos /* immutable */,
    events /* immutable */,
  ]);

  const lookUpTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const scheduleLookUp = useCallback(() => {
    if (lookUpTimeoutRef.current) {
      return;
    }

    lookUpTimeoutRef.current = setTimeout(() => {
      lookUpTimeoutRef.current = undefined;
      lookUpFromCache();
    }, LOOKUP_DELAY);
  }, [lookUpFromCache]);

  // A gateway change (or flipping the option) makes every verdict that rests
  // on an ipfs:// file stale, however it was reached: a tile that reported
  // and has since unmounted will not report again, an NFT left undecided
  // was left so under the old gateway, and an NFT the gallery filter keeps
  // unmounted because it was classified as unavailable would never be looked
  // at again. Forget all of them and the ipfs outcomes behind them, and
  // sweep again: mounted tiles re-verify on their own and report, and for
  // the rest an outcome recorded under the old gateway settles nothing, so
  // the NFT shows up for its tile to re-request the file through the new
  // gateway — or, with the option now off, is classified from what the
  // cache holds.
  const lastIpfsGatewayKeyRef = useRef(ipfsGatewayKey);
  useEffect(() => {
    if (lastIpfsGatewayKeyRef.current === ipfsGatewayKey) {
      return;
    }
    lastIpfsGatewayKeyRef.current = ipfsGatewayKey;

    let changed = false;
    const reconsider = (nft: NFTInfo, nftId: string) => {
      const ipfsUrls = getNFTPreviewUrls(nft, getMetadata(nftId)).filter(isIpfsUrl);
      if (!ipfsUrls.length) {
        return;
      }

      invalidationGeneration.current += 1;
      settled.delete(nftId);
      ipfsUrls.forEach((url) => cacheInfos.delete(url));
      if (statuses.delete(nftId)) {
        changed = true;
      }
    };

    nfts.forEach(reconsider);
    nachos.forEach((nft, nftId) => {
      if (!nfts.has(nftId)) {
        reconsider(nft, nftId);
      }
    });

    if (changed) {
      events.emit('changed');
    }
    scheduleLookUp();
  }, [
    ipfsGatewayKey,
    nfts /* immutable */,
    nachos /* immutable */,
    getMetadata /* immutable */,
    settled /* immutable */,
    statuses /* immutable */,
    cacheInfos /* immutable */,
    events /* immutable */,
    scheduleLookUp,
  ]);

  useEffect(() => {
    scheduleLookUp();

    const unsubscribeNFTs = subscribeToChanges(scheduleLookUp);
    const unsubscribeMetadata = subscribeToMetadataChanges(scheduleLookUp);

    return () => {
      unsubscribeNFTs();
      unsubscribeMetadata();

      if (lookUpTimeoutRef.current) {
        clearTimeout(lookUpTimeoutRef.current);
        lookUpTimeoutRef.current = undefined;
      }
    };
  }, [scheduleLookUp, subscribeToChanges, subscribeToMetadataChanges]);

  return {
    getPreviewStatus, // immutable
    setPreviewStatus, // immutable
    invalidatePreviewStatus, // immutable
    subscribeToPreviewStatusChanges, // immutable
  } as const;
}

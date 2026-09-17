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
import { isHostUnreachableError } from '../../../../util/downloadErrors';
import getNFTPreviewStatusFromCache, { getNFTPreviewUrls } from '../../../../util/getNFTPreviewStatusFromCache';
import { isIpfsBackedUrl } from '../../../../util/ipfs';

const log = debug('chia-gui:NFTProvider:useNFTPreviewStatuses');

// Cache infos are looked up in batches so a large collection does not hand
// the main process thousands of file reads in one IPC call. NFTs are
// classified LOOKUP_BATCH_SIZE at a time, and the urls those NFTs need are
// fetched LOOKUP_URL_BATCH_SIZE per call: how many urls an NFT carries is up
// to its minter (getNFTPreviewUrls caps it per source), so the batch that
// reaches the main process is measured in urls, not NFTs.
const LOOKUP_BATCH_SIZE = 200;
const LOOKUP_URL_BATCH_SIZE = 500;
// NFT pages and metadata results arrive in bursts; one sweep per window.
const LOOKUP_DELAY = 250;

type UseNFTPreviewStatusesProps = {
  nfts: Map<string, NFTInfo>; // should be immutable
  nachos: Map<string, NFTInfo>; // should be immutable
  getMetadata: (id: string) => MetadataState; // should be immutable
  subscribeToChanges: (callback: () => void) => () => void; // should be immutable
  subscribeToMetadataChanges: (callback: () => void) => () => void; // should be immutable
  // see NFTProvider: how many times the gateway has come back after being
  // unreachable, and when it last did (IpfsGatewayHealth.recoveredAt)
  ipfsGatewayRecoveries: number;
  ipfsGatewayRecoveredAt: number | undefined;
};

// warning: only used by NFTProvider
//
// Tracks, per NFT, whether its gallery tile can show a preview. Tiles report
// the verdict they settle on; NFTs that are not on screen (the gallery is
// virtualized, so most never mount) are classified from the outcomes the
// cache persisted during earlier visits and sessions, without downloading
// anything. A live report always wins over a cache lookup.
export default function useNFTPreviewStatuses(props: UseNFTPreviewStatusesProps) {
  const {
    nfts,
    nachos,
    getMetadata,
    subscribeToChanges,
    subscribeToMetadataChanges,
    ipfsGatewayRecoveries,
    ipfsGatewayRecoveredAt,
  } = props;

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

  // The gateway ipfs:// files are fetched through, and https gateway links
  // fall back to (empty while the option is off). A change of it forgets the
  // verdicts that rested on ipfs files (forgetIpfsVerdicts) and sweeps again;
  // the recorded failures themselves still count (see getCacheInfo below).
  const [ipfsGateway] = useIpfsGateway();
  const ipfsGatewayBase = useIpfsGatewayBase();
  const ipfsGatewayKey = ipfsGateway ? ipfsGatewayBase : '';
  const ipfsGatewayKeyRef = useRef(ipfsGatewayKey);
  ipfsGatewayKeyRef.current = ipfsGatewayKey;
  const ipfsGatewayRecoveredAtRef = useRef(ipfsGatewayRecoveredAt);
  ipfsGatewayRecoveredAtRef.current = ipfsGatewayRecoveredAt;

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

          const generation = invalidationGeneration.current;
          let invalidated = false;
          for (let urlStart = 0; urlStart < urls.length && !invalidated; urlStart += LOOKUP_URL_BATCH_SIZE) {
            // eslint-disable-next-line no-await-in-loop -- batches are sequential on purpose, to pace the main process
            const fetchedInfos = await getCacheInfos(urls.slice(urlStart, urlStart + LOOKUP_URL_BATCH_SIZE));

            if (generation !== invalidationGeneration.current) {
              // an invalidation ran while this lookup was in flight — the
              // outcomes may describe files that are gone now, and the NFTs
              // it reset are unsettled again, so start the sweep over
              invalidated = true;
            } else {
              fetchedInfos.forEach((cacheInfo) => cacheInfos.set(cacheInfo.url, cacheInfo));
            }
          }

          if (invalidated) {
            lookUpAgainRef.current = true;
            break;
          }

          // A failure recorded under another gateway is still a failure for
          // the filter. CacheManager re-requests such an entry through the
          // current gateway the moment a tile asks (its gateway-change rule),
          // so nothing is lost by classifying it: the NFT sits under
          // "unavailable", and the tile that asks — in that view, or in the
          // unfiltered gallery — reports whatever the new gateway yields. Reading
          // it as "never fetched" instead put every file whose hosts are gone
          // back under "Preview available" after every gateway change, each
          // holding a download slot until it failed the same way again. What
          // does settle nothing here is CacheManager's recovery rule
          // (isRecoveredGatewayFailure): once the gateway has come back after
          // being unreachable, a failure to reach it recorded under the current
          // gateway whose transfer began before that moment was a verdict on
          // the host, not on the content, so the NFT stays in view for its tile
          // to ask. One that began after the recovery is a new failure and
          // follows the ordinary rules.
          const currentGateway = ipfsGatewayKeyRef.current;
          const recoveredAt = ipfsGatewayRecoveredAtRef.current;
          const getCacheInfo = (url: string): CacheInfo | undefined => {
            const cacheInfo = cacheInfos.get(url);
            if (
              cacheInfo?.state === CacheState.ERROR &&
              currentGateway &&
              isIpfsBackedUrl(url) &&
              recoveredAt !== undefined &&
              cacheInfo.gateway === currentGateway &&
              isHostUnreachableError(cacheInfo.error) &&
              recoveredAt > (cacheInfo.startedAt ?? cacheInfo.timestamp)
            ) {
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
              // A verdict reached while the metadata is still being fetched
              // (the fetch looked doomed) is provisional: should the fetch
              // bring the metadata after all, its preview candidates may
              // change the verdict, so the NFT is left unsettled and the
              // store's change notification has it swept again. A tile's
              // live report settles it regardless.
              if (!metadataState.isLoading) {
                settled.add(nftId);
              }
              changed = true;
            } else if (!metadataState.isLoading) {
              // every input is known and the cache cannot decide — only a
              // download can, and the tile that performs it reports it
              settled.add(nftId);
              // a provisional verdict reached while the metadata was still
              // loading (see above) is stale now that the metadata has
              // arrived: drop it so the NFT rejoins the available previews
              // and a tile mounts to fetch the candidates it brought
              if (statuses.delete(nftId)) {
                changed = true;
              }
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
  // sweep again: mounted tiles re-verify on their own and report, and the
  // rest are classified afresh from what the cache holds. A failure recorded
  // under the old gateway still counts as one (the look-up says why), so such
  // an NFT sits under "unavailable" until a tile asks for it — in that view,
  // or in the unfiltered gallery — and CacheManager re-requests the file
  // through the new gateway; a verdict that rested on an abort, or on nothing
  // recorded, is undecided again and the NFT shows up for its tile. With the
  // option now off, the same sweep classifies from what the cache holds
  // without a gateway. An NFT whose metadata is not known is forgotten too — one
  // whose metadata failed to load, and one whose metadata is being fetched:
  // the metadata store retries failed fetches on the same change, and its
  // effect runs before this one, so by the time an NFT is looked at here its
  // failure has usually already become a fetch in flight. Either way the
  // preview uris the metadata brings are unknown until it arrives, and a
  // verdict reached without them must not outlive the change.
  // immutable function
  const forgetIpfsVerdicts = useCallback(() => {
    let changed = false;
    const reconsider = (nft: NFTInfo, nftId: string) => {
      const metadataState = getMetadata(nftId);
      const ipfsUrls = getNFTPreviewUrls(nft, metadataState).filter(isIpfsBackedUrl);
      const isMetadataUnknown = metadataState.isLoading || (!metadataState.metadata && !!metadataState.error);
      if (!ipfsUrls.length && !isMetadataUnknown) {
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
    nfts /* immutable */,
    nachos /* immutable */,
    getMetadata /* immutable */,
    settled /* immutable */,
    statuses /* immutable */,
    cacheInfos /* immutable */,
    events /* immutable */,
    scheduleLookUp,
  ]);

  const lastIpfsGatewayKeyRef = useRef(ipfsGatewayKey);
  useEffect(() => {
    if (lastIpfsGatewayKeyRef.current === ipfsGatewayKey) {
      return;
    }
    lastIpfsGatewayKeyRef.current = ipfsGatewayKey;
    forgetIpfsVerdicts();
  }, [ipfsGatewayKey, forgetIpfsVerdicts]);

  // The gateway came back after a run of requests that could not reach it:
  // the failures recorded meanwhile were verdicts on an unreachable host, and
  // CacheManager retries them on the next access (gatewayRecoveredAt), so
  // they settle nothing here any more (see getCacheInfo above) — forget the
  // verdicts that rested on them the same way, and let the tiles ask again.
  const lastIpfsGatewayRecoveriesRef = useRef(ipfsGatewayRecoveries);
  useEffect(() => {
    if (lastIpfsGatewayRecoveriesRef.current === ipfsGatewayRecoveries) {
      return;
    }
    lastIpfsGatewayRecoveriesRef.current = ipfsGatewayRecoveries;
    forgetIpfsVerdicts();
  }, [ipfsGatewayRecoveries, forgetIpfsVerdicts]);

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

import { EventEmitter } from 'events';

import { type NFTInfo, type Wallet } from '@chia-network/api';
import {
  useLazyGetNFTsCountQuery,
  useLazyGetNFTsQuery,
  useGetNFTWallets,
  useGetLoggedInFingerprintQuery,
} from '@chia-network/api-react';
import debug from 'debug';
import { useState, useCallback, useEffect, useMemo, useRef } from 'react';

import type NFTState from '../../../../@types/NFTState';
import useNFTCoinEvents from '../../../../hooks/useNFTCoinEvents';
import useStateAbort from '../../../../hooks/useStateAbort';
import getNFTId from '../../../../util/getNFTId';
import limit from '../../../../util/limit';
import { getChangedEventName } from './useNFTDataOnDemand';

const log = debug('chia-gui:useNFTData');

type UseNFTDataProps = {
  pageSize?: number;
  concurrency?: number;
};

// warning: only used by NFTProvider
export default function useNFTData(props: UseNFTDataProps) {
  const { pageSize = 24, concurrency = 10 } = props;

  const abortControllerRef = useRef<AbortController>(new AbortController());
  const [nfts] = useState(() => new Map<string, NFTInfo>());
  const add /* immutable until concurrency change */ = useMemo(() => limit(concurrency), [concurrency]);

  const events /* immutable */ = useMemo(() => {
    const eventEmitter = new EventEmitter();
    eventEmitter.setMaxListeners(Infinity);
    return eventEmitter;
  }, []);

  const [getNFTs /* immutable */] = useLazyGetNFTsQuery();
  const [getNFTsCount /* immutable */] = useLazyGetNFTsCountQuery();
  const {
    data: fingerprint,
    isLoading: isLoadingFingerprint,
    error: errorFingerprint,
  } = useGetLoggedInFingerprintQuery();
  const [isLoadingProcessing, setIsLoadingProcessing] = useStateAbort(false);
  const [errorProcessing, setErrorProcessing] = useStateAbort<Error | undefined>(undefined);
  const { wallets: nftWallets, isLoading: isLoadingWallets, error: errorWallets } = useGetNFTWallets();

  const subscribeToNFTCoinChanges = useNFTCoinEvents();

  // number of loaded NFTs
  const [loaded, setLoaded] = useStateAbort(0);
  // total number of NFTs
  const [count, setCount] = useStateAbort(0);

  const isLoading = isLoadingProcessing || isLoadingWallets || isLoadingFingerprint;
  const error = errorWallets || errorProcessing || errorFingerprint;

  // immutable function
  const fetchNFTsPage = useCallback(
    async (walletId: number, pageIndex: number, abortSignal: AbortSignal): Promise<string[]> => {
      log(`Fetching NFTs page ${pageIndex} for wallet ${walletId}`);
      if (abortSignal.aborted) {
        return [];
      }

      const startIndex = pageIndex * pageSize;
      const nftsByWallet = await getNFTs({
        walletIds: [walletId],
        startIndex,
        num: pageSize,
      }).unwrap();

      const page = nftsByWallet[walletId];
      if (!page || abortSignal.aborted) {
        return [];
      }

      const nftIds: string[] = [];
      page.forEach((nft) => {
        const nftId = getNFTId(nft.launcherId);
        nftIds.push(nftId);

        nfts.set(nftId, nft);

        events.emit(getChangedEventName(nftId), {
          nft,
          isLoading: false,
        });

        events.emit('changed');
      });

      setLoaded((prevLoaded) => prevLoaded + page.length, abortSignal);

      return nftIds;
    },
    [
      pageSize /* immutable */,
      getNFTs /* immutable */,
      setLoaded /* immutable */,
      nfts /* immutable */,
      events /* immutable */,
    ]
  );

  // immutable function
  const fetchData = useCallback(
    async (wallets: Wallet[], abortSignal: AbortSignal) => {
      log('Fetching NFTs');
      setCount(0, abortSignal);
      setLoaded(0, abortSignal);

      setErrorProcessing(undefined, abortSignal);
      setIsLoadingProcessing(true, abortSignal);

      const oldNFTIds = nfts.keys();
      const newNFTIds = new Set<string>();

      events.emit('changed');

      async function processWallet(wallet: Wallet) {
        log(`Processing wallet ${wallet.id}`);
        if (abortSignal.aborted) {
          return;
        }

        const { id: walletId } = wallet;
        const { total } = await getNFTsCount({
          walletIds: [walletId],
        }).unwrap();

        if (abortSignal.aborted) {
          return;
        }

        setCount((prevCount) => prevCount + total, abortSignal);
        const numPages = Math.ceil(total / pageSize);

        const fetchLimited = (pageIndex: number) =>
          add<string[]>(async () => {
            const ids = await fetchNFTsPage(walletId, pageIndex, abortSignal);
            ids.forEach((id) => newNFTIds.add(id));
          });

        const pageIndices = [];
        for (let i = 0; i < numPages; i++) {
          pageIndices.push(i);
        }

        await Promise.all(pageIndices.map(fetchLimited));
      }

      try {
        await Promise.all(wallets.map(processWallet));
      } catch (err) {
        setErrorProcessing(err as Error, abortSignal);
      } finally {
        // remove old NFTs
        if (!abortSignal.aborted) {
          for (const nftId of oldNFTIds) {
            if (!newNFTIds.has(nftId)) {
              nfts.delete(nftId);
            }
          }
        }

        setIsLoadingProcessing(false, abortSignal);
      }
    },
    [
      nfts,
      events,
      getNFTsCount,
      setCount,
      setLoaded,
      pageSize,
      add,
      fetchNFTsPage,
      setErrorProcessing,
      setIsLoadingProcessing,
    ]
  );

  useEffect(() => {
    // clear NFTs on fingerprint change
    nfts.clear();
  }, [nfts, fingerprint]);

  const refetchData = useCallback(() => {
    abortControllerRef.current.abort();
    abortControllerRef.current = new AbortController();

    return fetchData(nftWallets, abortControllerRef.current.signal);
  }, [fetchData, nftWallets]);

  useEffect(() => {
    // abort previous fetch
    if (fingerprint) {
      let changed = false;
      let initialLoadFinished = false;

      refetchData().finally(() => {
        initialLoadFinished = true;

        if (changed) {
          changed = false;
          refetchData();
        }
      });

      const unsubscribe = subscribeToNFTCoinChanges(() => {
        changed = true;

        if (initialLoadFinished) {
          changed = false;
          refetchData();
        }
      });

      return () => unsubscribe();
    }

    return undefined;
  }, [refetchData, nftWallets, fingerprint, subscribeToNFTCoinChanges]);

  // immutable function
  const getNFT = useCallback(
    (id: string | undefined) => {
      if (!id) {
        return {
          nft: undefined,
          isLoading: false,
          error: new Error('Invalid NFT id'),
        };
      }

      const nftId = getNFTId(id);

      return {
        nft: nfts.get(nftId),
        isLoading: false,
      };
    },
    [nfts /* immutable */]
  );

  // immutable function
  const subscribeToNFTChanges = useCallback(
    (id: string | undefined, callback: (nftState?: NFTState) => void) => {
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

  const subscribeToChanges = useCallback(
    (callback: () => void) => {
      events.on('changed', callback);

      return () => {
        events.off('changed', callback);
      };
    },
    [events]
  );

  return {
    nfts,

    getNFT,

    isLoading,
    error,

    count,
    loaded,
    progress: count > 0 ? (loaded / count) * 100 : !isLoading && count === 0 ? 100 : 0,

    subscribeToNFTChanges, // immutable
    subscribeToChanges,
  } as const;
}

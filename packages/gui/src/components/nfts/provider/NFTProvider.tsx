import { EventEmitter } from 'events';

import { type NFTInfo, type Wallet } from '@chia-network/api';
import {
  useGetNFTWallets,
  useLazyGetNFTsQuery,
  useLazyGetNFTsCountQuery,
  useNFTCoinAdded,
  useNFTCoinRemoved,
  useNFTCoinUpdated,
  useGetLoggedInFingerprintQuery,
  useLazyGetNFTInfoQuery,
} from '@chia-network/api-react';
import debug from 'debug';
import React, { useMemo, useCallback, useEffect, type ReactNode } from 'react';

import type Metadata from '../../../@types/Metadata';
import type MetadataOnDemand from '../../../@types/MetadataOnDemand';
import type NFTOnDemand from '../../../@types/NFTOnDemand';
import useCache from '../../../hooks/useCache';
import useNachoNFTs from '../../../hooks/useNachoNFTs';
import useStateAbort from '../../../hooks/useStateAbort';
import compareChecksums from '../../../util/compareChecksums';
import getNFTId from '../../../util/getNFTId';
import limit from '../../../util/limit';
import { launcherIdFromNFTId } from '../../../util/nfts';
import parseFileContent from '../../../util/parseFileContent';
import NFTProviderContext from './NFTProviderContext';

const log = debug('chia-gui:NFTProvider');

function parseMetadataFile(content: Buffer, headers: any) {
  const metadataString = parseFileContent(content, headers);

  return JSON.parse(metadataString) as Metadata;
}

type Change =
  | {
      type: 'add';
      walletId: string;
    }
  | {
      type: 'remove';
      walletId: string;
    }
  | {
      type: 'updated';
      walletId: string;
    };

export type NFTProviderProps = {
  children: ReactNode;
  pageSize?: number;
  concurrency?: number;
};

// private ongoingRequests: Map<string, Promise<Buffer>> = new Map();

export default function NFTProvider(props: NFTProviderProps) {
  const { children, pageSize = 24, concurrency = Infinity } = props;

  const events = useMemo(() => {
    const eventEmitter = new EventEmitter();
    eventEmitter.setMaxListeners(100);
    return eventEmitter;
  }, []);

  const cache = useCache();
  const nftAdd = useMemo(() => limit<NFTInfo>(concurrency), [concurrency]);
  const metadataAdd = useMemo(() => limit<Metadata>(concurrency), [concurrency]);
  const [currentAbortController, setCurrentAbortController] = useStateAbort<AbortController>(new AbortController());

  // queries
  const { wallets: nftWallets, isLoading: isLoadingWallets, error: errorWallets } = useGetNFTWallets();
  const {
    data: fingerprint,
    isLoading: isLoadingFingerprint,
    error: errorFingerprint,
  } = useGetLoggedInFingerprintQuery();
  const [getNFTs] = useLazyGetNFTsQuery();
  const [getNFTsCount] = useLazyGetNFTsCountQuery();
  const [getNFTInfo] = useLazyGetNFTInfoQuery();

  // number of loaded NFTs
  const [loaded, setLoaded] = useStateAbort(0);
  // total number of NFTs
  const [total, setTotal] = useStateAbort(0);

  const [nfts] = useStateAbort(new Map<string, NFTInfo>());
  const [nachoNFTsById] = useStateAbort(new Map<string, NFTInfo>());
  const [nftsOnDemand] = useStateAbort(new Map<string, NFTOnDemand>());
  const [metadatasOnDemand] = useStateAbort(new Map<string, MetadataOnDemand>());

  const { data: nachoNFTs, isLoading: isLoadingNachos, error: errorNachos } = useNachoNFTs();

  // status of loading
  const [isLoadingNFTs, setIsLoadingNFTs] = useStateAbort(false);
  const [errorLoading, setErrorLoading] = useStateAbort<Error | undefined>(undefined);

  // global state
  const isLoading = isLoadingWallets || isLoadingFingerprint || isLoadingNachos || isLoadingNFTs;
  const error = errorWallets || errorFingerprint || errorNachos || errorLoading;

  // events
  const [, setChanges] = useStateAbort<Change[]>([]);
  useNFTCoinAdded((data) => {
    const { walletId } = data;
    setChanges((prevChanges) => [...prevChanges, { type: 'add', walletId }]);
  });

  useNFTCoinRemoved((data) => {
    const { walletId } = data;
    setChanges((prevChanges) => [...prevChanges, { type: 'remove', walletId }]);
  });

  useNFTCoinUpdated((data) => {
    // console.log('NFT updated: ', data);
    const { walletId } = data;
    setChanges((prevChanges) => [...prevChanges, { type: 'updated', walletId }]);
  });

  async function fetchNFTsCount(walletId: number) {
    log(`Fetching NFTs count for wallet ${walletId}`);
    const { total: count } = await getNFTsCount({
      walletIds: [walletId],
    }).unwrap();

    return count;
  }

  const fetchAndProcessMetadata = useCallback(
    async (uri: string, hash: string | undefined) => {
      log(`Fetching metadata from ${uri}`);
      const { content, headers, checksum } = await cache.get(uri);

      log(`Comparing checksums ${checksum} and ${hash}`);
      if (hash && !compareChecksums(checksum, hash)) {
        throw new Error('Checksum mismatch');
      }

      return parseMetadataFile(content, headers);
    },
    [cache]
  );

  const setNFTOnDemand = useCallback(
    (nftId: string, nftOnDemand: NFTOnDemand, abortSignal: AbortSignal) => {
      log(`Setting NFT on demand for ${nftId}`);
      if (abortSignal.aborted) {
        log(`Aborted setting NFT on demand for ${nftId}`);
        return;
      }
      nftsOnDemand.set(nftId, nftOnDemand);

      events.emit('nftChanged', nftId, {
        nft: nftOnDemand.nft,
        error: nftOnDemand.error,
        isLoading: !!nftOnDemand.promise,
      });
    },
    [events, nftsOnDemand]
  );

  const setMetadataOnDemand = useCallback(
    (nftId: string, metadataOnDemand: MetadataOnDemand, abortSignal: AbortSignal) => {
      log(`Setting metadata on demand for ${nftId}`);
      if (abortSignal.aborted) {
        log(`Aborted setting metadata on demand for ${nftId}`);
        return;
      }

      metadatasOnDemand.set(nftId, metadataOnDemand);

      events.emit('metadataChanged', nftId, {
        metadata: metadataOnDemand.metadata,
        error: metadataOnDemand.error,
        isLoading: !!metadataOnDemand.promise,
      });
    },
    [events, metadatasOnDemand]
  );

  const fetchById = useCallback(
    async (id: string, abortSignal: AbortSignal): Promise<NFTInfo> => {
      const nftId = getNFTId(id);
      if (!nftId) {
        throw new Error('Invalid NFT ID');
      }

      if (nfts.has(nftId)) {
        return nfts.get(nftId);
      }

      if (nachoNFTsById.has(nftId)) {
        return nachoNFTsById.get(nftId);
      }

      if (nftsOnDemand.has(nftId)) {
        const nftOnDemand = nftsOnDemand.get(nftId);
        if (nftOnDemand.nft) {
          return nftOnDemand.nft;
        }

        if (nftOnDemand.error) {
          throw nftOnDemand.error;
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

          setNFTOnDemand(
            nftId,
            {
              nft,
            },
            abortSignal
          );
          return nft;
        } catch (e) {
          setNFTOnDemand(
            nftId,
            {
              error: e as Error,
            },
            abortSignal
          );

          throw e;
        }
      }

      const promise = nftAdd(() => limitedFetchNFTById());

      setNFTOnDemand(
        nftId,
        {
          promise,
        },
        abortSignal
      );

      return promise;
    },
    [nfts, nachoNFTsById, nftsOnDemand, getNFTInfo, setNFTOnDemand, nftAdd]
  );

  const getNFTState = useCallback(
    (id: string | undefined, abortSignal: AbortSignal) => {
      if (!id) {
        return {
          nft: undefined,
          isLoading: false,
          error: new Error('Invalid NFT ID'),
        };
      }

      const nftId = getNFTId(id);

      if (nfts.has(nftId)) {
        return {
          nft: nfts.get(nftId),
          isLoading: false,
          error: undefined,
        };
      }

      if (nachoNFTsById.has(nftId)) {
        return {
          nft: nachoNFTsById.get(nftId),
          isLoading: false,
          error: undefined,
        };
      }

      const nftOnDemand = nftsOnDemand.get(nftId);
      if (nftOnDemand) {
        return {
          nft: nftOnDemand.nft,
          isLoading: !!nftOnDemand.promise,
          error: nftOnDemand.error,
        };
      }

      fetchById(nftId, abortSignal).catch((e) => {
        log(`Error fetching NFT ${nftId}. Error: ${e.message}`);
      });

      return {
        nft: undefined,
        isLoading: true,
        error: undefined,
      };
    },
    [nfts, nftsOnDemand, fetchById, nachoNFTsById]
  );

  const fetchMetadata = useCallback(
    async (id: string, abortSignal: AbortSignal): Promise<Metadata> => {
      const nftId = getNFTId(id);

      if (metadatasOnDemand.has(nftId)) {
        const metadataOnDemand = metadatasOnDemand.get(nftId);
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
          const nft = await fetchById(nftId, abortSignal);
          const { metadataUris = [], metadataHash } = nft;

          const [firstUri] = metadataUris;
          if (!firstUri) {
            const metadataError = new Error('No metadata URI');
            if (metadataError) {
              throw metadataError;
            }
          }

          const metadata = await fetchAndProcessMetadata(firstUri, metadataHash);
          setMetadataOnDemand(nftId, { metadata }, abortSignal);
          return metadata;
        } catch (e) {
          setMetadataOnDemand(nftId, { error: e as Error }, abortSignal);
          throw e;
        }
      }

      const promise = metadataAdd(() => limitedFetchMetadata());

      setMetadataOnDemand(nftId, { promise }, abortSignal);

      return promise;
    },
    [fetchAndProcessMetadata, fetchById, metadatasOnDemand, setMetadataOnDemand, metadataAdd]
  );

  const startPreparingMetadata = useCallback(
    (nftId: string, abortSignal: AbortSignal) => {
      if (metadatasOnDemand.has(nftId)) {
        return;
      }

      fetchMetadata(nftId, abortSignal).catch((e) => {
        log(`Error fetching metadata for NFT ${nftId}. Error: ${e.message}`);
      });
    },
    [fetchMetadata, metadatasOnDemand]
  );

  const prepareNachoNFTsById = useCallback(() => {
    log('Preparing nacho NFTs');
    nachoNFTsById.clear();

    if (nachoNFTs) {
      nachoNFTsById.clear();
      nachoNFTs.forEach((nachoNFT: NFTInfo) => {
        const nftId = getNFTId(nachoNFT.launcherId);
        nachoNFTsById.set(nftId, nachoNFT);

        startPreparingMetadata(nftId, currentAbortController.signal);

        events.emit('nftChanged', nftId, {
          nft: nachoNFT,
          isLoading: false,
        });
      });
    }
  }, [nachoNFTsById, nachoNFTs, startPreparingMetadata, currentAbortController.signal, events]);

  async function fetchNFTsPage(walletId: number, pageIndex: number, abortSignal: AbortSignal) {
    log(`Fetching NFTs page ${pageIndex} for wallet ${walletId}`);
    const startIndex = pageIndex * pageSize;
    const nftsByWallet = await getNFTs({
      walletIds: [walletId],
      startIndex,
      num: pageSize,
    }).unwrap();

    const page = nftsByWallet[walletId];
    if (!page || abortSignal.aborted) {
      return;
    }

    page.forEach((nft) => {
      const nftId = getNFTId(nft.launcherId);

      nfts.set(nftId, nft);

      startPreparingMetadata(nftId, abortSignal);

      events.emit('nftChanged', nftId, {
        nft,
        isLoading: false,
      });
    });

    setLoaded((prevLoaded) => prevLoaded + page.length, abortSignal);
  }

  const invalidate = useCallback(
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

      dataUris.forEach((uri) => promises.push(cache.invalidate(uri)));

      const firstMetadataUri = metadataUris && metadataUris[0];
      if (firstMetadataUri) {
        promises.push(cache.invalidate(firstMetadataUri));
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
            previewVideoUris.forEach((uri: string) => promises.push(cache.invalidate(uri)));
          }

          if (previewImageUris) {
            previewImageUris.forEach((uri: string) => promises.push(cache.invalidate(uri)));
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
    [fetchById, fetchMetadata, cache, nftsOnDemand, metadatasOnDemand]
  );

  async function fetchData(abortSignal: AbortSignal) {
    if (isLoadingNFTs) {
      return;
    }

    setIsLoadingNFTs(true, abortSignal);
    setErrorLoading(undefined, abortSignal);
    setChanges([], abortSignal);

    const add = limit(concurrency);

    async function processWallet(wallet: Wallet) {
      log(`Processing wallet ${wallet.id}`);
      const { id: walletId } = wallet;
      const count = await fetchNFTsCount(walletId);
      if (abortSignal?.aborted) {
        return;
      }

      setTotal((prevTotal) => prevTotal + count, abortSignal);
      const numPages = Math.ceil(count / pageSize);

      const fetchLimited = (pageIndex: number) => add(() => fetchNFTsPage(walletId, pageIndex, abortSignal));

      const pageIndices = [];
      for (let i = 0; i < numPages; i++) {
        pageIndices.push(i);
      }

      try {
        await Promise.all(pageIndices.map(fetchLimited));
      } catch (err) {
        if (abortSignal.aborted) {
          return;
        }

        setErrorLoading(err as Error, abortSignal);
      }
    }

    try {
      await Promise.all(nftWallets.map(processWallet));
    } catch (err) {
      setErrorLoading(err as Error, abortSignal);
    } finally {
      setIsLoadingNFTs(false, abortSignal);
    }

    // if changes changed while we were fetching, fetch again
    setChanges((prevChanges) => {
      if (prevChanges.length > 0) {
        return prevChanges;
      }

      return [];
    }, abortSignal);
  }

  const getMetadataState = useCallback(
    (
      id: string | undefined,
      abortSignal: AbortSignal
    ): {
      metadata?: Metadata;
      isLoading: boolean;
      error?: Error;
    } => {
      if (!id) {
        return {
          metadata: undefined,
          isLoading: false,
          error: new Error('Invalid NFT ID'),
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

      fetchMetadata(nftId, abortSignal).catch((e) => {
        log(`Error fetching Metadata ${nftId}`, e);
      });

      return {
        metadata: undefined,
        isLoading: true,
        error: undefined,
      };
    },
    [fetchMetadata, metadatasOnDemand]
  );

  function reset() {
    log('Reset NFT provider');
    // metadatasOnDemand.clear();
    nftsOnDemand.clear();
    nfts.clear();
    prepareNachoNFTsById();

    setChanges([]);
    setTotal(0);
    setLoaded(0);
    setIsLoadingNFTs(false);
    setErrorLoading(undefined);

    events.emit('reset');
  }

  useEffect(() => {
    if (nftWallets && fingerprint) {
      log(`Reloading NFTs for wallets ${nftWallets.map((w) => w.id).join(', ')}`);
      const abortController = new AbortController();
      setCurrentAbortController(abortController);
      fetchData(abortController.signal);

      return () => {
        log(`Aborting NFTs reload for wallets ${nftWallets.map((w) => w.id).join(', ')}`);
        abortController.abort();
        reset();
      };
    }

    return undefined;
  }, [nftWallets, fingerprint]); // eslint-disable-line react-hooks/exhaustive-deps -- we want to fetch data only once

  useEffect(() => {
    prepareNachoNFTsById();
  }, [prepareNachoNFTsById]);

  const context = useMemo(
    () => ({
      events,

      nfts,
      nachoNFTs: nachoNFTsById,
      nftsOnDemand,
      metadatasOnDemand,

      isLoading,
      error,

      count: total,
      loaded,
      progress: total > 0 ? (loaded / total) * 100 : 0,

      invalidate: (id?: string) => invalidate(id, currentAbortController.signal),
      getNft: (id?: string) => getNFTState(id, currentAbortController.signal),
      getMetadata: (id?: string) => getMetadataState(id, currentAbortController.signal),
    }),
    [
      events,
      nfts,
      nachoNFTsById,
      nftsOnDemand,
      metadatasOnDemand,
      isLoading,
      error,
      total,
      loaded,
      invalidate,
      currentAbortController.signal,
      getNFTState,
      getMetadataState,
    ]
  );

  return <NFTProviderContext.Provider value={context}>{children}</NFTProviderContext.Provider>;
}

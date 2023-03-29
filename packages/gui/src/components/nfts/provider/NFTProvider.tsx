import { type NFTInfo, type Wallet } from '@chia-network/api';
import {
  useGetNFTWallets,
  useLazyGetNFTsQuery,
  useLazyGetNFTsCountQuery,
  useNFTCoinAdded,
} from '@chia-network/api-react';
import React, { useMemo, useState, useEffect, type ReactNode } from 'react';

import type Metadata from '../../../@types/Metadata';
import useCache from '../../../hooks/useCache';
import compareChecksums from '../../../util/compareChecksums';
import limit from '../../../util/limit';
import NFTProviderContext from './NFTProviderContext';

function parseMetadataFile(content: Buffer, headers: any) {
  let encoding: BufferEncoding = 'utf8';
  if (headers?.['content-type']) {
    const contentType = headers['content-type'];
    const parsedEncoding = contentType?.split('charset=')[1];

    if (parsedEncoding) {
      encoding = parsedEncoding.toLowerCase() === 'iso-8859-1' ? 'latin1' : parsedEncoding;
    }
  }

  const metadataString = Buffer.from(content).toString(encoding);

  return JSON.parse(metadataString) as Metadata;
}

type Change = {
  type: 'add' | 'remove';
  nftId: string;
};

type NFTItem = {
  nft: NFTInfo;
  metadata: any;
  metadataPromise?: Promise<any>;
  isLoading: boolean;
};

export type NFTProviderProps = {
  children: ReactNode;
  pageSize?: number;
  concurrency?: number;
};

// private ongoingRequests: Map<string, Promise<Buffer>> = new Map();

export default function NFTProvider(props: NFTProviderProps) {
  const { children, pageSize = 10, concurrency = 5 } = props;

  // number of loaded NFTs
  const [loaded, setLoaded] = useState(0);
  // total number of NFTs
  const [total, setTotal] = useState(0);
  // list of NFTs
  const [nfts, setNfts] = useState<NFTItem[]>([]);
  // status of loading
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | undefined>();
  const cache = useCache();

  const [getNFTs] = useLazyGetNFTsQuery();
  const [getNFTsCount] = useLazyGetNFTsCountQuery();
  const { wallets: nftWallets, isLoading: isLoadingWallets } = useGetNFTWallets();

  const [, setChanges] = useState<Change[]>([]);

  const metadataAdd = limit(concurrency);

  useNFTCoinAdded((data) => {
    // console.log('NFT coin added', data);

    const { nftId } = data;

    setChanges((prevChanges) => [...prevChanges, { type: 'add', nftId }]);
  });

  async function fetchNFTsCount(walletId: number) {
    const { total: count } = await getNFTsCount({
      walletIds: [walletId],
    }).unwrap();

    return count;
  }

  async function fetchNFTsPage(walletId: number, pageIndex: number) {
    const startIndex = pageIndex * pageSize;
    const nftsByWallet = await getNFTs({
      walletIds: [walletId],
      startIndex,
      num: pageSize,
    }).unwrap();

    const page = nftsByWallet[walletId];

    setNfts((prevNfts) => [
      ...prevNfts,
      ...page.map((nft: NFTInfo) => ({ nft, metadata: undefined, isLoading: false })),
    ]);
    setLoaded((prevLoaded) => prevLoaded + page.length);

    // try to get metadata for each NFT
    await Promise.all(page.map((nft: NFTInfo) => metadataAdd(() => fetchMetadata(nft))));

    return nftsByWallet[walletId];
  }

  async function updateNft(id: string, data: Partial<NFTItem>) {
    setNfts((prevNfts) =>
      prevNfts.map((nftItem) => {
        if (nftItem.nft.$nftId === id) {
          return {
            ...nftItem,
            ...data,
          };
        }

        return nftItem;
      })
    );
  }

  async function fetchAndProcessMetadata(uri: string, hash: string | undefined) {
    const { content, headers, checksum } = await cache.get(uri);

    if (hash && !compareChecksums(checksum, hash)) {
      throw new Error('Checksum mismatch');
    }

    return parseMetadataFile(content, headers);
  }

  async function fetchMetadata(nft: NFTInfo) {
    const { $nftId: nftId, metadataUris = [], metadataHash } = nft;

    const [firstUri] = metadataUris;
    if (!firstUri) {
      return undefined;
    }

    const existingNft = nfts.find((nftItem) => nftItem.nft.$nftId === nftId);
    if (existingNft?.metadataPromise) {
      return existingNft.metadataPromise;
    }

    const promise = fetchAndProcessMetadata(firstUri, metadataHash);

    updateNft(nftId, {
      metadata: undefined,
      metadataPromise: promise,
    });

    promise.then(
      (metadata) => {
        updateNft(nftId, {
          metadata,
          metadataPromise: undefined,
        });
      },
      () => {
        updateNft(nftId, {
          metadataPromise: undefined,
        });
      }
    );

    return promise;
  }

  async function fetchData() {
    if (isLoading) {
      return;
    }

    setIsLoading(true);
    setError(undefined);
    setChanges([]);

    const add = limit(concurrency);

    async function processWallet(wallet: Wallet) {
      const { id: walletId } = wallet;
      const count = await fetchNFTsCount(walletId);
      setTotal((prevTotal) => prevTotal + count);
      const numPages = Math.ceil(count / pageSize);

      const fetchLimited = (pageIndex: number) => add(() => fetchNFTsPage(walletId, pageIndex));

      const pageIndices = [];
      for (let i = 0; i < numPages; i++) {
        pageIndices.push(i);
      }

      try {
        await Promise.all(pageIndices.map(fetchLimited));
      } catch (err) {
        setError(err as Error);
      }
    }

    try {
      await Promise.all(nftWallets.map(processWallet));
    } catch (err) {
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }

    // if changes changed while we were fetching, fetch again
    setChanges((prevChanges) => {
      if (prevChanges.length > 0) {
        return prevChanges;
      }

      return [];
    });
  }

  useEffect(() => {
    if (!isLoadingWallets && nftWallets) {
      fetchData();
    }
  }, [isLoadingWallets, nftWallets]); // eslint-disable-line react-hooks/exhaustive-deps -- we want to fetch data only once

  const context = useMemo(
    () => ({
      nfts,
      count: total,
      loaded,
      isLoading,
      error,
    }),
    [nfts, total, loaded, isLoading, error]
  );

  return <NFTProviderContext.Provider value={context}>{children}</NFTProviderContext.Provider>;
}

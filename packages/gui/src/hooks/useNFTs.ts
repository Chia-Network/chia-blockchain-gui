import { type NFTInfo } from '@chia-network/api';
import { throttle } from 'lodash';
import { useMemo, useEffect, useState, useCallback } from 'react';

import type Metadata from '../@types/Metadata';
import MetadataState from '../@types/MetadataState';
import NFTPreviewAvailability from '../@types/NFTPreviewAvailability';
import NFTPreviewStatus from '../@types/NFTPreviewStatus';
import NFTVisibility from '../@types/NFTVisibility';
import NFTsDataStatistics from '../@types/NFTsDataStatistics';
import FileType from '../constants/FileType';
import getNFTFileType from '../util/getNFTFileType';
import hasSensitiveContent from '../util/hasSensitiveContent';

import useHiddenNFTs from './useHiddenNFTs';
import useNFTProvider from './useNFTProvider';

function searchableNFTContent(nftId: string, nft: NFTInfo, metadata?: Metadata) {
  const items = [nftId, nft.dataUris?.join(' ') ?? '', nft.launcherId, metadata?.name, metadata?.collection?.name];

  return items.join(' ').toLowerCase();
}

const prepareNFTs = throttle(
  (
    nfts: Map<string, NFTInfo>,
    nachos: Map<string, NFTInfo>,
    getMetadata: (id: string) => MetadataState,
    getPreviewStatus: (nftId: string) => NFTPreviewStatus | undefined,
    walletIds: number[],
    isHidden: (nftId: string) => boolean,
    visibility: NFTVisibility,
    previewAvailability: NFTPreviewAvailability,
    types: FileType[],
    search: string,
    onReponse: (filtered: NFTInfo[], statistics: NFTsDataStatistics) => void,
  ) => {
    const stats: NFTsDataStatistics = {
      [FileType.IMAGE]: 0,
      [FileType.VIDEO]: 0,
      [FileType.AUDIO]: 0,
      [FileType.DOCUMENT]: 0,
      [FileType.MODEL]: 0,
      [FileType.UNKNOWN]: 0,
      visible: 0,
      hidden: 0,
      total: 0,
      sensitive: 0,
      previewAvailable: 0,
      previewUnavailable: 0,
    };

    const filtered: NFTInfo[] = [];
    const nftsData: {
      nft: NFTInfo;
      type: FileType;
      metadata: Metadata | undefined;
    }[] = [];

    const searchString = search.toString().trim().toLowerCase();

    function process(nft: NFTInfo, nftId: string) {
      const { metadata } = getMetadata(nftId);

      const type = getNFTFileType(nft);

      nftsData.push({
        nft,
        metadata,
        type,
      });

      // process statistics
      if (type) {
        stats[type] = (stats[type] ?? 0) + 1;
      }

      const isHiddenByUser = isHidden(nftId);
      if (isHiddenByUser) {
        stats.hidden += 1;
      } else {
        stats.visible += 1;
      }

      if (hasSensitiveContent(metadata)) {
        stats.sensitive += 1;
      }

      // Only a settled verdict places an NFT among the unavailable previews;
      // one that has not been classified yet counts as available.
      const isPreviewUnavailable = getPreviewStatus(nftId) === NFTPreviewStatus.UNAVAILABLE;
      if (isPreviewUnavailable) {
        stats.previewUnavailable += 1;
      } else {
        stats.previewAvailable += 1;
      }

      stats.total += 1;

      // process filtering
      if (walletIds.length && (!nft.walletId || !walletIds.includes(nft.walletId))) {
        return;
      }

      const visible =
        visibility === NFTVisibility.ALL ||
        (visibility === NFTVisibility.VISIBLE && !isHiddenByUser) ||
        (visibility === NFTVisibility.HIDDEN && isHiddenByUser);
      if (!visible) {
        return;
      }

      const previewMatches =
        previewAvailability === NFTPreviewAvailability.ALL ||
        (previewAvailability === NFTPreviewAvailability.AVAILABLE && !isPreviewUnavailable) ||
        (previewAvailability === NFTPreviewAvailability.UNAVAILABLE && isPreviewUnavailable);
      if (!previewMatches) {
        return;
      }

      if (!type || !types.includes(type)) {
        return;
      }

      if (searchString.length) {
        const content = nft && searchableNFTContent(nftId, nft, metadata);
        if (!content || !content.includes(searchString)) {
          return;
        }
      }

      filtered.push(nft);
    }

    nfts.forEach((nft, nftId) => {
      process(nft, nftId);
    });

    nachos.forEach((nft, nftId) => {
      if (!nfts.has(nftId)) {
        process(nft, nftId);
      }
    });

    onReponse(filtered, stats);
    // return sortBy(filtered, (nft) => nft.nftCoinConfirmationHeight).reverse();
  },
  250,
  {
    // https://llu.is/throttle-and-debounce-visualized/
    leading: true, // call on first call
    trailing: true, // wait for last call
  },
);

export type UseNFTsProps = {
  walletIds?: number[];
  search?: string;
  types?: FileType[];
  visibility?: NFTVisibility;
  previewAvailability?: NFTPreviewAvailability;
  hideSensitiveContent?: boolean | 'false' | 'true';
};

const emptyWalletIds: number[] = [];
const allTypes = [FileType.IMAGE, FileType.VIDEO, FileType.AUDIO, FileType.DOCUMENT, FileType.MODEL, FileType.UNKNOWN];

export default function useNFTs(props: UseNFTsProps = {}) {
  const {
    walletIds = emptyWalletIds,
    types = allTypes,
    search = '',
    visibility = NFTVisibility.ALL,
    previewAvailability = NFTPreviewAvailability.ALL,
    // hideSensitiveContent = false,
  } = props;

  const {
    nfts,
    nachos,
    getMetadata,
    getPreviewStatus,
    subscribeToPreviewStatusChanges,
    isLoading,
    error,
    progress,
    invalidate,
    count,
    subscribeToChanges,
  } = useNFTProvider();
  const [isNFTHidden] = useHiddenNFTs();

  const total = useMemo(() => count + nachos.size, [count, nachos.size]);

  const [filtered, setFiltered] = useState<NFTInfo[]>([]);
  const [statistics, setStatistics] = useState<NFTsDataStatistics>({
    [FileType.IMAGE]: 0,
    [FileType.VIDEO]: 0,
    [FileType.AUDIO]: 0,
    [FileType.DOCUMENT]: 0,
    [FileType.MODEL]: 0,
    [FileType.UNKNOWN]: 0,
    visible: 0,
    hidden: 0,
    total: 0,
    sensitive: 0,
    previewAvailable: 0,
    previewUnavailable: 0,
  });

  const updateFiltered = useCallback(() => {
    // prepareNFTs is debounced and can returns undefined => we will use old value
    prepareNFTs(
      nfts,
      nachos,
      getMetadata,
      getPreviewStatus,
      walletIds,
      isNFTHidden,
      visibility,
      previewAvailability,
      types,
      search,
      (newFiltered, newStatistics) => {
        setStatistics(newStatistics);
        setFiltered(newFiltered);
      },
    );
  }, [
    nfts, // immutable
    nachos, // immutable
    getMetadata, // immutable
    getPreviewStatus, // immutable
    walletIds, // immutable
    isNFTHidden,
    visibility,
    previewAvailability,
    types,
    search,
    setFiltered,
    setStatistics,
  ]);

  useEffect(() => {
    updateFiltered();
  }, [updateFiltered]);

  useEffect(
    () =>
      subscribeToChanges(() => {
        // todo performance improvement => invalidate only visibly changed NFTs
        updateFiltered();
      }),
    [subscribeToChanges, updateFiltered],
  );

  // preview verdicts arrive as tiles settle and as cache lookups complete
  useEffect(() => subscribeToPreviewStatusChanges(updateFiltered), [subscribeToPreviewStatusChanges, updateFiltered]);

  return {
    total,
    nfts: filtered,
    isLoading,
    error,
    statistics,
    progress,
    invalidate,
  };
}

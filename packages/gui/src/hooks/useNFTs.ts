import { type NFTInfo } from '@chia-network/api';
import MetadataOnDemand from '@types/MetadataOnDemand';
import { throttle } from 'lodash';
import { useMemo, useEffect, useState, useCallback } from 'react';

import type Metadata from '../@types/Metadata';
import NFTVisibility from '../@types/NFTVisibility';
import NFTsDataStatistics from '../@types/NFTsDataStatistics';
import FileType from '../constants/FileType';
import getNFTFileType from '../util/getNFTFileType';
import hasSensitiveContent from '../util/hasSensitiveContent';
import useHiddenNFTs from './useHiddenNFTs';
import useNFTProvider from './useNFTProvider';

function searchableNFTContent(nftId: string, nft: NFTInfo, metadata: Metadata) {
  const items = [nftId, nft.dataUris?.join(' ') ?? '', nft.launcherId, metadata?.name, metadata?.collection?.name];

  return items.join(' ').toLowerCase();
}

const prepareNFTs = throttle(
  (
    nfts: Map<string, NFTInfo>,
    nachoNFTs: Map<string, NFTInfo>,
    metadatasOnDemand: Map<string, MetadataOnDemand>,
    walletIds: number[],
    isHidden: (nftId: string) => boolean,
    visibility: NFTVisibility,
    types: FileType[],
    search: string,
    onReponse: (filtered: NFTInfo[], statistics: NFTsDataStatistics) => void
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
    };

    const filtered: NFTInfo[] = [];
    const nftsData: {
      nft: NFTInfo;
      type: FileType;
      metadata: Metadata | undefined;
    }[] = [];

    const searchString = search.toString().trim().toLowerCase();

    function process(nft: NFTInfo, nftId: string) {
      const metadataStatus = metadatasOnDemand.get(nftId);

      const metadata = metadataStatus?.metadata;
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

      if (!type || !types.includes(type)) {
        return;
      }

      if (searchString.length) {
        if (!metadata) {
          return;
        }

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

    nachoNFTs.forEach((nft, nftId) => {
      if (!nfts.has(nftId)) {
        process(nft, nftId);
      }
    });

    onReponse(filtered, stats);
    // return sortBy(filtered, (nft) => nft.nftCoinConfirmationHeight).reverse();
  },
  1000,
  {
    // https://llu.is/throttle-and-debounce-visualized/
    leading: true, // call on first call
    trailing: true, // wait for last call
  }
);

export type UseNFTsProps = {
  walletIds?: number[];
  search?: string;
  types?: FileType[];
  visibility?: NFTVisibility;
  hideSensitiveContent?: boolean | 'false' | 'true';
};

export default function useNFTs(props: UseNFTsProps = {}) {
  const {
    walletIds = [],
    types = [FileType.IMAGE, FileType.VIDEO, FileType.AUDIO, FileType.DOCUMENT, FileType.MODEL, FileType.UNKNOWN],
    search = '',
    visibility = NFTVisibility.ALL,
    // hideSensitiveContent = false,
  } = props;

  const { events, nfts, nachoNFTs, metadatasOnDemand, isLoading, error, progress, invalidate, count } =
    useNFTProvider();
  const [isNFTHidden] = useHiddenNFTs();

  const total = useMemo(() => count + nachoNFTs.size, [count, nachoNFTs.size]);

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
  });

  const updateFiltered = useCallback(() => {
    // prepareNFTs is debounced and can returns undefined => we will use old value
    prepareNFTs(
      nfts,
      nachoNFTs,
      metadatasOnDemand,
      walletIds,
      isNFTHidden,
      visibility,
      types,
      search,
      (newFiltered, newStatistics) => {
        setStatistics(newStatistics);
        setFiltered(newFiltered);
      }
    );
  }, [
    nfts,
    nachoNFTs,
    metadatasOnDemand,
    walletIds,
    isNFTHidden,
    visibility,
    types,
    search,
    setFiltered,
    setStatistics,
  ]);

  useEffect(() => {
    updateFiltered();
  }, [updateFiltered]);

  useEffect(() => {
    function handleChange() {
      updateFiltered();
    }

    events.on('nftChanged', handleChange);
    events.on('metadataChanged', handleChange);

    return () => {
      events.off('nftChanged', handleChange);
      events.off('metadataChanged', handleChange);
    };
  }, [events, updateFiltered]);

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

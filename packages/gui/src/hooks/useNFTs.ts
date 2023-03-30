import { type NFTInfo } from '@chia-network/api';
import { useMemo } from 'react';

import FileType from '../@types/FileType';
import type Metadata from '../@types/Metadata';
import getFileType from '../util/getFileType';
import useHiddenNFTs from './useHiddenNFTs';
import useNFTProvider from './useNFTProvider';

function getNFTFileType(nft: NFTInfo): FileType {
  const { dataUris } = nft;
  if (dataUris && Array.isArray(dataUris) && dataUris.length > 0) {
    const file = dataUris[0];
    if (file) {
      return getFileType(file);
    }
  }

  return FileType.UNKNOWN;
}

function hasSensitiveContent(metadata?: Metadata) {
  if (!metadata) {
    return false;
  }

  const sensitiveContent = metadata.sensitive_content;
  if (!sensitiveContent || sensitiveContent === false || sensitiveContent === 'false') {
    return false;
  }

  return true;
}

function searchableNFTContent(nft: NFTInfo, metadata: Metadata) {
  const items = [nft.$nftId, nft.dataUris?.join(' ') ?? '', nft.launcherId, metadata?.name, metadata?.collection?.name];

  return items.join(' ').toLowerCase();
}

export type UseNFTsProps = {
  walletId?: number[] | number;
  type?: string[] | string;
  search?: string;
  visible?: boolean;
  hideSensitiveContent?: boolean | 'false' | 'true';
};

export default function useNFTs(props: UseNFTsProps = {}) {
  const { walletId = [], type, search = '', visible, hideSensitiveContent = false } = props;
  const { nfts, isLoading, error } = useNFTProvider();
  const [isNFTHidden] = useHiddenNFTs();

  const walletIds = useMemo(() => {
    if (Array.isArray(walletId)) {
      return walletId;
    }

    if (walletId === undefined) {
      return [];
    }

    return [walletId];
  }, [walletId]);

  const types = useMemo(() => {
    if (Array.isArray(type)) {
      return type;
    }

    if (type === undefined) {
      return [];
    }

    return [type];
  }, [type]);

  const nftsWithType: {
    nft: NFTInfo;
    metadata: Metadata;
    type: FileType;
  }[] = useMemo(
    () =>
      nfts.map((item) => ({
        ...item,
        type: getNFTFileType(item.nft),
      })),
    [nfts]
  );

  const filtered = useMemo(
    () =>
      nftsWithType.filter(({ nft, metadata, type: nftType }) => {
        if (walletIds.length && (!nft.walletId || !walletIds.includes(nft.walletId))) {
          return false;
        }

        if (visible !== undefined && visible !== !isNFTHidden(nft)) {
          return false;
        }

        if (types.length && !types.includes(nftType)) {
          return false;
        }

        if (hideSensitiveContent && hasSensitiveContent(metadata)) {
          return false;
        }

        if (search.trim().length) {
          const content = searchableNFTContent(nft, metadata);
          if (!content.includes(search.toLowerCase())) {
            return false;
          }
        }

        return true;
      }),
    [nftsWithType, search, visible, isNFTHidden, walletIds, hideSensitiveContent, types]
  );

  const statistics = useMemo(() => {
    const stats: Record<FileType, number> = {
      [FileType.IMAGE]: 0,
      [FileType.VIDEO]: 0,
      [FileType.AUDIO]: 0,
      [FileType.DOCUMENT]: 0,
      [FileType.MODEL]: 0,
      [FileType.UNKNOWN]: 0,
    };

    filtered.forEach((item) => {
      stats[item.type] = (stats[item.type] ?? 0) + 1;
    });

    return stats;
  }, [filtered]);

  const nftInfos = useMemo(() => filtered.map(({ nft }) => nft), [filtered]);

  return {
    nfts: nftInfos,
    isLoading,
    error,
    total: nfts.length,
    statistics,
  };
}

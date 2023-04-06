import { type NFTInfo } from '@chia-network/api';
import { useMemo } from 'react';

import FileType from '../@types/FileType';
import type Metadata from '../@types/Metadata';
import NFTVisibility from '../@types/NFTVisibility';
import getNFTsDataStatistics from '../util/getNFTsDataStatistics';
// import hasSensitiveContent from '../util/hasSensitiveContent';
import useHiddenNFTs from './useHiddenNFTs';
import useNFTProvider from './useNFTProvider';

function searchableNFTContent(nft: NFTInfo, metadata: Metadata) {
  const items = [nft.$nftId, nft.dataUris?.join(' ') ?? '', nft.launcherId, metadata?.name, metadata?.collection?.name];

  return items.join(' ').toLowerCase();
}

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
    types = [],
    search = '',
    visibility = NFTVisibility.ALL,
    // hideSensitiveContent = false,
  } = props;

  const { nfts, isLoading, error, progress, invalidate } = useNFTProvider();
  const [isNFTHidden] = useHiddenNFTs();

  const mainFiltered = useMemo(
    () =>
      nfts.filter(
        ({ isPrivate }) => !isPrivate
        /*
        // during loading of metadata we don't know if it's sensitive or not and hide it
        if (hideSensitiveContent && (!metadata || hasSensitiveContent(metadata))) {
          return false;
        }

        return true;
        */
      ),
    [nfts /* , hideSensitiveContent */]
  );

  const statistics = useMemo(() => getNFTsDataStatistics(mainFiltered, isNFTHidden), [mainFiltered, isNFTHidden]);

  const filtered = useMemo(
    () =>
      mainFiltered.filter(({ nft, metadata, type }) => {
        if (walletIds.length && (!nft.walletId || !walletIds.includes(nft.walletId))) {
          return false;
        }

        const isHiddenByUser = nft?.$nftId && isNFTHidden(nft.$nftId);
        const visible =
          visibility === NFTVisibility.ALL ||
          (visibility === NFTVisibility.VISIBLE && !isHiddenByUser) ||
          (visibility === NFTVisibility.HIDDEN && isHiddenByUser);
        if (!visible) {
          return false;
        }

        if (!type || !types.includes(type)) {
          return false;
        }

        if (search.trim().length) {
          if (!metadata) {
            return false;
          }

          const content = nft && searchableNFTContent(nft, metadata);
          if (!content || !content.includes(search.toLowerCase())) {
            return false;
          }
        }

        return true;
      }),
    [mainFiltered, search, visibility, isNFTHidden, walletIds, types]
  );

  const nftInfos = useMemo(() => filtered.map(({ nft }) => nft), [filtered]);

  return {
    nfts: nftInfos,
    isLoading,
    error,
    statistics,
    progress,
    invalidate,
  };
}

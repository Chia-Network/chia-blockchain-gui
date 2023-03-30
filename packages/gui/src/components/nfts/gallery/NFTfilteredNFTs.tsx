import type { NFTInfo } from '@chia-network/api';
import React from 'react';

import useNFTs from '../../../hooks/useNFTs';
import useNachoNFTs from '../../../hooks/useNachoNFTs';

type FilteredNFTtype = {
  walletId: number | undefined;
};

export default function useFilteredNFTs(props: FilteredNFTtype) {
  const { walletId } = props;
  const { nfts, isLoading: isLoadingNFTs } = useNFTs();

  const isLoading = isLoadingNFTs;

  const { data: nachoNFTs } = useNachoNFTs();

  const filteredData = React.useMemo(() => {
    if (nachoNFTs && walletId === -1) {
      return nachoNFTs;
    }

    if (!nfts) {
      return nfts;
    }

    return nfts.filter((nft: NFTInfo) => {
      if (walletId !== undefined && nft.walletId !== walletId) {
        return false;
      }
      return true;
    });
  }, [walletId, nfts, nachoNFTs]);

  return {
    filteredNFTs: filteredData,
    isLoading,
  };
}

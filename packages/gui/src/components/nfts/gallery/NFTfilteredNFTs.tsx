import type { NFTInfo } from '@chia/api';
import { useGetNFTWallets } from '@chia/api-react';
import React from 'react';

import useFetchNFTs from '../../../hooks/useFetchNFTs';
import useNachoNFTs from '../../../hooks/useNachoNFTs';

type FilteredNFTtype = {
  walletId: number | undefined;
};

export default function useFilteredNFTs(props: FilteredNFTtype) {
  const { walletId } = props;
  const { wallets: nftWallets, isLoading: isLoadingWallets } = useGetNFTWallets();
  const { nfts, isLoading: isLoadingNFTs } = useFetchNFTs(nftWallets.map((wallet: Wallet) => wallet.id));

  const isLoading = isLoadingWallets || isLoadingNFTs;

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

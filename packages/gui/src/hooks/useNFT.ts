import { useContext, useMemo } from 'react';

import NFTProviderContext from '../components/nfts/provider/NFTProviderContext';

export default function useNFT(nftId?: string) {
  const { nfts } = useContext(NFTProviderContext);

  const details = useMemo(() => nfts.find((item) => item.nft.$nftId === nftId), [nfts, nftId]);

  const nft = details?.nft;
  const isLoading = !nft;
  const error = undefined; // nfts don't have errors for now

  return {
    nft,
    isLoading,
    error,
  };
}

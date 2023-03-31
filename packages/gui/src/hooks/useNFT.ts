import { useContext, useMemo } from 'react';

import NFTProviderContext from '../components/nfts/provider/NFTProviderContext';

export default function useNFT(nftId?: string) {
  const { nfts } = useContext(NFTProviderContext);

  const details = useMemo(() => nfts.find((item) => item.nft.$nftId === nftId), [nfts, nftId]);

  const nft = details?.nft;
  const isLoading = !nft || !!details?.metadataPromise;
  const error = details?.metadataError;

  return {
    nft,
    isLoading,
    error,
  };
}

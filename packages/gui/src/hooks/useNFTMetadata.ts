import { useContext, useMemo } from 'react';

import NFTProviderContext from '../components/nfts/provider/NFTProviderContext';

export default function useNFTMetadata(nftId?: string) {
  const { nfts } = useContext(NFTProviderContext);

  const details = useMemo(() => nfts.find((item) => item.nft?.$nftId === nftId), [nfts, nftId]);

  const metadata = details?.metadata;
  const isLoading = !!details?.metadataPromise;
  const error = details?.metadataError;

  return {
    metadata,
    isLoading,
    error,
  };
}

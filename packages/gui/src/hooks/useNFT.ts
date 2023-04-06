import { useContext, useCallback, useMemo } from 'react';

import NFTProviderContext from '../components/nfts/provider/NFTProviderContext';

export default function useNFT(nftId?: string) {
  const context = useContext(NFTProviderContext);

  if (!context) {
    throw new Error('useNFT must be used within NFTProvider');
  }

  const { nfts, invalidate } = context;

  const details = useMemo(() => nfts.find((item) => item.nft.$nftId === nftId), [nfts, nftId]);

  const nft = details?.nft;
  const isLoading = !!details?.nftPromise;
  const error = details?.nftError;

  const handleInvalidate = useCallback(() => {
    if (nftId) {
      invalidate(nftId);
    }
  }, [invalidate, nftId]);

  return {
    nft,
    isLoading,
    error,

    invalidate: handleInvalidate,
  };
}

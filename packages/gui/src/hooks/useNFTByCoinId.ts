import { useContext, useEffect, useMemo } from 'react';

import NFTProviderContext from '../components/nfts/provider/NFTProviderContext';

export default function useNFTByCoinId(coinId?: string) {
  const context = useContext(NFTProviderContext);
  if (!context) {
    throw new Error('useNFT must be used within NFTProvider');
  }

  const { nfts, getByCoinId } = context;

  const details = useMemo(() => nfts.find((item) => item.coinId === coinId), [nfts, coinId]);

  useEffect(() => {
    if (coinId) {
      getByCoinId(coinId);
    }
  }, [getByCoinId, coinId]);

  const nft = details?.nft;
  const isLoading = !!details?.nftPromise;
  const error = details?.nftError;

  return {
    isLoading,
    error,
    nft,
  };
}

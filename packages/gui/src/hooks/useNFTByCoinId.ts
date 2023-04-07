import { useContext, useEffect, useMemo } from 'react';

import NFTProviderContext from '../components/nfts/provider/NFTProviderContext';
import removeHexPrefix from '../util/removeHexPrefix';

export default function useNFTByCoinId(coinId?: string) {
  const context = useContext(NFTProviderContext);
  if (!context) {
    throw new Error('useNFT must be used within NFTProvider');
  }

  const { nfts, getByCoinId } = context;

  const uniqueCoinId = useMemo(() => coinId && removeHexPrefix(coinId), [coinId]);
  const details = useMemo(() => nfts.find((item) => item.coinId === uniqueCoinId), [nfts, uniqueCoinId]);

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

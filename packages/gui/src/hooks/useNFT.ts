import { useContext, useCallback, useMemo, useEffect } from 'react';

import type NFTData from '../@types/NFTData';
import NFTProviderContext from '../components/nfts/provider/NFTProviderContext';
import getNFTId from '../util/getNFTId';

export default function useNFT(id?: string) {
  const context = useContext(NFTProviderContext);
  if (!context) {
    throw new Error('useNFT must be used within NFTProvider');
  }

  const { nfts, invalidate, load } = context;

  const nftId = id && getNFTId(id);
  const details = useMemo(() => (nftId ? nfts.find((item: NFTData) => item.id === nftId) : undefined), [nfts, nftId]);

  useEffect(() => {
    if (nftId) {
      load(nftId);
    }
  }, [load, nftId]);

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

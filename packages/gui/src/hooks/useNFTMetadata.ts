import { useContext, useEffect, useMemo } from 'react';

import NFTData from '../@types/NFTData';
import NFTProviderContext from '../components/nfts/provider/NFTProviderContext';
import getNFTId from '../util/getNFTId';

export default function useNFTMetadata(id?: string) {
  const context = useContext(NFTProviderContext);
  if (!context) {
    throw new Error('useNFT must be used within NFTProvider');
  }

  const { nfts, load } = context;

  const nftId = id && getNFTId(id);
  const details = useMemo(() => (nftId ? nfts.find((item: NFTData) => item.id === nftId) : undefined), [nfts, nftId]);

  useEffect(() => {
    if (nftId) {
      load(nftId);
    }
  }, [load, nftId]);

  const metadata = details?.metadata;
  const isLoading = !!details?.metadataPromise;
  const error = details?.metadataError;

  return {
    metadata,
    isLoading,
    error,
  };
}

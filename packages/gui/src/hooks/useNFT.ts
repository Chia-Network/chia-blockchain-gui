import { useContext, useState, useCallback, useEffect, useMemo } from 'react';

import NFTProviderContext from '../components/nfts/provider/NFTProviderContext';

export default function useNFT(id?: string) {
  const context = useContext(NFTProviderContext);
  if (!context) {
    throw new Error('useNFT must be used within NFTProvider');
  }

  const { invalidate, getNFT, subscribeToNFTChanges } = context;

  const handleInvalidate = useCallback(() => invalidate(id), [invalidate, id]);
  const [nftState, setNFTState] = useState(() => getNFT(id));

  useMemo(() => {
    setNFTState(getNFT(id));
  }, [id, getNFT]);

  useEffect(
    () =>
      subscribeToNFTChanges(id, (newNFTState) => {
        setNFTState(newNFTState);
      }),
    [id, subscribeToNFTChanges]
  );

  return {
    ...nftState,
    invalidate: handleInvalidate,
  };
}

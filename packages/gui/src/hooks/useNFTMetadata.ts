import { useContext, useState, useCallback, useEffect, useMemo } from 'react';

import NFTProviderContext from '../components/nfts/provider/NFTProviderContext';

export default function useNFTMetadata(id?: string) {
  const context = useContext(NFTProviderContext);
  if (!context) {
    throw new Error('useNFT must be used within NFTProvider');
  }

  const { invalidate, getMetadata, subscribeToMetadataChanges } = context;

  const handleInvalidate = useCallback(() => invalidate(id), [invalidate, id]);
  const [metadataState, setMetadataState] = useState(() => getMetadata(id));

  useMemo(() => {
    setMetadataState(getMetadata(id));
  }, [id, getMetadata]);

  useEffect(
    () =>
      subscribeToMetadataChanges(id, (newMetadataState) => {
        setMetadataState(newMetadataState);
      }),
    [id, subscribeToMetadataChanges]
  );

  return {
    ...metadataState,
    invalidate: handleInvalidate,
  };
}

import { useContext, useState, useCallback, useEffect } from 'react';

import NFTProviderContext from '../components/nfts/provider/NFTProviderContext';

export default function useNFTMetadata(id?: string) {
  const context = useContext(NFTProviderContext);
  if (!context) {
    throw new Error('useNFT must be used within NFTProvider');
  }

  const { invalidate, getMetadata, onMetadataChange } = context;

  const handleInvalidate = useCallback(() => invalidate(id), [invalidate, id]);
  const [metadataState, setMetadataState] = useState(() => getMetadata(id));

  useEffect(
    () =>
      onMetadataChange(id, (newMetadataState) => {
        setMetadataState(newMetadataState);
      }),
    [id, onMetadataChange]
  );

  return {
    ...metadataState,
    invalidate: handleInvalidate,
  };
}

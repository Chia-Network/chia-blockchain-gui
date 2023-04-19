import { useContext, useState, useCallback, useMemo, useEffect } from 'react';

import NFTProviderContext from '../components/nfts/provider/NFTProviderContext';
import getNFTId from '../util/getNFTId';

export default function useNFTMetadata(id?: string) {
  const context = useContext(NFTProviderContext);
  if (!context) {
    throw new Error('useNFT must be used within NFTProvider');
  }

  const nftId = useMemo(() => id && getNFTId(id), [id]);
  const { invalidate, getMetadata, events } = context;

  const handleInvalidate = useCallback(() => invalidate(nftId), [invalidate, nftId]);
  const [metadataState, setMetadataState] = useState(getMetadata(nftId));

  useEffect(() => {
    function handleChange(changedNFTId: string, state: ReturnType<typeof getMetadata>) {
      if (changedNFTId === nftId) {
        setMetadataState(state);
      }
    }

    events.on('metadataChanged', handleChange);
    setMetadataState(getMetadata(nftId));

    return () => {
      events.off('metadataChanged', handleChange);
    };
  }, [events, getMetadata, nftId]);

  return {
    ...metadataState,
    invalidate: handleInvalidate,
  };
}

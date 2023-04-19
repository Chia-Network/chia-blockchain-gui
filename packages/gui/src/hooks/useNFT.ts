import { useContext, useState, useCallback, useMemo, useEffect } from 'react';

import NFTProviderContext from '../components/nfts/provider/NFTProviderContext';
import getNFTId from '../util/getNFTId';

export default function useNFT(id?: string) {
  const context = useContext(NFTProviderContext);
  if (!context) {
    throw new Error('useNFT must be used within NFTProvider');
  }

  const nftId = useMemo(() => id && getNFTId(id), [id]);
  const { invalidate, getNft, events } = context;

  const handleInvalidate = useCallback(() => invalidate(nftId), [invalidate, nftId]);
  const [nftState, setNFTState] = useState(getNft(nftId));

  useEffect(() => {
    function handleChange(changedNFTId: string, state: ReturnType<typeof getNft>) {
      if (changedNFTId === nftId) {
        setNFTState(state);
      }
    }

    events.on('nftChanged', handleChange);
    setNFTState(getNft(nftId));

    return () => {
      events.off('nftChanged', handleChange);
    };
  }, [events, getNft, nftId]);

  return {
    ...nftState,
    invalidate: handleInvalidate,
  };
}

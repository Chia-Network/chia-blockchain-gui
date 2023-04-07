import { useContext } from 'react';

import NFTProviderContext from '../components/nfts/provider/NFTProviderContext';

export default function useNFTProvider() {
  const context = useContext(NFTProviderContext);
  if (!context) {
    throw new Error('useNFTProvider must be used within a NFTProvider');
  }

  return context;
}

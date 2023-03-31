import { useContext } from 'react';

import { NFTFilterContext } from '../components/nfts/NFTFilterProvider';

export default function useNFTFilter() {
  const context = useContext(NFTFilterContext);

  if (!context) {
    throw new Error('useNFTFilter must be used within a NFTFilterProvider');
  }

  return context;
}

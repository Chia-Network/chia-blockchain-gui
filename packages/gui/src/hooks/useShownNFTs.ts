import { useContext } from 'react';

import { NFTGalleryShowNFTsContext } from '../components/nfts/gallery/NFTGalleryShowNFTsProvider';

export default function useNFTGalleryShowNFTs(): [
  getVisibleNFTs: () => string[],
  setVisibleNFTs: (value: string[]) => void
] {
  const context = useContext(NFTGalleryShowNFTsContext);

  if (!context) {
    throw new Error('useShownNFTs must be used within a useShownNFTsProvider');
  }

  return [context.getVisibleNFTs, context.setVisibleNFTs];
}

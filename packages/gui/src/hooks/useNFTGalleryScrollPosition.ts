import { useContext } from 'react';

import { NFTGalleryScrollPositionContext } from '../components/nfts/gallery/NFTGalleryScrollPositionProvider';

export default function useNFTGalleryScrollPosition(): [
  getScrollPosition: () => number,
  setScrollPosition: (scrollPosition: number) => void
] {
  const context = useContext(NFTGalleryScrollPositionContext);

  if (!context) {
    throw new Error('useNFTGalleryScrollPosition must be used within a NFTGalleryScrollPositionProvider');
  }

  return [context.getScrollPosition, context.setScrollPosition];
}

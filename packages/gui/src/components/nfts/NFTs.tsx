import React from 'react';
import { Routes, Route } from 'react-router-dom';

import NFTDetail from './detail/NFTDetailV2';
import NFTGallery from './gallery/NFTGallery';
import NFTGalleryScrollPositionProvider from './gallery/NFTGalleryScrollPositionProvider';

/* ========================================================================== */

export default function NFTs() {
  return (
    /*
    Install Contexts:

    NFTFilterProvider: This context is used to store the filter values for the NFT gallery.

    NFTGalleryScrollPositionProvider: This context supports storing/restoring the scroll
    position only when navigating within NFT screens. This allows the user to navigate into
    NFT details, and then back to the gallery without losing the scroll position. When
    navigating to other non-NFT screens, and then back, the scroll position is reset to the
    top.
    */

    <NFTGalleryScrollPositionProvider>
      <Routes>
        <Route index element={<NFTGallery />} />
        <Route path=":nftId" element={<NFTDetail />} />
      </Routes>
    </NFTGalleryScrollPositionProvider>
  );
}

import React from 'react';
import { Routes, Route } from 'react-router-dom';

import NFTDetail from './detail/NFTDetailV2';
import NFTGallery from './gallery/NFTGallery';

/* ========================================================================== */

export default function NFTs() {
  return (
    <Routes>
      <Route index element={<NFTGallery />} />
      <Route path=":nftId" element={<NFTDetail />} />
    </Routes>
  );
}

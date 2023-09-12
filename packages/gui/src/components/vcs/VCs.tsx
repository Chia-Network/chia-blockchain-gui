import { useSerializedNavigationState } from '@chia-network/core';
import React from 'react';
import { Routes, Route } from 'react-router-dom';

import VCDetail from './VCDetail';
import VCList from './VCList';

export default function VCs() {
  const { getLocationState } = useSerializedNavigationState();
  const locationState = getLocationState();
  return (
    <Routes>
      <Route index element={<VCList />} />
      <Route path=":vcId" element={<VCDetail coinId={locationState?.coinId} />} />
    </Routes>
  );
}

import { Flex, LayoutDashboardSub } from '@chia/core';
import React from 'react';
import { Route, Routes } from 'react-router-dom';

import PlotNFTAbsorbRewards from '../plotNFT/PlotNFTAbsorbRewards';
import PlotNFTAdd from '../plotNFT/PlotNFTAdd';
import PlotNFTChangePool from '../plotNFT/PlotNFTChangePool';
import { PoolHeaderSource } from './PoolHeader';
import PoolOverview from './PoolOverview';

export default function Pool() {
  return (
    <LayoutDashboardSub>
      <Flex flexDirection="column" gap={3}>
        <Routes>
          <Route element={<PoolOverview />} index />
          <Route path="add" element={<PlotNFTAdd headerTag={PoolHeaderSource} />} />
          <Route path=":plotNFTId/change-pool" element={<PlotNFTChangePool headerTag={PoolHeaderSource} />} />
          <Route path=":plotNFTId/absorb-rewards" element={<PlotNFTAbsorbRewards headerTag={PoolHeaderSource} />} />
        </Routes>
      </Flex>
    </LayoutDashboardSub>
  );
}

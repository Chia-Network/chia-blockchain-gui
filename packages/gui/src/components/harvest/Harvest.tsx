import { Flex, LayoutDashboardSub } from '@chia-network/core';
import React from 'react';
import { Route, Routes } from 'react-router-dom';

import PlotAdd from '../plot/add/PlotAdd';
import HarvesterOverview from './HarvesterOverview';

export default function Harvester() {
  return (
    <LayoutDashboardSub>
      <Flex flexDirection="column" gap={3}>
        <Routes>
          <Route index element={<HarvesterOverview />} />
          <Route path="add" element={<PlotAdd />} />
        </Routes>
      </Flex>
    </LayoutDashboardSub>
  );
}

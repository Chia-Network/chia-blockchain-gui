import { Flex, LayoutDashboardSub } from '@chia-network/core';
import React from 'react';
import { Route, Routes } from 'react-router-dom';

import PlotAdd from './add/PlotAdd';
import PlotOverview from './overview/PlotOverview';

export default function Plot() {
  return (
    <LayoutDashboardSub>
      <Flex flexDirection="column" gap={3}>
        <Routes>
          <Route index element={<PlotOverview />} />
          <Route path="add" element={<PlotAdd />} />
        </Routes>
      </Flex>
    </LayoutDashboardSub>
  );
}

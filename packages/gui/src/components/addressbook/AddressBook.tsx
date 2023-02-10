import { LayoutDashboardSub } from '@chia-network/core';
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

import AddAddress from './AddAddress';
import ListAddress from './ListAddress';

export function AddressBook() {
  return (
    <LayoutDashboardSub>
      <Routes>
        <Route path="list" element={<ListAddress />} />
        <Route path="add" element={<AddAddress />} />
        <Route path="/" element={<Navigate to="list" />} />
      </Routes>
    </LayoutDashboardSub>
  );
}

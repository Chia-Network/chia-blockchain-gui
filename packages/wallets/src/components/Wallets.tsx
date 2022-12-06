import { LayoutDashboardSub } from '@chia-network/core';
import React from 'react';
import { Navigate, Routes, Route } from 'react-router-dom';

import Wallet from './Wallet';
import WalletsSidebar from './WalletsSidebar';

export default function Wallets() {
  return (
    <Routes>
      <Route element={<LayoutDashboardSub sidebar={<WalletsSidebar />} outlet />}>
        <Route path=":walletId" element={<Wallet />} />
        <Route path="*" element={<Navigate to="1" />} />
      </Route>
    </Routes>
  );
}

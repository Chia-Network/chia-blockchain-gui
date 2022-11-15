import { LayoutDashboardSub } from '@chia/core';
import React from 'react';
import { Navigate , Routes, Route } from 'react-router-dom';

import Wallet from './Wallet';
import WalletsSidebar from './WalletsSidebar';
import WalletCreate from './create/WalletCreate';

export default function Wallets() {
  return (
    <Routes>
      <Route element={<LayoutDashboardSub outlet />}>
        <Route path="create/*" element={<WalletCreate />} />
      </Route>
      <Route
        element={<LayoutDashboardSub sidebar={<WalletsSidebar />} outlet />}
      >
        <Route path=":walletId" element={<Wallet />} />
        <Route path="*" element={<Navigate to="1" />} />
      </Route>
    </Routes>
  );
}

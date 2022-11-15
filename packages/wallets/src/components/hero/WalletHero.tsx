import React from 'react';
import { Routes, Route } from 'react-router-dom';

import WalletHeroAdd from './WalletHeroAdd';
import WalletHeroWallets from './WalletHeroWallets';

export default function Wallets() {
  return (
    <Routes>
      <Route path="wallets" element={<WalletHeroWallets />} />
      <Route path="wallets/add" element={<WalletHeroAdd />} />
    </Routes>
  );
}

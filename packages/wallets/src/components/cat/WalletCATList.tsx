import React from 'react';
import { Routes, Route } from 'react-router-dom';

import WalletCATCreateExistingSimple from './WalletCATCreateExistingSimple';
import WalletCATSelect from './WalletCATSelect';

export default function WalletCATList() {
  return (
    <Routes>
      <Route element={<WalletCATSelect />} index />
      <Route path="existing" element={<WalletCATCreateExistingSimple />} />
    </Routes>
  );
}

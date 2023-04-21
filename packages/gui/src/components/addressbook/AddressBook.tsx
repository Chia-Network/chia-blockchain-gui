import { LayoutDashboardSub } from '@chia-network/core';
import React from 'react';
import { Routes, Route } from 'react-router-dom';

import AddressBookSideBar from './AddressBookSideBar';
import ContactAdd from './ContactAdd';
import ContactEdit from './ContactEdit';
import ContactSummary from './ContactSummary';

export default function AddressBook() {
  return (
    <Routes>
      <Route element={<LayoutDashboardSub sidebar={<AddressBookSideBar />} outlet />}>
        <Route path="/new" element={<ContactAdd />} />
        <Route path="edit/:contactid" element={<ContactEdit />} />
        <Route path=":contactid" element={<ContactSummary />} />
        <Route path="*" element={<div />} />
      </Route>
    </Routes>
  );
}

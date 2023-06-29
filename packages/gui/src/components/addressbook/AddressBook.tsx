import { LayoutDashboardSub } from '@chia-network/core';
import React from 'react';
import { Routes, Route } from 'react-router-dom';

import AddressBookSideBar from './AddressBookSideBar';
import ContactAdd from './ContactAdd';
import ContactEdit from './ContactEdit';
import ContactSummary from './ContactSummary';
import MyContact from './MyContact';

export default function AddressBook() {
  return (
    <Routes>
      <Route element={<LayoutDashboardSub sidebar={<AddressBookSideBar />} outlet />}>
        <Route path="/myContact" element={<MyContact />} />
        <Route path="/new" element={<ContactAdd />} />
        <Route path="edit/:contactId" element={<ContactEdit />} />
        <Route path=":contactId" element={<ContactSummary />} />
        <Route path="*" element={<MyContact />} />
      </Route>
    </Routes>
  );
}

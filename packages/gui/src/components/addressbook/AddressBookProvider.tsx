import { useAddressBook } from '@chia-network/core';
import React, { createContext, useEffect, useMemo } from 'react';

const initialState = {
  addressBook: [],
};

export const AddressBookContext = createContext(initialState);

export default function AddressBookProvider({ children }) {
  const [addressBook, addContact, removeContact, getContactByContactId, editContact, getContactByAddress] =
    useAddressBook();

  const value = useMemo(
    () => [addressBook, addContact, removeContact, getContactByContactId, editContact, getContactByAddress],
    [addressBook, addContact, removeContact, getContactByContactId, editContact, getContactByAddress]
  );

  useEffect(() => {}, []);
  return <AddressBookContext.Provider value={value}>{children}</AddressBookContext.Provider>;
}

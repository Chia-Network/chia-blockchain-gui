import React, { createContext, useMemo } from 'react';

import useAddressBook from '../../hooks/useAddressBook';

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

  return <AddressBookContext.Provider value={value}>{children}</AddressBookContext.Provider>;
}

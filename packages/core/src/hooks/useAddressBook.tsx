import { useState, useEffect } from 'react';

export default function useAddressBook(): [
  AddressContact[] | undefined, // contacts
  (
    name: string,
    addresses: ContactAddress[],
    dids: ContactDID[],
    notes: string,
    nftid: string,
    domainnames: ContactDomainName[]
  ) => void, // addContact
  (contactid: number) => void, // removeContact
  (contactid: number) => AddressContact | undefined, // getContactContactId
  (contact: AddressContact, contactid: number) => void,
  (address: string) => AddressContact | undefined // getContactByAddress
] {
  // editContact
  const [addressBook, setAddressBook] = useState<AddressContact[]>([]);
  const LOCAL_STORAGE_KEY = 'addressbook';
  const contactBookJSON = JSON.stringify(addressBook);
  useEffect(() => {
    if (localStorage.getItem(LOCAL_STORAGE_KEY) === undefined || localStorage.getItem(LOCAL_STORAGE_KEY) === null) {
      setAddressBook([]);
    } else {
      const addresses: AddressContact[] = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY));
      setAddressBook([...addresses]);
    }
  }, []);

  useEffect(() => {
    if (addressBook !== undefined) localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(addressBook));
  }, [contactBookJSON, addressBook]);

  function getNewContactId(): number {
    if (addressBook.length === 0 || addressBook === undefined) return 1;
    return Math.max(...addressBook.map((o) => o.contactid)) + 1;
  }

  function addContact(
    name: string,
    addresses: ContactAddress[],
    dids: ContactDID[],
    notes: string,
    nftid: string,
    domainnames: ContactDomainName[]
  ) {
    const contactid = getNewContactId();
    const newAddress: AddressContact = {
      contactid,
      name,
      addresses: [...addresses],
      dids,
      notes,
      nftid,
      domainnames,
    };

    setAddressBook([...addressBook, newAddress]);
  }

  function removeContact(contactId: number) {
    const filteredContacts = addressBook.filter((contact) => contact.contactid !== contactId);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(filteredContacts));
    setAddressBook([...filteredContacts]);
  }

  function getContactByContactId(contactid: number) {
    const found = addressBook.find((contact) => contact.contactid === contactid);
    return found;
  }

  function editContact(contact: AddressContact, contactid: number) {
    const found = addressBook.find((c) => c.contactid === contactid);
    return found;
  }

  function getContactByAddress(address: string) {
    const result = addressBook.find(
      (ab) => ab.addresses !== undefined && ab.addresses.some((c) => c.address === address)
    );
    return result;
  }

  return [addressBook, addContact, removeContact, getContactByContactId, editContact, getContactByAddress];
}

interface AddressContact {
  contactid: number;
  name: string;
  addresses: ContactAddress[];
  dids: ContactDID[];
  notes: string;
  nftid: string;
  domainnames: ContactDomainName[];
}

interface ContactAddress {
  name: string;
  address: string;
}

interface ContactDID {
  did: string;
}

interface ContactDomainName {
  domainname: string;
}

import { useCallback, useState, useEffect } from 'react';

export default function useAddressBook(): [
  AddressContact[] | undefined, // contacts
  (
    name: string,
    addresses: ContactAddress[],
    dids: ContactDID[],
    notes: string,
    nftid: string,
    domainNames: ContactDomainName[]
  ) => void, // addContact
  (contactId: number) => void, // removeContact
  (contactId: number) => AddressContact | undefined, // getContactContactId
  (
    contactId: number,
    name: string,
    addresses: ContactAddress[],
    dids: ContactDID[],
    notes: string,
    nftid: string,
    domainNames: ContactDomainName[]
  ) => void, // editContact
  (address: string) => AddressContact | undefined // getContactByAddress
] {
  // editContact
  const [addressBook, setAddressBook] = useState<AddressContact[]>([]);

  const updateAddressBook = useCallback((contacts) => {
    (window as any).ipcRenderer.invoke('saveAddressBook', contacts);
    setAddressBook(contacts);
  }, []);

  useEffect(() => {
    async function getAddressBook() {
      const contacts = await (window as any).ipcRenderer.invoke('readAddressBook');
      setAddressBook(contacts);
    }

    getAddressBook();
  }, []);

  function getNewContactId(): number {
    if (addressBook.length === 0 || addressBook === undefined) return 1;
    return Math.max(...addressBook.map((o) => o.contactId)) + 1;
  }

  function addContact(
    name: string,
    addresses: ContactAddress[],
    dids: ContactDID[],
    notes: string,
    nftid: string,
    domainNames: ContactDomainName[]
  ) {
    const contactId = getNewContactId();
    const newAddress: AddressContact = {
      contactId,
      name,
      addresses: [...addresses],
      dids,
      notes,
      nftid,
      domainNames,
    };

    updateAddressBook([...addressBook, newAddress]);
  }

  function removeContact(contactId: number) {
    const filteredContacts = addressBook.filter((contact) => contact.contactId !== contactId);
    updateAddressBook([...filteredContacts]);
  }

  function getContactByContactId(contactId: number) {
    const found = addressBook.find((contact) => contact.contactId === contactId);
    return found;
  }

  function editContact(
    contactId: number,
    name: string,
    addresses: ContactAddress[],
    dids: ContactDID[],
    notes: string,
    nftid: string,
    domainNames: ContactDomainName[]
  ) {
    const filteredContacts = addressBook.filter((contact) => contact.contactId !== contactId);

    const newAddress: AddressContact = {
      contactId,
      name,
      addresses: [...addresses],
      dids,
      notes,
      nftid,
      domainNames,
    };

    updateAddressBook([...filteredContacts, newAddress]);
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
  contactId: number;
  name: string;
  addresses: ContactAddress[];
  dids: ContactDID[];
  notes: string;
  nftid: string;
  domainNames: ContactDomainName[];
}

interface ContactAddress {
  name: string;
  address: string;
}

interface ContactDID {
  name: string;
  did: string;
}

interface ContactDomainName {
  name: string;
  domain: string;
}

import { useState, useEffect } from 'react';

export default function useAddressBook(): [
  IAddressContact[],
  (friendName: string, address: string) => void,
  (address: string) => IAddressContact | undefined
] {
  const [addressBook, setAddressBook] = useState<IAddressContact[]>([]);

  function getAddressBook() {
    if (localStorage.getItem('addressbook') === null) {
      return [];
    }
    const addresses: IAddressContact[] = JSON.parse(localStorage.getItem('addressbook'));
    setAddressBook(addresses);
  }

  function addAddress(friendlyName: string, address: string) {
    const newAddress: IAddressContact = {
      friendlyname: friendlyName,
      address,
    };
    addressBook.push(newAddress);
    setAddressBook(addressBook);
    localStorage.setItem('addressbook', JSON.stringify(addressBook));
  }

  function getContactByAddress(findAddress: string): IAddressContact | undefined {
    const existing = addressBook.find((x) => x.address.toLowerCase() === findAddress.toLowerCase());
    return existing;
  }

  useEffect(() => {
    getAddressBook();
  }, []);

  return [addressBook, addAddress, getContactByAddress];
}

interface IAddressContact {
  friendlyname: string;
  address: string;
}

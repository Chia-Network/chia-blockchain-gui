export interface AddressBookEntry {
  name: string;
  address: string;
}

export interface AddressBook {
  entries: AddressBookEntry[];
}

export interface AddressBookService {
  read(): Promise<AddressBook>;
  save(addressBook: AddressBook): Promise<void>;
}

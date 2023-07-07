import path from 'path';

import { getUserDataDir } from '../util/userData';
import { readData, writeData } from './utils/yamlUtils';

function getAddressBookPath() {
  const userDataDir = getUserDataDir();
  if (!userDataDir) {
    throw new Error('userDataDir needs to be initialized');
  }
  return path.join(userDataDir, 'contacts.yaml');
}

export function readAddressBook(): string {
  const contacts = readData(getAddressBookPath());
  const contactsJSON = JSON.stringify(contacts);
  return contactsJSON;
}

export function saveAddressBook(contactsJSON: string): void {
  try {
    if (!contactsJSON) {
      return;
    }
    const addressBookPath = getAddressBookPath();
    const contacts = JSON.parse(contactsJSON);
    writeData(contacts, addressBookPath);
  } catch (e) {
    console.warn(e);
  }
}

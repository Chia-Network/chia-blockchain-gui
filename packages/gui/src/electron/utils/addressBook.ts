import path from 'node:path';

import { getUserDataDir } from './userData';
import { readData, writeData } from './yamlUtils';

function getAddressBookPath() {
  const userDataDir = getUserDataDir();
  if (!userDataDir) {
    throw new Error('userDataDir needs to be initialized');
  }
  return path.join(userDataDir, 'contacts.yaml');
}

export function readAddressBook(): any[] {
  const result = readData(getAddressBookPath());
  const contacts = result?.contacts || [];
  return contacts;
}

export function saveAddressBook(contacts: any[]): void {
  try {
    const addressBookPath = getAddressBookPath();
    const data = { contacts: contacts || [] };
    writeData(data, addressBookPath);
  } catch (e) {
    console.warn(e);
  }
}

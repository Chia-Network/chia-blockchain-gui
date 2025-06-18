import API from '../constants/API';

import type AddressBookService from './AddressBookService';
import type AppService from './AppService';
import type PreferencesService from './PreferencesService';

declare global {
  interface Window {
    [API.APP]: AppService;
    [API.PREFERENCES]: PreferencesService;
    [API.ADDRESS_BOOK]: AddressBookService;
  }
}

// this export is needed to make this file a module
export {};

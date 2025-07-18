import API from '../constants/API';

import type AddressBookService from './AddressBookService';
import type AppService from './AppService';
import type CacheService from './CacheService';
import type ChiaLogsService from './ChiaLogsService';
import type LinkService from './LinkService';
import type PreferencesService from './PreferencesService';
import type WebSocketService from './WebSocketService';

declare global {
  interface Window {
    [API.APP]: AppService;
    [API.CACHE]: CacheService;
    [API.CHIA_LOGS]: ChiaLogsService;
    [API.LINK]: LinkService;
    [API.PREFERENCES]: PreferencesService;
    [API.WEBSOCKET]: WebSocketService;
    [API.ADDRESS_BOOK]: AddressBookService;
  }
}

declare module '*.module.css' {
  const classes: { [key: string]: string };
  export default classes;
}

// this export is needed to make this file a module
export {};

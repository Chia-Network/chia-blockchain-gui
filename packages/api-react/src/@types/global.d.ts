import API from '../constants/API';

import type AppService from './AppService';
import type CacheService from './CacheService';
import type ChiaLogsService from './ChiaLogsService';
import type LinkService from './LinkService';
import type PreferencesService from './PreferencesService';

declare global {
  interface Window {
    [API.APP]: AppService;
    [API.CACHE]: CacheService;
    [API.CHIA_LOGS]: ChiaLogsService;
    [API.LINK]: LinkService;
    [API.PREFERENCES]: PreferencesService;
  }
}

// this export is needed to make this file a module
export {};

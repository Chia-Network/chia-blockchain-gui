import { createContext } from 'react';

import type CacheService from '../../@types/CacheService';

const CacheContext = createContext<
  | (Omit<CacheService, 'getCacheDirectory' | 'getCacheSize' | 'getMaxCacheSize'> & {
      cacheDirectory: string | undefined;
      cacheSize: number | undefined;
      maxCacheSize: number | undefined;
    })
  | undefined
>(undefined);

export default CacheContext;

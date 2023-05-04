import { createContext } from 'react';

import type CacheAPI from '../../@types/CacheAPI';

const CacheContext = createContext<
  | (Omit<CacheAPI, 'getCacheDirectory' | 'getCacheSize' | 'getMaxCacheSize'> & {
      cacheDirectory: string | undefined;
      cacheSize: number | undefined;
      maxCacheSize: number | undefined;
    })
  | undefined
>(undefined);

export default CacheContext;

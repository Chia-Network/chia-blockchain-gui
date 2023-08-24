import type CacheState from '../constants/CacheState';

import type Headers from './Headers';

type CacheInfoBase =
  | {
      state: CacheState.NOT_CACHED;
    }
  | {
      state: CacheState.CACHED;
      headers: Headers;
      checksum: string;
    }
  | {
      state: CacheState.ERROR;
      error: string;
    };

export default CacheInfoBase;

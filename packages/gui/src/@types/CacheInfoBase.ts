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
      // How many times in a row the download has failed with a transient
      // error, so retries can back off and eventually stop (CacheManager).
      retries?: number;
      // For ipfs:// URLs: the gateway base the failed request went through,
      // so a later gateway change retries the entry immediately.
      gateway?: string;
    };

export default CacheInfoBase;

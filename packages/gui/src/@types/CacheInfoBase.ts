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
      // When the failed transfer started, recorded for a failure to reach the
      // gateway host: a recovery of the gateway after that moment releases the
      // entry for retry even if it was written after the recovery (CacheManager).
      startedAt?: number;
      // For a size-limit failure: the cap the attempt ran under, so a later
      // caller is retried only when it allows more.
      maxSize?: number;
      // The caller's time limits, recorded only when that limit ended the
      // transfer. A larger caller must not inherit a smaller caller's cap.
      maxDuration?: number;
      timeout?: number;
    };

export default CacheInfoBase;

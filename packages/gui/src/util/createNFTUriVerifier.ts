import type CacheService from '../@types/CacheService';
import type { NFTPreviewState } from '../hooks/selectNFTPreviewState';

import compareChecksums from './compareChecksums';
import { MAX_URIS_PER_CANDIDATE } from './getNFTPreviewStatusFromCache';

// One verifier belongs to one NFT/input generation. Excluding an unsupported
// file reuses previous decisions rather than repeating a shrinking URI walk's
// IPC requests. Bound both the walk and memo, including failures and joins.
export default function createNFTUriVerifier(getChecksum: CacheService['getChecksum'], maxSize?: number) {
  const outcomes = new Map<string, Promise<NFTPreviewState>>();
  return async (uris: string[] | undefined, hash: string | undefined, excluded = new Set<string>()) => {
    if (!hash) {
      return undefined;
    }
    let first: NFTPreviewState | undefined;
    for (const uri of (uris ?? []).slice(0, MAX_URIS_PER_CANDIDATE)) {
      if (!excluded.has(uri)) {
        const key = JSON.stringify([uri, hash]);
        let pending = outcomes.get(key);
        if (!pending) {
          pending = Promise.resolve()
            .then(() => getChecksum(uri, { maxSize }))
            .then<NFTPreviewState, NFTPreviewState>(
              (checksum) =>
                compareChecksums(checksum, hash)
                  ? { uri, isVerified: true }
                  : { uri, isVerified: false, failedFetch: false, error: new Error('Invalid hash checksum') },
              (error: Error) => ({ uri, isVerified: false, failedFetch: true, error }),
            );
          if (outcomes.size >= MAX_URIS_PER_CANDIDATE * 3) {
            outcomes.delete(outcomes.keys().next().value!);
          }
          outcomes.set(key, pending);
        }
        // eslint-disable-next-line no-await-in-loop -- Preserve minter order and mismatch priority.
        const state = await pending;
        if (state.isVerified) {
          return state;
        }
        if (!first || (first.failedFetch && state.failedFetch === false)) {
          first = state;
        }
      }
    }
    return first;
  };
}

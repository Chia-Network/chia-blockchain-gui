import type { CacheRequestOptions } from '../@types/CacheService';
import type Metadata from '../@types/Metadata';

export const CHECKSUM_MISMATCH_ERROR = 'Checksum mismatch';
export const MAX_METADATA_URI_ATTEMPTS = 5;
export const METADATA_URI_BUDGET_MS = 60_000;
// A metadata file is a JSON document a few kilobytes long; the confirmation
// dialog's own metadata fetch allows 5 MiB, and the gallery's fetch allows the
// same. The download cap for video would let a minter hand the renderer
// 100 MB to parse on the UI thread.
export const METADATA_MAX_SIZE = 5 * 1024 * 1024;

export type FetchMetadata = (uri: string, hash: string | undefined, options: CacheRequestOptions) => Promise<Metadata>;

/** Ordered, hash-checked copies of an NFT's metadata, with bounded work.
 * Reserve an equal share of the 60-second TRANSFER allowance for each of
 * at most five candidates. Each share is enforced by the main process after
 * limiter admission (including the FIRST request). Thus queue wait does not
 * consume a fallback's allowance, but five slow hosts cannot consume five
 * video-sized deadlines. Unused shares are not lent to other candidates.
 *
 * The secondary admission clock still stops starting further fallbacks after
 * 60 seconds following the first failure; it is not the security bound. A
 * queued operation can outlive that clock, while its active transfer cannot
 * outlive its reserved share. This is not a 60-second end-to-end wall clock.
 * Without a hash, preserve the existing single-URI compatibility policy.
 */
export default async function fetchMetadataFromUris(
  uris: string[] | undefined,
  hash: string | undefined,
  fetchOne: FetchMetadata,
): Promise<Metadata> {
  if (!Array.isArray(uris) || uris.length === 0) {
    throw new Error('No metadata URI');
  }

  const candidates = uris.slice(0, hash ? MAX_METADATA_URI_ATTEMPTS : 1);
  const maxDuration = Math.floor(METADATA_URI_BUDGET_MS / candidates.length);
  let deadline: number | undefined;
  let firstError: Error | undefined;
  let mismatchError: Error | undefined;

  for (const uri of candidates) {
    if (deadline !== undefined && Date.now() >= deadline) {
      break;
    }

    try {
      // One cache operation returns all bytes/headers/hash for this candidate;
      // no hidden second or third transfer can spend the share again.
      // eslint-disable-next-line no-await-in-loop -- Ordered fallback copies.
      return await fetchOne(uri, hash, { maxDuration });
    } catch (e) {
      const error = e instanceof Error ? e : new Error(String(e));
      deadline ??= Date.now() + METADATA_URI_BUDGET_MS;
      firstError ??= error;
      if (!mismatchError && error.message === CHECKSUM_MISMATCH_ERROR) {
        mismatchError = error;
      }
    }
  }

  throw mismatchError ?? firstError ?? new Error('No metadata URI');
}

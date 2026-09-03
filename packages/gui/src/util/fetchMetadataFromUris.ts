import type Metadata from '../@types/Metadata';

export const CHECKSUM_MISMATCH_ERROR = 'Checksum mismatch';

export type FetchMetadata = (uri: string, hash: string | undefined) => Promise<Metadata>;

/**
 * Fetches an NFT's metadata from the first of its metadata URIs that serves
 * it. NFTs commonly record several copies of their metadata (an HTTPS
 * gateway URL and an ipfs:// URI, say); a host that is down, rate limiting or
 * challenging the request must not hide the metadata while another copy is
 * reachable — data files already fall through their URI list this way.
 *
 * When every URI fails, a checksum mismatch outranks a download failure: a
 * file that does not match the on-chain hash must be reported as such, not
 * as merely unavailable. Otherwise the first failure is reported, since the
 * first URI is the one the minter considered canonical.
 */
export default async function fetchMetadataFromUris(
  uris: string[] | undefined,
  hash: string | undefined,
  fetchOne: FetchMetadata,
): Promise<Metadata> {
  if (!uris || uris.length === 0) {
    throw new Error('No metadata URI');
  }

  let firstError: Error | undefined;
  let mismatchError: Error | undefined;

  for (const uri of uris) {
    try {
      // eslint-disable-next-line no-await-in-loop -- the URIs are fallbacks for each other, tried in order
      return await fetchOne(uri, hash);
    } catch (e) {
      const error = e as Error;
      firstError ??= error;
      if (!mismatchError && error.message === CHECKSUM_MISMATCH_ERROR) {
        mismatchError = error;
      }
    }
  }

  throw mismatchError ?? firstError ?? new Error('No metadata URI');
}

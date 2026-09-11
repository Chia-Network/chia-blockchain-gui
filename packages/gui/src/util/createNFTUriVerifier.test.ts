import createNFTUriVerifier from './createNFTUriVerifier';
import { MAX_URIS_PER_CANDIDATE } from './getNFTPreviewStatusFromCache';

const HASH = 'a'.repeat(64);
const WRONG_HASH = 'b'.repeat(64);

describe('NFT URI verification', () => {
  it('reuses earlier outcomes across repeated media exclusions', async () => {
    const getChecksum = jest.fn(async () => HASH);
    const verify = createNFTUriVerifier(getChecksum);
    const uris = Array.from({ length: MAX_URIS_PER_CANDIDATE }, (_, i) => `https://example.com/${i}`);
    const excluded = new Set<string>();
    for (const uri of uris) {
      // eslint-disable-next-line no-await-in-loop -- Simulate successive decoder failures.
      expect((await verify(uris, HASH, excluded))?.uri).toBe(uri);
      excluded.add(uri);
    }
    expect(await verify(uris, HASH, excluded)).toBeUndefined();
    expect(getChecksum).toHaveBeenCalledTimes(MAX_URIS_PER_CANDIDATE);
  });

  it('memoizes failures too, preserving mismatch priority on later passes', async () => {
    const getChecksum = jest.fn(async (uri: string) => {
      if (uri.endsWith('network')) {
        throw new Error('HTTP error: 503');
      }
      return WRONG_HASH;
    });
    const verify = createNFTUriVerifier(getChecksum);
    const uris = ['https://example.com/network', 'https://example.com/mismatch'];
    expect(await verify(uris, HASH)).toMatchObject({ uri: uris[1], failedFetch: false });
    expect(await verify(uris, HASH)).toMatchObject({ uri: uris[1], failedFetch: false });
    expect(getChecksum).toHaveBeenCalledTimes(2);
  });

  it('bounds the original list before exclusions and never fetches without a hash', async () => {
    const getChecksum = jest.fn(async () => WRONG_HASH);
    const verify = createNFTUriVerifier(getChecksum);
    const uris = Array.from({ length: 1000 }, (_, i) => `https://example.com/${i}`);
    expect(await verify(uris, undefined)).toBeUndefined();
    await verify(uris, HASH, new Set(uris.slice(0, 2)));
    expect(getChecksum).toHaveBeenCalledTimes(MAX_URIS_PER_CANDIDATE - 2);
    expect(getChecksum).not.toHaveBeenCalledWith(uris[MAX_URIS_PER_CANDIDATE], expect.anything());
  });

  it('coalesces overlapping passes and a new generation retries settled failures', async () => {
    const getChecksum = jest.fn(async () => {
      throw new Error('HTTP error: 503');
    });
    const verify = createNFTUriVerifier(getChecksum);
    await Promise.all([verify(['https://example.com/a'], HASH), verify(['https://example.com/a'], HASH)]);
    expect(getChecksum).toHaveBeenCalledTimes(1);
    await createNFTUriVerifier(getChecksum)(['https://example.com/a'], HASH);
    expect(getChecksum).toHaveBeenCalledTimes(2);
  });
});

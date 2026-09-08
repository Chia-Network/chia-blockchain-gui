import fetchMetadataFromUris, {
  CHECKSUM_MISMATCH_ERROR,
  MAX_METADATA_URI_ATTEMPTS,
  METADATA_URI_BUDGET_MS,
} from './fetchMetadataFromUris';

const METADATA = { name: 'Test NFT' };
const HTTPS_URI = 'https://nftstorage.link/ipfs/bafybeigdyrztest/metadata.json';
const IPFS_URI = 'ipfs://bafybeigdyrztest/metadata.json';

describe('fetchMetadataFromUris', () => {
  it('bounds attempt count and reserves a total transfer allowance including the first URI', async () => {
    const uris = Array.from({ length: 20 }, (_, i) => `https://host-${i}.example/metadata.json`);
    const fetchOne = jest.fn().mockRejectedValue(new Error('HTTP error: 503'));
    await expect(fetchMetadataFromUris(uris, 'ab', fetchOne)).rejects.toThrow('HTTP error: 503');
    expect(fetchOne).toHaveBeenCalledTimes(MAX_METADATA_URI_ATTEMPTS);
    expect(fetchOne).toHaveBeenLastCalledWith(uris[MAX_METADATA_URI_ATTEMPTS - 1], 'ab', { maxDuration: 12_000 });
    const reserved = fetchOne.mock.calls.reduce((sum, [, , options]) => sum + options.maxDuration, 0);
    expect(reserved).toBe(METADATA_URI_BUDGET_MS);
  });

  it('reserves half the transfer allowance for each of two copies', async () => {
    const fetchOne = jest.fn().mockRejectedValueOnce(new Error('HTTP error: 503')).mockResolvedValueOnce(METADATA);
    await expect(fetchMetadataFromUris([HTTPS_URI, IPFS_URI], 'ab', fetchOne)).resolves.toEqual(METADATA);
    expect(fetchOne).toHaveBeenNthCalledWith(1, HTTPS_URI, 'ab', { maxDuration: 30_000 });
    expect(fetchOne).toHaveBeenNthCalledWith(2, IPFS_URI, 'ab', { maxDuration: 30_000 });
  });

  it('starts no further fallback after the secondary admission budget expires', async () => {
    let now = Date.now();
    const spy = jest.spyOn(Date, 'now').mockImplementation(() => now);
    const fetchOne = jest
      .fn()
      .mockRejectedValueOnce(new Error('HTTP error: 503'))
      .mockImplementationOnce(async () => {
        // This may include queue time; the actual transfer still has its own cap.
        now += METADATA_URI_BUDGET_MS;
        throw new Error('Request timed out after 30000ms of inactivity');
      })
      .mockResolvedValueOnce(METADATA);
    try {
      await expect(
        fetchMetadataFromUris([HTTPS_URI, IPFS_URI, 'https://mirror.example/m.json'], 'ab', fetchOne),
      ).rejects.toThrow('HTTP error: 503');
      expect(fetchOne).toHaveBeenCalledTimes(2);
    } finally {
      spy.mockRestore();
    }
  });

  it('does not burn the fallback admission window in the first request queue', async () => {
    let now = Date.now();
    const spy = jest.spyOn(Date, 'now').mockImplementation(() => now);
    const fetchOne = jest
      .fn()
      .mockImplementationOnce(async () => {
        now += 10 * METADATA_URI_BUDGET_MS;
        throw new Error('HTTP error: 403');
      })
      .mockResolvedValueOnce(METADATA);
    try {
      await expect(fetchMetadataFromUris([HTTPS_URI, IPFS_URI], 'ab', fetchOne)).resolves.toEqual(METADATA);
      expect(fetchOne).toHaveBeenCalledTimes(2);
      expect(fetchOne).toHaveBeenNthCalledWith(1, HTTPS_URI, 'ab', { maxDuration: 30_000 });
    } finally {
      spy.mockRestore();
    }
  });

  it('keeps falling through while the admission budget lasts', async () => {
    let now = Date.now();
    const spy = jest.spyOn(Date, 'now').mockImplementation(() => now);
    const fetchOne = jest
      .fn()
      .mockRejectedValueOnce(new Error('HTTP error: 504'))
      .mockImplementationOnce(async () => {
        now += METADATA_URI_BUDGET_MS / 2;
        throw new Error('HTTP error: 504');
      })
      .mockResolvedValueOnce(METADATA);
    try {
      await expect(
        fetchMetadataFromUris([HTTPS_URI, IPFS_URI, 'https://mirror.example/m.json'], 'ab', fetchOne),
      ).resolves.toEqual(METADATA);
      expect(fetchOne).toHaveBeenCalledTimes(3);
    } finally {
      spy.mockRestore();
    }
  });

  it('preserves one bounded first-URI fetch when there is no metadata hash', async () => {
    const fetchOne = jest.fn().mockRejectedValue(new Error('HTTP error: 503'));
    await expect(fetchMetadataFromUris([HTTPS_URI, IPFS_URI], undefined, fetchOne)).rejects.toThrow('HTTP error: 503');
    await expect(fetchMetadataFromUris([HTTPS_URI, IPFS_URI], '', fetchOne)).rejects.toThrow('HTTP error: 503');
    expect(fetchOne).toHaveBeenCalledTimes(2);
    expect(fetchOne).toHaveBeenNthCalledWith(1, HTTPS_URI, undefined, { maxDuration: METADATA_URI_BUDGET_MS });
    expect(fetchOne).toHaveBeenNthCalledWith(2, HTTPS_URI, '', { maxDuration: METADATA_URI_BUDGET_MS });
  });

  it('returns the first success without fetching additional copies', async () => {
    const fetchOne = jest.fn().mockResolvedValue(METADATA);
    await expect(fetchMetadataFromUris([HTTPS_URI, IPFS_URI], 'ab', fetchOne)).resolves.toEqual(METADATA);
    expect(fetchOne).toHaveBeenCalledTimes(1);
    expect(fetchOne).toHaveBeenCalledWith(HTTPS_URI, 'ab', { maxDuration: 30_000 });
  });

  it('reports the first failure when no checksum mismatch was observed', async () => {
    const fetchOne = jest
      .fn()
      .mockRejectedValueOnce(new Error('HTTP error: 504'))
      .mockRejectedValueOnce(new Error('IPFS gateway fetching is disabled'));
    await expect(fetchMetadataFromUris([HTTPS_URI, IPFS_URI], 'ab', fetchOne)).rejects.toThrow('HTTP error: 504');
  });

  it('reports checksum mismatch in preference to a download failure', async () => {
    const fetchOne = jest
      .fn()
      .mockRejectedValueOnce(new Error('HTTP error: 504'))
      .mockRejectedValueOnce(new Error(CHECKSUM_MISMATCH_ERROR));
    await expect(fetchMetadataFromUris([HTTPS_URI, IPFS_URI], 'ab', fetchOne)).rejects.toThrow(CHECKSUM_MISMATCH_ERROR);
  });

  it('continues after mismatch when another copy can match', async () => {
    const fetchOne = jest
      .fn()
      .mockRejectedValueOnce(new Error(CHECKSUM_MISMATCH_ERROR))
      .mockResolvedValueOnce(METADATA);
    await expect(fetchMetadataFromUris([HTTPS_URI, IPFS_URI], 'ab', fetchOne)).resolves.toEqual(METADATA);
  });

  it('rejects missing or malformed lists without fetching', async () => {
    const fetchOne = jest.fn();
    await expect(fetchMetadataFromUris([], 'ab', fetchOne)).rejects.toThrow('No metadata URI');
    await expect(fetchMetadataFromUris(undefined, 'ab', fetchOne)).rejects.toThrow('No metadata URI');
    await expect(fetchMetadataFromUris('not an array' as unknown as string[], 'ab', fetchOne)).rejects.toThrow(
      'No metadata URI',
    );
    expect(fetchOne).not.toHaveBeenCalled();
  });
});

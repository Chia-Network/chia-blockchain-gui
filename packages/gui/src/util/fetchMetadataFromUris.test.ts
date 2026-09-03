import fetchMetadataFromUris, { CHECKSUM_MISMATCH_ERROR } from './fetchMetadataFromUris';

const METADATA = { name: 'Test NFT' };
const HTTPS_URI = 'https://nftstorage.link/ipfs/bafybeigdyrztest/metadata.json';
const IPFS_URI = 'ipfs://bafybeigdyrztest/metadata.json';

describe('fetchMetadataFromUris', () => {
  it('returns the metadata served by the first URI without touching the others', async () => {
    const fetchOne = jest.fn().mockResolvedValue(METADATA);

    await expect(fetchMetadataFromUris([HTTPS_URI, IPFS_URI], 'ab', fetchOne)).resolves.toEqual(METADATA);
    expect(fetchOne).toHaveBeenCalledTimes(1);
    expect(fetchOne).toHaveBeenCalledWith(HTTPS_URI, 'ab');
  });

  it('falls through to the next URI when a host fails', async () => {
    const fetchOne = jest.fn().mockRejectedValueOnce(new Error('HTTP error: 403')).mockResolvedValueOnce(METADATA);

    await expect(fetchMetadataFromUris([HTTPS_URI, IPFS_URI], 'ab', fetchOne)).resolves.toEqual(METADATA);
    expect(fetchOne).toHaveBeenCalledTimes(2);
    expect(fetchOne).toHaveBeenLastCalledWith(IPFS_URI, 'ab');
  });

  it('reports the first failure when every URI fails', async () => {
    const fetchOne = jest
      .fn()
      .mockRejectedValueOnce(new Error('HTTP error: 504'))
      .mockRejectedValueOnce(new Error('IPFS gateway fetching is disabled'));

    await expect(fetchMetadataFromUris([HTTPS_URI, IPFS_URI], 'ab', fetchOne)).rejects.toThrow('HTTP error: 504');
    expect(fetchOne).toHaveBeenCalledTimes(2);
  });

  it('reports a checksum mismatch over a download failure', async () => {
    const fetchOne = jest
      .fn()
      .mockRejectedValueOnce(new Error('HTTP error: 504'))
      .mockRejectedValueOnce(new Error(CHECKSUM_MISMATCH_ERROR));

    await expect(fetchMetadataFromUris([HTTPS_URI, IPFS_URI], 'ab', fetchOne)).rejects.toThrow(CHECKSUM_MISMATCH_ERROR);
  });

  it('keeps trying after a checksum mismatch in case another copy matches', async () => {
    const fetchOne = jest
      .fn()
      .mockRejectedValueOnce(new Error(CHECKSUM_MISMATCH_ERROR))
      .mockResolvedValueOnce(METADATA);

    await expect(fetchMetadataFromUris([HTTPS_URI, IPFS_URI], 'ab', fetchOne)).resolves.toEqual(METADATA);
  });

  it('rejects an NFT without metadata URIs before fetching anything', async () => {
    const fetchOne = jest.fn();

    await expect(fetchMetadataFromUris([], 'ab', fetchOne)).rejects.toThrow('No metadata URI');
    await expect(fetchMetadataFromUris(undefined, 'ab', fetchOne)).rejects.toThrow('No metadata URI');
    expect(fetchOne).not.toHaveBeenCalled();
  });
});

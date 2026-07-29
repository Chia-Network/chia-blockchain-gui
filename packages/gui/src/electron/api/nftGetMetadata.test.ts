import crypto from 'node:crypto';

type FetchBuffer = typeof import('../utils/fetchBuffer').default;

const mockFetchBuffer = jest.fn<ReturnType<FetchBuffer>, Parameters<FetchBuffer>>();

jest.mock('../utils/fetchBuffer', () => ({
  __esModule: true,
  default: mockFetchBuffer,
  MaxSizeExceededError:
    jest.requireActual<typeof import('../utils/fetchBuffer')>('../utils/fetchBuffer').MaxSizeExceededError,
}));

const { MaxSizeExceededError } = jest.requireActual<typeof import('../utils/fetchBuffer')>('../utils/fetchBuffer');

const { nftGetImageDataUrl, nftGetMetadata } =
  jest.requireActual<typeof import('./nftGetMetadata')>('./nftGetMetadata');

function sha256(data: Buffer): string {
  return crypto.createHash('sha256').update(data.toString('latin1'), 'latin1').digest('hex');
}

describe('nftGetMetadata', () => {
  beforeEach(() => {
    mockFetchBuffer.mockReset();
  });

  it('parses metadata only after its raw bytes match the expected hash', async () => {
    const data = Buffer.from('{"name":"Verified NFT","preview_image_uris":["https://example.com/preview.png"]}');
    mockFetchBuffer.mockResolvedValue({
      data,
      headers: {
        'content-type': 'application/json',
      },
    });

    await expect(nftGetMetadata('https://example.com/metadata.json', `0x${sha256(data)}`)).resolves.toEqual({
      name: 'Verified NFT',
      preview_image_uris: ['https://example.com/preview.png'],
    });
  });

  it('rejects metadata whose bytes do not match the on-chain hash', async () => {
    const data = Buffer.from('{"name":"Tampered NFT"}');
    mockFetchBuffer.mockResolvedValue({
      data,
      headers: {},
    });

    await expect(nftGetMetadata('https://example.com/metadata.json', '00')).resolves.toBeUndefined();
  });

  it('does not fetch metadata without an expected hash', async () => {
    await expect(nftGetMetadata('https://example.com/metadata.json', undefined)).resolves.toBeUndefined();
    expect(mockFetchBuffer).not.toHaveBeenCalled();
  });
});

describe('nftGetImageDataUrl', () => {
  beforeEach(() => {
    mockFetchBuffer.mockReset();
  });

  it('returns an immutable data URL for a verified image response', async () => {
    const data = Buffer.from('verified image bytes');
    mockFetchBuffer.mockResolvedValue({
      data,
      headers: {
        'content-type': 'image/png; charset=binary',
      },
    });

    await expect(nftGetImageDataUrl('https://example.com/preview.png', sha256(data))).resolves.toBe(
      `data:image/png;base64,${data.toString('base64')}`,
    );
  });

  it('rejects a hash-matched response that is not an image', async () => {
    const data = Buffer.from('<html>not an image</html>');
    mockFetchBuffer.mockResolvedValue({
      data,
      headers: {
        'content-type': 'text/html',
      },
    });

    await expect(nftGetImageDataUrl('https://example.com/preview.png', sha256(data))).resolves.toBeUndefined();
  });

  it('does not fetch an image without an expected hash', async () => {
    await expect(nftGetImageDataUrl('https://example.com/preview.png', undefined)).resolves.toBeUndefined();
    expect(mockFetchBuffer).not.toHaveBeenCalled();
  });

  it('falls back to the direct URL when an image response exceeds the size cap', async () => {
    mockFetchBuffer.mockRejectedValue(
      new MaxSizeExceededError({
        'content-type': 'image/gif',
      }),
    );

    await expect(nftGetImageDataUrl('https://example.com/large.gif', '00')).resolves.toBe(
      'https://example.com/large.gif',
    );
  });

  it('rejects an oversized response that is not an image', async () => {
    mockFetchBuffer.mockRejectedValue(
      new MaxSizeExceededError({
        'content-type': 'video/mp4',
      }),
    );

    await expect(nftGetImageDataUrl('https://example.com/large.mp4', '00')).resolves.toBeUndefined();
  });

  it('rejects on any other download failure', async () => {
    mockFetchBuffer.mockRejectedValue(new Error('Request timeout after 10000ms'));

    await expect(nftGetImageDataUrl('https://example.com/preview.png', '00')).resolves.toBeUndefined();
  });
});

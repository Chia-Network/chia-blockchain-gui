import crypto from 'node:crypto';

type FetchBuffer = typeof import('../utils/fetchBuffer').default;

const mockFetchBuffer = jest.fn<ReturnType<FetchBuffer>, Parameters<FetchBuffer>>();

jest.mock('../utils/fetchBuffer', () => ({
  __esModule: true,
  default: mockFetchBuffer,
  MaxSizeExceededError:
    jest.requireActual<typeof import('../utils/fetchBuffer')>('../utils/fetchBuffer').MaxSizeExceededError,
}));

const mockMaybeIpfsToGatewayUrl = jest.fn<string, [string]>();

jest.mock('../utils/ipfsGateway', () => ({
  __esModule: true,
  default: mockMaybeIpfsToGatewayUrl,
}));

const mockAllowUnverifiedNftPreviews = jest.fn<boolean, []>();

jest.mock('../utils/allowUnverifiedNftPreviews', () => ({
  __esModule: true,
  default: mockAllowUnverifiedNftPreviews,
}));

const { MaxSizeExceededError } = jest.requireActual<typeof import('../utils/fetchBuffer')>('../utils/fetchBuffer');

const ipfsToGatewayUrl = jest.requireActual<typeof import('../../util/ipfs')>('../../util/ipfs').default;

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
    mockMaybeIpfsToGatewayUrl.mockReset();
    // gateway option off: URLs pass through untranslated
    mockMaybeIpfsToGatewayUrl.mockImplementation((url) => url);
    mockAllowUnverifiedNftPreviews.mockReset();
    mockAllowUnverifiedNftPreviews.mockReturnValue(false);
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

  it('omits the preview for an oversized image response by default', async () => {
    mockFetchBuffer.mockRejectedValue(
      new MaxSizeExceededError({
        'content-type': 'image/gif',
      }),
    );

    await expect(nftGetImageDataUrl('https://example.com/large.gif', '00')).resolves.toBeUndefined();
  });

  it('falls back to the direct URL for an oversized image when unverified previews are enabled', async () => {
    mockAllowUnverifiedNftPreviews.mockReturnValue(true);
    mockFetchBuffer.mockRejectedValue(
      new MaxSizeExceededError({
        'content-type': 'image/gif',
      }),
    );

    await expect(nftGetImageDataUrl('https://example.com/large.gif', '00')).resolves.toBe(
      'https://example.com/large.gif',
    );
  });

  it('falls back to the gateway URL for an oversized ipfs image when both options are on', async () => {
    mockAllowUnverifiedNftPreviews.mockReturnValue(true);
    mockMaybeIpfsToGatewayUrl.mockImplementation(ipfsToGatewayUrl);
    mockFetchBuffer.mockRejectedValue(
      new MaxSizeExceededError({
        'content-type': 'image/gif',
      }),
    );

    // the dialog CSP only allows https: and data: images, so the raw ipfs
    // URI would render as a broken image
    await expect(nftGetImageDataUrl('ipfs://bafybeigdyrztest/large.gif', '00')).resolves.toBe(
      'https://ipfs.io/ipfs/bafybeigdyrztest/large.gif',
    );
  });

  it('omits the preview for an oversized ipfs image served by a plain-http local gateway', async () => {
    mockAllowUnverifiedNftPreviews.mockReturnValue(true);
    mockMaybeIpfsToGatewayUrl.mockImplementation((url) => ipfsToGatewayUrl(url, 'http://127.0.0.1:8080/ipfs/'));
    mockFetchBuffer.mockRejectedValue(
      new MaxSizeExceededError({
        'content-type': 'image/gif',
      }),
    );

    // the dialog CSP allows https: images only
    await expect(nftGetImageDataUrl('ipfs://bafybeigdyrztest/large.gif', '00')).resolves.toBeUndefined();
  });

  it('omits the preview for an oversized ipfs image while the gateway option is off', async () => {
    mockAllowUnverifiedNftPreviews.mockReturnValue(true);
    mockFetchBuffer.mockRejectedValue(
      new MaxSizeExceededError({
        'content-type': 'image/gif',
      }),
    );

    // an untranslated ipfs URI would be blocked by the dialog CSP, so no
    // preview is returned at all even though unverified previews are allowed
    await expect(nftGetImageDataUrl('ipfs://bafybeigdyrztest/large.gif', '00')).resolves.toBeUndefined();
  });

  it('omits the preview for an oversized ipfs image while unverified previews are off', async () => {
    mockMaybeIpfsToGatewayUrl.mockImplementation(ipfsToGatewayUrl);
    mockFetchBuffer.mockRejectedValue(
      new MaxSizeExceededError({
        'content-type': 'image/gif',
      }),
    );

    // the gateway option alone does not opt into unverified fallbacks
    await expect(nftGetImageDataUrl('ipfs://bafybeigdyrztest/large.gif', '00')).resolves.toBeUndefined();
  });

  it('rejects an oversized response that is not an image even when unverified previews are enabled', async () => {
    mockAllowUnverifiedNftPreviews.mockReturnValue(true);
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

const mockNftGetMetadata = jest.fn();
const mockNftGetImageDataUrl = jest.fn();
const mockReadPrefs = jest.fn<Record<string, any>, []>(() => ({}));

jest.mock('../api/nftGetMetadata', () => ({
  nftGetMetadata: mockNftGetMetadata,
  nftGetImageDataUrl: mockNftGetImageDataUrl,
}));
jest.mock('../prefs', () => ({ readPrefs: () => mockReadPrefs() }));

const { resolveNftPreviewUrl, MAX_NFT_PREVIEW_URI_INSPECTIONS, MAX_NFT_PREVIEW_URI_LENGTH } =
  jest.requireActual<typeof import('./resolveNftPreviewUrl')>('./resolveNftPreviewUrl');

// A getter at the first forbidden index proves the work bound without a
// machine-dependent timing assertion or allocating an enormous hostile list.
function boundedList() {
  const uris = Array.from({ length: MAX_NFT_PREVIEW_URI_INSPECTIONS }, () => 'not a URL');
  Object.defineProperty(uris, MAX_NFT_PREVIEW_URI_INSPECTIONS, {
    get: () => {
      throw new Error('URI inspection exceeded its bound');
    },
  });
  return uris;
}

function unreadableList(): string[] {
  return new Proxy([] as string[], {
    get: () => {
      throw new Error('An unhashed URI list must not be inspected');
    },
  });
}

describe('confirmation preview preprocessing bounds', () => {
  beforeEach(() => {
    mockNftGetMetadata.mockReset();
    mockNftGetImageDataUrl.mockReset();
    mockReadPrefs.mockReset();
    mockReadPrefs.mockReturnValue({});
  });

  it('bounds both data and metadata list inspection before validation', async () => {
    await expect(resolveNftPreviewUrl(boundedList(), 'data', boundedList(), 'metadata')).resolves.toBeUndefined();
    expect(mockNftGetImageDataUrl).not.toHaveBeenCalled();
    expect(mockNftGetMetadata).not.toHaveBeenCalled();
  });

  it('does not inspect data URIs without a data hash', async () => {
    await expect(
      resolveNftPreviewUrl(unreadableList(), undefined, ['https://example.com/m.json'], 'metadata'),
    ).resolves.toBeUndefined();
    expect(mockNftGetMetadata).toHaveBeenCalledTimes(1);
  });

  it('bounds metadata preview-image lists too', async () => {
    mockNftGetMetadata.mockResolvedValue({ preview_image_uris: boundedList(), preview_image_hash: 'image' });
    await expect(
      resolveNftPreviewUrl([], undefined, ['https://example.com/m.json'], 'metadata'),
    ).resolves.toBeUndefined();
    expect(mockNftGetImageDataUrl).not.toHaveBeenCalled();
  });

  it('does not scan metadata preview-image URIs without their hash', async () => {
    mockNftGetMetadata.mockResolvedValue({ preview_image_uris: unreadableList() });
    await expect(
      resolveNftPreviewUrl([], undefined, ['https://example.com/m.json'], 'metadata'),
    ).resolves.toBeUndefined();
  });

  it('skips oversized URI strings before URL parsing', async () => {
    const uri = `https://example.com/${'a'.repeat(MAX_NFT_PREVIEW_URI_LENGTH)}.png`;
    await expect(resolveNftPreviewUrl([uri], 'data', [], undefined)).resolves.toBeUndefined();
    expect(mockNftGetImageDataUrl).not.toHaveBeenCalled();
  });

  it('does not inspect any list or preferences when both hashes are absent', async () => {
    await expect(
      resolveNftPreviewUrl(unreadableList(), undefined, unreadableList(), undefined),
    ).resolves.toBeUndefined();
    expect(mockReadPrefs).not.toHaveBeenCalled();
  });
});

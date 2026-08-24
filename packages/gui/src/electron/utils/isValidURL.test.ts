const mockReadPrefs = jest.fn<Record<string, any>, []>();

jest.mock('../prefs', () => ({
  readPrefs: mockReadPrefs,
}));

const isValidURL = jest.requireActual<typeof import('./isValidURL')>('./isValidURL').default;

describe('isValidURL', () => {
  beforeEach(() => {
    mockReadPrefs.mockReset();
    mockReadPrefs.mockReturnValue({});
  });

  it('accepts https URLs', () => {
    expect(isValidURL('https://example.com/image.png')).toBe(true);
  });

  it('requires the protocol and rejects non-https schemes', () => {
    expect(isValidURL('example.com/image.png')).toBe(false);
    expect(isValidURL('http://example.com/image.png')).toBe(false);
    expect(isValidURL('ftp://example.com/image.png')).toBe(false);
  });

  it('accepts ipfs:// URIs with a CID host regardless of the gateway option', () => {
    // validator's isURL rejects CID hosts (no TLD), so these pass only via
    // the gateway-form translation. The check is structural on purpose: the
    // gateway option gates fetching (toFetchableUrl), not validity — cache
    // lookups for already-downloaded ipfs content must keep working while
    // the option is off.
    expect(isValidURL('ipfs://bafybeiceg2gltyhlkukwetn26k7t2zdvthg4u4c6uj23rpni2adzgvo5si/020.png')).toBe(true);
    expect(isValidURL('ipfs://ipfs/QmPK1s3pNYLi9ERiq3BDxKa4XosgWwFRQUydHUtz4YgpqB')).toBe(true);
    expect(mockReadPrefs).not.toHaveBeenCalled();
  });

  it('rejects a bare ipfs scheme and non-strings', () => {
    expect(isValidURL('ipfs://')).toBe(false);
    expect(isValidURL(undefined as unknown as string)).toBe(false);
  });
});

const mockReadPrefs = jest.fn<Record<string, any>, []>();

jest.mock('../prefs', () => ({
  readPrefs: mockReadPrefs,
}));

const {
  default: maybeIpfsToGatewayUrl,
  ipfsGatewayEnabled,
  NFT_IPFS_GATEWAY_PREF,
} = jest.requireActual<typeof import('./ipfsGateway')>('./ipfsGateway');

describe('ipfsGatewayEnabled', () => {
  beforeEach(() => {
    mockReadPrefs.mockReset();
  });

  it('is disabled when the preference has never been set', () => {
    mockReadPrefs.mockReturnValue({});

    expect(ipfsGatewayEnabled()).toBe(false);
  });

  it('is enabled only by an explicit boolean true', () => {
    mockReadPrefs.mockReturnValue({ [NFT_IPFS_GATEWAY_PREF]: true });
    expect(ipfsGatewayEnabled()).toBe(true);

    mockReadPrefs.mockReturnValue({ [NFT_IPFS_GATEWAY_PREF]: 'true' });
    expect(ipfsGatewayEnabled()).toBe(false);
  });

  it('fails closed when the preferences store cannot be read', () => {
    mockReadPrefs.mockImplementation(() => {
      throw new Error('userDataDir needs to be initialized');
    });

    expect(ipfsGatewayEnabled()).toBe(false);
  });
});

describe('maybeIpfsToGatewayUrl', () => {
  beforeEach(() => {
    mockReadPrefs.mockReset();
  });

  it('never consults the preferences store for non-ipfs URLs', () => {
    expect(maybeIpfsToGatewayUrl('https://example.com/image.png')).toBe('https://example.com/image.png');
    expect(mockReadPrefs).not.toHaveBeenCalled();
  });

  it('leaves ipfs URIs untranslated while the gateway option is off', () => {
    mockReadPrefs.mockReturnValue({});

    expect(maybeIpfsToGatewayUrl('ipfs://QmPK1s3pNYLi9ERiq3BDxKa4XosgWwFRQUydHUtz4YgpqB')).toBe(
      'ipfs://QmPK1s3pNYLi9ERiq3BDxKa4XosgWwFRQUydHUtz4YgpqB',
    );
  });

  it('translates ipfs URIs when the gateway option is on', () => {
    mockReadPrefs.mockReturnValue({ [NFT_IPFS_GATEWAY_PREF]: true });

    expect(maybeIpfsToGatewayUrl('ipfs://QmPK1s3pNYLi9ERiq3BDxKa4XosgWwFRQUydHUtz4YgpqB/img.png')).toBe(
      'https://ipfs.io/ipfs/QmPK1s3pNYLi9ERiq3BDxKa4XosgWwFRQUydHUtz4YgpqB/img.png',
    );
  });
});

const mockReadPrefs = jest.fn<Record<string, any>, []>();

jest.mock('../prefs', () => ({
  readPrefs: mockReadPrefs,
}));

const {
  default: maybeIpfsToGatewayUrl,
  ipfsGatewayEnabled,
  toFetchableUrl,
  IpfsGatewayDisabledError,
  NFT_IPFS_GATEWAY_PREF,
  ipfsGatewayBase,
} = jest.requireActual<typeof import('./ipfsGateway')>('./ipfsGateway');
const { NFT_IPFS_GATEWAY_URL_PREF } = jest.requireActual<typeof import('../../util/ipfs')>('../../util/ipfs');

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

describe('ipfsGatewayBase', () => {
  beforeEach(() => {
    mockReadPrefs.mockReset();
  });

  it('uses the public gateway when no gateway has been configured', () => {
    mockReadPrefs.mockReturnValue({});

    expect(ipfsGatewayBase()).toBe('https://ipfs.io/ipfs/');
  });

  it('normalizes the configured gateway', () => {
    mockReadPrefs.mockReturnValue({ [NFT_IPFS_GATEWAY_URL_PREF]: 'https://dweb.link' });

    expect(ipfsGatewayBase()).toBe('https://dweb.link/ipfs/');
  });

  it('falls back to the public gateway for an unusable value', () => {
    mockReadPrefs.mockReturnValue({ [NFT_IPFS_GATEWAY_URL_PREF]: 'http://dweb.link' });
    expect(ipfsGatewayBase()).toBe('https://ipfs.io/ipfs/');

    mockReadPrefs.mockReturnValue({ [NFT_IPFS_GATEWAY_URL_PREF]: 42 });
    expect(ipfsGatewayBase()).toBe('https://ipfs.io/ipfs/');
  });

  it('falls back to the public gateway when the preferences store cannot be read', () => {
    mockReadPrefs.mockImplementation(() => {
      throw new Error('userDataDir needs to be initialized');
    });

    expect(ipfsGatewayBase()).toBe('https://ipfs.io/ipfs/');
  });
});

describe('maybeIpfsToGatewayUrl', () => {
  beforeEach(() => {
    mockReadPrefs.mockReset();
  });

  it('translates ipfs URIs through the configured gateway', () => {
    mockReadPrefs.mockReturnValue({
      [NFT_IPFS_GATEWAY_PREF]: true,
      [NFT_IPFS_GATEWAY_URL_PREF]: 'https://gateway.pinata.cloud/ipfs/',
    });

    expect(maybeIpfsToGatewayUrl('ipfs://QmPK1s3pNYLi9ERiq3BDxKa4XosgWwFRQUydHUtz4YgpqB/img.png')).toBe(
      'https://gateway.pinata.cloud/ipfs/QmPK1s3pNYLi9ERiq3BDxKa4XosgWwFRQUydHUtz4YgpqB/img.png',
    );
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

describe('toFetchableUrl', () => {
  beforeEach(() => {
    mockReadPrefs.mockReset();
  });

  it('passes non-ipfs URLs through without consulting the preferences store', () => {
    expect(toFetchableUrl('https://example.com/image.png')).toBe('https://example.com/image.png');
    expect(mockReadPrefs).not.toHaveBeenCalled();
  });

  it('translates ipfs URIs when the gateway option is on', () => {
    mockReadPrefs.mockReturnValue({ [NFT_IPFS_GATEWAY_PREF]: true });

    expect(toFetchableUrl('ipfs://QmPK1s3pNYLi9ERiq3BDxKa4XosgWwFRQUydHUtz4YgpqB/img.png')).toBe(
      'https://ipfs.io/ipfs/QmPK1s3pNYLi9ERiq3BDxKa4XosgWwFRQUydHUtz4YgpqB/img.png',
    );
  });

  it('refuses ipfs URIs while the gateway option is off', () => {
    mockReadPrefs.mockReturnValue({});

    expect(() => toFetchableUrl('ipfs://QmPK1s3pNYLi9ERiq3BDxKa4XosgWwFRQUydHUtz4YgpqB')).toThrow(
      IpfsGatewayDisabledError,
    );
  });

  it('uses the pinned gateway over the current preference when one is given', () => {
    mockReadPrefs.mockReturnValue({
      [NFT_IPFS_GATEWAY_PREF]: true,
      [NFT_IPFS_GATEWAY_URL_PREF]: 'https://dweb.link/ipfs/',
    });

    expect(
      toFetchableUrl('ipfs://QmPK1s3pNYLi9ERiq3BDxKa4XosgWwFRQUydHUtz4YgpqB/img.png', 'https://ipfs.io/ipfs/'),
    ).toBe('https://ipfs.io/ipfs/QmPK1s3pNYLi9ERiq3BDxKa4XosgWwFRQUydHUtz4YgpqB/img.png');
  });

  it('still refuses ipfs URIs while the option is off, whatever gateway is pinned', () => {
    mockReadPrefs.mockReturnValue({});

    expect(() =>
      toFetchableUrl('ipfs://QmPK1s3pNYLi9ERiq3BDxKa4XosgWwFRQUydHUtz4YgpqB', 'https://ipfs.io/ipfs/'),
    ).toThrow(IpfsGatewayDisabledError);
  });
});

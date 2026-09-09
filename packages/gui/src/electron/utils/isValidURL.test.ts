const mockReadPrefs = jest.fn<Record<string, any>, []>();

jest.mock('../prefs', () => ({
  readPrefs: mockReadPrefs,
}));

const { default: isValidURL, isValidRequestURL } = jest.requireActual<typeof import('./isValidURL')>('./isValidURL');
const { normalizeIpfsGatewayBase } = jest.requireActual<typeof import('../../util/ipfs')>('../../util/ipfs');

const CID = 'QmPK1s3pNYLi9ERiq3BDxKa4XosgWwFRQUydHUtz4YgpqB';

describe('isValidRequestURL', () => {
  it('accepts the https URLs isValidURL accepts', () => {
    expect(isValidRequestURL('https://example.com/image.png')).toBe(true);
    expect(isValidRequestURL(`https://ipfs.io/ipfs/${CID}/img.png`)).toBe(true);
  });

  it('accepts a gateway on this machine, the one exception the gateway setting allows', () => {
    expect(isValidRequestURL(`http://127.0.0.1:8080/ipfs/${CID}/img.png`)).toBe(true);
    expect(isValidRequestURL(`http://localhost:8080/ipfs/${CID}`)).toBe(true);
    expect(isValidRequestURL(`http://[::1]:8080/ipfs/${CID}`)).toBe(true);
    expect(isValidRequestURL(`https://localhost:8443/ipfs/${CID}`)).toBe(true);
  });

  it('rejects plain http anywhere else, and anything that is not a URL', () => {
    expect(isValidRequestURL(`http://192.168.1.10:8080/ipfs/${CID}`)).toBe(false);
    expect(isValidRequestURL(`http://dweb.link/ipfs/${CID}`)).toBe(false);
    expect(isValidRequestURL(`http://localhost.evil.com/ipfs/${CID}`)).toBe(false);
    expect(isValidRequestURL(`ipfs://${CID}`)).toBe(false);
    expect(isValidRequestURL('not a url')).toBe(false);
  });

  // The gateway setting and the request check are two sides of one policy: a
  // gateway the setting accepts must produce request URLs the check accepts,
  // or every fetch through it would fail with "Invalid URL".
  it.each([
    'https://dweb.link',
    'https://ipfs.mintgarden.io/ipfs/',
    'https://gateway.example.com:8443/gw/ipfs/',
    'https://192.168.1.10:8443',
    'https://[fd00::1]:8443',
    'https://mynas.local',
    'https://mynas.local:8443/ipfs/',
    'https://localhost:8443',
    'http://127.0.0.1:8080',
    'http://localhost:8080/ipfs/',
    'http://[::1]:8080',
  ])('accepts every request URL built from the accepted gateway %p', (gateway) => {
    const base = normalizeIpfsGatewayBase(gateway);
    expect(base).toBeDefined();
    expect(isValidRequestURL(`${base}${CID}/img.png`)).toBe(true);
  });
});

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

  it('rejects ipfs URIs whose path would leave the gateway prefix', () => {
    expect(isValidURL('ipfs://../../admin')).toBe(false);
    expect(isValidURL('ipfs://%2e%2e/%2e%2e/api/v0/id')).toBe(false);
    expect(isValidURL(`ipfs://${CID}/../../admin`)).toBe(false);
  });
});

describe('isValidURL length bound', () => {
  it('refuses a uri past the validator limit before translating it', () => {
    const longUri = `ipfs://${'/'.repeat(100_000)}x`;
    const started = process.hrtime.bigint();
    expect(isValidURL(longUri)).toBe(false);
    expect(isValidURL(`https://example.com/${'a'.repeat(3000)}`)).toBe(false);
    expect(Number(process.hrtime.bigint() - started) / 1e6).toBeLessThan(50);
  });
});

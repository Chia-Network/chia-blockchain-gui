import ipfsToGatewayUrl, { DEFAULT_IPFS_GATEWAY_BASE, getIpfsPath, isIpfsUrl, normalizeIpfsGatewayBase } from './ipfs';

// CID taken from a real mainnet NFT whose on-chain data URI is ipfs://
const CID_V1 = 'bafybeiceg2gltyhlkukwetn26k7t2zdvthg4u4c6uj23rpni2adzgvo5si';
const CID_V0 = 'QmPK1s3pNYLi9ERiq3BDxKa4XosgWwFRQUydHUtz4YgpqB';

describe('isIpfsUrl', () => {
  it('matches the ipfs scheme case-insensitively', () => {
    expect(isIpfsUrl(`ipfs://${CID_V1}/020.png`)).toBe(true);
    expect(isIpfsUrl(`IPFS://${CID_V1}`)).toBe(true);
  });

  it('does not match other schemes', () => {
    expect(isIpfsUrl(`https://ipfs.io/ipfs/${CID_V1}`)).toBe(false);
    expect(isIpfsUrl('')).toBe(false);
  });
});

describe('getIpfsPath', () => {
  it('returns the CID and path', () => {
    expect(getIpfsPath(`ipfs://${CID_V1}/020.png`)).toBe(`${CID_V1}/020.png`);
    expect(getIpfsPath(`ipfs://${CID_V1}`)).toBe(CID_V1);
  });

  it('strips the redundant ipfs/ prefix some minting tools produce', () => {
    expect(getIpfsPath(`ipfs://ipfs/${CID_V1}/020.png`)).toBe(`${CID_V1}/020.png`);
  });

  it('preserves the case of CIDv0 base58 hashes', () => {
    expect(getIpfsPath(`ipfs://${CID_V0}/image.png`)).toBe(`${CID_V0}/image.png`);
  });

  it('returns undefined for non-ipfs URLs and a bare scheme', () => {
    expect(getIpfsPath(`https://example.com/${CID_V1}`)).toBeUndefined();
    expect(getIpfsPath('ipfs://')).toBeUndefined();
  });
});

describe('ipfsToGatewayUrl', () => {
  it('translates ipfs:// URIs to the HTTPS gateway', () => {
    expect(ipfsToGatewayUrl(`ipfs://${CID_V1}/020.png`)).toBe(`${DEFAULT_IPFS_GATEWAY_BASE}${CID_V1}/020.png`);
    expect(ipfsToGatewayUrl(`ipfs://ipfs/${CID_V1}`)).toBe(`${DEFAULT_IPFS_GATEWAY_BASE}${CID_V1}`);
  });

  it('returns non-ipfs URLs unchanged', () => {
    const url = 'https://example.com/image.png?size=large';
    expect(ipfsToGatewayUrl(url)).toBe(url);
  });

  it('returns an unusable bare scheme unchanged so validation rejects it', () => {
    expect(ipfsToGatewayUrl('ipfs://')).toBe('ipfs://');
  });

  it('appends the ipfs path to a custom gateway base', () => {
    expect(ipfsToGatewayUrl(`ipfs://${CID_V1}/020.png`, 'https://dweb.link/ipfs/')).toBe(
      `https://dweb.link/ipfs/${CID_V1}/020.png`,
    );
    expect(ipfsToGatewayUrl('https://example.com/image.png', 'https://dweb.link/ipfs/')).toBe(
      'https://example.com/image.png',
    );
  });
});

describe('normalizeIpfsGatewayBase', () => {
  it.each([
    ['https://dweb.link', 'https://dweb.link/ipfs/'],
    ['https://dweb.link/', 'https://dweb.link/ipfs/'],
    ['https://dweb.link/ipfs', 'https://dweb.link/ipfs/'],
    ['https://dweb.link/ipfs/', 'https://dweb.link/ipfs/'],
    ['https://DWEB.link/IPFS/', 'https://dweb.link/ipfs/'],
    ['  https://gateway.example.com:8443/gw/ipfs/  ', 'https://gateway.example.com:8443/gw/ipfs/'],
    ['http://127.0.0.1:8080', 'http://127.0.0.1:8080/ipfs/'],
    ['http://localhost:8080/ipfs/', 'http://localhost:8080/ipfs/'],
    ['http://[::1]:8080', 'http://[::1]:8080/ipfs/'],
  ])('normalizes %p to %p', (input, expected) => {
    expect(normalizeIpfsGatewayBase(input)).toBe(expected);
  });

  it.each([
    undefined,
    null,
    '',
    '   ',
    'dweb.link',
    'ipfs.io/ipfs/',
    'ftp://dweb.link',
    'ipfs://dweb.link',
    // plain http is only accepted for this machine
    'http://dweb.link',
    'http://192.168.1.10:8080',
    'https://user:secret@dweb.link',
    'https://dweb.link/ipfs/?token=1',
    'https://dweb.link/ipfs/#top',
    'https://',
    'https://exa mple.com',
  ])('rejects %p', (input) => {
    expect(normalizeIpfsGatewayBase(input as string | undefined | null)).toBeUndefined();
  });

  it('is idempotent on its own output', () => {
    const base = normalizeIpfsGatewayBase('https://dweb.link');
    expect(normalizeIpfsGatewayBase(base)).toBe(base);
    expect(normalizeIpfsGatewayBase(DEFAULT_IPFS_GATEWAY_BASE)).toBe(DEFAULT_IPFS_GATEWAY_BASE);
  });
});

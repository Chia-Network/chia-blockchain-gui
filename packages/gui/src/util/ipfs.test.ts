import ipfsToGatewayUrl, {
  DEFAULT_IPFS_GATEWAY_BASE,
  getIpfsPath,
  isIpfsPath,
  isIpfsUrl,
  isLoopbackUrl,
  normalizeIpfsGatewayBase,
  trimTrailingSlashes,
} from './ipfs';

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
    expect(getIpfsPath('ipfs:///')).toBeUndefined();
  });

  it('keeps a query string and drops a trailing slash', () => {
    expect(getIpfsPath(`ipfs://${CID_V1}/020.png?filename=a.png`)).toBe(`${CID_V1}/020.png?filename=a.png`);
    expect(getIpfsPath(`ipfs://${CID_V1}/dir/`)).toBe(`${CID_V1}/dir`);
    expect(getIpfsPath(`ipfs://${CID_V1}/image%20-%20one.jfif`)).toBe(`${CID_V1}/image%20-%20one.jfif`);
  });

  // File names on chain are whatever the minter typed — Unicode, brackets,
  // quotes — and were fetchable before the path check existed; the URL parser
  // percent-encodes what needs it on the way out.
  it.each([`${CID_V1}/图片.png`, `${CID_V1}/café.png`, `${CID_V1}/a[1].png`, `${CID_V1}/a{b}"c|d^e\`f.png`])(
    'keeps the path %p as published',
    (ipfsPath) => {
      expect(getIpfsPath(`ipfs://${ipfsPath}`)).toBe(ipfsPath);
      expect(ipfsToGatewayUrl(`ipfs://${ipfsPath}`)).toBe(new URL(`${DEFAULT_IPFS_GATEWAY_BASE}${ipfsPath}`).href);
    },
  );

  // The path is minter-authored and gets appended to a gateway base, so a
  // path that would resolve out from under the base — or that does not start
  // with a CID at all — is not IPFS content.
  it.each([
    'ipfs://../../admin',
    'ipfs://../api/v0/id',
    `ipfs://${CID_V1}/../../admin`,
    `ipfs://${CID_V1}/./x`,
    'ipfs://%2e%2e/%2e%2e/api',
    `ipfs://${CID_V1}/%2E%2e/x`,
    `ipfs://${CID_V1}/.%2e/x`,
    `ipfs://${CID_V1}\\..\\..\\admin`,
    `ipfs://${CID_V1}/a\\b`,
    `ipfs://${CID_V1}//x`,
    `ipfs://${CID_V1}/x y`,
    `ipfs://${CID_V1}/x\r\nX-Inject: 1`,
    'ipfs://@evil.com/x',
    'ipfs:////evil.com/x',
    'ipfs://-/x',
  ])('returns undefined for %p, which does not name IPFS content', (url) => {
    expect(getIpfsPath(url)).toBeUndefined();
  });
});

describe('isIpfsPath', () => {
  it('accepts a CID with an ordinary file path', () => {
    expect(isIpfsPath(CID_V1)).toBe(true);
    expect(isIpfsPath(`${CID_V0}/image.png`)).toBe(true);
    expect(isIpfsPath(`${CID_V1}/BatGAN_POAP_Miami_12.png`)).toBe(true);
    expect(isIpfsPath(`${CID_V1}/some-dir/file~1(2)!.jfif`)).toBe(true);
    expect(isIpfsPath(`${CID_V1}/图片 [1].png`.replace(' ', '%20'))).toBe(true);
  });

  it('rejects dot segments, empty segments and a non-CID first segment', () => {
    expect(isIpfsPath('../../admin')).toBe(false);
    expect(isIpfsPath(`${CID_V1}/../admin`)).toBe(false);
    expect(isIpfsPath(`${CID_V1}/%2e%2e/admin`)).toBe(false);
    expect(isIpfsPath(`${CID_V1}//admin`)).toBe(false);
    expect(isIpfsPath('')).toBe(false);
    expect(isIpfsPath('not a cid/x')).toBe(false);
  });
});

describe('isLoopbackUrl', () => {
  it.each([
    'http://127.0.0.1:8080/ipfs/x',
    'http://localhost:8080/x',
    'http://[::1]:8080/x',
    'https://localhost:8443/x',
  ])('accepts %p', (url) => {
    expect(isLoopbackUrl(url)).toBe(true);
  });

  it.each([
    'http://192.168.1.10:8080/x',
    'http://dweb.link/x',
    'https://dweb.link/x',
    'http://localhost.evil.com/x',
    'http://127.0.0.1.evil.com/x',
    'ftp://localhost/x',
    'ipfs://localhost',
    'not a url',
  ])('rejects %p', (url) => {
    expect(isLoopbackUrl(url)).toBe(false);
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
    expect(ipfsToGatewayUrl(`ipfs://${CID_V1}/020.png`, 'http://127.0.0.1:8080/ipfs/')).toBe(
      `http://127.0.0.1:8080/ipfs/${CID_V1}/020.png`,
    );
    expect(ipfsToGatewayUrl('https://example.com/image.png', 'https://dweb.link/ipfs/')).toBe(
      'https://example.com/image.png',
    );
  });

  it('keeps a query string on the gateway URL', () => {
    expect(ipfsToGatewayUrl(`ipfs://${CID_V1}/020.png?filename=a.png`)).toBe(
      `${DEFAULT_IPFS_GATEWAY_BASE}${CID_V1}/020.png?filename=a.png`,
    );
  });

  // A minter-authored path must not be able to reach anything but /ipfs/ on
  // the gateway — with a local gateway that would be a request to an arbitrary
  // path on the user's own machine. Such a URI comes back unchanged, so it
  // fails validation like any other ipfs:// URI nothing could fetch.
  it.each([
    ['ipfs://../../admin', 'http://127.0.0.1:8080/ipfs/'],
    ['ipfs://../api/v0/id', 'http://127.0.0.1:8080/ipfs/'],
    ['ipfs://%2e%2e/%2e%2e/api', 'http://127.0.0.1:8080/ipfs/'],
    [`ipfs://${CID_V1}/../../admin`, DEFAULT_IPFS_GATEWAY_BASE],
    [`ipfs://${CID_V1}\\..\\..\\admin`, DEFAULT_IPFS_GATEWAY_BASE],
    ['ipfs:////evil.com/x', DEFAULT_IPFS_GATEWAY_BASE],
    ['ipfs://@evil.com/x', DEFAULT_IPFS_GATEWAY_BASE],
  ])('returns %p unchanged instead of a URL outside the %p base', (url, base) => {
    expect(ipfsToGatewayUrl(url, base)).toBe(url);
  });

  it('never yields a URL that leaves the gateway base', () => {
    const bases = [
      DEFAULT_IPFS_GATEWAY_BASE,
      'http://127.0.0.1:8080/ipfs/',
      'https://gateway.example.com:8443/gw/ipfs/',
    ];
    const uris = [
      `ipfs://${CID_V1}/020.png`,
      `ipfs://${CID_V0}`,
      `ipfs://${CID_V1}/a/b/c.png?x=1#frag`,
      'ipfs://../../admin',
      `ipfs://${CID_V1}/..%2f..%2fadmin`,
      `ipfs://${CID_V1}/%2e%2e/admin`,
      'ipfs://evil.com@x/y',
    ];
    bases.forEach((base) => {
      uris.forEach((uri) => {
        const result = ipfsToGatewayUrl(uri, base);
        expect(result === uri || new URL(result).href.startsWith(base)).toBe(true);
      });
    });
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
    ['https://localhost:8443', 'https://localhost:8443/ipfs/'],
    ['https://192.168.1.10:8443', 'https://192.168.1.10:8443/ipfs/'],
    ['https://[fd00::1]:8443', 'https://[fd00::1]:8443/ipfs/'],
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
    // a host every outgoing request would be refused for (no top-level domain)
    'https://my-nas',
    'https://my-nas:8443/ipfs/',
  ])('rejects %p', (input) => {
    expect(normalizeIpfsGatewayBase(input as string | undefined | null)).toBeUndefined();
  });

  it('is idempotent on its own output', () => {
    const base = normalizeIpfsGatewayBase('https://dweb.link');
    expect(normalizeIpfsGatewayBase(base)).toBe(base);
    expect(normalizeIpfsGatewayBase(DEFAULT_IPFS_GATEWAY_BASE)).toBe(DEFAULT_IPFS_GATEWAY_BASE);
  });
});

describe('trimTrailingSlashes', () => {
  it('removes trailing slashes and leaves everything else', () => {
    expect(trimTrailingSlashes('a/b///')).toBe('a/b');
    expect(trimTrailingSlashes('a//b')).toBe('a//b');
    expect(trimTrailingSlashes('///')).toBe('');
    expect(trimTrailingSlashes('')).toBe('');
  });

  it('is linear on a long run of slashes that does not reach the end', () => {
    const input = `${'/'.repeat(200_000)}x`;
    const started = process.hrtime.bigint();
    expect(trimTrailingSlashes(input)).toBe(input);
    expect(Number(process.hrtime.bigint() - started) / 1e6).toBeLessThan(50);
  });
});

describe('length bound', () => {
  const longUri = `ipfs://${'/'.repeat(100_000)}x`;

  it('refuses an ipfs uri past the validator limit without working on it', () => {
    const started = process.hrtime.bigint();
    expect(getIpfsPath(longUri)).toBeUndefined();
    expect(ipfsToGatewayUrl(longUri)).toBe(longUri);
    expect(Number(process.hrtime.bigint() - started) / 1e6).toBeLessThan(50);
  });

  it('refuses a gateway base past the limit', () => {
    expect(normalizeIpfsGatewayBase(`https://dweb.link/${'a'.repeat(3000)}`)).toBeUndefined();
  });
});

import { EventEmitter } from 'node:events';

import guardRedirects, { MAX_REDIRECTS, isAllowedRedirect, isLocalOrPrivateHost } from './redirectPolicy';

describe('isAllowedRedirect', () => {
  it.each([
    ['https://minter.example/a.png', 'https://cdn.example/a.png'],
    ['https://minter.example/a.png', 'https://ipfs.io/ipfs/QmPK1s3pNYLi9ERiq3BDxKa4XosgWwFRQUydHUtz4YgpqB'],
    // a local gateway may canonicalize a path within its own origin
    [
      'http://127.0.0.1:8080/ipfs/QmPK1s3pNYLi9ERiq3BDxKa4XosgWwFRQUydHUtz4YgpqB',
      'http://127.0.0.1:8080/ipfs/QmPK1s3pNYLi9ERiq3BDxKa4XosgWwFRQUydHUtz4YgpqB/',
    ],
    ['http://localhost:8080/ipfs/x', 'http://localhost:8080/ipfs/x/'],
    // ... over https as well, and from a gateway on the local network or an
    // NFT host on a private address: same origin is never a new host
    ['https://localhost:8443/ipfs/x', 'https://localhost:8443/ipfs/x/'],
    ['https://127.0.0.1:8443/ipfs/x', 'https://127.0.0.1:8443/ipfs/y'],
    ['https://192.168.1.10/ipfs/x', 'https://192.168.1.10/ipfs/x/'],
    ['https://[fd00::1]/ipfs/x', 'https://[fd00::1]/ipfs/x/'],
    ['https://nas.local/ipfs/x', 'https://nas.local/ipfs/x/'],
    ['https://minter.example/a', 'https://minter.example/b'],
  ])('allows %s -> %s', (from, to) => {
    expect(isAllowedRedirect(from, to)).toBe(true);
  });

  it.each([
    // scheme downgrade
    ['https://minter.example/a.png', 'http://minter.example/a.png'],
    // loopback and private hosts, whatever the scheme
    ['https://minter.example/a.png', 'http://127.0.0.1:8080/api/v0/shutdown'],
    ['https://minter.example/a.png', 'http://localhost:5000/'],
    ['https://minter.example/a.png', 'http://[::1]:8080/'],
    ['https://minter.example/a.png', 'http://192.168.1.1/'],
    ['https://minter.example/a.png', 'http://169.254.169.254/latest/meta-data/'],
    ['https://minter.example/a.png', 'http://10.0.0.1/'],
    // other schemes
    ['https://minter.example/a.png', 'file:///etc/passwd'],
    ['https://minter.example/a.png', 'data:text/html,hi'],
    ['https://minter.example/a.png', 'ipfs://QmPK1s3pNYLi9ERiq3BDxKa4XosgWwFRQUydHUtz4YgpqB'],
    // this machine and the local network are off limits over https as well:
    // a redirect names a host the NFT never did
    ['https://minter.example/a.png', 'https://127.0.0.1:8443/a.png'],
    ['https://minter.example/a.png', 'https://localhost/a.png'],
    ['https://minter.example/a.png', 'https://api.localhost/a.png'],
    ['https://minter.example/a.png', 'https://[::1]/a.png'],
    ['https://minter.example/a.png', 'https://[::ffff:127.0.0.1]/a.png'],
    ['https://minter.example/a.png', 'https://[fe80::1]/a.png'],
    ['https://minter.example/a.png', 'https://[fd00::1]/a.png'],
    ['https://minter.example/a.png', 'https://169.254.169.254/latest/meta-data/'],
    ['https://minter.example/a.png', 'https://10.0.0.1/'],
    ['https://minter.example/a.png', 'https://172.16.0.1/'],
    ['https://minter.example/a.png', 'https://192.168.1.1/'],
    ['https://minter.example/a.png', 'https://100.64.0.1/'],
    ['https://minter.example/a.png', 'https://0.0.0.0/'],
    // names that resolve on this machine or its network by convention
    ['https://minter.example/a.png', 'https://router.local/'],
    ['https://minter.example/a.png', 'https://nas.local./'],
    ['https://minter.example/a.png', 'https://printer.home.arpa/'],
    ['https://minter.example/a.png', 'https://vault.internal/'],
    ['https://minter.example/a.png', 'https://home.arpa/'],
    ['https://minter.example/a.png', 'https://internal/'],
    // a local gateway may not send the request anywhere else
    ['http://127.0.0.1:8080/ipfs/x', 'http://127.0.0.1:9090/ipfs/x'],
    ['http://127.0.0.1:8080/ipfs/x', 'http://localhost:8080/ipfs/x'],
    ['http://127.0.0.1:8080/ipfs/x', 'http://192.168.1.1/ipfs/x'],
    ['https://localhost:8443/ipfs/x', 'https://localhost:9443/ipfs/x'],
    ['https://localhost:8443/ipfs/x', 'https://127.0.0.1:8443/ipfs/x'],
    ['https://192.168.1.10/ipfs/x', 'https://192.168.1.11/ipfs/x'],
    // garbage
    ['https://minter.example/a.png', 'not a url'],
    ['https://minter.example/a.png', ''],
  ])('refuses %s -> %s', (from, to) => {
    expect(isAllowedRedirect(from, to)).toBe(false);
  });

  it('refuses a non-string target', () => {
    expect(isAllowedRedirect('https://minter.example/a.png', undefined as unknown as string)).toBe(false);
  });
});

describe('guardRedirects', () => {
  function makeRequest() {
    return Object.assign(new EventEmitter(), { followRedirect: jest.fn() });
  }

  it('follows allowed redirects and judges each hop from the previous target', () => {
    const request = makeRequest();
    const refuse = jest.fn();
    guardRedirects(request, 'https://minter.example/a.png', refuse);

    request.emit('redirect', 302, 'GET', 'https://cdn.example/a.png', {});
    expect(request.followRedirect).toHaveBeenCalledTimes(1);
    // the second hop downgrades: refused even though the first was fine
    request.emit('redirect', 302, 'GET', 'http://cdn.example/a.png', {});
    expect(request.followRedirect).toHaveBeenCalledTimes(1);
    expect(refuse).toHaveBeenCalledWith(expect.objectContaining({ message: 'Redirect refused' }));
  });

  it('stops after MAX_REDIRECTS hops', () => {
    const request = makeRequest();
    const refuse = jest.fn();
    guardRedirects(request, 'https://minter.example/a.png', refuse);

    for (let hop = 1; hop <= MAX_REDIRECTS; hop += 1) {
      request.emit('redirect', 302, 'GET', `https://hop${hop}.example/a.png`, {});
    }
    expect(request.followRedirect).toHaveBeenCalledTimes(MAX_REDIRECTS);
    expect(refuse).not.toHaveBeenCalled();

    request.emit('redirect', 302, 'GET', 'https://hop6.example/a.png', {});
    expect(request.followRedirect).toHaveBeenCalledTimes(MAX_REDIRECTS);
    expect(refuse).toHaveBeenCalledWith(expect.objectContaining({ message: 'Too many redirects' }));
  });
});

describe('isLocalOrPrivateHost', () => {
  it.each([
    'localhost',
    'LOCALHOST',
    'app.localhost',
    '127.0.0.1',
    '127.255.0.1',
    '10.1.2.3',
    '172.16.0.1',
    '172.31.255.255',
    '192.168.0.1',
    '169.254.1.1',
    '100.64.0.1',
    '100.127.255.255',
    '0.0.0.0',
    '[::1]',
    '[::]',
    '[fe80::1]',
    '[fd12::1]',
    '[fc00::1]',
    '[::ffff:10.0.0.1]',
    '[::ffff:7f00:1]',
    '[::ffff:a00:1]',
    // transition forms that embed a private IPv4 address
    '[::7f00:1]',
    '[::127.0.0.1]',
    '[::ffff:0:7f00:1]',
    '[64:ff9b::7f00:1]',
    '[64:ff9b::10.0.0.1]',
    '[2002:7f00:1::]',
    '[2002:c0a8:101::1]',
    // site-local
    '[fec0::1]',
    'router.local',
    'nas.LOCAL',
    'nas.local.',
    'printer.home.arpa',
    'vault.internal',
    // the zones themselves, not only names under them
    'local',
    'home.arpa',
    'internal',
    'home.arpa.',
  ])('%s is local or private', (host) => {
    expect(isLocalOrPrivateHost(host)).toBe(true);
  });

  it.each([
    'example.com',
    'ipfs.io',
    '8.8.8.8',
    '172.32.0.1',
    '100.128.0.1',
    '11.0.0.1',
    '[2001:db8::1]',
    '[2606:4700::1111]',
    '[2002:0808:0808::]',
    '[64:ff9b::808:808]',
    '[::8.8.8.8]',
    'localhost.evil.com',
    '127.0.0.1.evil.com',
    'local.example.com',
    'internal.example.com',
  ])('%s is not', (host) => {
    expect(isLocalOrPrivateHost(host)).toBe(false);
  });
});

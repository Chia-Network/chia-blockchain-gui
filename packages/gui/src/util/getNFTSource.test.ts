import CacheState from '../constants/CacheState';

import getNFTSource from './getNFTSource';

const CID = 'QmPK1s3pNYLi9ERiq3BDxKa4XosgWwFRQUydHUtz4YgpqB';

function cached(url: string, gateway?: string) {
  return {
    url,
    timestamp: 1,
    state: CacheState.CACHED as const,
    headers: {},
    checksum: 'abc',
    ...(gateway === undefined ? {} : { gateway }),
  };
}

describe('getNFTSource', () => {
  it('reports a plain web URL as served by its own host', () => {
    expect(getNFTSource('https://raw.githubusercontent.com/org/repo/main/nft.png')).toEqual({
      kind: 'web',
      host: 'raw.githubusercontent.com',
    });
  });

  it('reports a gateway link as IPFS content served by the host in the link', () => {
    const url = `https://ipfs.mintgarden.io/ipfs/${CID}/img.png`;
    expect(getNFTSource(url, cached(url))).toEqual({
      kind: 'ipfs',
      host: 'ipfs.mintgarden.io',
      ipfsPath: `${CID}/img.png`,
      viaGateway: false,
    });
  });

  it('names the subdomain gateway operator, not the CID label', () => {
    const url = 'https://bafybeiceg2gltyhlkukwetn26k7t2zdvthg4u4c6uj23rpni2adzgvo5si.ipfs.dweb.link/img.png';
    expect(getNFTSource(url)).toMatchObject({ kind: 'ipfs', host: 'dweb.link', viaGateway: false });
  });

  it('reports a gateway link the fallback served as coming through that gateway', () => {
    const url = `https://nftstorage.link/ipfs/${CID}/img.png`;
    expect(getNFTSource(url, cached(url, 'http://127.0.0.1:8080/ipfs/'))).toEqual({
      kind: 'ipfs',
      host: '127.0.0.1',
      ipfsPath: `${CID}/img.png`,
      viaGateway: true,
    });
  });

  it('reports an ipfs:// file as coming through its recorded gateway', () => {
    const url = `ipfs://${CID}/img.png`;
    expect(getNFTSource(url, cached(url, 'https://ipfs.mintgarden.io/ipfs/'))).toEqual({
      kind: 'ipfs',
      host: 'ipfs.mintgarden.io',
      ipfsPath: `${CID}/img.png`,
      viaGateway: true,
    });
  });

  it('knows an ipfs:// file came through a gateway even when the sidecar does not say which', () => {
    const url = `ipfs://${CID}/img.png`;
    expect(getNFTSource(url, cached(url))).toEqual({
      kind: 'ipfs',
      host: undefined,
      ipfsPath: `${CID}/img.png`,
      viaGateway: true,
    });
    expect(getNFTSource(url)).toMatchObject({ viaGateway: true, host: undefined });
  });

  it('ignores a gateway recorded on a failure', () => {
    const url = `https://nftstorage.link/ipfs/${CID}/img.png`;
    expect(
      getNFTSource(url, {
        url,
        timestamp: 1,
        state: CacheState.ERROR,
        error: 'HTTP error: 504',
        gateway: 'https://ipfs.io/ipfs/',
      }),
    ).toMatchObject({ viaGateway: false, host: 'nftstorage.link' });
  });

  it('returns undefined for something that is not a URL', () => {
    expect(getNFTSource('not a url')).toBeUndefined();
    expect(getNFTSource('')).toBeUndefined();
  });
});

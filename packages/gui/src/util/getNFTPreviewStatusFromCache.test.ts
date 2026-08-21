import type CacheInfo from '../@types/CacheInfo';
import NFTPreviewStatus from '../@types/NFTPreviewStatus';
import CacheState from '../constants/CacheState';

import getNFTPreviewStatusFromCache from './getNFTPreviewStatusFromCache';

const HASH = '0xabc123';

function cached(url: string, checksum: string): CacheInfo {
  return { url, state: CacheState.CACHED, checksum, headers: {}, timestamp: 1 };
}

function errored(url: string, error: string): CacheInfo {
  return { url, state: CacheState.ERROR, error, timestamp: 1 };
}

function notCached(url: string): CacheInfo {
  return { url, state: CacheState.NOT_CACHED, timestamp: 1 };
}

function lookup(infos: CacheInfo[]) {
  const byUrl = new Map(infos.map((info) => [info.url, info]));
  return (url: string) => byUrl.get(url);
}

describe('getNFTPreviewStatusFromCache', () => {
  it('is unavailable when there is no file to verify against', () => {
    expect(getNFTPreviewStatusFromCache({ dataUris: [], dataHash: HASH }, lookup([]))).toBe(
      NFTPreviewStatus.UNAVAILABLE,
    );
    expect(getNFTPreviewStatusFromCache({ dataUris: ['https://a/x.png'], dataHash: undefined }, lookup([]))).toBe(
      NFTPreviewStatus.UNAVAILABLE,
    );
  });

  it('is available once any uri has cached bytes matching the hash, ignoring the 0x prefix', () => {
    const status = getNFTPreviewStatusFromCache(
      { dataUris: ['https://a/x.png', 'https://b/x.png'], dataHash: HASH },
      lookup([errored('https://a/x.png', 'getaddrinfo ENOTFOUND a'), cached('https://b/x.png', 'abc123')]),
    );

    expect(status).toBe(NFTPreviewStatus.AVAILABLE);
  });

  it('is unavailable only when every uri has a settled failure', () => {
    const status = getNFTPreviewStatusFromCache(
      { dataUris: ['https://a/x.png', 'https://b/x.png'], dataHash: HASH },
      lookup([
        errored('https://a/x.png', 'Request timed out after 30000ms of inactivity'),
        cached('https://b/x.png', 'feed'),
      ]),
    );

    expect(status).toBe(NFTPreviewStatus.UNAVAILABLE);
  });

  it('stays undecided while a uri has never been fetched', () => {
    const status = getNFTPreviewStatusFromCache(
      { dataUris: ['https://a/x.png', 'https://b/x.png'], dataHash: HASH },
      lookup([errored('https://a/x.png', 'getaddrinfo ENOTFOUND a'), notCached('https://b/x.png')]),
    );

    expect(status).toBeUndefined();
    expect(getNFTPreviewStatusFromCache({ dataUris: ['https://a/x.png'], dataHash: HASH }, lookup([]))).toBeUndefined();
  });

  it('stays undecided after a transient error the cache will retry', () => {
    const status = getNFTPreviewStatusFromCache(
      { dataUris: ['https://a/x.png'], dataHash: HASH },
      lookup([errored('https://a/x.png', 'Request aborted')]),
    );

    expect(status).toBeUndefined();
  });
});

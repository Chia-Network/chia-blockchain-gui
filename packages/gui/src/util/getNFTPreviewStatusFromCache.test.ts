import type CacheInfo from '../@types/CacheInfo';
import type MetadataState from '../@types/MetadataState';
import NFTPreviewStatus from '../@types/NFTPreviewStatus';
import CacheState from '../constants/CacheState';

import getNFTPreviewStatusFromCache, { getNFTPreviewUrls } from './getNFTPreviewStatusFromCache';

const HASH = '0xabc123';
const PREVIEW_HASH = '0xdef456';

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

const noMetadata: MetadataState = { metadata: undefined, isLoading: false, error: new Error('No metadata URI') };
const loadingMetadata: MetadataState = { metadata: undefined, isLoading: true };
const metadataWithPreview: MetadataState = {
  metadata: { preview_image_uris: ['https://thumbs/x.png'], preview_image_hash: PREVIEW_HASH },
  isLoading: false,
};

const dead = errored('https://a/x.png', 'getaddrinfo ENOTFOUND a');

describe('getNFTPreviewStatusFromCache', () => {
  it('is unavailable when there is no file to verify against', () => {
    expect(getNFTPreviewStatusFromCache({ dataUris: [], dataHash: HASH }, noMetadata, lookup([]))).toBe(
      NFTPreviewStatus.UNAVAILABLE,
    );
    expect(
      getNFTPreviewStatusFromCache({ dataUris: ['https://a/x.png'], dataHash: undefined }, noMetadata, lookup([])),
    ).toBe(NFTPreviewStatus.UNAVAILABLE);
  });

  it('is available once any data uri has cached bytes matching the hash, ignoring the 0x prefix', () => {
    const status = getNFTPreviewStatusFromCache(
      { dataUris: ['https://a/x.png', 'https://b/x.png'], dataHash: HASH },
      noMetadata,
      lookup([dead, cached('https://b/x.png', 'abc123')]),
    );

    expect(status).toBe(NFTPreviewStatus.AVAILABLE);
  });

  it('is unavailable only when every uri has a settled failure', () => {
    const status = getNFTPreviewStatusFromCache(
      { dataUris: ['https://a/x.png', 'https://b/x.png'], dataHash: HASH },
      noMetadata,
      lookup([errored('https://a/x.png', 'HTTP error: 404'), cached('https://b/x.png', 'feed')]),
    );

    expect(status).toBe(NFTPreviewStatus.UNAVAILABLE);
  });

  it('stays undecided while a uri has never been fetched', () => {
    const status = getNFTPreviewStatusFromCache(
      { dataUris: ['https://a/x.png', 'https://b/x.png'], dataHash: HASH },
      noMetadata,
      lookup([dead, notCached('https://b/x.png')]),
    );

    expect(status).toBeUndefined();
    expect(
      getNFTPreviewStatusFromCache({ dataUris: ['https://a/x.png'], dataHash: HASH }, noMetadata, lookup([])),
    ).toBeUndefined();
  });

  // The cache retries these on a later access, so a tile that asked would
  // fetch again; settling the NFT as unavailable would hide it from a
  // filtered gallery, and a hidden tile never asks.
  it.each([
    'Request aborted',
    'Response aborted',
    'HTTP error: 503',
    'HTTP error: 403',
    'HTTP error: 429',
    'net::ERR_CONNECTION_RESET',
    'net::ERR_NAME_NOT_RESOLVED',
    'Request timed out after 30000ms of inactivity',
  ])('stays undecided after %p, an error the cache will retry', (message) => {
    const status = getNFTPreviewStatusFromCache(
      { dataUris: ['https://a/x.png'], dataHash: HASH },
      noMetadata,
      lookup([errored('https://a/x.png', message)]),
    );

    expect(status).toBeUndefined();
  });

  it.each(['HTTP error: 404', 'HTTP error: 410', 'HTTP error: 501', 'net::ERR_CERT_AUTHORITY_INVALID', 'Invalid URL'])(
    'is unavailable after %p, an error the cache will not retry',
    (message) => {
      const status = getNFTPreviewStatusFromCache(
        { dataUris: ['https://a/x.png'], dataHash: HASH },
        noMetadata,
        lookup([errored('https://a/x.png', message)]),
      );

      expect(status).toBe(NFTPreviewStatus.UNAVAILABLE);
    },
  );

  it('is available through a verified thumbnail even when the data file is unreachable', () => {
    const status = getNFTPreviewStatusFromCache(
      { dataUris: ['https://a/x.png'], dataHash: HASH },
      metadataWithPreview,
      lookup([dead, cached('https://thumbs/x.png', 'def456')]),
    );

    expect(status).toBe(NFTPreviewStatus.AVAILABLE);
  });

  it('is available through a verified data file while the metadata is still loading', () => {
    const status = getNFTPreviewStatusFromCache(
      { dataUris: ['https://a/x.png'], dataHash: HASH },
      loadingMetadata,
      lookup([cached('https://a/x.png', 'abc123')]),
    );

    expect(status).toBe(NFTPreviewStatus.AVAILABLE);
  });

  it('does not settle an unreachable data file as unavailable until the metadata is known', () => {
    const nft = { dataUris: ['https://a/x.png'], dataHash: HASH };

    expect(getNFTPreviewStatusFromCache(nft, loadingMetadata, lookup([dead]))).toBeUndefined();
    expect(getNFTPreviewStatusFromCache(nft, metadataWithPreview, lookup([dead]))).toBeUndefined();
    expect(
      getNFTPreviewStatusFromCache(
        nft,
        metadataWithPreview,
        lookup([dead, errored('https://thumbs/x.png', 'getaddrinfo ENOTFOUND thumbs')]),
      ),
    ).toBe(NFTPreviewStatus.UNAVAILABLE);
    expect(getNFTPreviewStatusFromCache(nft, noMetadata, lookup([dead]))).toBe(NFTPreviewStatus.UNAVAILABLE);
  });

  it('lists the urls the classification consults', () => {
    const nft = { dataUris: ['https://a/x.png'], dataHash: HASH };

    expect(getNFTPreviewUrls(nft, loadingMetadata)).toEqual(['https://a/x.png']);
    expect(getNFTPreviewUrls(nft, metadataWithPreview)).toEqual(['https://thumbs/x.png', 'https://a/x.png']);
    // a preview source without a hash is never verified, so its uris are not consulted
    expect(
      getNFTPreviewUrls(nft, {
        metadata: { preview_image_uris: ['https://thumbs/unhashed.png'] },
        isLoading: false,
      }),
    ).toEqual(['https://a/x.png']);
  });
});

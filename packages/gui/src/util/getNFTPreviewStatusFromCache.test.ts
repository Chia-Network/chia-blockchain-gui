import type CacheInfo from '../@types/CacheInfo';
import type MetadataState from '../@types/MetadataState';
import NFTPreviewStatus from '../@types/NFTPreviewStatus';
import CacheState from '../constants/CacheState';

import getNFTPreviewStatusFromCache, {
  MAX_URIS_PER_CANDIDATE,
  getNFTPreviewUrls,
} from './getNFTPreviewStatusFromCache';

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
  it.each(['Request aborted', 'Response aborted'])(
    'stays undecided after %p, a download cancelled from our side and retried on the next access',
    (message) => {
      const status = getNFTPreviewStatusFromCache(
        { dataUris: ['https://a/x.png'], dataHash: HASH },
        noMetadata,
        lookup([errored('https://a/x.png', message)]),
      );

      expect(status).toBeUndefined();
    },
  );

  it.each([
    'HTTP error: 503',
    'HTTP error: 403',
    'HTTP error: 429',
    'net::ERR_CONNECTION_RESET',
    'net::ERR_NAME_NOT_RESOLVED',
    'Request timed out after 30000ms of inactivity',
  ])('is unavailable after %p, a transient failure the cache retries only when a tile asks', (message) => {
    // recorded long ago, so the cache would retry it for a tile that asked —
    // the filter still shows what a tile would be shown right now
    const status = getNFTPreviewStatusFromCache(
      { dataUris: ['https://a/x.png'], dataHash: HASH },
      noMetadata,
      lookup([errored('https://a/x.png', message)]),
    );

    expect(status).toBe(NFTPreviewStatus.UNAVAILABLE);
  });

  it('is unavailable after a transient failure whatever its age or count', () => {
    const now = 1_700_000_000_000;
    for (const [retries, ago] of [
      [undefined, 1000],
      [1, 1000],
      [1, 2 * 60 * 60 * 1000],
      [5, 24 * 60 * 60 * 1000],
    ] as const) {
      const info: CacheInfo = {
        url: 'https://a/x.png',
        state: CacheState.ERROR,
        error: 'HTTP error: 504',
        timestamp: now - ago,
        ...(retries === undefined ? {} : { retries }),
      };
      expect(
        getNFTPreviewStatusFromCache({ dataUris: ['https://a/x.png'], dataHash: HASH }, noMetadata, lookup([info])),
      ).toBe(NFTPreviewStatus.UNAVAILABLE);
    }
  });

  describe('an ipfs twin of a failed gateway link', () => {
    const now = 1_700_000_000_000;
    const CID = 'QmPK1s3pNYLi9ERiq3BDxKa4XosgWwFRQUydHUtz4YgpqB';
    const link = `https://nftstorage.link/ipfs/${CID}/x.png`;
    const twin = `ipfs://${CID}/x.png`;
    const failedLink: CacheInfo = {
      url: link,
      state: CacheState.ERROR,
      error: 'HTTP error: 504',
      timestamp: now - 60 * 60 * 1000,
      retries: 3,
    };

    it('is unavailable when the link failed and its never-fetched twin names the same content', () => {
      // the cache refuses the twin as cold content without writing a sidecar
      const status = getNFTPreviewStatusFromCache(
        { dataUris: [link, twin], dataHash: HASH },
        noMetadata,
        lookup([failedLink]),
        now,
      );
      expect(status).toBe(NFTPreviewStatus.UNAVAILABLE);
    });

    it('stays undecided for a never-fetched uri naming other content', () => {
      const other = 'ipfs://QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG/x.png';
      const status = getNFTPreviewStatusFromCache(
        { dataUris: [link, other], dataHash: HASH },
        noMetadata,
        lookup([failedLink]),
        now,
      );
      expect(status).toBeUndefined();
    });

    it.each([['a failed ipfs uri does not fail a never-fetched link: its own host would still be tried', twin, link]])(
      '%s',
      (_label, failedUri, neverFetched) => {
        const status = getNFTPreviewStatusFromCache(
          { dataUris: [failedUri, neverFetched], dataHash: HASH },
          noMetadata,
          lookup([{ ...failedLink, url: failedUri }]),
          now,
        );
        expect(status).toBeUndefined();
      },
    );

    it.each([
      // the content exists; a twin would be downloaded (and mismatch on its own)
      ['a hash mismatch', cached(link, '0xffff')],
      // no verdict on the content
      ['a network error', { ...failedLink, error: 'net::ERR_CONNECTION_RESET' }],
      ["the caller's deadline running out", { ...failedLink, error: 'Request exceeded the 30000ms download deadline' }],
      // the host is put on cooldown; the content is not cold and the twin is still fetched
      ['a rate limit', { ...failedLink, error: 'HTTP error: 429' }],
    ])('does not fail the twin after %s of the link', (_label, linkInfo) => {
      const status = getNFTPreviewStatusFromCache(
        { dataUris: [link, twin], dataHash: HASH },
        noMetadata,
        lookup([linkInfo as CacheInfo]),
        now,
      );
      expect(status).toBeUndefined();
    });

    it.each(['HTTP error: 404', 'HTTP error: 504', 'Request timed out after 30000ms of inactivity'])(
      'fails the twin after %p of the link, which cools the content for the gateway',
      (error) => {
        const status = getNFTPreviewStatusFromCache(
          { dataUris: [link, twin], dataHash: HASH },
          noMetadata,
          lookup([{ ...failedLink, error }]),
          now,
        );
        expect(status).toBe(NFTPreviewStatus.UNAVAILABLE);
      },
    );

    it('lets a twin with an outcome of its own speak for itself', () => {
      const status = getNFTPreviewStatusFromCache(
        { dataUris: [link, twin], dataHash: HASH },
        noMetadata,
        lookup([failedLink, cached(twin, HASH)]),
        now,
      );
      expect(status).toBe(NFTPreviewStatus.AVAILABLE);
    });

    it('dooms a metadata fetch whose ipfs copy is the twin of its failed gateway copy', () => {
      const metaLink = `https://nftstorage.link/ipfs/${CID}/x.json`;
      const metaTwin = `ipfs://${CID}/x.json`;
      const status = getNFTPreviewStatusFromCache(
        { dataUris: [link, twin], dataHash: HASH, metadataUris: [metaLink, metaTwin] },
        loadingMetadata,
        lookup([failedLink, { ...failedLink, url: metaLink }]),
        now,
      );
      expect(status).toBe(NFTPreviewStatus.UNAVAILABLE);
    });
  });

  describe('metadata still being fetched', () => {
    const now = 1_700_000_000_000;
    const repeated = (url: string, error = 'HTTP error: 504'): CacheInfo => ({
      url,
      state: CacheState.ERROR,
      error,
      timestamp: now - 60 * 60 * 1000,
      retries: 3,
    });
    const nft = {
      dataUris: ['https://a/x.png'],
      dataHash: HASH,
      metadataUris: ['https://a/x.json', 'ipfs://QmPK1s3pNYLi9ERiq3BDxKa4XosgWwFRQUydHUtz4YgpqB/x.json'],
    };

    it('consults the metadata uris while the fetch is in flight, and not once it has settled', () => {
      expect(getNFTPreviewUrls(nft, loadingMetadata)).toEqual([...nft.metadataUris, 'https://a/x.png']);
      expect(getNFTPreviewUrls(nft, noMetadata)).toEqual(['https://a/x.png']);
    });

    it('is unavailable when the data file and every metadata copy have been seen to fail', () => {
      const infos = lookup([repeated('https://a/x.png'), repeated(nft.metadataUris[0]), repeated(nft.metadataUris[1])]);
      expect(getNFTPreviewStatusFromCache(nft, loadingMetadata, infos)).toBe(NFTPreviewStatus.UNAVAILABLE);
    });

    it('stays undecided while a metadata copy has never been fetched, or is cached', () => {
      const fresh = lookup([repeated('https://a/x.png'), repeated(nft.metadataUris[0])]);
      expect(getNFTPreviewStatusFromCache(nft, loadingMetadata, fresh)).toBeUndefined();

      const cachedCopy = lookup([
        repeated('https://a/x.png'),
        repeated(nft.metadataUris[0]),
        cached(nft.metadataUris[1], '0x1234'),
      ]);
      expect(getNFTPreviewStatusFromCache(nft, loadingMetadata, cachedCopy)).toBeUndefined();
    });

    it('is unavailable even when a metadata copy failed only once: a tile asking would be shown that failure', () => {
      const infos = lookup([
        repeated('https://a/x.png'),
        repeated(nft.metadataUris[0]),
        { ...repeated(nft.metadataUris[1]), retries: 1, timestamp: now - 24 * 60 * 60 * 1000 },
      ]);
      expect(getNFTPreviewStatusFromCache(nft, loadingMetadata, infos)).toBe(NFTPreviewStatus.UNAVAILABLE);
    });

    it('stays undecided when only some of the recorded copies could be consulted', () => {
      const many = {
        ...nft,
        metadataUris: Array.from({ length: MAX_URIS_PER_CANDIDATE + 1 }, (_, i) => `https://a/${i}.json`),
      };
      const infos = lookup([repeated('https://a/x.png'), ...many.metadataUris.map((uri) => repeated(uri))]);
      expect(getNFTPreviewStatusFromCache(many, loadingMetadata, infos)).toBeUndefined();
    });

    it('does not decide the preview from the data file alone while the metadata is merely slow', () => {
      const infos = lookup([repeated('https://a/x.png')]);
      expect(getNFTPreviewStatusFromCache(nft, loadingMetadata, infos)).toBeUndefined();
    });
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

  it('consults nothing for a preview source whose uri list is not a list', () => {
    const nft = { dataUris: ['https://a/x.png'], dataHash: HASH };
    const hostile: MetadataState = {
      metadata: {
        preview_image_uris: {} as unknown as string[],
        preview_image_hash: PREVIEW_HASH,
        preview_video_uris: 5 as unknown as string[],
        preview_video_hash: PREVIEW_HASH,
      },
      isLoading: false,
    };

    expect(getNFTPreviewUrls(nft, hostile)).toEqual(['https://a/x.png']);
    expect(getNFTPreviewStatusFromCache(nft, hostile, lookup([cached('https://a/x.png', HASH)]))).toBe(
      NFTPreviewStatus.AVAILABLE,
    );
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

  // The uri arrays are minter-authored and uncapped; every url listed here is
  // a file read in the main process, so the sweep consults a bounded prefix.
  it('consults at most MAX_URIS_PER_CANDIDATE uris of one source', () => {
    const manyUris = Array.from({ length: 5000 }, (_, i) => `https://a/${i}.png`);
    const nft = { dataUris: manyUris, dataHash: HASH };

    const urls = getNFTPreviewUrls(nft, noMetadata);
    expect(urls).toHaveLength(MAX_URIS_PER_CANDIDATE);
    expect(urls).toEqual(manyUris.slice(0, MAX_URIS_PER_CANDIDATE));

    // per source, not per NFT: the thumbnail gets its own prefix
    expect(
      getNFTPreviewUrls(nft, {
        metadata: { preview_image_uris: manyUris, preview_image_hash: PREVIEW_HASH },
        isLoading: false,
      }),
    ).toHaveLength(2 * MAX_URIS_PER_CANDIDATE);
  });

  it('stays undecided when only uris past the cap are left, instead of calling the preview unavailable', () => {
    const manyUris = Array.from({ length: MAX_URIS_PER_CANDIDATE + 1 }, (_, i) => `https://a/${i}.png`);
    const nft = { dataUris: manyUris, dataHash: HASH };
    const consultedAllDead = manyUris
      .slice(0, MAX_URIS_PER_CANDIDATE)
      .map((url) => errored(url, 'getaddrinfo ENOTFOUND a'));

    // the ones consulted all failed, but the last was never looked at
    expect(getNFTPreviewStatusFromCache(nft, noMetadata, lookup(consultedAllDead))).toBeUndefined();

    // a verified uri within the prefix still decides it
    expect(
      getNFTPreviewStatusFromCache(nft, noMetadata, lookup([...consultedAllDead.slice(1), cached(manyUris[0], HASH)])),
    ).toBe(NFTPreviewStatus.AVAILABLE);

    // exactly the cap: every uri was consulted, so all-failed is unavailable
    const atCap = { dataUris: manyUris.slice(0, MAX_URIS_PER_CANDIDATE), dataHash: HASH };
    expect(getNFTPreviewStatusFromCache(atCap, noMetadata, lookup(consultedAllDead))).toBe(
      NFTPreviewStatus.UNAVAILABLE,
    );
  });
});

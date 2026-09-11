import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

type DownloadFile = typeof import('./utils/downloadFile').default;

const mockDownloadFile = jest.fn<ReturnType<DownloadFile>, Parameters<DownloadFile>>();

jest.mock('electron', () => ({
  BrowserWindow: jest.fn(),
  dialog: {
    showOpenDialog: jest.fn(),
  },
}));

jest.mock('./utils/downloadFile', () => ({
  __esModule: true,
  default: mockDownloadFile,
  MAX_FILE_SIZE_EXCEEDED_ERROR: 'Maximum file size exceeded',
  DEFAULT_DOWNLOAD_MAX_DURATION: jest.requireActual('./utils/downloadFile').DEFAULT_DOWNLOAD_MAX_DURATION,
  isTransientDownloadError: jest.requireActual('./utils/downloadFile').isTransientDownloadError,
  TEMP_FILE_SUFFIX: '.tmp',
  isDownloadTimeoutError: jest.requireActual('./utils/downloadFile').isDownloadTimeoutError,
  normalizeMaxSize: jest.requireActual('./utils/downloadFile').normalizeMaxSize,
  normalizeTimeout: jest.requireActual('./utils/downloadFile').normalizeTimeout,
}));

const { DEFAULT_DOWNLOAD_MAX_DURATION } =
  jest.requireActual<typeof import('./utils/downloadFile')>('./utils/downloadFile');

jest.mock('./utils/ipcMainHandle', () => ({
  __esModule: true,
  default: jest.fn(),
}));

const mockIpfsGatewayBase = jest.fn<string, []>(() => 'https://ipfs.io/ipfs/');
const mockIpfsGatewayEnabled = jest.fn<boolean, []>(() => true);

jest.mock('./utils/ipfsGateway', () => ({
  ...jest.requireActual('./utils/ipfsGateway'),
  ipfsGatewayBase: () => mockIpfsGatewayBase(),
  ipfsGatewayEnabled: () => mockIpfsGatewayEnabled(),
}));

const {
  default: CacheManager,
  MAX_CACHE_INFO_LOOKUPS,
  TRANSIENT_ERROR_RETRY_DELAY,
  MAX_TRANSIENT_ERROR_RETRY_DELAY,
  MAX_TRANSIENT_RETRIES,
  transientErrorRetryDelay,
  servedContentType,
} = jest.requireActual<typeof import('./CacheManager')>('./CacheManager');

// The download starts only after the sidecar has been read, so a test that
// interferes with an in-flight download has to wait for it to actually start.
async function untilDownloadsStarted(count: number) {
  for (let attempt = 0; attempt < 200 && mockDownloadFile.mock.calls.length < count; attempt += 1) {
    // eslint-disable-next-line no-await-in-loop -- polling
    await new Promise((resolve) => {
      setTimeout(resolve, 5);
    });
  }
  expect(mockDownloadFile).toHaveBeenCalledTimes(count);
}

describe('CacheManager eviction', () => {
  let cacheDirectory: string;

  beforeEach(async () => {
    mockDownloadFile.mockReset();
    cacheDirectory = await fs.mkdtemp(path.join(os.tmpdir(), 'chia-cache-manager-'));
  });

  afterEach(async () => {
    await fs.rm(cacheDirectory, { recursive: true, force: true });
  });

  it('does not evict a just-downloaded file that fits within the configured total size', async () => {
    const payload = Buffer.alloc(600, 7);
    mockDownloadFile.mockImplementation(async (_url, localPath) => {
      await fs.writeFile(localPath, payload);
      return {
        'content-type': 'image/png',
      };
    });

    const cacheManager = new CacheManager({
      cacheDirectory,
      maxCacheSize: 1024,
    });
    await cacheManager.init();

    await expect(cacheManager.getContent('https://example.com/nft.png')).resolves.toEqual(payload);
    await expect(cacheManager.getCacheSize()).resolves.toBeLessThanOrEqual(1024);
  });

  it('keeps a completed download cached when cache housekeeping fails', async () => {
    const payload = Buffer.from('cached payload');
    mockDownloadFile.mockImplementation(async (_url, localPath) => {
      await fs.writeFile(localPath, payload);
      return {
        'content-type': 'image/png',
      };
    });

    const cacheManager = new CacheManager({
      cacheDirectory,
      maxCacheSize: 1024,
    });
    await cacheManager.init();

    // A concurrent invalidation can delete files mid-scan and make the
    // post-download size check fail — that must not poison the download.
    jest
      .spyOn(cacheManager, 'getCacheSize')
      .mockRejectedValueOnce(new Error("ENOENT: no such file or directory, stat '/cache/other-chiacache'"));

    await expect(cacheManager.getContent('https://example.com/nft.png')).resolves.toEqual(payload);
    await expect(cacheManager.getContent('https://example.com/nft.png')).resolves.toEqual(payload);
    expect(mockDownloadFile).toHaveBeenCalledTimes(1);
  });

  it('ignores files that vanish while the cache size is being measured', async () => {
    const cacheManager = new CacheManager({
      cacheDirectory,
      maxCacheSize: 1024,
    });
    await cacheManager.init();

    await fs.writeFile(path.join(cacheDirectory, 'aaaa-chiacache'), Buffer.alloc(100));
    // a broken symlink stats like a file deleted between readdir and stat
    await fs.symlink(path.join(cacheDirectory, 'missing-target'), path.join(cacheDirectory, 'bbbb-chiacache'));

    await expect(cacheManager.getCacheSize()).resolves.toBe(100);
  });

  it('evicts without failing when a file vanishes during the eviction scan', async () => {
    const cacheManager = new CacheManager({
      cacheDirectory,
      maxCacheSize: 1024,
    });
    await cacheManager.init();

    await fs.writeFile(path.join(cacheDirectory, 'aaaa-chiacache'), Buffer.alloc(200));
    await fs.symlink(path.join(cacheDirectory, 'missing-target'), path.join(cacheDirectory, 'bbbb-chiacache'));

    await expect(cacheManager.setMaxCacheSize(100)).resolves.toBeUndefined();
    await expect(fs.stat(path.join(cacheDirectory, 'aaaa-chiacache'))).rejects.toThrow('ENOENT');
  });

  it('does not retry a timed-out download on the next access', async () => {
    mockDownloadFile.mockRejectedValue(new Error('Request timed out after 30000ms of inactivity'));

    const cacheManager = new CacheManager({
      cacheDirectory,
      maxCacheSize: 1024,
    });
    await cacheManager.init();

    await expect(cacheManager.getContent('https://example.com/nft.png')).rejects.toThrow('Request timed out');
    await expect(cacheManager.getContent('https://example.com/nft.png')).rejects.toThrow('Request timed out');
    expect(mockDownloadFile).toHaveBeenCalledTimes(1);
  });

  it('retries a timeout persisted by a previous session', async () => {
    const payload = Buffer.from('cached payload');
    mockDownloadFile.mockRejectedValue(new Error('Request timed out after 30000ms of inactivity'));

    const firstSession = new CacheManager({
      cacheDirectory,
      maxCacheSize: 1024,
    });
    await firstSession.init();
    await expect(firstSession.getContent('https://example.com/nft.png')).rejects.toThrow('Request timed out');

    mockDownloadFile.mockReset();
    mockDownloadFile.mockImplementation(async (_url, localPath) => {
      await fs.writeFile(localPath, payload);
      return {
        'content-type': 'image/png',
      };
    });

    const secondSession = new CacheManager({
      cacheDirectory,
      maxCacheSize: 1024,
    });
    await secondSession.init();
    await expect(secondSession.getContent('https://example.com/nft.png')).resolves.toEqual(payload);
  });

  it('does not retry a gateway error on the next access', async () => {
    mockDownloadFile.mockRejectedValue(new Error('HTTP error: 504'));

    const cacheManager = new CacheManager({
      cacheDirectory,
      maxCacheSize: 1024,
    });
    await cacheManager.init();

    await expect(cacheManager.getContent('https://example.com/nft.png')).rejects.toThrow('HTTP error: 504');
    await expect(cacheManager.getContent('https://example.com/nft.png')).rejects.toThrow('HTTP error: 504');
    expect(mockDownloadFile).toHaveBeenCalledTimes(1);
  });

  it.each(['HTTP error: 504', 'HTTP error: 403', 'net::ERR_BLOCKED_BY_RESPONSE'])(
    'retries %p persisted by a previous session',
    async (message) => {
      const payload = Buffer.from('cached payload');
      mockDownloadFile.mockRejectedValue(new Error(message));

      const firstSession = new CacheManager({
        cacheDirectory,
        maxCacheSize: 1024,
      });
      await firstSession.init();
      await expect(firstSession.getContent('https://example.com/nft.png')).rejects.toThrow(message);

      mockDownloadFile.mockReset();
      mockDownloadFile.mockImplementation(async (_url, localPath) => {
        await fs.writeFile(localPath, payload);
        return {
          'content-type': 'image/png',
        };
      });

      const secondSession = new CacheManager({
        cacheDirectory,
        maxCacheSize: 1024,
      });
      await secondSession.init();
      await expect(secondSession.getContent('https://example.com/nft.png')).resolves.toEqual(payload);
    },
  );

  it('retries a transient error within the session once the retry delay has elapsed', async () => {
    const payload = Buffer.from('cached payload');
    const failedAt = Date.now();
    const nowSpy = jest.spyOn(Date, 'now').mockReturnValue(failedAt);
    mockDownloadFile.mockRejectedValue(new Error('HTTP error: 504'));

    try {
      const cacheManager = new CacheManager({
        cacheDirectory,
        maxCacheSize: 1024,
      });
      await cacheManager.init();

      await expect(cacheManager.getContent('https://example.com/nft.png')).rejects.toThrow('HTTP error: 504');

      nowSpy.mockReturnValue(failedAt + TRANSIENT_ERROR_RETRY_DELAY - 1);
      await expect(cacheManager.getContent('https://example.com/nft.png')).rejects.toThrow('HTTP error: 504');
      expect(mockDownloadFile).toHaveBeenCalledTimes(1);

      mockDownloadFile.mockReset();
      mockDownloadFile.mockImplementation(async (_url, localPath) => {
        await fs.writeFile(localPath, payload);
        return {
          'content-type': 'image/png',
        };
      });

      nowSpy.mockReturnValue(failedAt + TRANSIENT_ERROR_RETRY_DELAY);
      await expect(cacheManager.getContent('https://example.com/nft.png')).resolves.toEqual(payload);
      expect(mockDownloadFile).toHaveBeenCalledTimes(1);
    } finally {
      nowSpy.mockRestore();
    }
  });

  it('waits twice as long before each further in-session retry of a transient error', async () => {
    const url = 'https://example.com/nft.png';
    const firstFailure = Date.now();
    const nowSpy = jest.spyOn(Date, 'now').mockReturnValue(firstFailure);
    mockDownloadFile.mockRejectedValue(new Error('HTTP error: 503'));

    try {
      const cacheManager = new CacheManager({
        cacheDirectory,
        maxCacheSize: 1024,
      });
      await cacheManager.init();

      await expect(cacheManager.getContent(url)).rejects.toThrow('HTTP error: 503');
      expect(await cacheManager.getCacheInfos([url])).toEqual([expect.objectContaining({ retries: 1 })]);

      // first retry after the base delay, and it fails again
      const secondFailure = firstFailure + transientErrorRetryDelay(1);
      nowSpy.mockReturnValue(secondFailure);
      await expect(cacheManager.getContent(url)).rejects.toThrow('HTTP error: 503');
      expect(mockDownloadFile).toHaveBeenCalledTimes(2);
      expect(await cacheManager.getCacheInfos([url])).toEqual([expect.objectContaining({ retries: 2 })]);

      // the base delay is no longer enough...
      nowSpy.mockReturnValue(secondFailure + transientErrorRetryDelay(1));
      await expect(cacheManager.getContent(url)).rejects.toThrow('HTTP error: 503');
      expect(mockDownloadFile).toHaveBeenCalledTimes(2);

      // ...twice the base delay is
      nowSpy.mockReturnValue(secondFailure + transientErrorRetryDelay(2));
      await expect(cacheManager.getContent(url)).rejects.toThrow('HTTP error: 503');
      expect(mockDownloadFile).toHaveBeenCalledTimes(3);
      expect(transientErrorRetryDelay(2)).toBe(2 * TRANSIENT_ERROR_RETRY_DELAY);
    } finally {
      nowSpy.mockRestore();
    }
  });

  it('stops retrying a transient error within the session after the retry cap, but still once per later session', async () => {
    const url = 'https://example.com/nft.png';
    let now = Date.now();
    const nowSpy = jest.spyOn(Date, 'now').mockImplementation(() => now);
    mockDownloadFile.mockRejectedValue(new Error('net::ERR_CONNECTION_RESET'));

    try {
      const cacheManager = new CacheManager({
        cacheDirectory,
        maxCacheSize: 1024,
      });
      await cacheManager.init();

      await expect(cacheManager.getContent(url)).rejects.toThrow('net::ERR_CONNECTION_RESET');
      for (let attempt = 2; attempt <= MAX_TRANSIENT_RETRIES; attempt += 1) {
        now += MAX_TRANSIENT_ERROR_RETRY_DELAY;
        // eslint-disable-next-line no-await-in-loop -- consecutive retries
        await expect(cacheManager.getContent(url)).rejects.toThrow('net::ERR_CONNECTION_RESET');
        expect(mockDownloadFile).toHaveBeenCalledTimes(attempt);
      }
      expect(await cacheManager.getCacheInfos([url])).toEqual([
        expect.objectContaining({ retries: MAX_TRANSIENT_RETRIES }),
      ]);

      // the cap is reached: however long the wallet stays open, no more probes
      now += 100 * MAX_TRANSIENT_ERROR_RETRY_DELAY;
      await expect(cacheManager.getContent(url)).rejects.toThrow('net::ERR_CONNECTION_RESET');
      expect(mockDownloadFile).toHaveBeenCalledTimes(MAX_TRANSIENT_RETRIES);

      // a later session still gives the URL its one retry
      const laterSession = new CacheManager({
        cacheDirectory,
        maxCacheSize: 1024,
      });
      await laterSession.init();
      await expect(laterSession.getContent(url)).rejects.toThrow('net::ERR_CONNECTION_RESET');
      expect(mockDownloadFile).toHaveBeenCalledTimes(MAX_TRANSIENT_RETRIES + 1);
      await expect(laterSession.getContent(url)).rejects.toThrow('net::ERR_CONNECTION_RESET');
      expect(mockDownloadFile).toHaveBeenCalledTimes(MAX_TRANSIENT_RETRIES + 1);
    } finally {
      nowSpy.mockRestore();
    }
  });

  it('starts the retry count over when a transient failure follows a settled one', async () => {
    const url = 'https://example.com/nft.png';
    const urlHash = crypto.createHash('md5').update(url).digest('hex');
    // a sidecar left by an earlier version, or by a failure that has since
    // become permanent: the count belongs to an unbroken run of transient
    // failures only
    await fs.writeFile(
      path.join(cacheDirectory, `${urlHash}-chiacache-info`),
      JSON.stringify({ url, state: 'ERROR', error: 'Request aborted', timestamp: Date.now(), retries: 5 }),
    );
    mockDownloadFile.mockRejectedValue(new Error('HTTP error: 502'));

    const cacheManager = new CacheManager({
      cacheDirectory,
      maxCacheSize: 1024,
    });
    await cacheManager.init();

    await expect(cacheManager.getContent(url)).rejects.toThrow('HTTP error: 502');
    expect(await cacheManager.getCacheInfos([url])).toEqual([expect.objectContaining({ retries: 1 })]);
  });

  it('keeps a missing resource settled across sessions', async () => {
    mockDownloadFile.mockRejectedValue(new Error('HTTP error: 404'));

    const firstSession = new CacheManager({
      cacheDirectory,
      maxCacheSize: 1024,
    });
    await firstSession.init();
    await expect(firstSession.getContent('https://example.com/nft.png')).rejects.toThrow('HTTP error: 404');

    const secondSession = new CacheManager({
      cacheDirectory,
      maxCacheSize: 1024,
    });
    await secondSession.init();
    await expect(secondSession.getContent('https://example.com/nft.png')).rejects.toThrow('HTTP error: 404');
    expect(mockDownloadFile).toHaveBeenCalledTimes(1);
  });

  it('retries a failed ipfs download as soon as the gateway changes', async () => {
    const payload = Buffer.from('cached payload');
    const url = 'ipfs://QmPK1s3pNYLi9ERiq3BDxKa4XosgWwFRQUydHUtz4YgpqB/img.png';
    mockDownloadFile.mockRejectedValue(new Error('HTTP error: 403'));

    const cacheManager = new CacheManager({
      cacheDirectory,
      maxCacheSize: 1024,
    });
    await cacheManager.init();

    await expect(cacheManager.getContent(url)).rejects.toThrow('HTTP error: 403');
    // same gateway, within the retry delay: still settled
    await expect(cacheManager.getContent(url)).rejects.toThrow('HTTP error: 403');
    expect(mockDownloadFile).toHaveBeenCalledTimes(1);

    mockDownloadFile.mockReset();
    mockDownloadFile.mockImplementation(async (_url, localPath) => {
      await fs.writeFile(localPath, payload);
      return {
        'content-type': 'image/png',
      };
    });
    mockIpfsGatewayBase.mockReturnValue('https://dweb.link/ipfs/');

    try {
      await expect(cacheManager.getContent(url)).resolves.toEqual(payload);
      expect(mockDownloadFile).toHaveBeenCalledTimes(1);
    } finally {
      mockIpfsGatewayBase.mockReturnValue('https://ipfs.io/ipfs/');
    }
  });

  it('retries through the new gateway when a fetch joined in flight was started under the old one', async () => {
    const payload = Buffer.from('cached payload');
    const url = 'ipfs://QmPK1s3pNYLi9ERiq3BDxKa4XosgWwFRQUydHUtz4YgpqB/img.png';

    let failFirstDownload!: (error: Error) => void;
    mockDownloadFile.mockImplementationOnce(
      () =>
        new Promise((_resolve, reject) => {
          failFirstDownload = reject;
        }),
    );

    const cacheManager = new CacheManager({
      cacheDirectory,
      maxCacheSize: 1024,
    });
    await cacheManager.init();

    try {
      // started through the default gateway, still in flight
      const first = cacheManager.getContent(url);
      await untilDownloadsStarted(1);

      // the user switches gateways while it is in flight, and a tile asks again
      mockIpfsGatewayBase.mockReturnValue('https://dweb.link/ipfs/');
      mockDownloadFile.mockImplementation(async (_url, localPath) => {
        await fs.writeFile(localPath, payload);
        return {
          'content-type': 'image/png',
        };
      });
      const second = cacheManager.getContent(url);

      failFirstDownload(new Error('HTTP error: 403'));

      await expect(first).rejects.toThrow('HTTP error: 403');
      // the failure belongs to the old gateway, so the joiner is retried
      // through the new one instead of inheriting the error
      await expect(second).resolves.toEqual(payload);
      expect(mockDownloadFile).toHaveBeenCalledTimes(2);
    } finally {
      mockIpfsGatewayBase.mockReturnValue('https://ipfs.io/ipfs/');
    }
  });

  it('records a failure against the gateway the request was started through', async () => {
    const url = 'ipfs://QmPK1s3pNYLi9ERiq3BDxKa4XosgWwFRQUydHUtz4YgpqB/img.png';

    let failDownload!: (error: Error) => void;
    mockDownloadFile.mockImplementationOnce(
      () =>
        new Promise((_resolve, reject) => {
          failDownload = reject;
        }),
    );

    const cacheManager = new CacheManager({
      cacheDirectory,
      maxCacheSize: 1024,
    });
    await cacheManager.init();

    try {
      const pending = cacheManager.getContent(url);
      await untilDownloadsStarted(1);
      mockIpfsGatewayBase.mockReturnValue('https://dweb.link/ipfs/');
      failDownload(new Error('HTTP error: 403'));
      await expect(pending).rejects.toThrow('HTTP error: 403');

      const [info] = await cacheManager.getCacheInfos([url]);
      expect(info).toMatchObject({ state: 'ERROR', gateway: 'https://ipfs.io/ipfs/' });
    } finally {
      mockIpfsGatewayBase.mockReturnValue('https://ipfs.io/ipfs/');
    }
  });

  it('downloads through the gateway captured when the request entered, even if the preference changed before the transfer started', async () => {
    const url = 'ipfs://QmPK1s3pNYLi9ERiq3BDxKa4XosgWwFRQUydHUtz4YgpqB/img.png';
    mockDownloadFile.mockRejectedValue(new Error('HTTP error: 403'));

    const cacheManager = new CacheManager({
      cacheDirectory,
      maxCacheSize: 1024,
    });
    await cacheManager.init();

    try {
      const pending = cacheManager.getContent(url);
      // the download has not started yet (the sidecar is still being read)
      expect(mockDownloadFile).not.toHaveBeenCalled();
      mockIpfsGatewayBase.mockReturnValue('https://dweb.link/ipfs/');

      await expect(pending).rejects.toThrow('HTTP error: 403');

      // the transfer was pinned to the gateway the request entered with, and
      // the sidecar names that same gateway
      expect(mockDownloadFile.mock.calls[0][2]).toMatchObject({ gatewayBase: 'https://ipfs.io/ipfs/' });
      const [info] = await cacheManager.getCacheInfos([url]);
      expect(info).toMatchObject({ state: 'ERROR', gateway: 'https://ipfs.io/ipfs/' });
    } finally {
      mockIpfsGatewayBase.mockReturnValue('https://ipfs.io/ipfs/');
    }
  });

  it('does not keep re-requesting an ipfs failure whose sidecar predates gateway tracking', async () => {
    const url = 'ipfs://QmPK1s3pNYLi9ERiq3BDxKa4XosgWwFRQUydHUtz4YgpqB/img.png';
    // an ERROR sidecar written by a version that did not record the gateway
    const urlHash = crypto.createHash('md5').update(url).digest('hex');
    await fs.writeFile(
      path.join(cacheDirectory, `${urlHash}-chiacache-info`),
      JSON.stringify({ url, state: 'ERROR', error: 'HTTP error: 403', timestamp: Date.now() }),
    );
    mockDownloadFile.mockRejectedValue(new Error('HTTP error: 403'));

    const cacheManager = new CacheManager({
      cacheDirectory,
      maxCacheSize: 1024,
    });
    await cacheManager.init();

    // retried once per session like any transient failure...
    await expect(cacheManager.getContent(url)).rejects.toThrow('HTTP error: 403');
    // ...and then settled, instead of on every access
    await expect(cacheManager.getContent(url)).rejects.toThrow('HTTP error: 403');
    expect(mockDownloadFile).toHaveBeenCalledTimes(1);
  });

  it('starts the transient retry count over on a gateway change', async () => {
    const url = 'ipfs://QmPK1s3pNYLi9ERiq3BDxKa4XosgWwFRQUydHUtz4YgpqB/img.png';
    let now = Date.now();
    const nowSpy = jest.spyOn(Date, 'now').mockImplementation(() => now);
    mockDownloadFile.mockRejectedValue(new Error('HTTP error: 503'));

    const cacheManager = new CacheManager({
      cacheDirectory,
      maxCacheSize: 1024,
    });
    await cacheManager.init();

    try {
      await expect(cacheManager.getContent(url)).rejects.toThrow('HTTP error: 503');
      now += transientErrorRetryDelay(1);
      await expect(cacheManager.getContent(url)).rejects.toThrow('HTTP error: 503');
      expect(await cacheManager.getCacheInfos([url])).toEqual([
        expect.objectContaining({ retries: 2, gateway: 'https://ipfs.io/ipfs/' }),
      ]);

      // the failures were a verdict on the old gateway; the new one has not
      // failed yet
      mockIpfsGatewayBase.mockReturnValue('https://dweb.link/ipfs/');
      await expect(cacheManager.getContent(url)).rejects.toThrow('HTTP error: 503');
      expect(mockDownloadFile).toHaveBeenCalledTimes(3);
      expect(await cacheManager.getCacheInfos([url])).toEqual([
        expect.objectContaining({ retries: 1, gateway: 'https://dweb.link/ipfs/' }),
      ]);
    } finally {
      nowSpy.mockRestore();
      mockIpfsGatewayBase.mockReturnValue('https://ipfs.io/ipfs/');
    }
  });

  it('does not treat a gateway change as a reason to retry while the gateway option is off', async () => {
    const url = 'ipfs://QmPK1s3pNYLi9ERiq3BDxKa4XosgWwFRQUydHUtz4YgpqB/img.png';
    mockDownloadFile.mockRejectedValue(new Error('HTTP error: 403'));

    const cacheManager = new CacheManager({
      cacheDirectory,
      maxCacheSize: 1024,
    });
    await cacheManager.init();

    await expect(cacheManager.getContent(url)).rejects.toThrow('HTTP error: 403');

    mockIpfsGatewayBase.mockReturnValue('https://dweb.link/ipfs/');
    mockIpfsGatewayEnabled.mockReturnValue(false);
    try {
      await expect(cacheManager.getContent(url)).rejects.toThrow('HTTP error: 403');
      expect(mockDownloadFile).toHaveBeenCalledTimes(1);
    } finally {
      mockIpfsGatewayBase.mockReturnValue('https://ipfs.io/ipfs/');
      mockIpfsGatewayEnabled.mockReturnValue(true);
    }
  });

  it('refetches an IPFS gateway link through the configured gateway when its own host fails', async () => {
    const payload = Buffer.from('cached payload');
    const url = 'https://nftstorage.link/ipfs/QmPK1s3pNYLi9ERiq3BDxKa4XosgWwFRQUydHUtz4YgpqB/img.png';
    mockDownloadFile
      .mockRejectedValueOnce(new Error('HTTP error: 403'))
      .mockImplementationOnce(async (_url, localPath) => {
        await fs.writeFile(localPath, payload);
        return {
          'content-type': 'image/png',
        };
      });

    const cacheManager = new CacheManager({
      cacheDirectory,
      maxCacheSize: 1024,
    });
    await cacheManager.init();

    await expect(cacheManager.getContent(url)).resolves.toEqual(payload);
    expect(mockDownloadFile).toHaveBeenCalledTimes(2);
    // same cache key, fetched from the gateway instead
    expect(mockDownloadFile.mock.calls[1][0]).toBe(url);
    expect(mockDownloadFile.mock.calls[1][2]).toMatchObject({
      requestUrl: 'https://ipfs.io/ipfs/QmPK1s3pNYLi9ERiq3BDxKa4XosgWwFRQUydHUtz4YgpqB/img.png',
    });
  });

  it.each([
    ['a plain https url', 'https://example.com/nft.png', 'HTTP error: 403'],
    [
      'a link already served by the configured gateway',
      'https://ipfs.io/ipfs/QmPK1s3pNYLi9ERiq3BDxKa4XosgWwFRQUydHUtz4YgpqB/img.png',
      'HTTP error: 403',
    ],
    [
      // the same operator behind a subdomain: a retry through it would ask the host that just failed
      'a subdomain link on the configured gateway host',
      'https://bafybeiceg2gltyhlkukwetn26k7t2zdvthg4u4c6uj23rpni2adzgvo5si.ipfs.ipfs.io/img.png',
      'HTTP error: 403',
    ],
    [
      'an aborted download',
      'https://nftstorage.link/ipfs/QmPK1s3pNYLi9ERiq3BDxKa4XosgWwFRQUydHUtz4YgpqB/img.png',
      'Request aborted',
    ],
    [
      'a download over the size cap',
      'https://nftstorage.link/ipfs/QmPK1s3pNYLi9ERiq3BDxKa4XosgWwFRQUydHUtz4YgpqB/img.png',
      'Maximum file size exceeded',
    ],
    // the text after /ipfs/ is not a CID path, so there is nothing a gateway
    // could serve — and appended to a local gateway it would name a path on
    // this machine
    ['a gateway-looking link whose path leaves /ipfs/', 'https://attacker.example/ipfs/../../admin', 'HTTP error: 500'],
    [
      'a gateway-looking link with an encoded dot segment',
      'https://attacker.example/ipfs/%2e%2e/%2e%2e/api/v0/shutdown',
      'HTTP error: 500',
    ],
    [
      'a subdomain-style link whose path leaves /ipfs/',
      'https://abc.ipfs.attacker.example/../../debug/vars',
      'HTTP error: 500',
    ],
  ])('does not fall back to the gateway for %s', async (_label, url, message) => {
    mockDownloadFile.mockRejectedValue(new Error(message));

    const cacheManager = new CacheManager({
      cacheDirectory,
      maxCacheSize: 1024,
    });
    await cacheManager.init();

    await expect(cacheManager.getContent(url)).rejects.toThrow(message);
    expect(mockDownloadFile).toHaveBeenCalledTimes(1);
  });

  it('refetches a subdomain gateway link on another host through the configured gateway', async () => {
    const payload = Buffer.from('cached payload');
    const cid = 'bafybeiceg2gltyhlkukwetn26k7t2zdvthg4u4c6uj23rpni2adzgvo5si';
    const url = `https://${cid}.ipfs.dweb.link/img.png`;
    mockDownloadFile
      .mockRejectedValueOnce(new Error('HTTP error: 502'))
      .mockImplementationOnce(async (_url, localPath) => {
        await fs.writeFile(localPath, payload);
        return {
          'content-type': 'image/png',
        };
      });

    const cacheManager = new CacheManager({
      cacheDirectory,
      maxCacheSize: 1024,
    });
    await cacheManager.init();

    await expect(cacheManager.getContent(url)).resolves.toEqual(payload);
    expect(mockDownloadFile).toHaveBeenCalledTimes(2);
    expect(mockDownloadFile.mock.calls[1][2]).toMatchObject({ requestUrl: `https://ipfs.io/ipfs/${cid}/img.png` });
  });

  it('gives the gateway fallback only what is left of the download deadline', async () => {
    const payload = Buffer.from('cached payload');
    const url = 'https://nftstorage.link/ipfs/QmPK1s3pNYLi9ERiq3BDxKa4XosgWwFRQUydHUtz4YgpqB/img.png';
    let now = Date.now();
    const nowSpy = jest.spyOn(Date, 'now').mockImplementation(() => now);
    const firstLegDuration = 10 * 60 * 1000;
    mockDownloadFile
      .mockImplementationOnce(async () => {
        now += firstLegDuration;
        throw new Error('Request timed out after 30000ms of inactivity');
      })
      .mockImplementationOnce(async (_url, localPath) => {
        await fs.writeFile(localPath, payload);
        return {
          'content-type': 'image/png',
        };
      });

    const cacheManager = new CacheManager({
      cacheDirectory,
      maxCacheSize: 1024,
    });
    await cacheManager.init();

    try {
      await expect(cacheManager.getContent(url)).resolves.toEqual(payload);
      expect(mockDownloadFile).toHaveBeenCalledTimes(2);
      expect(mockDownloadFile.mock.calls[0][2]).toMatchObject({ maxDuration: DEFAULT_DOWNLOAD_MAX_DURATION });
      expect(mockDownloadFile.mock.calls[1][2]).toMatchObject({
        maxDuration: DEFAULT_DOWNLOAD_MAX_DURATION - firstLegDuration,
      });
    } finally {
      nowSpy.mockRestore();
    }
  });

  it('refuses a caller whose shared budget is spent instead of expiring the download it would join', async () => {
    const payload = Buffer.from('cached payload');
    const url = 'https://example.com/nft.png';
    let finishDownload!: () => Promise<void>;
    let aborted = false;
    mockDownloadFile.mockImplementationOnce(
      (_url, localPath, options) =>
        new Promise((resolve, reject) => {
          options?.signal?.addEventListener(
            'abort',
            () => {
              aborted = true;
              reject(new Error('Request aborted'));
            },
            { once: true },
          );
          finishDownload = async () => {
            await fs.writeFile(localPath, payload);
            resolve({ 'content-type': 'image/png' });
          };
        }),
    );

    const cacheManager = new CacheManager({
      cacheDirectory,
      maxCacheSize: 1024,
    });
    await cacheManager.init();

    const first = cacheManager.getContent(url);
    await untilDownloadsStarted(1);

    // a recheck arrives with nothing left of its shared allowance: it is
    // refused outright rather than seated on the transfer with a deadline
    // that expires at once
    await expect(cacheManager.fetchRemoteContent(url, {}, { remaining: 0 })).rejects.toThrow(
      'shared download deadline',
    );
    expect(aborted).toBe(false);

    await finishDownload();
    await expect(first).resolves.toEqual(payload);
    expect(mockDownloadFile).toHaveBeenCalledTimes(1);
    // the refusal recorded nothing: the entry is the completed download's
    const [info] = await cacheManager.getCacheInfos([url]);
    expect(info.state).toBe('CACHED');
  });

  it('serves cached content to a caller whose shared budget is spent', async () => {
    const payload = Buffer.from('cached payload');
    const url = 'https://example.com/nft.png';
    mockDownloadFile.mockImplementation(async (_url, localPath) => {
      await fs.writeFile(localPath, payload);
      return { 'content-type': 'image/png' };
    });

    const cacheManager = new CacheManager({
      cacheDirectory,
      maxCacheSize: 1024,
    });
    await cacheManager.init();
    await expect(cacheManager.getContent(url)).resolves.toEqual(payload);

    // a recheck whose allowance the transfer used up in full still finds the
    // file it paid for: serving it needs no further transfer
    await expect(cacheManager.fetchRemoteContent(url, {}, { remaining: 0 })).resolves.toMatchObject({
      state: 'CACHED',
    });
    expect(mockDownloadFile).toHaveBeenCalledTimes(1);
  });

  it('records nothing when a caller whose shared budget is spent finds no cached entry', async () => {
    const url = 'https://example.com/nft.png';
    const cacheManager = new CacheManager({
      cacheDirectory,
      maxCacheSize: 1024,
    });
    await cacheManager.init();

    await expect(cacheManager.fetchRemoteContent(url, {}, { remaining: 0 })).rejects.toThrow(
      'shared download deadline',
    );
    expect(mockDownloadFile).not.toHaveBeenCalled();
    // the refusal is the caller's, not the url's: no sidecar, so a funded
    // caller — and the next gateway — start from nothing
    const [info] = await cacheManager.getCacheInfos([url]);
    expect(info.state).toBe('NOT_CACHED');
    expect(await fs.readdir(cacheDirectory)).toEqual([]);
  });

  it('hands a caller whose shared budget is spent the settled failure the cache holds', async () => {
    const url = 'https://example.com/nft.png';
    mockDownloadFile.mockRejectedValue(new Error('HTTP error: 404'));
    const cacheManager = new CacheManager({
      cacheDirectory,
      maxCacheSize: 1024,
    });
    await cacheManager.init();
    await expect(cacheManager.getContent(url)).rejects.toThrow('HTTP error: 404');

    // a 404 is not retried, so the spent caller is told what the cache knows
    await expect(cacheManager.fetchRemoteContent(url, {}, { remaining: 0 })).resolves.toMatchObject({
      state: 'ERROR',
      error: 'HTTP error: 404',
    });
    expect(mockDownloadFile).toHaveBeenCalledTimes(1);
  });

  it('serves every caller that shares a lookup of an entry that is already cached', async () => {
    const payload = Buffer.from('shared bytes');
    mockDownloadFile.mockImplementation(async (_url, localPath) => {
      await fs.writeFile(localPath, payload);
      return { 'content-type': 'image/png' };
    });
    const cacheManager = new CacheManager({ cacheDirectory, maxCacheSize: 1024 });
    await cacheManager.init();
    const url = 'https://example.com/shared.png';
    await cacheManager.getContent(url);

    // several tiles ask for the same cached file at once: the first lookup
    // finishes from the sidecar and never starts a transfer, and the others
    // must still be answered
    const results = await Promise.all([
      cacheManager.getContent(url),
      cacheManager.getContent(url, { maxDuration: 100 }),
      cacheManager.getChecksum(url),
      cacheManager.getURI(url),
    ]);
    expect(results[0]).toEqual(payload);
    expect(results[1]).toEqual(payload);
    expect(mockDownloadFile).toHaveBeenCalledTimes(1);
  });

  it('answers a caller that shares a lookup of a settled failure', async () => {
    mockDownloadFile.mockRejectedValue(new Error('HTTP error: 404'));
    const cacheManager = new CacheManager({ cacheDirectory, maxCacheSize: 1024 });
    await cacheManager.init();
    const url = 'https://example.com/gone.png';
    await expect(cacheManager.getContent(url)).rejects.toThrow('HTTP error: 404');

    const results = await Promise.allSettled([
      cacheManager.getContent(url),
      cacheManager.getContent(url, { maxDuration: 100 }),
    ]);
    expect(results.map((result) => result.status)).toEqual(['rejected', 'rejected']);
    expect(mockDownloadFile).toHaveBeenCalledTimes(1);
  });

  it('refuses a joiner after its own allowance without ending the transfer it joined', async () => {
    const payload = Buffer.from('video bytes');
    const url = 'https://example.com/video.mp4';
    let finishDownload!: () => Promise<void>;
    let aborted = false;
    mockDownloadFile.mockImplementationOnce(
      (_url, localPath, options) =>
        new Promise((resolve, reject) => {
          options?.signal?.addEventListener(
            'abort',
            () => {
              aborted = true;
              reject(new Error('Request aborted'));
            },
            { once: true },
          );
          finishDownload = async () => {
            await fs.writeFile(localPath, payload);
            resolve({ 'content-type': 'video/mp4' });
          };
        }),
    );
    const cacheManager = new CacheManager({ cacheDirectory, maxCacheSize: 1024 });
    await cacheManager.init();

    // another NFT's tile is downloading the video
    const owner = cacheManager.getContent(url);
    await untilDownloadsStarted(1);
    // a metadata fetch whose NFT lists the same url joins with a small allowance
    await expect(cacheManager.fetchRemoteContent(url, { maxDuration: 40 })).rejects.toThrow('shared download deadline');
    // ... and the video transfer is still running, untouched
    expect(aborted).toBe(false);
    await finishDownload();
    await expect(owner).resolves.toEqual(payload);
    expect(mockDownloadFile).toHaveBeenCalledTimes(1);
    const [info] = await cacheManager.getCacheInfos([url]);
    expect(info.state).toBe('CACHED');
  });

  it('does not hand a cached file to a caller whose cap it exceeds, and keeps it for callers it fits', async () => {
    const payload = Buffer.alloc(3000, 1);
    mockDownloadFile.mockImplementation(async (_url, localPath) => {
      await fs.writeFile(localPath, payload);
      return { 'content-type': 'application/json' };
    });
    const cacheManager = new CacheManager({ cacheDirectory, maxCacheSize: 1024 * 1024 });
    await cacheManager.init();
    const url = 'https://example.com/data.json';
    await expect(cacheManager.getContent(url)).resolves.toEqual(payload);
    await expect(cacheManager.getContentWithInfo(url, { maxSize: 2000 })).rejects.toThrow('Maximum file size exceeded');
    await expect(cacheManager.getContent(url)).resolves.toEqual(payload);
    expect(mockDownloadFile).toHaveBeenCalledTimes(1);
  });

  it('retries a size-limit failure only for a caller that allows more than the cap it failed under', async () => {
    const url = 'https://example.com/big.json';
    mockDownloadFile.mockRejectedValueOnce(new Error('Maximum file size exceeded'));
    const cacheManager = new CacheManager({ cacheDirectory, maxCacheSize: 1024 * 1024 });
    await cacheManager.init();
    await expect(cacheManager.getContent(url, { maxSize: 5 * 1024 * 1024 })).rejects.toThrow(
      'Maximum file size exceeded',
    );
    const [info] = await cacheManager.getCacheInfos([url]);
    expect(info).toMatchObject({ state: 'ERROR', maxSize: 5 * 1024 * 1024 });

    // the same cap: settled, no second transfer
    await expect(cacheManager.getContent(url, { maxSize: 5 * 1024 * 1024 })).rejects.toThrow(
      'Maximum file size exceeded',
    );
    expect(mockDownloadFile).toHaveBeenCalledTimes(1);

    // a larger cap (the data verifier's default): tried again
    const payload = Buffer.from('fits now');
    mockDownloadFile.mockImplementation(async (_url, localPath) => {
      await fs.writeFile(localPath, payload);
      return { 'content-type': 'application/json' };
    });
    await expect(cacheManager.getContent(url)).resolves.toEqual(payload);
    expect(mockDownloadFile).toHaveBeenCalledTimes(2);
  });

  it('does not fall back to the gateway once the host has used up the whole download deadline', async () => {
    const url = 'https://nftstorage.link/ipfs/QmPK1s3pNYLi9ERiq3BDxKa4XosgWwFRQUydHUtz4YgpqB/img.png';
    let now = Date.now();
    const nowSpy = jest.spyOn(Date, 'now').mockImplementation(() => now);
    mockDownloadFile.mockImplementation(async () => {
      now += DEFAULT_DOWNLOAD_MAX_DURATION;
      throw new Error(`Request exceeded the ${DEFAULT_DOWNLOAD_MAX_DURATION}ms download deadline`);
    });

    const cacheManager = new CacheManager({
      cacheDirectory,
      maxCacheSize: 1024,
    });
    await cacheManager.init();

    try {
      await expect(cacheManager.getContent(url)).rejects.toThrow('download deadline');
      expect(mockDownloadFile).toHaveBeenCalledTimes(1);
    } finally {
      nowSpy.mockRestore();
    }
  });

  it('does not fall back to the gateway while the gateway option is off, and gives the link its fallback once it is on', async () => {
    const payload = Buffer.from('cached payload');
    const url = 'https://nftstorage.link/ipfs/QmPK1s3pNYLi9ERiq3BDxKa4XosgWwFRQUydHUtz4YgpqB/img.png';
    mockDownloadFile.mockRejectedValue(new Error('HTTP error: 403'));
    mockIpfsGatewayEnabled.mockReturnValue(false);

    const cacheManager = new CacheManager({
      cacheDirectory,
      maxCacheSize: 1024,
    });
    await cacheManager.init();

    try {
      await expect(cacheManager.getContent(url)).rejects.toThrow('HTTP error: 403');
      expect(mockDownloadFile).toHaveBeenCalledTimes(1);
      // the failure was the host's alone: no gateway was involved
      const [info] = await cacheManager.getCacheInfos([url]);
      expect(info).toMatchObject({ state: 'ERROR', error: 'HTTP error: 403' });
      expect(info).not.toHaveProperty('gateway');
    } finally {
      mockIpfsGatewayEnabled.mockReturnValue(true);
    }

    // the same gateway as before, just switched on: the link is retried and
    // this time falls back to the gateway
    mockDownloadFile.mockReset();
    mockDownloadFile
      .mockRejectedValueOnce(new Error('HTTP error: 403'))
      .mockImplementationOnce(async (_url, localPath) => {
        await fs.writeFile(localPath, payload);
        return {
          'content-type': 'image/png',
        };
      });
    await expect(cacheManager.getContent(url)).resolves.toEqual(payload);
    expect(mockDownloadFile).toHaveBeenCalledTimes(2);
  });

  it('settles a gateway link whose host is the configured gateway instead of retrying it on every access', async () => {
    const url = 'https://ipfs.io/ipfs/QmPK1s3pNYLi9ERiq3BDxKa4XosgWwFRQUydHUtz4YgpqB/img.png';
    mockDownloadFile.mockRejectedValue(new Error('HTTP error: 403'));

    const cacheManager = new CacheManager({
      cacheDirectory,
      maxCacheSize: 1024,
    });
    await cacheManager.init();

    await expect(cacheManager.getContent(url)).rejects.toThrow('HTTP error: 403');
    await expect(cacheManager.getContent(url)).rejects.toThrow('HTTP error: 403');
    expect(mockDownloadFile).toHaveBeenCalledTimes(1);
    const [info] = await cacheManager.getCacheInfos([url]);
    expect(info).toMatchObject({ state: 'ERROR', gateway: 'https://ipfs.io/ipfs/' });
  });

  it('records the gateway a failed fallback went through, so a gateway change retries the link', async () => {
    const payload = Buffer.from('cached payload');
    const url = 'https://nftstorage.link/ipfs/QmPK1s3pNYLi9ERiq3BDxKa4XosgWwFRQUydHUtz4YgpqB/img.png';
    mockDownloadFile.mockRejectedValue(new Error('HTTP error: 504'));

    const cacheManager = new CacheManager({
      cacheDirectory,
      maxCacheSize: 1024,
    });
    await cacheManager.init();

    await expect(cacheManager.getContent(url)).rejects.toThrow('HTTP error: 504');
    expect(mockDownloadFile).toHaveBeenCalledTimes(2);
    const [info] = await cacheManager.getCacheInfos([url]);
    expect(info).toMatchObject({ state: 'ERROR', gateway: 'https://ipfs.io/ipfs/' });

    mockDownloadFile.mockReset();
    mockDownloadFile.mockImplementation(async (_url, localPath) => {
      await fs.writeFile(localPath, payload);
      return {
        'content-type': 'image/png',
      };
    });
    mockIpfsGatewayBase.mockReturnValue('https://gateway.pinata.cloud/ipfs/');
    try {
      await expect(cacheManager.getContent(url)).resolves.toEqual(payload);
    } finally {
      mockIpfsGatewayBase.mockReturnValue('https://ipfs.io/ipfs/');
    }
  });

  it('does not treat a gateway change as a reason to retry a non-ipfs failure', async () => {
    mockDownloadFile.mockRejectedValue(new Error('HTTP error: 404'));

    const cacheManager = new CacheManager({
      cacheDirectory,
      maxCacheSize: 1024,
    });
    await cacheManager.init();

    await expect(cacheManager.getContent('https://example.com/nft.png')).rejects.toThrow('HTTP error: 404');
    mockIpfsGatewayBase.mockReturnValue('https://dweb.link/ipfs/');
    try {
      await expect(cacheManager.getContent('https://example.com/nft.png')).rejects.toThrow('HTTP error: 404');
      expect(mockDownloadFile).toHaveBeenCalledTimes(1);
    } finally {
      mockIpfsGatewayBase.mockReturnValue('https://ipfs.io/ipfs/');
    }
  });

  it('retries an aborted download on the next access', async () => {
    const payload = Buffer.from('cached payload');
    mockDownloadFile.mockRejectedValueOnce(new Error('Request aborted')).mockImplementation(async (_url, localPath) => {
      await fs.writeFile(localPath, payload);
      return {
        'content-type': 'image/png',
      };
    });

    const cacheManager = new CacheManager({
      cacheDirectory,
      maxCacheSize: 1024,
    });
    await cacheManager.init();

    await expect(cacheManager.getContent('https://example.com/nft.png')).rejects.toThrow('Request aborted');
    await expect(cacheManager.getContent('https://example.com/nft.png')).resolves.toEqual(payload);
    expect(mockDownloadFile).toHaveBeenCalledTimes(2);
  });

  it('does not overlap cache size scans when a scan outlives the coalescing window', async () => {
    jest.useFakeTimers();
    try {
      const cacheManager = new CacheManager({
        cacheDirectory,
        maxCacheSize: 1024,
      });
      await cacheManager.init();

      let runningScans = 0;
      let maxConcurrentScans = 0;
      const scanResolvers: Array<() => void> = [];
      const getCacheSizeSpy = jest.spyOn(cacheManager, 'getCacheSize').mockImplementation(
        () =>
          new Promise<number>((resolve) => {
            runningScans += 1;
            maxConcurrentScans = Math.max(maxConcurrentScans, runningScans);
            scanResolvers.push(() => {
              runningScans -= 1;
              resolve(0);
            });
          }),
      );

      const send = jest.fn();
      const fakeWindow = {
        webContents: { send },
        isDestroyed: () => false,
        on: jest.fn(),
      } as any;
      cacheManager.bindEvents(fakeWindow);

      cacheManager.emit('sizeChanged');
      jest.advanceTimersByTime(500); // the first scan starts and stays in flight

      cacheManager.emit('sizeChanged'); // burst arriving mid-scan
      jest.advanceTimersByTime(500); // previously this started an overlapping scan

      expect(maxConcurrentScans).toBe(1);

      scanResolvers.shift()?.();
      await Promise.resolve(); // let the first scan settle and reschedule
      jest.advanceTimersByTime(500); // the follow-up scan delivers the fresh size

      expect(getCacheSizeSpy).toHaveBeenCalledTimes(2);
      expect(maxConcurrentScans).toBe(1);
    } finally {
      jest.useRealTimers();
    }
  });

  // Both eviction gates are `> 0`, so a zero limit would not mean "no cache"
  // but "no eviction" — the renderer-reachable state SEC-866 was about.
  it.each([0, '0', '', -1, Number.NaN, Number.POSITIVE_INFINITY])(
    'refuses %p as a cache limit and keeps the current one',
    async (limit) => {
      const cacheManager = new CacheManager({
        cacheDirectory,
        maxCacheSize: 1024,
      });
      await cacheManager.init();

      await expect(cacheManager.setMaxCacheSize(limit)).rejects.toThrow('positive finite number');
      expect(cacheManager.maxCacheSize).toBe(1024);
    },
  );

  // Downloads stream into `<file>.tmp` and rename into place; a quit or crash
  // mid-download leaves the temp file behind. Those files are the cache's too.
  it('sweeps leftover temp files at startup', async () => {
    const stale = path.join(cacheDirectory, 'aaaa-chiacache.tmp');
    await fs.writeFile(stale, Buffer.alloc(300));
    await fs.writeFile(path.join(cacheDirectory, 'bbbb-chiacache'), Buffer.alloc(100));
    await fs.writeFile(path.join(cacheDirectory, 'unrelated.tmp'), Buffer.alloc(50));

    const cacheManager = new CacheManager({
      cacheDirectory,
      maxCacheSize: 1024,
    });
    await cacheManager.init();

    await expect(fs.stat(stale)).rejects.toThrow('ENOENT');
    // cached files, and files that are not the cache's, are left alone
    await expect(fs.stat(path.join(cacheDirectory, 'bbbb-chiacache'))).resolves.toBeDefined();
    await expect(fs.stat(path.join(cacheDirectory, 'unrelated.tmp'))).resolves.toBeDefined();
  });

  it('counts temp files toward the cache size and removes them with the cache', async () => {
    const cacheManager = new CacheManager({
      cacheDirectory,
      maxCacheSize: 1024,
    });
    await cacheManager.init();

    const temp = path.join(cacheDirectory, 'aaaa-chiacache.tmp');
    await fs.writeFile(temp, Buffer.alloc(300));
    await fs.writeFile(path.join(cacheDirectory, 'bbbb-chiacache'), Buffer.alloc(100));

    await expect(cacheManager.getCacheSize()).resolves.toBe(400);

    await cacheManager.clearCache();
    await expect(fs.stat(temp)).rejects.toThrow('ENOENT');
    await expect(cacheManager.getCacheSize()).resolves.toBe(0);
  });

  it('waits for a download in flight to settle before clearing the cache, so nothing survives the clear', async () => {
    const inFlightUrl = 'https://example.com/in-flight.png';
    let tempFilePath = '';
    let cleanedUpByDownload = false;
    mockDownloadFile.mockImplementation(async (_url, localPath, options) => {
      // the real downloadFile streams into the temp file, and on abort removes
      // it itself — which must still find it there
      tempFilePath = `${localPath}.tmp`;
      await fs.writeFile(tempFilePath, Buffer.alloc(300));
      await new Promise<void>((resolve) => {
        options?.signal?.addEventListener('abort', () => resolve());
      });
      await fs.unlink(tempFilePath);
      cleanedUpByDownload = true;
      throw new Error('Request aborted');
    });

    const cacheManager = new CacheManager({
      cacheDirectory,
      maxCacheSize: 1024,
    });
    await cacheManager.init();

    const pending = cacheManager.getContent(inFlightUrl);
    await untilDownloadsStarted(1);
    await fs.writeFile(path.join(cacheDirectory, 'bbbb-chiacache'), Buffer.alloc(100));

    // the download rejects while the clear is still waiting on it, so its
    // expectation has to be attached before the clear runs
    const pendingRejection = expect(pending).rejects.toThrow('Request aborted');
    await cacheManager.clearCache();

    // the clear waited for the aborted download to settle, so its temp file,
    // the sidecar its abort recorded and the rest of the cache are all gone
    await pendingRejection;
    expect(cleanedUpByDownload).toBe(true);
    await expect(fs.readdir(cacheDirectory)).resolves.toEqual([]);
  });

  it('holds a request that arrives during a clear until the clear is done', async () => {
    const payload = Buffer.from('next uri');
    let clearFinished = false;
    let nextDownloadStartedAfterClear: boolean | undefined;
    mockDownloadFile
      // the download the clear aborts: like the real one, it fails on abort
      .mockImplementationOnce(async (_url, localPath, options) => {
        await fs.writeFile(`${localPath}.tmp`, Buffer.alloc(300));
        await new Promise<void>((resolve) => {
          options?.signal?.addEventListener('abort', () => resolve());
        });
        await fs.unlink(`${localPath}.tmp`);
        throw new Error('Request aborted');
      })
      // the download a tile starts for its next uri as soon as it sees that failure
      .mockImplementationOnce(async (_url, localPath) => {
        nextDownloadStartedAfterClear = clearFinished;
        await fs.writeFile(localPath, payload);
        return {
          'content-type': 'image/png',
        };
      });

    const cacheManager = new CacheManager({
      cacheDirectory,
      maxCacheSize: 1024,
    });
    await cacheManager.init();

    const aborted = cacheManager.getContent('https://example.com/first.png');
    await untilDownloadsStarted(1);
    // a tile that sees its download fail moves straight on to the next uri —
    // while the clear is still waiting on that very failure
    const next = aborted.catch(() => cacheManager.getContent('https://example.com/second.png'));

    const clear = cacheManager.clearCache().then(() => {
      clearFinished = true;
    });
    await clear;

    await expect(next).resolves.toEqual(payload);
    // the second download did not start until the clear had finished, so the
    // unlink pass could not take its temp file from under it
    expect(nextDownloadStartedAfterClear).toBe(true);
    await expect(fs.readdir(cacheDirectory)).resolves.toHaveLength(2); // its data file and sidecar
  });

  it('keeps tracking a request that replaced one the clear aborted, so later callers join it', async () => {
    const payload = Buffer.from('retried');
    const url = 'https://example.com/nft.png';
    let finishRetry!: () => void;
    mockDownloadFile
      .mockImplementationOnce(async (_url, localPath, options) => {
        await fs.writeFile(`${localPath}.tmp`, Buffer.alloc(300));
        await new Promise<void>((resolve) => {
          options?.signal?.addEventListener('abort', () => resolve());
        });
        await fs.unlink(`${localPath}.tmp`);
        throw new Error('Request aborted');
      })
      .mockImplementationOnce(async (_url, localPath) => {
        await new Promise<void>((resolve) => {
          finishRetry = resolve;
        });
        await fs.writeFile(localPath, payload);
        return {
          'content-type': 'image/png',
        };
      });

    const cacheManager = new CacheManager({
      cacheDirectory,
      maxCacheSize: 1024,
    });
    await cacheManager.init();

    const aborted = cacheManager.getContent(url);
    await untilDownloadsStarted(1);
    // the same url is requested again the moment the abort is seen — while the
    // aborted request is still settling and about to remove itself from the map
    const retried = aborted.catch(() => cacheManager.getContent(url));
    await cacheManager.clearCache();
    await untilDownloadsStarted(2);

    // a third caller must join the retry, not start a third download
    const joined = cacheManager.getContent(url);
    finishRetry();

    await expect(retried).resolves.toEqual(payload);
    await expect(joined).resolves.toEqual(payload);
    expect(mockDownloadFile).toHaveBeenCalledTimes(2);
  });

  it('evicts a stale temp file but never the one a download in flight is writing', async () => {
    let finishDownload!: () => void;
    const inFlightUrl = 'https://example.com/in-flight.png';
    mockDownloadFile.mockImplementation(async (_url, localPath) => {
      // the real downloadFile streams into the temp file before renaming it
      await fs.writeFile(`${localPath}.tmp`, Buffer.alloc(300));
      await new Promise<void>((resolve) => {
        finishDownload = resolve;
      });
      await fs.rename(`${localPath}.tmp`, localPath);
      return {
        'content-type': 'image/png',
      };
    });

    const cacheManager = new CacheManager({
      cacheDirectory,
      maxCacheSize: 1024,
    });
    await cacheManager.init();

    const stale = path.join(cacheDirectory, 'aaaa-chiacache.tmp');
    await fs.writeFile(stale, Buffer.alloc(300));

    const pending = cacheManager.getContent(inFlightUrl);
    await untilDownloadsStarted(1);
    const inFlightTemp = (await fs.readdir(cacheDirectory)).find(
      (file) => file.endsWith('.tmp') && file !== 'aaaa-chiacache.tmp',
    );
    expect(inFlightTemp).toBeDefined();

    // both temp files count; evicting down to 350 bytes must drop the stale
    // one and keep the live one
    await expect(cacheManager.getCacheSize()).resolves.toBe(600);
    await cacheManager.setMaxCacheSize(350);
    await expect(fs.stat(stale)).rejects.toThrow('ENOENT');
    await expect(fs.stat(path.join(cacheDirectory, inFlightTemp!))).resolves.toBeDefined();

    finishDownload();
    await expect(pending).resolves.toEqual(Buffer.alloc(300));
  });

  it('reports a sidecar that cannot be read by its error code, not its path', async () => {
    const url = 'https://example.com/nft.png';
    const urlHash = crypto.createHash('md5').update(url).digest('hex');
    // a directory where the sidecar should be makes readFile fail with EISDIR
    await fs.mkdir(path.join(cacheDirectory, `${urlHash}-chiacache-info`));

    const cacheManager = new CacheManager({
      cacheDirectory,
      maxCacheSize: 1024,
    });
    await cacheManager.init();

    const [info] = await cacheManager.getCacheInfos([url]);
    expect(info).toMatchObject({ state: 'ERROR', error: 'EISDIR' });
    expect(info.state === 'ERROR' && info.error.includes(cacheDirectory)).toBe(false);
  });
});

describe('CacheManager getCacheInfos', () => {
  let cacheDirectory: string;

  beforeEach(async () => {
    mockDownloadFile.mockReset();
    cacheDirectory = await fs.mkdtemp(path.join(os.tmpdir(), 'chia-cache-manager-'));
  });

  afterEach(async () => {
    await fs.rm(cacheDirectory, { recursive: true, force: true });
  });

  it('reports persisted outcomes per url without downloading anything', async () => {
    const payload = Buffer.from('cached payload');
    mockDownloadFile.mockImplementation(async (url, localPath) => {
      if (url === 'https://example.com/broken.png') {
        throw new Error('getaddrinfo ENOTFOUND example.com');
      }
      await fs.writeFile(localPath, payload);
      return {
        'content-type': 'image/png',
      };
    });

    const cacheManager = new CacheManager({
      cacheDirectory,
      maxCacheSize: 1024,
    });
    await cacheManager.init();

    await expect(cacheManager.getContent('https://example.com/ok.png')).resolves.toEqual(payload);
    await expect(cacheManager.getContent('https://example.com/broken.png')).rejects.toThrow('ENOTFOUND');
    mockDownloadFile.mockClear();

    const infos = await cacheManager.getCacheInfos([
      'https://example.com/ok.png',
      'https://example.com/broken.png',
      'https://example.com/never-requested.png',
      'not a url',
    ]);

    expect(infos.map((info) => [info.url, info.state])).toEqual([
      ['https://example.com/ok.png', 'CACHED'],
      ['https://example.com/broken.png', 'ERROR'],
      ['https://example.com/never-requested.png', 'NOT_CACHED'],
      ['not a url', 'ERROR'],
    ]);
    expect(infos[0]).toMatchObject({ checksum: expect.any(String) });
    expect(infos[1]).toMatchObject({ error: 'getaddrinfo ENOTFOUND example.com' });
    expect(infos[3]).toMatchObject({ error: 'Invalid URL: not a url' });
    expect(mockDownloadFile).not.toHaveBeenCalled();
  });

  // The urls are NFT data; the renderer batches them, but the IPC channel is
  // the boundary that has to hold regardless of who calls it.
  it('refuses a lookup over the batch cap, and anything that is not an array', async () => {
    const cacheManager = new CacheManager({
      cacheDirectory,
      maxCacheSize: 1024,
    });
    await cacheManager.init();

    const urls = Array.from({ length: MAX_CACHE_INFO_LOOKUPS + 1 }, (_, i) => `https://example.com/${i}.png`);
    await expect(cacheManager.getCacheInfos(urls)).rejects.toThrow('Too many urls');
    await expect(cacheManager.getCacheInfos('https://example.com/x.png' as unknown as string[])).rejects.toThrow(
      'Invalid urls',
    );

    const infos = await cacheManager.getCacheInfos(urls.slice(0, MAX_CACHE_INFO_LOOKUPS));
    expect(infos).toHaveLength(MAX_CACHE_INFO_LOOKUPS);
    expect(infos.every((info) => info.state === 'NOT_CACHED')).toBe(true);
  });
});

describe('CacheManager request options from the renderer', () => {
  let cacheDirectory: string;

  beforeEach(async () => {
    mockDownloadFile.mockReset();
    cacheDirectory = await fs.mkdtemp(path.join(os.tmpdir(), 'chia-cache-options-'));
  });

  afterEach(async () => {
    await fs.rm(cacheDirectory, { recursive: true, force: true });
  });

  it.each([
    // a request for "no limit" gets the ceiling, not an unbounded transfer
    [{ maxSize: -1 }, { maxSize: 2 * 1024 * 1024 * 1024, timeout: 30_000 }],
    [{ maxSize: 0 }, { maxSize: 2 * 1024 * 1024 * 1024, timeout: 30_000 }],
    [{ maxSize: Number.NaN }, { maxSize: 100 * 1024 * 1024, timeout: 30_000 }],
    [{ maxSize: 'huge' as unknown as number }, { maxSize: 100 * 1024 * 1024, timeout: 30_000 }],
    // a timeout a timer cannot hold is clamped to the transfer ceiling
    [{ timeout: 1e12 }, { maxSize: 100 * 1024 * 1024, timeout: 30 * 60 * 1000 }],
    [{ timeout: 0 }, { maxSize: 100 * 1024 * 1024, timeout: 30_000 }],
    [
      { maxSize: 5 * 1024 * 1024, timeout: 10_000 },
      { maxSize: 5 * 1024 * 1024, timeout: 10_000 },
    ],
  ])('hands the download %p as %p', async (options, expected) => {
    mockDownloadFile.mockImplementation(async (_url, localPath) => {
      await fs.writeFile(localPath, 'bytes');
      return { 'content-type': 'image/png' };
    });
    const cacheManager = new CacheManager({ cacheDirectory, maxCacheSize: 1024 });
    await cacheManager.init();
    await cacheManager.getContent('https://example.com/nft.png', options);
    expect(mockDownloadFile).toHaveBeenCalledTimes(1);
    expect(mockDownloadFile.mock.calls[0][2]).toMatchObject(expected);
  });
});

describe('CacheManager sidecar integrity and error redaction', () => {
  let cacheDirectory: string;

  beforeEach(async () => {
    mockDownloadFile.mockReset();
    cacheDirectory = await fs.mkdtemp(path.join(os.tmpdir(), 'chia-cache-sidecar-'));
  });

  afterEach(async () => {
    await fs.rm(cacheDirectory, { recursive: true, force: true });
  });

  it('writes a sidecar through a temp file that is gone once the entry is published', async () => {
    mockDownloadFile.mockImplementation(async (_url, localPath) => {
      await fs.writeFile(localPath, 'bytes');
      return { 'content-type': 'image/png' };
    });
    const cacheManager = new CacheManager({ cacheDirectory, maxCacheSize: 1024 });
    await cacheManager.init();
    await cacheManager.getContent('https://example.com/nft.png');
    const files = await fs.readdir(cacheDirectory);
    expect(files).toHaveLength(2);
    expect(files.some((file) => file.endsWith('.tmp'))).toBe(false);
  });

  it('treats a sidecar that is not JSON as no entry, removes it, and fetches afresh', async () => {
    const payload = Buffer.from('fresh bytes');
    mockDownloadFile.mockImplementation(async (_url, localPath) => {
      await fs.writeFile(localPath, payload);
      return { 'content-type': 'image/png' };
    });
    const cacheManager = new CacheManager({ cacheDirectory, maxCacheSize: 1024 });
    await cacheManager.init();
    const url = 'https://example.com/nft.png';
    await cacheManager.getContent(url);
    const infoFile = (await fs.readdir(cacheDirectory)).find((file) => file.endsWith('-info'))!;
    // what a crash mid-write left behind before sidecars were renamed into place
    await fs.writeFile(path.join(cacheDirectory, infoFile), '{"url":"https://example.com/nft.png","state":"CA');

    const [info] = await cacheManager.getCacheInfos([url]);
    expect(info.state).toBe('NOT_CACHED');
    await expect(fs.stat(path.join(cacheDirectory, infoFile))).rejects.toThrow();

    await expect(cacheManager.getContent(url)).resolves.toEqual(payload);
    expect(mockDownloadFile).toHaveBeenCalledTimes(2);
    const [after] = await cacheManager.getCacheInfos([url]);
    expect(after.state).toBe('CACHED');
  });

  it('keeps the cache directory out of a persisted download error and out of what the renderer reads', async () => {
    mockDownloadFile.mockRejectedValue(
      Object.assign(new Error(`EACCES: permission denied, open '${cacheDirectory}/abc-chiacache.tmp'`), {
        code: 'EACCES',
      }),
    );
    const cacheManager = new CacheManager({ cacheDirectory, maxCacheSize: 1024 });
    await cacheManager.init();
    const url = 'https://example.com/nft.png';
    await expect(cacheManager.getContent(url)).rejects.toThrow('EACCES: cache file operation failed');
    const [info] = await cacheManager.getCacheInfos([url]);
    expect(info.state).toBe('ERROR');
    expect(info.error).toBe('EACCES: cache file operation failed');
    expect(info.error).not.toContain(cacheDirectory);
  });

  it('leaves an error that names no cache path as it is', () => {
    const cacheManager = new CacheManager({ cacheDirectory, maxCacheSize: 1024 });
    const error = new Error('HTTP error: 404');
    expect(cacheManager.redactCachePath(error)).toBe(error);
  });
});

describe('CacheManager directory scans', () => {
  let cacheDirectory: string;

  beforeEach(async () => {
    mockDownloadFile.mockReset();
    cacheDirectory = await fs.mkdtemp(path.join(os.tmpdir(), 'chia-cache-scan-'));
  });

  afterEach(async () => {
    await fs.rm(cacheDirectory, { recursive: true, force: true });
  });

  it('stats a large cache a bounded number of files at a time', async () => {
    await Promise.all(
      Array.from({ length: 300 }, (_, i) => fs.writeFile(path.join(cacheDirectory, `f${i}-chiacache`), 'x')),
    );
    const cacheManager = new CacheManager({ cacheDirectory, maxCacheSize: 1024 * 1024 });
    await cacheManager.init();

    const realStat = fs.stat.bind(fs);
    let inFlight = 0;
    let peak = 0;
    const statSpy = jest.spyOn(fs, 'stat').mockImplementation(async (...args) => {
      inFlight += 1;
      peak = Math.max(peak, inFlight);
      try {
        await new Promise((resolve) => {
          setTimeout(resolve, 1);
        });
        return await realStat(...(args as Parameters<typeof fs.stat>));
      } finally {
        inFlight -= 1;
      }
    });
    try {
      await expect(cacheManager.getCacheSize()).resolves.toBe(300);
    } finally {
      statSpy.mockRestore();
    }
    expect(peak).toBeGreaterThan(1);
    expect(peak).toBeLessThanOrEqual(64);
  });
});

describe('CacheManager cache: responses', () => {
  let cacheDirectory: string;

  beforeEach(async () => {
    mockDownloadFile.mockReset();
    cacheDirectory = await fs.mkdtemp(path.join(os.tmpdir(), 'chia-cache-protocol-'));
  });

  afterEach(async () => {
    await fs.rm(cacheDirectory, { recursive: true, force: true });
  });

  it.each([
    ['image/png', 'image/png'],
    ['video/mp4; charset=binary', 'video/mp4; charset=binary'],
    ['video/mp4; codecs="avc1.42E01E, mp4a.40.2"', 'video/mp4; codecs="avc1.42E01E, mp4a.40.2"'],
    ['audio/webm;codecs=opus', 'audio/webm; codecs=opus'],
    ['audio/ogg', 'audio/ogg'],
    ['model/gltf-binary', 'model/gltf-binary'],
    ['image/svg+xml; foo=bar', 'image/svg+xml; foo=bar'],
    ['text/html', 'application/octet-stream'],
    ['text/html; charset=utf-8', 'application/octet-stream'],
    ['application/javascript', 'application/octet-stream'],
    ['application/octet-stream', 'application/octet-stream'],
    // a parameter that is not one (a smuggled header line) is not passed through
    ['image/png; x=a\r\nX-Injected: 1', 'application/octet-stream'],
    // a value the response cannot carry is not passed through either
    ['image/png; a="\u0000"', 'application/octet-stream'],
    ['image/png; a="\u65e5"', 'application/octet-stream'],
    ['image/png; a=\u00e9', 'application/octet-stream'],
    [
      'video/mp4; codecs="avc1.42E01E, mp4a.40.2"; charset=binary',
      'video/mp4; codecs="avc1.42E01E, mp4a.40.2"; charset=binary',
    ],
    ['', 'application/octet-stream'],
    [undefined, 'application/octet-stream'],
  ])('serves a stored type of %p as %p', (stored, served) => {
    expect(servedContentType(stored)).toBe(served);
  });

  it('serves cached bytes as an opaque, sandboxed response when the remote type is not media', async () => {
    const payload = Buffer.from('<script>alert(1)</script>');
    mockDownloadFile.mockImplementation(async (_url, localPath) => {
      await fs.writeFile(localPath, payload);
      return { 'content-type': 'text/html' };
    });
    const cacheManager = new CacheManager({ cacheDirectory, maxCacheSize: 1024 });
    await cacheManager.init();
    const url = 'https://example.com/nft';
    await expect(cacheManager.getContent(url)).resolves.toEqual(payload);
    // what the tile is handed and what the protocol serves are the same file
    const cacheUrl = await cacheManager.getURI(url);
    expect(cacheUrl.startsWith('cache://')).toBe(true);

    let handler: ((request: Request) => Promise<Response>) | undefined;
    cacheManager.prepareProtocol({
      handle: (_scheme: string, callback: (request: Request) => Promise<Response>) => {
        handler = callback;
      },
    } as never);
    const response = await handler!(new Request(cacheUrl));
    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toBe('application/octet-stream');
    expect(response.headers.get('x-content-type-options')).toBeNull();
    expect(response.headers.get('content-security-policy')).toBe("default-src 'none'; sandbox");
    expect(Buffer.from(await response.arrayBuffer())).toEqual(payload);
  });
});

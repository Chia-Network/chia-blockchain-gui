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
  isTransientDownloadError: jest.requireActual('./utils/downloadFile').isTransientDownloadError,
}));

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

  it('treats a zero cache limit as unlimited when updating the setting', async () => {
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
    await cacheManager.getContent('https://example.com/nft.png');

    await cacheManager.setMaxCacheSize(0);

    expect(cacheManager.maxCacheSize).toBe(0);
    await expect(cacheManager.getContent('https://example.com/nft.png')).resolves.toEqual(payload);
    expect(mockDownloadFile).toHaveBeenCalledTimes(1);
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

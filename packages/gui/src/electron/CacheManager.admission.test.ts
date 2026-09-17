import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

type DownloadFile = typeof import('./utils/downloadFile').default;
const mockDownloadFile = jest.fn<ReturnType<DownloadFile>, Parameters<DownloadFile>>();
jest.mock('electron', () => ({ BrowserWindow: jest.fn(), dialog: { showOpenDialog: jest.fn() } }));
jest.mock('./utils/ipcMainHandle', () => ({ __esModule: true, default: jest.fn() }));
jest.mock('./utils/downloadFile', () => ({
  ...jest.requireActual('./utils/downloadFile'),
  __esModule: true,
  default: mockDownloadFile,
}));
jest.mock('./utils/ipfsGateway', () => ({
  ...jest.requireActual('./utils/ipfsGateway'),
  ipfsGatewayEnabled: () => true,
  ipfsGatewayBase: () => 'https://gateway.example/ipfs/',
}));
const { default: CacheManager } = jest.requireActual<typeof import('./CacheManager')>('./CacheManager');
const cid = 'QmPK1s3pNYLi9ERiq3BDxKa4XosgWwFRQUydHUtz4YgpqB';
const tick = () =>
  new Promise<void>((resolve) => {
    setImmediate(resolve);
  });

describe('CacheManager admission and failure scope', () => {
  let directory: string;
  let manager: InstanceType<typeof CacheManager>;
  beforeEach(async () => {
    directory = await fs.mkdtemp(path.join(os.tmpdir(), 'chia-cache-admission-'));
    manager = new CacheManager({ cacheDirectory: directory, concurrency: 1, rateLimitCooldown: 300 });
    await manager.init();
    mockDownloadFile.mockReset();
  });
  afterEach(async () => {
    jest.restoreAllMocks();
    await fs.rm(directory, { force: true, recursive: true });
  });

  function serve() {
    mockDownloadFile.mockImplementation(async (_url, localPath) => {
      await fs.writeFile(localPath, 'healthy');
      return { 'content-type': 'image/png' };
    });
  }

  // Observe the pre-admission wait so the second call is definitely queued
  // before the first response changes the host's cooldown.
  function observeQueue() {
    const original = (manager as any).waitForHostCooldown.bind(manager);
    let ready!: () => void;
    const queued = new Promise<void>((resolve) => {
      ready = resolve;
    });
    jest.spyOn(manager as any, 'waitForHostCooldown').mockImplementation(async (...args: unknown[]) => {
      await original(...args);
      ready();
    });
    return queued;
  }

  it.each(['https://gateway.example/a.png', `ipfs://${cid}/a.png`, `https://origin.example/ipfs/${cid}/a.png`])(
    'rechecks a queued request after a 429 on %s and lets an unrelated host use the slot',
    async (firstUrl) => {
      let rejectFirst!: (error: Error) => void;
      let started!: () => void;
      const admission = new Promise<void>((resolve) => {
        started = resolve;
      });
      if (firstUrl.startsWith('https://origin')) {
        mockDownloadFile.mockRejectedValueOnce(new Error('HTTP error: 404'));
      }
      mockDownloadFile.mockImplementationOnce(
        () =>
          new Promise((_resolve, reject) => {
            rejectFirst = reject;
            started();
          }),
      );
      serve();
      const first = manager.fetchRemoteContent(firstUrl);
      await admission;
      const queued = observeQueue();
      const second = manager.getContent(`ipfs://${cid}/b.png`, { maxDuration: 100 });
      await queued;
      await tick();
      const calls = mockDownloadFile.mock.calls.length;
      const limitedAt = Date.now();
      rejectFirst(new Error('HTTP error: 429'));
      await first;
      // This must finish before the delayed gateway request, with concurrency 1.
      await expect(manager.getContent('https://other.example/ok.png')).resolves.toEqual(Buffer.from('healthy'));
      expect(mockDownloadFile).toHaveBeenCalledTimes(calls + 1);
      await expect(second).resolves.toEqual(Buffer.from('healthy'));
      expect(Date.now() - limitedAt).toBeGreaterThanOrEqual(280);
    },
  );

  it('rechecks cold paths for callers already waiting in the download queue', async () => {
    let fail!: (error: Error) => void;
    let started!: () => void;
    const admission = new Promise<void>((resolve) => {
      started = resolve;
    });
    mockDownloadFile.mockImplementationOnce(
      () =>
        new Promise((_resolve, reject) => {
          fail = reject;
          started();
        }),
    );
    mockDownloadFile.mockRejectedValue(new Error('HTTP error: 504'));
    const first = manager.fetchRemoteContent(`ipfs://${cid}/same.png`);
    await admission;
    const queued = observeQueue();
    const second = manager.fetchRemoteContent(`https://gateway.example/ipfs/${cid}/same.png`);
    const rejected = expect(second).rejects.toThrow('HTTP error: 504');
    await queued;
    await tick();
    fail(new Error('HTTP error: 504'));
    await first;
    await rejected;
    expect(mockDownloadFile).toHaveBeenCalledTimes(1);
  });

  it('drains a request sent back to cooldown when the cache is cleared', async () => {
    let fail!: (error: Error) => void;
    let started!: () => void;
    const admission = new Promise<void>((resolve) => {
      started = resolve;
    });
    mockDownloadFile.mockImplementationOnce(
      () =>
        new Promise((_resolve, reject) => {
          fail = reject;
          started();
        }),
    );
    serve();
    const first = manager.fetchRemoteContent(`ipfs://${cid}/a.png`);
    await admission;
    const queued = observeQueue();
    const second = manager.fetchRemoteContent(`ipfs://${cid}/b.png`);
    await queued;
    await tick();
    fail(new Error('HTTP error: 429'));
    await first;
    // the clear aborts the request waiting out the cooldown; it settles by
    // rejecting, and records nothing the clear would have to delete
    const drained = expect(second).rejects.toThrow('Request aborted');
    await manager.clearCache();
    await drained;
    expect(mockDownloadFile).toHaveBeenCalledTimes(1);
    expect(await fs.readdir(directory)).toEqual([]);
    await expect(manager.getContent('https://other.example/ok.png')).resolves.toEqual(Buffer.from('healthy'));
  });

  it.each(['HTTP error: 504', 'Request timed out after 30000ms of inactivity'])(
    'keeps a two-host %s failure specific to the path',
    async (failure) => {
      mockDownloadFile.mockRejectedValueOnce(new Error('HTTP error: 404')).mockRejectedValueOnce(new Error(failure));
      await manager.fetchRemoteContent(`https://origin.example/ipfs/${cid}/missing.png`);
      await expect(manager.getContent(`ipfs://${cid}/missing.png`)).rejects.toThrow(failure);
      expect(mockDownloadFile).toHaveBeenCalledTimes(2);
      serve();
      await expect(manager.getContent(`https://healthy.example/ipfs/${cid}/good.png`)).resolves.toEqual(
        Buffer.from('healthy'),
      );
      await expect(manager.getContent(`ipfs://${cid}/another.png`)).resolves.toEqual(Buffer.from('healthy'));
      expect(mockDownloadFile).toHaveBeenCalledTimes(4);
    },
  );
});

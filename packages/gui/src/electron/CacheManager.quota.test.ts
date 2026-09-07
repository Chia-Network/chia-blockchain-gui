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
  ipfsGatewayEnabled: () => false,
}));
const { default: CacheManager } = jest.requireActual<typeof import('./CacheManager')>('./CacheManager');

describe('CacheManager failure record quota', () => {
  let directory: string;
  beforeEach(async () => {
    directory = await fs.mkdtemp(path.join(os.tmpdir(), 'chia-cache-quota-'));
    mockDownloadFile.mockReset();
    mockDownloadFile.mockRejectedValue(new Error('HTTP error: 404'));
  });
  afterEach(async () => {
    await fs.rm(directory, { force: true, recursive: true });
  });

  it('evicts failure-only sidecars when the user reduces the quota', async () => {
    const manager = new CacheManager({ cacheDirectory: directory, maxCacheSize: 100_000 });
    await manager.init();
    for (let index = 0; index < 20; index += 1) {
      // eslint-disable-next-line no-await-in-loop -- Seed persisted failures in order.
      await manager.fetchRemoteContent(`https://example.com/missing-${index}`);
    }
    expect(await manager.getCacheSize()).toBeGreaterThan(1024);
    await manager.setMaxCacheSize(1024);
    expect(await manager.getCacheSize()).toBeLessThanOrEqual(1024);
  });

  it('enforces the quota after failed downloads and keeps the newest failure settled', async () => {
    const manager = new CacheManager({ cacheDirectory: directory, maxCacheSize: 1024 });
    await manager.init();
    for (let index = 0; index < 20; index += 1) {
      // eslint-disable-next-line no-await-in-loop -- Each failure must run housekeeping.
      await manager.fetchRemoteContent(`https://example.com/missing-${index}`);
    }
    expect(await manager.getCacheSize()).toBeLessThanOrEqual(1024);
    await expect(manager.getChecksum('https://example.com/missing-19')).rejects.toThrow('HTTP error: 404');
    expect(mockDownloadFile).toHaveBeenCalledTimes(20);
  });

  it('enforces the quota after a concurrent failure burst', async () => {
    const manager = new CacheManager({ cacheDirectory: directory, maxCacheSize: 1024 });
    await manager.init();
    await Promise.all(
      Array.from({ length: 20 }, (_, index) => manager.fetchRemoteContent(`https://example.com/concurrent-${index}`)),
    );
    expect(await manager.getCacheSize()).toBeLessThanOrEqual(1024);
  });

  it('evicts stale sidecar temporary files even when no data file exists', async () => {
    const manager = new CacheManager({ cacheDirectory: directory, maxCacheSize: 1024 });
    await manager.init();
    const temporary = path.join(directory, 'stale-chiacache-info.tmp');
    await fs.writeFile(temporary, Buffer.alloc(2048));
    await manager.setMaxCacheSize(1024);
    await expect(fs.stat(temporary)).rejects.toMatchObject({ code: 'ENOENT' });
    expect(await manager.getCacheSize()).toBe(0);
  });
});

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
}));

jest.mock('./utils/ipcMainHandle', () => ({
  __esModule: true,
  default: jest.fn(),
}));

const CacheManager = jest.requireActual<typeof import('./CacheManager')>('./CacheManager').default;

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

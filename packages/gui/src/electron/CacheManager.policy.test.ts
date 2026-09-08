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
const { MAX_FILE_SIZE_EXCEEDED_ERROR } = jest.requireActual('./utils/downloadFile');
const url = 'https://example.com/shared.mp4';

describe('CacheManager caller policy isolation', () => {
  let directory: string;
  let manager: InstanceType<typeof CacheManager>;
  beforeEach(async () => {
    directory = await fs.mkdtemp(path.join(os.tmpdir(), 'chia-cache-policy-'));
    manager = new CacheManager({ cacheDirectory: directory });
    await manager.init();
    mockDownloadFile.mockReset();
  });
  afterEach(async () => {
    await fs.rm(directory, { force: true, recursive: true });
  });

  function success() {
    mockDownloadFile.mockImplementationOnce(async (_url, filePath) => {
      await fs.writeFile(filePath, 'larger caller succeeds');
      return { 'content-type': 'video/mp4' };
    });
  }

  it('retries a joined size failure under the larger caller cap, with only one writer', async () => {
    let refuse!: (error: Error) => void;
    let started!: () => void;
    const admission = new Promise<void>((resolve) => {
      started = resolve;
    });
    mockDownloadFile.mockImplementationOnce(
      () =>
        new Promise((_resolve, reject) => {
          refuse = reject;
          started();
        }),
    );
    success();
    const owner = manager.fetchRemoteContent(url, { maxSize: 5 });
    await admission;
    const joined = manager.getChecksum(url, { maxSize: 100 });
    expect(mockDownloadFile).toHaveBeenCalledTimes(1);
    refuse(new Error(MAX_FILE_SIZE_EXCEEDED_ERROR));
    expect((await owner).state).toBe('ERROR');
    await expect(joined).resolves.toMatch(/^[a-f0-9]{64}$/);
    expect(mockDownloadFile).toHaveBeenCalledTimes(2);
    expect(mockDownloadFile.mock.calls.map(([, , options]) => options?.maxSize)).toEqual([5, 100]);
  });

  it('uses the remaining larger allowance after the owner deadline, without persisting the owner limit for it', async () => {
    let started!: () => void;
    const admission = new Promise<void>((resolve) => {
      started = resolve;
    });
    mockDownloadFile.mockImplementationOnce(
      (_url, _path, options) =>
        new Promise((_resolve, reject) => {
          options?.signal?.addEventListener('abort', () => reject(new Error('Request aborted')), { once: true });
          started();
        }),
    );
    success();
    const owner = manager.fetchRemoteContent(url, { maxDuration: 200 });
    await admission;
    const joined = manager.getChecksum(url, { maxDuration: 4000 });
    expect((await owner).state).toBe('ERROR');
    await expect(joined).resolves.toMatch(/^[a-f0-9]{64}$/);
    expect(mockDownloadFile).toHaveBeenCalledTimes(2);
    const remaining = mockDownloadFile.mock.calls[1][2]?.maxDuration!;
    expect(remaining).toBeGreaterThan(200);
    expect(remaining).toBeLessThan(4000);
  });

  it('retains backoff at the same deadline but retries a persisted failure for a larger allowance', async () => {
    mockDownloadFile.mockRejectedValueOnce(new Error('Request exceeded the 100ms download deadline'));
    await manager.fetchRemoteContent(url, { maxDuration: 100 });
    await expect(manager.getChecksum(url, { maxDuration: 100 })).rejects.toThrow('download deadline');
    expect(mockDownloadFile).toHaveBeenCalledTimes(1);
    success();
    await expect(manager.getChecksum(url, { maxDuration: 2000 })).resolves.toMatch(/^[a-f0-9]{64}$/);
    expect(mockDownloadFile).toHaveBeenCalledTimes(2);
  });

  it('does not retry an HTTP failure just because the caller has larger limits', async () => {
    mockDownloadFile.mockRejectedValueOnce(new Error('HTTP error: 404'));
    await manager.fetchRemoteContent(url, { maxSize: 5, maxDuration: 100 });
    await expect(manager.getChecksum(url, { maxSize: 100, maxDuration: 2000 })).rejects.toThrow('HTTP error: 404');
    expect(mockDownloadFile).toHaveBeenCalledTimes(1);
  });
});

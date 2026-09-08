import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

const mockDownloadFile = jest.fn();
jest.mock('electron', () => ({ BrowserWindow: jest.fn(), dialog: { showOpenDialog: jest.fn() } }));
jest.mock('./utils/downloadFile', () => ({
  __esModule: true,
  ...jest.requireActual('./utils/downloadFile'),
  default: mockDownloadFile,
}));
jest.mock('./utils/ipcMainHandle', () => ({ __esModule: true, default: jest.fn() }));
const CacheManager = jest.requireActual<typeof import('./CacheManager')>('./CacheManager').default;

// Exercise the combined metadata reader and cache-maintenance implementation.
it('keeps a bundled metadata read valid when a clear starts during its cached lookup', async () => {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'chia-bundled-read-clear-'));
  const url = 'https://example.com/metadata.json';
  mockDownloadFile.mockImplementation(async (_url, file) => {
    await fs.writeFile(file, 'complete');
    return { 'content-type': 'application/json' };
  });
  const cache = new CacheManager({ cacheDirectory: directory });
  try {
    await cache.init();
    await cache.getContent(url);
    const read = cache.getContentWithInfo(url).catch((error: Error) => error);
    await cache.clearCache();
    expect(await read).toMatchObject({ content: Buffer.from('complete') });
  } finally {
    await fs.rm(directory, { recursive: true, force: true });
  }
});

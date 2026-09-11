import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

import resolveStoredCacheDirectory from './resolveStoredCacheDirectory';

describe('resolveStoredCacheDirectory', () => {
  let root: string;
  const fallback = '/fallback/cache';

  beforeEach(async () => {
    root = await fs.mkdtemp(path.join(os.tmpdir(), 'chia-cache-dir-'));
  });

  afterEach(async () => {
    await fs.rm(root, { recursive: true, force: true });
  });

  it('uses an existing absolute directory', () => {
    expect(resolveStoredCacheDirectory(root, fallback)).toBe(root);
  });

  it('falls back when nothing is stored', () => {
    expect(resolveStoredCacheDirectory(undefined, fallback)).toBe(fallback);
    expect(resolveStoredCacheDirectory(null, fallback)).toBe(fallback);
    expect(resolveStoredCacheDirectory('', fallback)).toBe(fallback);
  });

  it.each([5, ['a'], { path: '/x' }, true])('falls back and says so when the stored value is %p', (value) => {
    const log = jest.fn();
    expect(resolveStoredCacheDirectory(value, fallback, log)).toBe(fallback);
    expect(log).toHaveBeenCalledTimes(1);
  });

  it('falls back on a relative path, a NUL byte, a file, or a missing directory', async () => {
    const file = path.join(root, 'file');
    await fs.writeFile(file, 'x');
    expect(resolveStoredCacheDirectory('relative/cache', fallback)).toBe(fallback);
    expect(resolveStoredCacheDirectory(`${root}\0`, fallback)).toBe(fallback);
    expect(resolveStoredCacheDirectory(file, fallback)).toBe(fallback);
    expect(resolveStoredCacheDirectory(path.join(root, 'missing'), fallback)).toBe(fallback);
  });
});

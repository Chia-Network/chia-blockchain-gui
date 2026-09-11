import resolveStoredMaxCacheSize from './resolveStoredMaxCacheSize';

describe('resolveStoredMaxCacheSize', () => {
  it('accepts a positive size from the current key', () => {
    expect(resolveStoredMaxCacheSize({ maxCacheSize: 2048 })).toBe(2048);
  });

  it('ignores a stored zero under the current key so eviction stays enabled', () => {
    // zero would disable eviction rather than limit the cache; a build that
    // accepted it may have persisted one from an emptied settings field
    expect(resolveStoredMaxCacheSize({ maxCacheSize: 0 })).toBeUndefined();
    expect(resolveStoredMaxCacheSize({ maxCacheSize: 0, cacheLimitSize: 1024 })).toBe(1024);
  });

  it('accepts a positive size from the legacy key', () => {
    expect(resolveStoredMaxCacheSize({ cacheLimitSize: 1024 })).toBe(1024);
  });

  it('ignores a legacy zero so the default limit still applies after upgrade', () => {
    // older builds rejected a stored zero at startup and kept the default
    // limit, so a migrated zero must not silently become unlimited
    expect(resolveStoredMaxCacheSize({ cacheLimitSize: 0 })).toBeUndefined();
  });

  it('prefers the current key over the legacy key', () => {
    expect(resolveStoredMaxCacheSize({ maxCacheSize: 512, cacheLimitSize: 1024 })).toBe(512);
  });

  it('falls back to a valid legacy size when the current key is invalid', () => {
    expect(resolveStoredMaxCacheSize({ maxCacheSize: -1, cacheLimitSize: 1024 })).toBe(1024);
  });

  it('ignores invalid values', () => {
    expect(resolveStoredMaxCacheSize({})).toBeUndefined();
    expect(resolveStoredMaxCacheSize({ maxCacheSize: -5 })).toBeUndefined();
    expect(resolveStoredMaxCacheSize({ maxCacheSize: Number.NaN })).toBeUndefined();
    expect(resolveStoredMaxCacheSize({ maxCacheSize: Number.POSITIVE_INFINITY })).toBeUndefined();
    expect(resolveStoredMaxCacheSize({ maxCacheSize: '1024', cacheLimitSize: '2048' })).toBeUndefined();
  });
});

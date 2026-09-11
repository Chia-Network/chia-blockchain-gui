type StoredCacheSizePrefs = {
  maxCacheSize?: unknown;
  cacheLimitSize?: unknown;
};

const isStoredCacheSize = (size: unknown): size is number => typeof size === 'number' && Number.isFinite(size);

// `cacheLimitSize` is the legacy preference key older versions of the
// settings UI stored the value under. Invalid values are ignored because the
// CacheManager constructor rejects them. A stored zero falls through to the
// default under either key: zero would disable eviction rather than limit
// the cache (see sanitizeNumber), and a build that briefly accepted it may
// have persisted one from an emptied settings field.
export default function resolveStoredMaxCacheSize(prefs: StoredCacheSizePrefs): number | undefined {
  if (isStoredCacheSize(prefs.maxCacheSize) && prefs.maxCacheSize > 0) {
    return prefs.maxCacheSize;
  }

  if (isStoredCacheSize(prefs.cacheLimitSize) && prefs.cacheLimitSize > 0) {
    return prefs.cacheLimitSize;
  }

  return undefined;
}

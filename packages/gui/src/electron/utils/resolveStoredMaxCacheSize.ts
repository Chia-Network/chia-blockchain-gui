type StoredCacheSizePrefs = {
  maxCacheSize?: unknown;
  cacheLimitSize?: unknown;
};

const isStoredCacheSize = (size: unknown): size is number => typeof size === 'number' && Number.isFinite(size);

// `cacheLimitSize` is the legacy preference key older versions of the
// settings UI stored the value under. Invalid values are ignored because the
// CacheManager constructor rejects negative sizes. Zero means unlimited, but
// only under the current key: builds that wrote `cacheLimitSize` rejected
// zero at startup and kept the default limit, so a stored legacy zero must
// keep falling through to the default instead of disabling eviction.
export default function resolveStoredMaxCacheSize(prefs: StoredCacheSizePrefs): number | undefined {
  if (isStoredCacheSize(prefs.maxCacheSize) && prefs.maxCacheSize >= 0) {
    return prefs.maxCacheSize;
  }

  if (isStoredCacheSize(prefs.cacheLimitSize) && prefs.cacheLimitSize > 0) {
    return prefs.cacheLimitSize;
  }

  return undefined;
}

import fs from 'node:fs';
import path from 'node:path';

// The cache directory the main process will use at startup. The preference
// is written by the renderer through the generic preference save, so it is
// not trusted as it is: only a non-empty absolute path that is an existing
// directory is used, and anything else — a wrong type, a relative path, a
// path with a NUL byte, a directory that is not there (an unmounted drive)
// — falls back to the default, which the cache creates itself. A bad value
// must never keep the window from opening.
export default function resolveStoredCacheDirectory(
  storedValue: unknown,
  defaultDirectory: string,
  log: (message: string) => void = () => {},
): string {
  if (typeof storedValue !== 'string' || storedValue.length === 0) {
    if (storedValue !== undefined && storedValue !== null) {
      log(`Ignoring a cache directory preference that is not a path (${typeof storedValue})`);
    }
    return defaultDirectory;
  }

  if (storedValue.includes('\0') || !path.isAbsolute(storedValue)) {
    log('Ignoring a cache directory preference that is not an absolute path');
    return defaultDirectory;
  }

  try {
    if (fs.statSync(storedValue).isDirectory()) {
      return path.resolve(storedValue);
    }
    log('Ignoring a cache directory preference that is not a directory');
  } catch {
    log('Ignoring a cache directory preference that does not exist');
  }
  return defaultDirectory;
}

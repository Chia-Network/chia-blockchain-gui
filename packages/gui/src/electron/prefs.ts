import path from 'node:path';

import { getUserDataDir } from './utils/userData';
import { readData, writeData } from './utils/yamlUtils';

function getPrefsPath() {
  const userDataDir = getUserDataDir();
  if (!userDataDir) {
    throw new Error('userDataDir needs to be initialized');
  }
  return path.join(userDataDir, 'prefs.yaml');
}

export function readPrefs(): Record<string, any> {
  return readData(getPrefsPath());
}

export function savePrefs(prefs: Record<string, any>) {
  writeData(prefs, getPrefsPath());
}

/**
 * Preference keys that the renderer is NOT allowed to set or change through the
 * generic `PreferencesAPI.SAVE` / `PreferencesAPI.MIGRATE` IPC endpoints.
 *
 * `customLogPath` controls which file `ChiaLogsAPI.GET_CONTENT` / `GET_INFO`
 * read from disk. Allowing the renderer to write it would let a compromised
 * renderer point those endpoints at arbitrary files (path traversal / arbitrary
 * file read). The only trusted way to set it is the native file picker in
 * `ChiaLogsAPI.SET_PATH`, which requires explicit user consent and writes the
 * preference directly in the main process.
 */
export const PROTECTED_PREF_KEYS = ['customLogPath'] as const;

/**
 * Returns a copy of renderer-supplied preferences with protected keys forced
 * back to their current on-disk values (or removed entirely if not yet set).
 * This guarantees the renderer can neither introduce nor mutate protected keys,
 * while still preserving legitimate round-trips of the full preferences object.
 */
export function sanitizeRendererPrefs(incoming: Record<string, any>): Record<string, any> {
  const sanitized = { ...incoming };
  const current = readPrefs();

  PROTECTED_PREF_KEYS.forEach((key) => {
    if (Object.hasOwn(current, key)) {
      sanitized[key] = current[key];
    } else {
      delete sanitized[key];
    }
  });

  return sanitized;
}

export function migratePrefs(prefs: Record<string, any>) {
  const currentPrefs = readPrefs();
  Object.keys(prefs).forEach((key) => {
    // When currentPrefs already has the pref, don't override it.
    // Prefs in `prefs.yaml` has priority over prefs from localStorage.
    if (!Object.hasOwn(currentPrefs, key)) {
      currentPrefs[key] = prefs[key];
    }
  });

  savePrefs(currentPrefs);
}

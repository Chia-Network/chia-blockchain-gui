import path from 'path';

import { getUserDataDir } from '../util/userData';

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

import path from 'node:path';

import { getUserDataDir } from './userData';
import { readData, writeData } from './yamlUtils';

type PrivateValues = string | number | boolean | PrivateValues[];

let currentPreferences: Record<string, PrivateValues> | undefined;

function getPreferencesPath() {
  const userDataDir = getUserDataDir();
  if (!userDataDir) {
    throw new Error('userDataDir needs to be initialized');
  }
  return path.join(userDataDir, 'private-prefs.yaml');
}

function readPreferences() {
  currentPreferences = currentPreferences ?? readData(getPreferencesPath());
  return currentPreferences;
}

function savePreferences(prefs: Record<string, PrivateValues>) {
  writeData(prefs, getPreferencesPath());
  currentPreferences = prefs;
}

export function get<TResult extends PrivateValues>(name: string, defaultValue: TResult): TResult;
export function get<TResult extends PrivateValues>(name: string, defaultValue?: TResult): TResult | undefined {
  const prefs = readPreferences();

  if (name in prefs) {
    return (prefs[name] as TResult) ?? defaultValue;
  }

  return defaultValue;
}

export function set(name: string, value: PrivateValues) {
  const prefs = readPreferences();

  savePreferences({
    ...prefs,
    [name]: value,
  });
}

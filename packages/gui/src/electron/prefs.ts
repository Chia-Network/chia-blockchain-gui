import fs from 'fs';
import path from 'path';

import {dump, load} from 'js-yaml';

import { getUserDataDir } from '../util/userData';

function getPrefsPath(){
  const userDataDir = getUserDataDir();
  if(!userDataDir){
    throw new Error('userDataDir needs to be initialized');
  }
  return path.join(userDataDir, 'prefs.yaml');
}

export function readPrefs(): Record<string, any> {
  try{
    const prefsPath = getPrefsPath();
    if(!fs.existsSync(prefsPath)){
      return {};
    }

    const yamlData = fs.readFileSync(prefsPath, 'utf-8');
    return load(yamlData) as Record<string, any>;
  }
  catch (e) {
    console.warn(e);
    return {};
  }
}

export function savePrefs(prefs: Record<string, any>){
  try{
    if(!prefs){
      return;
    }
    const prefsPath = getPrefsPath();
    const yamlData = dump(prefs);
    fs.writeFileSync(prefsPath, yamlData, {encoding: 'utf-8'});
  }
  catch (e) {
    console.warn(e);
  }
}

export function migratePrefs(prefs: Record<string, any>){
  const currentPrefs = readPrefs();
  Object.keys(prefs).forEach(key => {
    // When currentPrefs already has the pref, don't override it.
    // Prefs in `prefs.yaml` has priority over prefs from localStorage.
    if(!Object.hasOwn(currentPrefs, key)){
      currentPrefs[key] = prefs[key];
    }
  });

  savePrefs(currentPrefs);
}

import { getUserDataDir } from '../util/userData';
import path from 'path';
import fs from 'fs';
import {dump, load} from 'js-yaml';

function getPrefsPath(){
  const userDataDir = getUserDataDir();
  if(!userDataDir){
    throw new Error('userDataDir needs to be initialized');
  }
  return path.join(userDataDir, 'prefs.yaml');
}

export function readPrefs(): Record<string, any> {
  try{
    const path = getPrefsPath();
    if(!fs.existsSync(path)){
      return {};
    }

    const yamlData = fs.readFileSync(path, 'utf-8');
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
    const path = getPrefsPath();
    const yamlData = dump(prefs);
    fs.writeFileSync(path, yamlData, {encoding: 'utf-8'});
  }
  catch (e) {
    console.warn(e);
  }
}

export function migratePrefs(prefs: Record<string, any>){
  const currentPrefs = readPrefs();
  for(const key in prefs){
    // When currentPrefs already has the pref, don't override it.
    // Prefs in `prefs.yaml` has priority over prefs from localStorage.
    if(!Object.hasOwn(currentPrefs, key)){
      currentPrefs[key] = prefs[key];
    }
  }

  savePrefs(currentPrefs);
}

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
      return migrateGUIPrefsFromLocalStorage();
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

function migrateGUIPrefsFromLocalStorage(){
  const prefs: Record<string, any> = {};
  const targets: string[] = [
    // 'cacheFolder',
  ];

  for(const key of targets){
    const item = window.localStorage.getItem(key);
    if(item === undefined || item === null){
      continue;
    }

    try{
      prefs[key] = JSON.parse(item);
      window.localStorage.removeItem(key);
    }
    catch(e){
      console.warn(e);
    }
  }

  savePrefs(prefs);
  return prefs;
}

import type { IpcRenderer } from 'electron';

type WindowExt = typeof window & {
  preferences: Record<string, any>;
  ipcRenderer: IpcRenderer;
};

export async function initPrefs(onInitCallback: Function){
  const w = window as WindowExt;
  await migrateGUIPrefsFromLocalStorage();
  w.preferences = await w.ipcRenderer.invoke('readPrefs');
  onInitCallback();
}

async function migrateGUIPrefsFromLocalStorage(){
  const w = window as WindowExt;
  const prefs: Record<string, any> = {};
  const targets: string[] = [
    'cacheFolder',
    'cacheLimitSize',
    'darkMode',
    'finaldir',
    'fingerprintSettings',
    'hiddenWalletsItems',
    'isHidden',
    'limit-cache-size',
    'locale',
    'mode',
    'sensitive-content',
    'skipMigration',
    'suppressShareOnCreate',
    'suppressUnsafeLinkWarning',
    'tmp2dir',
    'tmpdir',
  ];
  // Items which were not stringified on localStorage
  const noParse: string[] = [
    'finaldir',
    'tmp2dir',
    'tmpdir',
  ];

  for(const key of targets){
    const item = window.localStorage.getItem(key);
    if(item === undefined || item === null){
      continue;
    }

    try{
      prefs[key] = noParse.includes(key) ? item : JSON.parse(item);
      window.localStorage.removeItem(key);
    }
    catch(e){
      console.warn(e);
    }
  }

  const hasMigratingItems = Object.keys(prefs).length > 0;
  if(!hasMigratingItems){
    return;
  }

  console.log('GUI Prefs Migration has been dispatched');
  await w.ipcRenderer.invoke('migratePrefs', prefs);
}

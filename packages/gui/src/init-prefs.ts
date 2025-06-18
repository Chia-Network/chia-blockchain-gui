async function migrateGUIPrefsFromLocalStorage() {
  const prefs: Record<string, any> = {};
  const targets: string[] = [
    'cacheFolder',
    'cacheLimitSize',
    'darkMode',
    'enableAutoLogin',
    'enableDataLayerService',
    'enableFilePropagationServer',
    'finaldir',
    'fingerprintSettings',
    'hiddenWalletsItems',
    'hideObjectionableContent',
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
  const noParse: string[] = ['finaldir', 'tmp2dir', 'tmpdir'];

  targets.forEach((key) => {
    const item = window.localStorage.getItem(key);
    if (item === undefined || item === null) {
      return;
    }

    try {
      prefs[key] = noParse.includes(key) ? item : JSON.parse(item);
    } catch (e) {
      console.warn(e);
    }
  });

  const hasMigratingItems = Object.keys(prefs).length > 0;
  if (!hasMigratingItems) {
    return;
  }

  await window.preferencesAPI.migrate(prefs);

  Object.keys(prefs).forEach((key) => {
    window.localStorage.removeItem(key);
  });
}

export default async function initPrefs(onInitCallback: Function) {
  await migrateGUIPrefsFromLocalStorage();
  window.preferences = await window.preferencesAPI.read();
  onInitCallback();
}

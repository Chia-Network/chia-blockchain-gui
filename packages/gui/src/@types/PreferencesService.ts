type Preferences = {
  darkMode?: boolean;
  cacheFolder?: string;
  maxCacheSize?: number;
  customLogPath?: string;
  keepBackgroundRunning?: boolean;
  [key: string]: unknown;
};

type PreferencesService = {
  read: () => Promise<Preferences>;
  save: (preferences: Preferences) => Promise<void>;
  migrate: (preferences: Preferences) => Promise<void>;
};

export default PreferencesService;

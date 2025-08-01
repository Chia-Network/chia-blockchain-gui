type AppService = {
  // App configuration and settings
  setLocale: (locale: string) => Promise<void>;
  getConfig: () => Promise<any>;
  getTempDir: () => Promise<string>;
  getVersion: () => Promise<string>;
  setPromptOnQuit: (prompt: boolean) => Promise<void>;
  quitGUI: () => Promise<void>;
  showNotification: (options: { title: string; body: string }) => Promise<void>;

  openKeyDetail: (fingerprint: string) => Promise<void>;

  // File operations
  download: (url: string) => Promise<void>;
  abortDownloadingFiles: () => Promise<void>;
  processLaunchTasks: () => Promise<void>;

  // Dialog operations
  showOpenFileDialogAndRead: (options?: {
    extensions?: string[];
  }) => Promise<{ content: Uint8Array; filename: string } | undefined>;
  showOpenDirectoryDialog: (options?: { defaultPath?: string }) => Promise<string | undefined>;
  showSaveDialogAndSave: (options: { content: string; defaultPath?: string }) => Promise<any>;

  // Network operations
  fetchTextResponse: (
    url: string,
    data: string,
  ) => Promise<{
    err?: any;
    statusCode?: number;
    statusMessage?: string;
    responseBody?: string;
  }>;
  startMultipleDownload: (tasks: { url: string; filename: string }[]) => Promise<string | undefined>;

  // Event handlers
  subscribeToCheckForUpdates: (callback: (...args: unknown[]) => void) => () => void;
  subscribeToExitDaemon: (callback: (...args: unknown[]) => void) => () => void;
  daemonExited: () => Promise<void>;

  subscribeToMultipleDownloadProgress: (callback: (...args: unknown[]) => void) => () => void;
  subscribeToErrorDownloadingUrl: (callback: (...args: unknown[]) => void) => () => void;
  subscribeToMultipleDownloadDone: (callback: (...args: unknown[]) => void) => () => void;
};

export default AppService;

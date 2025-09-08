import { contextBridge, ipcRenderer } from 'electron';

import API from './constants/API';
import AddressBookAPI from './constants/AddressBookAPI';
import AppAPI from './constants/AppAPI';
import CacheAPI from './constants/CacheAPI';
import ChiaLogsAPI from './constants/ChiaLogsAPI';
import LinkAPI from './constants/LinkAPI';
import PreferencesAPI from './constants/PreferencesAPI';
import WebSocketAPI from './constants/WebSocketAPI';

async function invokeWithCustomErrors(channel: string, ...args: unknown[]) {
  const response = await ipcRenderer.invoke(channel, ...args);
  return response;
}

function onIpcEvent(channel: string, callback: (...args: unknown[]) => void) {
  // do not sent event to the renderer process
  const handler = (_event: unknown, ...args: unknown[]) => callback(...args);
  ipcRenderer.on(channel, handler);
  return () => {
    ipcRenderer.off(channel, handler);
  };
}

contextBridge.exposeInMainWorld(API.APP, {
  setLocale: (locale: string) => invokeWithCustomErrors(AppAPI.SET_LOCALE, locale),
  getConfig: () => invokeWithCustomErrors(AppAPI.GET_CONFIG),
  getTempDir: () => invokeWithCustomErrors(AppAPI.GET_TEMP_DIR),
  getVersion: () => invokeWithCustomErrors(AppAPI.GET_VERSION),
  setPromptOnQuit: (modeBool: boolean) => invokeWithCustomErrors(AppAPI.SET_PROMPT_ON_QUIT, modeBool),
  quitGUI: () => invokeWithCustomErrors(AppAPI.QUIT_GUI),
  showNotification: (options: { title: string; body: string }) =>
    invokeWithCustomErrors(AppAPI.SHOW_NOTIFICATION, options),
  fetchTextResponse: (url: string, data: string) => invokeWithCustomErrors(AppAPI.FETCH_TEXT_RESPONSE, url, data),
  fetchPoolInfo: (poolUrl: string) => invokeWithCustomErrors(AppAPI.FETCH_POOL_INFO, poolUrl),
  openKeyDetail: (fingerprint: string) => invokeWithCustomErrors(AppAPI.OPEN_KEY_DETAIL, fingerprint),

  download: (url: string) => invokeWithCustomErrors(AppAPI.DOWNLOAD, url),
  startMultipleDownload: (tasks: { url: string; filename: string }[]) =>
    invokeWithCustomErrors(AppAPI.START_MULTIPLE_DOWNLOAD, tasks),
  abortDownloadingFiles: () => invokeWithCustomErrors(AppAPI.ABORT_DOWNLOADING_FILES),
  processLaunchTasks: () => invokeWithCustomErrors(AppAPI.PROCESS_LAUNCH_TASKS),

  setBypassCommands: (commands: string[]) => invokeWithCustomErrors(AppAPI.SET_BYPASS_COMMANDS, commands),
  getBypassCommands: () => invokeWithCustomErrors(AppAPI.GET_BYPASS_COMMANDS),

  checkNFTOwnership: (nftId: string) => invokeWithCustomErrors(AppAPI.CHECK_NFT_OWNERSHIP, nftId),

  showOpenDirectoryDialog: (options?: { defaultPath?: string }) =>
    invokeWithCustomErrors(AppAPI.SHOW_OPEN_DIRECTORY_DIALOG, options),
  showOpenFileDialogAndRead: (options?: { extensions?: string[] }) =>
    invokeWithCustomErrors(AppAPI.SHOW_OPEN_FILE_DIALOG_AND_READ, options),
  showSaveDialogAndSave: (options: { content: Buffer; defaultPath?: string }) =>
    invokeWithCustomErrors(AppAPI.SHOW_SAVE_DIALOG_AND_SAVE, options),

  daemonExited: () => invokeWithCustomErrors(AppAPI.DAEMON_EXITED),

  subscribeToCheckForUpdates: (callback: (...args: unknown[]) => void) =>
    onIpcEvent(AppAPI.ON_CHECK_FOR_UPDATES, callback),
  subscribeToExitDaemon: (callback: (...args: unknown[]) => void) => onIpcEvent(AppAPI.ON_EXIT_DAEMON, callback),

  subscribeToMultipleDownloadProgress: (callback: (...args: unknown[]) => void) =>
    onIpcEvent(AppAPI.ON_MULTIPLE_DOWNLOAD_PROGRESS, callback),
  subscribeToErrorDownloadingUrl: (callback: (...args: unknown[]) => void) =>
    onIpcEvent(AppAPI.ON_ERROR_DOWNLOADING_URL, callback),
  subscribeToMultipleDownloadDone: (callback: (...args: unknown[]) => void) =>
    onIpcEvent(AppAPI.ON_MULTIPLE_DOWNLOAD_DONE, callback),
});

contextBridge.exposeInMainWorld(API.PREFERENCES, {
  read: () => invokeWithCustomErrors(PreferencesAPI.READ),
  save: (prefs: Record<string, any>) => invokeWithCustomErrors(PreferencesAPI.SAVE, prefs),
  migrate: (prefs: Record<string, any>) => invokeWithCustomErrors(PreferencesAPI.MIGRATE, prefs),
});

contextBridge.exposeInMainWorld(API.CHIA_LOGS, {
  getContent: () => invokeWithCustomErrors(ChiaLogsAPI.GET_CONTENT),
  getInfo: () => invokeWithCustomErrors(ChiaLogsAPI.GET_INFO),
  setPath: () => invokeWithCustomErrors(ChiaLogsAPI.SET_PATH),
});

contextBridge.exposeInMainWorld(API.LINK, {
  openExternal: (url: string) => invokeWithCustomErrors(LinkAPI.OPEN_EXTERNAL, url),
});

contextBridge.exposeInMainWorld(API.ADDRESS_BOOK, {
  read: () => invokeWithCustomErrors(AddressBookAPI.READ),
  save: (contacts: any[]) => invokeWithCustomErrors(AddressBookAPI.SAVE, contacts),
});

contextBridge.exposeInMainWorld(API.CACHE, {
  getCacheSize: () => invokeWithCustomErrors(CacheAPI.GET_CACHE_SIZE),
  clearCache: () => invokeWithCustomErrors(CacheAPI.CLEAR_CACHE),
  getCacheDirectory: () => invokeWithCustomErrors(CacheAPI.GET_CACHE_DIRECTORY),
  setCacheDirectory: () => invokeWithCustomErrors(CacheAPI.SET_CACHE_DIRECTORY),
  setMaxCacheSize: (maxCacheSize: number) => invokeWithCustomErrors(CacheAPI.SET_MAX_CACHE_SIZE, maxCacheSize),
  getMaxCacheSize: () => invokeWithCustomErrors(CacheAPI.GET_MAX_CACHE_SIZE),
  getContent: (url: string, options?: { maxSize?: number; timeout?: number }) =>
    invokeWithCustomErrors(CacheAPI.GET_CONTENT, url, options),
  getHeaders: (url: string, options?: { maxSize?: number; timeout?: number }) =>
    invokeWithCustomErrors(CacheAPI.GET_HEADERS, url, options),
  getChecksum: (url: string, options?: { maxSize?: number; timeout?: number }) =>
    invokeWithCustomErrors(CacheAPI.GET_CHECKSUM, url, options),
  getURI: (url: string, options?: { maxSize?: number; timeout?: number }) =>
    invokeWithCustomErrors(CacheAPI.GET_URI, url, options),
  invalidate: (url: string) => invokeWithCustomErrors(CacheAPI.INVALIDATE, url),
  subscribeToDirectoryChange: (callback: (...args: unknown[]) => void) =>
    onIpcEvent(CacheAPI.ON_CACHE_DIRECTORY_CHANGED, callback),
  subscribeToMaxSizeChange: (callback: (...args: unknown[]) => void) =>
    onIpcEvent(CacheAPI.ON_MAX_CACHE_SIZE_CHANGED, callback),
  subscribeToSizeChange: (callback: (...args: unknown[]) => void) => onIpcEvent(CacheAPI.ON_SIZE_CHANGED, callback),
});

contextBridge.exposeInMainWorld(API.WEBSOCKET, {
  connect: () => invokeWithCustomErrors(WebSocketAPI.CONNECT),
  send: (id: string, data: string) => invokeWithCustomErrors(WebSocketAPI.SEND, id, data),
  close: (id: string) => invokeWithCustomErrors(WebSocketAPI.CLOSE, id),
  subscribeToOpen: (callback: (...args: unknown[]) => void) => onIpcEvent(WebSocketAPI.ON_OPEN, callback),
  subscribeToMessage: (callback: (...args: unknown[]) => void) => onIpcEvent(WebSocketAPI.ON_MESSAGE, callback),
  subscribeToError: (callback: (...args: unknown[]) => void) => onIpcEvent(WebSocketAPI.ON_ERROR, callback),
  subscribeToClose: (callback: (...args: unknown[]) => void) => onIpcEvent(WebSocketAPI.ON_CLOSE, callback),
});

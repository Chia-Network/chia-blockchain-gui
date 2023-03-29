const { /* contextBridge, */ ipcRenderer, shell } = require('electron');

/*
contextBridge.exposeInMainWorld('cacheApi', {
  getCacheSize: () => ipcRenderer.invoke('cache:getCacheSize'),
  clearCache: () => ipcRenderer.invoke('cache:clearCache'),
  changeCacheDirectory: (...args) => ipcRenderer.invoke('cache:changeCacheDirectory', ...args),
  setMaxTotalSize: (...args) => ipcRenderer.invoke('cache:setMaxTotalSize', ...args),
  get: (...args) => ipcRenderer.invoke('cache:get', ...args),
  invalidate: (...args) => ipcRenderer.invoke('cache:invalidate', ...args),
});

contextBridge.exposeInMainWorld('ipcRenderer', ipcRenderer);
contextBridge.exposeInMainWorld('shell', shell);
*/

// deprecated - use contextBridge instead
window.ipcRenderer = ipcRenderer;
window.shell = shell;
window.cacheApi = {
  getCacheSize: () => ipcRenderer.invoke('cache:getCacheSize'),
  clearCache: () => ipcRenderer.invoke('cache:clearCache'),
  changeCacheDirectory: (...args) => ipcRenderer.invoke('cache:changeCacheDirectory', ...args),
  setMaxTotalSize: (...args) => ipcRenderer.invoke('cache:setMaxTotalSize', ...args),
  get: (...args) => ipcRenderer.invoke('cache:get', ...args),
  invalidate: (...args) => ipcRenderer.invoke('cache:invalidate', ...args),
};

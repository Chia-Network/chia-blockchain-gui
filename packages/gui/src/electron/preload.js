const { /* contextBridge, */ ipcRenderer, shell } = require('electron');

function decodeError({ name, message, extra }) {
  const error = new Error(message);
  error.name = name;
  Object.assign(error, extra);

  return error;
}

async function invokeWithCustomErrors(channel, ...args) {
  const { error, result } = await ipcRenderer.invoke(channel, ...args);
  if (error) {
    throw decodeError(error);
  }

  return result;
}

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
  getCacheSize: () => invokeWithCustomErrors('cache:getCacheSize'),
  clearCache: () => invokeWithCustomErrors('cache:clearCache'),
  getCacheDirectory: () => invokeWithCustomErrors('cache:getCacheDirectory'),
  setCacheDirectory: (...args) => invokeWithCustomErrors('cache:setCacheDirectory', ...args),
  setMaxCacheSize: (...args) => invokeWithCustomErrors('cache:setMaxCacheSize', ...args),
  getMaxCacheSize: () => invokeWithCustomErrors('cache:getMaxCacheSize'),
  getContent: (...args) => invokeWithCustomErrors('cache:getContent', ...args),
  getHeaders: (...args) => invokeWithCustomErrors('cache:getHeaders', ...args),
  getChecksum: (...args) => invokeWithCustomErrors('cache:getChecksum', ...args),
  getURI: (...args) => invokeWithCustomErrors('cache:getURI', ...args),
  invalidate: (...args) => invokeWithCustomErrors('cache:invalidate', ...args),
};

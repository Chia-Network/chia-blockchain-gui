import { contextBridge, ipcRenderer } from 'electron';

(async () => {
  const { resolveChannelId, rejectChannelId } = await ipcRenderer.invoke(`dialog:init`);
  if (!resolveChannelId || !rejectChannelId) {
    throw new Error('Invalid metadata');
  }

  contextBridge.exposeInMainWorld('dialogAPI', {
    resolve: (response: unknown) => ipcRenderer.invoke(resolveChannelId, response),
    reject: (error: Error) => ipcRenderer.invoke(rejectChannelId, { message: error.message }),
  });
})();

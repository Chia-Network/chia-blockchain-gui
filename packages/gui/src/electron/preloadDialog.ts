import { contextBridge, ipcRenderer } from 'electron';

function getArg(argumentName: string): string {
  const prefix = `--${argumentName}=`;
  const found = process.argv.find((a) => a.startsWith(prefix));
  if (!found) {
    throw new Error(`${argumentName} missing`);
  }

  return found.slice(prefix.length);
}

const resolveChannelId = getArg('resolveChannelId');
const rejectChannelId = getArg('rejectChannelId');

contextBridge.exposeInMainWorld('dialogAPI', {
  resolve: (response: unknown) => ipcRenderer.invoke(resolveChannelId, response),
  reject: (error: Error) => ipcRenderer.invoke(rejectChannelId, { message: error.message }),
});

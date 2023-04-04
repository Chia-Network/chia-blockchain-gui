import { ipcRenderer } from 'electron';

import decodeError from './decodeError';

export default async function invokeWithCustomErrors(channel: string, ...args: any[]) {
  const { error, result } = await ipcRenderer.invoke(channel, ...args);
  if (error) {
    throw decodeError(error);
  }

  return result;
}

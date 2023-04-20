import { ipcMain } from 'electron';

import encodeError from './encodeError';

export default function handleWithCustomErrors(channel: string, handler: (...args: any[]) => any) {
  ipcMain.handle(channel, async (...args: any[]) => {
    try {
      return { result: await handler(...args) };
    } catch (e) {
      return { error: encodeError(e as Error) };
    }
  });
}

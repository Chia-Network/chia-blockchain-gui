import { ipcMain } from 'electron';

export default function ipcMainHandle<THandler extends (...args: any[]) => any>(channel: string, handler: THandler) {
  ipcMain.handle(channel, (_event, ...args) => handler(...args));
}

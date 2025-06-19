import { BrowserWindow, ipcMain, type IpcMainInvokeEvent, nativeTheme } from 'electron';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

import * as preferences from '../prefs';

import { addAsset, removeAsset } from './assets';
import openExternal from './openExternal';

function generateScriptContent(confirmId: string) {
  return `
    document.getElementById('${confirmId}')?.addEventListener('click', () => {
      window.dialogAPI.resolve(true);
    });
    
    document.querySelectorAll('[data-action="cancel"]').forEach(button => {
      button.addEventListener('click', () => {
        window.dialogAPI.resolve(false);
      });
    });
  `;
}

export type DialogOptions = {
  title?: string;
  width?: number;
  height?: number;
  hideMenu?: boolean;
  modal?: boolean;
  hideOnBlur?: boolean;
  titleBarStyle?: 'default' | 'hiddenInset' | 'hidden';
};

export default function openReactDialog<TResponse, TProps extends object>(
  parent: BrowserWindow,
  Component: React.ComponentType<TProps>,
  props: TProps,
  options: DialogOptions,
): Promise<TResponse | undefined> {
  const { title, width, height, hideMenu = false, modal = false, hideOnBlur = false, titleBarStyle } = options;

  const prefs = preferences.readPrefs();

  const dialogId = crypto.randomUUID();
  const channelId = `dialog-${dialogId}`;
  const resolveChannelId = `${channelId}-resolve`;
  const rejectChannelId = `${channelId}-reject`;

  const confirmId = crypto.randomUUID();

  const isDarkMode = prefs.darkMode ?? nativeTheme.shouldUseDarkColors;
  const initialBgColor = isDarkMode ? '#0f252a' : '#ffffff';

  try {
    const scriptAssetURL = addAsset({
      content: generateScriptContent(confirmId),
      type: 'text/javascript',
    });

    const cssPath = path.join(__dirname, 'main.css');
    const cssContent = fs.readFileSync(cssPath, 'utf-8');

    const styleAssetURL = addAsset({
      content: cssContent,
      type: 'text/css',
    });

    const html = renderToStaticMarkup(
      <html lang="en" className={isDarkMode ? 'dark' : ''}>
        <head>
          <meta charSet="utf-8" />
          <meta
            httpEquiv="Content-Security-Policy"
            content="
              default-src 'none';
              base-uri   'none';
              connect-src 'none';
              font-src   'none';
              frame-src  'none';
              img-src data:;
              media-src 'none';
              object-src 'none';
              script-src asset:;
              style-src  asset:;
              worker-src 'none';
              form-action 'none';
            "
          />
          <meta name="viewport" content="width=device-width, minimum-scale=1.0, initial-scale=1, user-scalable=yes" />
          <link href={styleAssetURL} type="text/css" rel="stylesheet" />
        </head>
        <body>
          <Component {...props} confirmId={confirmId} styleURL={styleAssetURL} isDarkMode={isDarkMode} />
          <script src={scriptAssetURL} />
        </body>
      </html>,
    );

    const dialogURL = addAsset({
      content: `<!DOCTYPE html>${html}`,
      type: 'text/html',
    });

    const assets = [dialogURL, scriptAssetURL, styleAssetURL];

    let settled = false;

    return new Promise<TResponse | undefined>((resolve, reject) => {
      function safeResolve(value: TResponse | undefined) {
        if (settled) {
          return;
        }
        settled = true;
        resolve(value);
      }
      function safeReject(error: Error) {
        if (settled) {
          return;
        }
        settled = true;
        reject(error);
      }

      const dialog = new BrowserWindow({
        modal,
        parent,
        width,
        height,
        title,
        show: false,
        resizable: false,
        useContentSize: true,
        titleBarStyle,
        backgroundColor: initialBgColor,
        webPreferences: {
          preload: path.join(__dirname, 'preloadDialog.js'),
          contextIsolation: true,
          sandbox: true,
          nodeIntegration: false,
          additionalArguments: [`--resolveChannelId=${resolveChannelId}`, `--rejectChannelId=${rejectChannelId}`],
        },
      });

      dialog.webContents.on('will-navigate', (event, url) => {
        event.preventDefault();
        const currentURL = dialog.webContents.getURL();

        if (url !== currentURL) {
          event.preventDefault();
          openExternal(url);
        }
      });

      // open dev tools
      // dialog.webContents.openDevTools();

      dialog.once('ready-to-show', () => dialog.show());

      if (hideMenu) {
        dialog.setMenu(null);
      }

      ipcMain.handleOnce(resolveChannelId, (_event, response: TResponse | undefined) => {
        safeResolve(response);
        setImmediate(() => dialog.close());
      });

      ipcMain.handleOnce(rejectChannelId, (_event: IpcMainInvokeEvent, error: { message?: string }) => {
        safeReject(new Error(error?.message ?? 'Unknown error'));
        setImmediate(() => dialog.close());
      });

      dialog.once('closed', () => {
        safeResolve(undefined);

        ipcMain.removeHandler(resolveChannelId);
        ipcMain.removeHandler(rejectChannelId);

        removeAsset(assets);
      });

      if (hideOnBlur) {
        dialog.on('blur', () => {
          safeResolve(undefined);
          dialog.close();
        });
      }

      dialog.loadURL(dialogURL);
    });
  } catch (error) {
    console.error('Failed to render React component:', error);
    throw new Error('Failed to render dialog content');
  }
}

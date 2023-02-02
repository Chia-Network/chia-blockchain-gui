import crypto from 'crypto';
import {
  app,
  dialog,
  net,
  shell,
  ipcMain,
  BrowserWindow,
  IncomingMessage,
  Menu,
  nativeImage,
  Notification,
  protocol,
} from 'electron';
import fs from 'fs';
import path from 'path';
import url from 'url';

import { NFTInfo } from '@chia-network/api';
import { initialize, enable } from '@electron/remote/main';
import axios from 'axios';
import chokidar from 'chokidar';
import windowStateKeeper from 'electron-window-state';
import React from 'react';
// import os from 'os';
// import installExtension, { REDUX_DEVTOOLS, REACT_DEVELOPER_TOOLS } from 'electron-devtools-installer';
import ReactDOMServer from 'react-dom/server';
import { ServerStyleSheet, StyleSheetManager } from 'styled-components';

// handle setupevents as quickly as possible
import '../config/env';
import packageJson from '../../package.json';
import AppIcon from '../assets/img/chia64x64.png';
import About from '../components/about/About';
import { i18n } from '../config/locales';
import chiaEnvironment from '../util/chiaEnvironment';
import computeHash from '../util/computeHash';
import loadConfig from '../util/loadConfig';
import manageDaemonLifetime from '../util/manageDaemonLifetime';
import { setUserDataDir } from '../util/userData';
import { parseExtensionFromUrl } from '../util/utils';
import handleSquirrelEvent from './handleSquirrelEvent';
import { readPrefs, savePrefs, migratePrefs } from './prefs';

const isPlaywrightTesting = process.env.PLAYWRIGHT_TESTS === 'true';
const NET = 'mainnet';

app.disableHardwareAcceleration();
app.commandLine.appendSwitch('disable-http-cache');

initialize();

const appIcon = nativeImage.createFromPath(path.join(__dirname, AppIcon));
const defaultThumbCacheFolder = path.join(app.getPath('cache'), app.getName());
let thumbCacheFolder = defaultThumbCacheFolder;

if (!fs.existsSync(defaultThumbCacheFolder)) {
  fs.mkdirSync(defaultThumbCacheFolder);
}

let mainWindow: BrowserWindow | null = null;

let watcher;

let currentDownloadRequest: any;
let abortDownloadingFiles: boolean = false;

function watchCacheFolder(folder: string) {
  function watchFolder(f) {
    watcher = chokidar.watch(f, { persistent: true });
    watcher.on('unlink', (pathLocal: any) => {
      mainWindow?.webContents.send('removed-cache-file', pathLocal.split('/').splice(-1, 1)[0]);
    });
  }
  if (folder) {
    if (watcher) {
      watcher.close().then(() => {
        watchFolder(folder);
      });
    } else {
      watchFolder(folder);
    }
  }
}

let cacheLimitSize: number = 1024;

// Set the userData directory to its location within CHIA_ROOT/gui
setUserDataDir();

function renderAbout(): string {
  const sheet = new ServerStyleSheet();
  const about = ReactDOMServer.renderToStaticMarkup(
    <StyleSheetManager sheet={sheet.instance}>
      <About packageJson={packageJson} versions={process.versions} version={app.getVersion()} />
    </StyleSheetManager>
  );

  const tags = sheet.getStyleTags();
  const result = about.replace('{{CSS}}', tags); // .replaceAll('/*!sc*/', ' ');

  sheet.seal();

  return result;
}

const openedWindows = new Set<BrowserWindow>();

function openAbout() {
  const about = renderAbout();

  const aboutWindow = new BrowserWindow({
    width: 400,
    height: 460,
    useContentSize: true,
    titleBarStyle: 'hiddenInset',
  });
  aboutWindow.loadURL(`data:text/html;charset=utf-8,${about}`);

  aboutWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url);
    return { action: 'deny' };
  });

  aboutWindow.once('closed', () => {
    openedWindows.delete(aboutWindow);
  });

  aboutWindow.setMenu(null);

  openedWindows.add(aboutWindow);

  // aboutWindow.webContents.openDevTools({ mode: 'detach' });
}

export function getChecksum(pathLocal: string) {
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash('sha256');
    const input = fs.createReadStream(pathLocal);
    input.on('error', reject);
    input.on('data', (chunk) => {
      hash.update(chunk);
    });
    input.on('close', () => {
      resolve(hash.digest('hex'));
    });
  });
}

if (!handleSquirrelEvent()) {
  // squirrel event handled and app will exit in 1000ms, so don't do anything else
  const ensureSingleInstance = () => {
    const gotTheLock = app.requestSingleInstanceLock();

    if (!gotTheLock) {
      app.quit();
      return false;
    }
    app.on('second-instance', () => {
      // Someone tried to run a second instance, we should focus our window.
      if (mainWindow) {
        if (mainWindow.isMinimized()) {
          mainWindow.restore();
        }
        mainWindow.focus();
      }
    });

    return true;
  };

  const ensureCorrectEnvironment = () => {
    // check that the app is either packaged or running in the python venv
    if (!chiaEnvironment.guessPackaged() && !('VIRTUAL_ENV' in process.env)) {
      app.quit();
      return false;
    }

    return true;
  };

  const createMenu = () => Menu.buildFromTemplate(getMenuTemplate());

  // if any of these checks return false, don't do any other initialization since the app is quitting
  if (ensureSingleInstance() && ensureCorrectEnvironment()) {
    const exitPyProc = () => {};

    app.on('will-quit', exitPyProc);

    /** ***********************************************************
     * window management
     ************************************************************ */
    let decidedToClose = false;
    let isClosing = false;
    let mainWindowLaunchTasks: ((window: BrowserWindow) => void)[] = [];

    const createWindow = async () => {
      if (manageDaemonLifetime(NET)) {
        chiaEnvironment.startChiaDaemon();
      }

      ipcMain.handle('getConfig', () => loadConfig(NET));

      ipcMain.handle('getTempDir', () => app.getPath('temp'));

      ipcMain.handle('getVersion', () => app.getVersion());

      ipcMain.handle(
        'showNotification',
        async (
          _event,
          options: {
            title: string;
            body: string;
          }
        ) => {
          new Notification(options).show();
        }
      );

      ipcMain.handle('fetchTextResponse', async (_event, requestOptions, requestHeaders, requestData) => {
        const request = net.request(requestOptions as any);

        Object.entries(requestHeaders || {}).forEach(([header, value]) => {
          request.setHeader(header, value as any);
        });

        let err: any | undefined;
        let statusCode: number | undefined;
        let statusMessage: string | undefined;
        let responseBody: string | undefined;

        try {
          responseBody = await new Promise((resolve, reject) => {
            request.on('response', (response: IncomingMessage) => {
              statusCode = response.statusCode;
              statusMessage = response.statusMessage;

              response.on('data', (chunk) => {
                const body = chunk.toString('utf8');

                resolve(body);
              });

              response.on('error', (e: string) => {
                reject(new Error(e));
              });
            });

            request.on('error', (error: any) => {
              reject(error);
            });

            request.write(requestData);
            request.end();
          });
        } catch (e) {
          console.error(e);
          err = e;
        }

        return { err, statusCode, statusMessage, responseBody };
      });

      function getRemoteFileSize(urlLocal: string): Promise<number> {
        return new Promise((resolve, reject) => {
          axios({
            method: 'HEAD',
            url: urlLocal,
          })
            .then((response) => {
              resolve(Number(response.headers['content-length'] || -1));
            })
            .catch((e) => {
              reject(e.message);
            });
        });
      }

      const allRequests: any = {};

      ipcMain.handle('abortFetchingBinary', (_event, uri: string) => {
        if (allRequests[uri]) {
          allRequests[uri].abort();
          delete allRequests[uri];
        }
      });

      ipcMain.handle('removeCachedFile', (_event, file: string) => {
        const filePath = path.join(thumbCacheFolder, file);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      });

      function shouldCacheFile(filePath: string) {
        const stats = fs.statSync(filePath);
        const allowWriteCache = getCacheSize() + stats.size < cacheLimitSize * 1024 * 1024;
        return allowWriteCache;
      }

      ipcMain.handle('getSvgContent', (_event, file) => {
        if (file) {
          const fileOnDisk = path.join(thumbCacheFolder, file);
          if (fs.existsSync(fileOnDisk)) {
            return fs.readFileSync(fileOnDisk, { encoding: 'utf8' });
          }
          return null;
        }
        console.error('Error getting svg file...', file);
        return undefined;
      });

      ipcMain.handle(
        'fetchBinaryContent',
        async (_event, requestOptions = {}, requestHeaders = {}, requestData?: any) => {
          const { maxSize = Infinity, ...rest } = requestOptions;

          let wasCached = false;

          if (allRequests[rest.url]) {
            /* request already exists */
            return undefined;
          }

          allRequests[rest.url] = net.request(rest);

          const nftIdUrl = `${rest.nftId}_${rest.url}`;
          const fileOnDisk = path.join(thumbCacheFolder, computeHash(nftIdUrl, { encoding: 'utf-8' }));

          const fileStream = fs.createWriteStream(fileOnDisk);

          Object.entries(requestHeaders).forEach(([header, value]: [string, any]) => {
            allRequests[rest.url].setHeader(header, value);
          });

          let error: Error | undefined;
          let statusCode: number | undefined;
          let statusMessage: string | undefined;
          let contentType: string | undefined;
          let encoding = 'binary';
          let dataObject: { isValid?: boolean; content: string } = {
            content: '',
          };

          const buffers: Buffer[] = [];
          let totalLength = 0;

          try {
            /* GET FILE SIZE */
            const fileSize: number = await getRemoteFileSize(rest.url);
            dataObject = await new Promise((resolve, reject) => {
              allRequests[rest.url].on('response', (response: IncomingMessage) => {
                statusCode = response.statusCode;
                statusMessage = response.statusMessage;

                const rawContentType = response.headers['content-type'];
                if (rawContentType) {
                  if (Array.isArray(rawContentType)) {
                    [contentType] = rawContentType;
                  } else {
                    contentType = rawContentType;
                  }

                  if (contentType) {
                    // extract charset from contentType
                    const charsetMatch = contentType.match(/charset=([^;]+)/);
                    if (charsetMatch) {
                      [, encoding] = charsetMatch;
                    }
                  }
                }

                response.on('data', (chunk) => {
                  buffers.push(chunk);

                  fileStream.write(chunk);

                  totalLength += chunk.byteLength;

                  if (fileSize > 0) {
                    mainWindow?.webContents.send('fetchBinaryContentProgress', {
                      nftIdUrl,
                      progress: totalLength / fileSize,
                    });
                  }
                  if (totalLength > maxSize || fileSize > maxSize) {
                    if (allRequests[rest.url]) {
                      allRequests[rest.url].abort();
                      if (fs.existsSync(fileOnDisk)) {
                        fs.unlinkSync(fileOnDisk);
                      }
                    }
                    reject(new Error('Response too large'));
                  }
                });

                response.on('end', () => {
                  let content;
                  // special case for iso-8859-1, which is mapped to 'latin1' in node
                  if (encoding.toLowerCase() === 'iso-8859-1') {
                    encoding = 'latin1';
                  }
                  try {
                    content = Buffer.concat(buffers).toString(encoding as BufferEncoding);
                  } catch (e: any) {
                    console.error(`Failed to convert data to string using encoding ${encoding}: ${e.message}`);
                  }
                  fileStream.end();
                  getChecksum(fileOnDisk).then((checksum) => {
                    const isValid = (checksum as string).replace(/^0x/, '') === rest.dataHash.replace(/^0x/, '');
                    if (rest.forceCache) {
                      /* should we cache it or delete it? */
                      if (shouldCacheFile(fileOnDisk)) {
                        wasCached = true;
                      } else if (fs.existsSync(fileOnDisk)) {
                        fs.unlinkSync(fileOnDisk);
                      }
                      mainWindow?.webContents.send('fetchBinaryContentDone', {
                        nftIdUrl,
                        valid: isValid,
                      });
                      const extension = parseExtensionFromUrl(rest.url);
                      resolve({
                        isValid,
                        content: extension === 'svg' ? content : '',
                      });
                    } else {
                      resolve({ isValid, content });
                    }
                  });
                  delete allRequests[rest.url];
                });

                response.on('error', (e: string) => {
                  fileStream.end();
                  reject(new Error(e));
                });
              });

              allRequests[rest.url].on('error', (err: any) => {
                reject(err);
              });

              if (requestData) {
                allRequests[rest.url].write(requestData);
              }

              allRequests[rest.url].end();
            });
          } catch (e: any) {
            if (fs.existsSync(fileOnDisk)) {
              fs.unlinkSync(fileOnDisk);
            }
            delete allRequests[rest.url];
            error = e;
          }

          return {
            error,
            statusCode,
            statusMessage,
            encoding,
            dataObject,
            wasCached,
          };
        }
      );

      ipcMain.handle('showMessageBox', async (_event, options) => dialog.showMessageBox(mainWindow, options));

      ipcMain.handle('showOpenDialog', async (_event, options) => dialog.showOpenDialog(options));

      ipcMain.handle('showSaveDialog', async (_event, options) => dialog.showSaveDialog(options));

      ipcMain.handle('download', async (_event, options) => {
        if (mainWindow) {
          return mainWindow.webContents.downloadURL(options.url);
        }
        console.error('mainWindow was not initialized');
        return undefined;
      });

      ipcMain.handle('selectMultipleDownloadFolder', async (_event: any) =>
        dialog.showOpenDialog({
          properties: ['openDirectory'],
          defaultPath: app.getPath('downloads'),
        })
      );

      type DownloadFileWithProgressProps = {
        folder: string;
        nft: NFTInfo;
        current: number;
        total: number;
      };

      function downloadFileWithProgress(props: DownloadFileWithProgressProps): Promise<number> {
        const { folder, nft, current, total } = props;
        const uri = nft.dataUris[0];
        return new Promise((resolve, reject) => {
          getRemoteFileSize(uri)
            .then((fileSize: number) => {
              let totalLength = 0;
              currentDownloadRequest = net.request(uri);
              currentDownloadRequest.on('response', (response: IncomingMessage) => {
                let fileName: string = '';
                /* first try to get file name from server headers */
                const disposition = response.headers['content-disposition'];
                if (disposition && typeof disposition === 'string') {
                  const filenameRegex = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/;
                  const matches = filenameRegex.exec(disposition);
                  if (matches != null && matches[1]) {
                    fileName = matches[1].replace(/['"]/g, '');
                  }
                }
                /* if we didn't get file name from server headers, then parse it from uri */
                fileName = fileName || uri.replace(/\/$/, '').split('/').splice(-1, 1)[0];
                currentDownloadRequest.on('abort', () => {
                  reject(new Error('download aborted'));
                });

                /* if there is already a file with that name in this folder, add nftId to the file name */
                if (fs.existsSync(path.join(folder, fileName))) {
                  fileName = `${fileName}-${nft.$nftId}`;
                }

                const fileStream = fs.createWriteStream(path.join(folder, fileName));
                response.on('data', (chunk) => {
                  fileStream.write(chunk);
                  totalLength += chunk.byteLength;
                  if (fileSize > 0) {
                    mainWindow?.webContents.send('downloadProgress', {
                      url: nft.dataUris[0],
                      nftId: nft.$nftId,
                      progress: totalLength / fileSize,
                      i: current,
                      total,
                    });
                  }
                });
                response.on('end', () => {
                  fileStream.end();
                  resolve(totalLength);
                });
              });
              currentDownloadRequest.end();
            })
            .catch((error) => {
              reject(error);
            });
        });
      }

      ipcMain.handle('startMultipleDownload', async (_event: any, options: any) => {
        /* eslint no-await-in-loop: off -- we want to handle each file separately! */
        let totalDownloadedSize = 0;
        let successFileCount = 0;
        let errorFileCount = 0;
        for (let i = 0; i < options.nfts.length; i++) {
          let fileSize;
          try {
            fileSize = await downloadFileWithProgress({
              folder: options.folder,
              nft: options.nfts[i],
              current: i,
              total: options.nfts.length,
            });
            totalDownloadedSize += fileSize;
            successFileCount++;
          } catch (e: any) {
            if (e.message === 'download aborted' && abortDownloadingFiles) {
              break;
            }
            mainWindow?.webContents.send('errorDownloadingUrl', options.nfts[i]);
            errorFileCount++;
          }
        }
        abortDownloadingFiles = false;
        mainWindow?.webContents.send('multipleDownloadDone', { totalDownloadedSize, successFileCount, errorFileCount });
        return true;
      });

      ipcMain.handle('abortDownloadingFiles', async (_event: any) => {
        abortDownloadingFiles = true;
        if (currentDownloadRequest) {
          currentDownloadRequest.abort();
        }
      });

      ipcMain.handle('processLaunchTasks', async (_event) => {
        const tasks = [...mainWindowLaunchTasks];

        mainWindowLaunchTasks = [];

        tasks.forEach((task) => task(mainWindow!));
      });

      /* ========================== CACHE FOLDER ================================ */
      function getCacheSize() {
        let folderSize: number = 0;
        const files = fs.readdirSync(thumbCacheFolder);

        files
          .filter(
            (file) =>
              /* skip files that start with a dot */
              !file.match(/^\./)
          )
          .forEach((file) => {
            const stats = fs.statSync(path.join(thumbCacheFolder, file));
            folderSize += stats.size;
          });
        return folderSize;
      }
      ipcMain.handle('getDefaultCacheFolder', (_event) => thumbCacheFolder);

      ipcMain.handle('setCacheFolder', (_event, newFolder) => {
        thumbCacheFolder = newFolder;
      });

      ipcMain.handle('selectCacheFolder', async (_event) =>
        dialog.showOpenDialog({
          properties: ['openDirectory'],
          defaultPath: thumbCacheFolder,
        })
      );

      ipcMain.handle('changeCacheFolderFromTo', async (_event, [from, to]) => {
        const fromFolder = from || thumbCacheFolder;
        if (fs.existsSync(fromFolder)) {
          const fileStats = fs.statSync(fromFolder);
          if (fileStats.isDirectory()) {
            const files = fs.readdirSync(fromFolder);
            files.forEach((file) => {
              if (fs.lstatSync(path.join(fromFolder, file)).isFile()) {
                fs.renameSync(path.join(fromFolder, file), path.join(to, file));
              }
            });
          }
          watchCacheFolder(to);
        }

        thumbCacheFolder = to;
      });

      ipcMain.handle('getCacheSize', async (_event) => getCacheSize());

      ipcMain.handle(
        'isNewFolderEmtpy',
        (_event, selectedFolder) =>
          fs.readdirSync(selectedFolder).filter(
            (file) =>
              /* skip files that start with a dot */
              !file.match(/^\./)
          ).length
      );

      ipcMain.handle('adjustCacheLimitSize', async (_event, { newSize, cacheInstances }) => {
        if (newSize) {
          cacheLimitSize = newSize;
        }
        let overSize = getCacheSize() - newSize * 1024 * 1024; /* MiB! */

        if (overSize > 0) {
          const removedEntries: any[] = [];
          for (let cnt = 0; cnt < cacheInstances.length; cnt++) {
            const fileString = cacheInstances[cnt].video || cacheInstances[cnt].image || cacheInstances[cnt].binary;
            if (fileString) {
              const filePath = path.join(thumbCacheFolder, fileString);
              if (fs.existsSync(filePath)) {
                const fileStats = fs.statSync(filePath);
                fs.unlinkSync(filePath);
                overSize -= fileStats.size;
                removedEntries.push(cacheInstances[cnt]);
              }
            }
            if (overSize < 0) break;
          }
          mainWindow?.webContents.send('removedFromLocalStorage', {
            removedEntries,
            occupied: getCacheSize(),
          });
        }
      });

      ipcMain.handle('readPrefs', async (_event) => readPrefs());

      ipcMain.handle('savePrefs', async (_event, prefsObj) => {
        savePrefs(prefsObj);
      });

      ipcMain.handle('migratePrefs', async (_event, prefsObj) => migratePrefs(prefsObj));

      ipcMain.handle('getCacheFilenames', (_event) => fs.readdirSync(thumbCacheFolder));

      ipcMain.handle('clearNFTCache', (_event) => {
        if (fs.existsSync(thumbCacheFolder)) {
          const files = fs.readdirSync(thumbCacheFolder);
          for (let i = 0; i < files.length; i++) {
            fs.unlinkSync(path.join(thumbCacheFolder, files[i]));
          }
        }
        return true;
      });

      /* ======================================================================== */

      decidedToClose = false;
      const mainWindowState = windowStateKeeper({
        defaultWidth: 1200,
        defaultHeight: 1200,
      });
      mainWindow = new BrowserWindow({
        x: mainWindowState.x,
        y: mainWindowState.y,
        width: mainWindowState.width,
        height: mainWindowState.height,
        minWidth: 500,
        minHeight: 500,
        backgroundColor: '#ffffff',
        show: isPlaywrightTesting,
        webPreferences: {
          preload: `${__dirname}/preload.js`,
          nodeIntegration: true,
          contextIsolation: false,
          nativeWindowOpen: true,
          webSecurity: true,
        },
      });

      mainWindowState.manage(mainWindow);

      if (process.platform === 'linux') {
        mainWindow.setIcon(appIcon);
      }

      mainWindow.once('ready-to-show', () => {
        mainWindow.show();
      });

      // don't show remote daeomn detials in the title bar
      if (!manageDaemonLifetime(NET)) {
        mainWindow.webContents.on('did-finish-load', async () => {
          const { url: urlLocal } = await loadConfig(NET);
          if (mainWindow) {
            mainWindow.setTitle(`${app.getName()} [${urlLocal}]`);
          }
        });
      }
      // Uncomment this to open devtools by default
      // if (!guessPackaged()) {
      //   mainWindow.webContents.openDevTools();
      // }
      mainWindow.on('close', (e) => {
        // if the daemon isn't local we aren't going to try to start/stop it
        if (decidedToClose || !manageDaemonLifetime(NET)) {
          return;
        }
        e.preventDefault();
        if (!isClosing) {
          isClosing = true;
          const choice = dialog.showMessageBoxSync({
            type: 'question',
            buttons: [i18n._(/* i18n */ { id: 'No' }), i18n._(/* i18n */ { id: 'Yes' })],
            title: i18n._(/* i18n */ { id: 'Confirm' }),
            message: i18n._(
              /* i18n */ {
                id: 'Are you sure you want to quit?',
              }
            ),
          });
          if (choice === 0) {
            isClosing = false;
            return;
          }
          isClosing = false;
          decidedToClose = true;
          mainWindow.webContents.send('exit-daemon');
          // save the window state and unmange so we don't restore the mini exiting state
          mainWindowState.saveState(mainWindow);
          mainWindowState.unmanage(mainWindow);
          mainWindow.setBounds({ height: 500, width: 500 });
          mainWindow.center();
          ipcMain.on('daemon-exited', () => {
            mainWindow.close();

            openedWindows.forEach((win) => win.close());
          });
        }
      });

      const startUrl =
        process.env.NODE_ENV === 'development'
          ? 'http://localhost:3000'
          : url.format({
              pathname: path.join(__dirname, '/../renderer/index.html'),
              protocol: 'file:',
              slashes: true,
            });

      mainWindow.loadURL(startUrl);
      enable(mainWindow.webContents);
    };

    const appReady = async () => {
      createWindow();
      app.applicationMenu = createMenu();
      protocol.registerFileProtocol('cached', (request: any, callback: (obj: any) => void) => {
        const filePath: string = path.join(thumbCacheFolder, request.url.replace(/^cached:\/\//, ''));
        callback({ path: filePath });
      });
      const prefs = readPrefs();
      thumbCacheFolder = prefs.cacheFolder || defaultThumbCacheFolder;
      watchCacheFolder(thumbCacheFolder);

      if (prefs.cacheLimitSize !== undefined) {
        try {
          const prefsCacheLimitSize = +prefs.cacheLimitSize;
          if (!Number.isNaN(prefsCacheLimitSize) && Number.isFinite(prefsCacheLimitSize) && prefsCacheLimitSize > 0) {
            cacheLimitSize = prefsCacheLimitSize;
          }
        } catch (e) {
          console.error(e);
        }
      }
      if (prefs.cacheFolder !== undefined) {
        try {
          const prefsCacheFolder = prefs.cacheFolder;
          if (fs.existsSync(prefsCacheFolder)) {
            thumbCacheFolder = prefsCacheFolder;
          }
        } catch (e) {
          console.error(e);
        }
      }
    };

    app.on('ready', appReady);

    app.on('window-all-closed', () => {
      app.quit();
    });

    app.on('open-file', (event, pathLocal) => {
      event.preventDefault();

      // App may have been launched with a file to open. Make sure we have a
      // main window before trying to open a file.
      if (!mainWindow) {
        mainWindowLaunchTasks.push((window: BrowserWindow) => {
          window.webContents.send('open-file', pathLocal);
        });
      } else {
        mainWindow?.webContents.send('open-file', pathLocal);
      }
    });

    app.on('open-url', (event, urlLocal) => {
      event.preventDefault();

      // App may have been launched with a URL to open. Make sure we have a
      // main window before trying to open a URL.
      if (!mainWindow) {
        mainWindowLaunchTasks.push((window: BrowserWindow) => {
          window.webContents.send('open-url', urlLocal);
        });
      } else {
        mainWindow?.webContents.send('open-url', urlLocal);
      }
    });

    ipcMain.on('load-page', (_, arg: { file: string; query: string }) => {
      mainWindow.loadURL(
        url.format({
          pathname: path.join(__dirname, arg.file),
          protocol: 'file:',
          slashes: true,
        }) + arg.query
      );
    });

    ipcMain.handle('setLocale', (_event, locale: string) => {
      i18n.activate(locale);
      app.applicationMenu = createMenu();
    });
  }
}

function getMenuTemplate() {
  const template = [
    {
      label: i18n._(/* i18n */ { id: 'File' }),
      submenu: [
        {
          role: 'quit',
        },
      ],
    },
    {
      label: i18n._(/* i18n */ { id: 'Edit' }),
      submenu: [
        {
          role: 'undo',
        },
        {
          role: 'redo',
        },
        {
          type: 'separator',
        },
        {
          role: 'cut',
        },
        {
          role: 'copy',
        },
        {
          role: 'paste',
        },
        {
          role: 'delete',
        },
        {
          type: 'separator',
        },
        {
          role: 'selectall',
        },
      ],
    },
    {
      label: i18n._(/* i18n */ { id: 'View' }),
      submenu: [
        {
          role: 'reload',
        },
        {
          role: 'forcereload',
        },
        {
          label: i18n._(/* i18n */ { id: 'Developer' }),
          submenu: [
            {
              label: i18n._(/* i18n */ { id: 'Developer Tools' }),
              accelerator: process.platform === 'darwin' ? 'Alt+Command+I' : 'Ctrl+Shift+I',
              click: () => mainWindow.toggleDevTools(),
            },
            // {
            // label: isSimulator
            //  ? i18n._(/* i18n */ { id: 'Disable Simulator' })
            //   : i18n._(/* i18n */ { id: 'Enable Simulator' }),
            // click: () => toggleSimulatorMode(),
            // },
          ],
        },
        {
          type: 'separator',
        },
        {
          role: 'resetzoom',
        },
        {
          role: 'zoomin',
        },
        {
          role: 'zoomout',
        },
        {
          type: 'separator',
        },
        {
          label: i18n._(/* i18n */ { id: 'Full Screen' }),
          accelerator: process.platform === 'darwin' ? 'Ctrl+Command+F' : 'F11',
          click: () => mainWindow.setFullScreen(!mainWindow.isFullScreen()),
        },
      ],
    },
    {
      label: i18n._(/* i18n */ { id: 'Window' }),
      submenu: [
        {
          role: 'minimize',
        },
        {
          role: 'zoom',
        },
        {
          role: 'close',
        },
      ],
    },
    {
      label: i18n._(/* i18n */ { id: 'Help' }),
      role: 'help',
      submenu: [
        {
          label: i18n._(/* i18n */ { id: 'Chia Blockchain Wiki' }),
          click: () => {
            openExternal('https://github.com/Chia-Network/chia-blockchain/wiki');
          },
        },
        {
          label: i18n._(/* i18n */ { id: 'Frequently Asked Questions' }),
          click: () => {
            openExternal('https://github.com/Chia-Network/chia-blockchain/wiki/FAQ');
          },
        },
        {
          label: i18n._(/* i18n */ { id: 'Release Notes' }),
          click: () => {
            openExternal('https://github.com/Chia-Network/chia-blockchain/releases');
          },
        },
        {
          label: i18n._(/* i18n */ { id: 'Contribute on GitHub' }),
          click: () => {
            openExternal('https://github.com/Chia-Network/chia-blockchain/blob/main/CONTRIBUTING.md');
          },
        },
        {
          type: 'separator',
        },
        {
          label: i18n._(/* i18n */ { id: 'Report an Issue...' }),
          click: () => {
            openExternal('https://github.com/Chia-Network/chia-blockchain/issues');
          },
        },
        {
          label: i18n._(/* i18n */ { id: 'Chat on KeyBase' }),
          click: () => {
            openExternal('https://keybase.io/team/chia_network.public');
          },
        },
        {
          label: i18n._(/* i18n */ { id: 'Follow on Twitter' }),
          click: () => {
            openExternal('https://twitter.com/chia_project');
          },
        },
      ],
    },
  ];

  if (process.platform === 'darwin') {
    // Chia Blockchain menu (Mac)
    template.unshift({
      label: i18n._(/* i18n */ { id: 'Chia' }),
      submenu: [
        {
          label: i18n._(/* i18n */ { id: 'About Chia Blockchain' }),
          click: () => {
            openAbout();
          },
        },
        {
          type: 'separator',
        },
        {
          role: 'services',
        },
        {
          type: 'separator',
        },
        {
          role: 'hide',
        },
        {
          role: 'hideothers',
        },
        {
          role: 'unhide',
        },
        {
          type: 'separator',
        },
        {
          role: 'quit',
        },
      ],
    });

    // File menu (MacOS)
    template.splice(1, 1, {
      label: i18n._(/* i18n */ { id: 'File' }),
      submenu: [
        {
          role: 'close',
        },
      ],
    });

    // Edit menu (MacOS)
    template[2].submenu.push(
      {
        type: 'separator',
      },
      {
        label: i18n._(/* i18n */ { id: 'Speech' }),
        submenu: [
          {
            role: 'startspeaking',
          },
          {
            role: 'stopspeaking',
          },
        ],
      }
    );

    // Window menu (MacOS)
    template.splice(4, 1, {
      role: 'window',
      submenu: [
        {
          role: 'minimize',
        },
        {
          role: 'zoom',
        },
        {
          type: 'separator',
        },
        {
          role: 'front',
        },
      ],
    });
  }

  if (process.platform === 'linux' || process.platform === 'win32') {
    // Help menu (Windows, Linux)
    template[4].submenu.push(
      {
        type: 'separator',
      },
      {
        label: i18n._(/* i18n */ { id: 'About Chia Blockchain' }),
        click() {
          openAbout();
        },
      }
    );
  }

  return template;
}

/**
 * Open the given external protocol URL in the desktop’s default manner.
 */
function openExternal(urlLocal) {
  shell.openExternal(urlLocal);
}

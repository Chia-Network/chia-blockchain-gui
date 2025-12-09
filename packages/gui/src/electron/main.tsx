import {
  app,
  dialog,
  net,
  ipcMain,
  BrowserWindow,
  IncomingMessage,
  Menu,
  nativeImage,
  Notification,
  type MenuItemConstructorOptions,
  nativeTheme,
} from 'electron';
import fs from 'node:fs';
import path from 'node:path';
import url from 'node:url';

import windowStateKeeper from 'electron-window-state';
import { uniq } from 'lodash';
import sanitizeFilename from 'sanitize-filename';

// handle setupevents as quickly as possible
import '../config/env';

import packageJson from '../../package.json';
import AppIcon from '../assets/img/chia64x64.png';
import { i18n } from '../config/locales';

import CacheManager from './CacheManager';
import AddressBookAPI from './constants/AddressBookAPI';
import AllowedCommands from './constants/AllowedCommands';
import AppAPI from './constants/AppAPI';
import ChiaLogsAPI from './constants/ChiaLogsAPI';
import LinkAPI from './constants/LinkAPI';
import PreferencesAPI from './constants/PreferencesAPI';
import About from './dialogs/About/About';
import Confirm, { getTitle as getConfirmTitle } from './dialogs/Confirm/Confirm';
import KeyDetail from './dialogs/KeyDetail/KeyDetail';
import { readPrefs, savePrefs, migratePrefs } from './prefs';
import { readAddressBook, saveAddressBook } from './utils/addressBook';
import checkNFTOwnership from './utils/checkNFTOwnership';
import chiaEnvironment, { chiaInit } from './utils/chiaEnvironment';
import downloadFile from './utils/downloadFile';
import fetchJSON from './utils/fetchJSON';
import getKeyDetails from './utils/getKeyDetails';
import getNetworkInfo from './utils/getNetworkInfo';
import ipcMainHandle from './utils/ipcMainHandle';
import isValidURL from './utils/isValidURL';
import loadConfig, { checkConfigFileExists } from './utils/loadConfig';
import manageDaemonLifetime from './utils/manageDaemonLifetime';
import openExternal from './utils/openExternal';
import openReactDialog from './utils/openReactDialog';
import * as privatePreferences from './utils/privatePreferences';
import { setUserDataDir } from './utils/userData';
import webSocketBridgeBindEvents from './utils/webSocketBridge';

const isPlaywrightTesting = process.env.PLAYWRIGHT_TESTS === 'true';
const NET = 'mainnet';

app.disableHardwareAcceleration();
app.commandLine.appendSwitch('disable-http-cache');

const appIcon = nativeImage.createFromPath(path.join(__dirname, AppIcon));

const prefs = readPrefs();

const defaultCacheFolder = path.join(app.getPath('cache'), app.getName());
const cacheDirectory: string = prefs.cacheFolder || defaultCacheFolder;

const cacheManager = new CacheManager({
  cacheDirectory,
  maxCacheSize: prefs.maxCacheSize,
});

// IPC listeners
ipcMainHandle(PreferencesAPI.READ, () => readPrefs());
ipcMainHandle(PreferencesAPI.SAVE, (prefsObj) => savePrefs(prefsObj));
ipcMainHandle(PreferencesAPI.MIGRATE, (prefsObj) => migratePrefs(prefsObj));

ipcMainHandle(AddressBookAPI.SAVE, (addressBook) => saveAddressBook(addressBook));
ipcMainHandle(AddressBookAPI.READ, () => readAddressBook());

ipcMainHandle(LinkAPI.OPEN_EXTERNAL, (openUrl: string) => openExternal(openUrl));

ipcMainHandle(AppAPI.OPEN_KEY_DETAIL, async (fingerprint: string) => {
  await openKeyDetail(fingerprint);
});

ipcMainHandle(AppAPI.GET_CONFIG, async () => {
  const config = await loadConfig();
  if (!config) {
    return config;
  }

  return {
    url: config.url,
  };
});

ipcMainHandle(AppAPI.SHOW_NOTIFICATION, async (options: { title: string; body: string }) => {
  const { title, body } = options;

  new Notification({
    title,
    body,
  }).show();
});

// main window
let mainWindow: BrowserWindow | null = null;

let currentDownloadRequest: any;
let abortDownloadingFiles: boolean = false;

// When there is no config file, it is assumed to be the first run.
// At that time, the config file is created here by `chia init`.
if (!checkConfigFileExists()) {
  chiaInit();
}

// Set the userData directory to its location within CHIA_ROOT/gui
setUserDataDir();

const openedWindows = new Set<BrowserWindow>();

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
  let promptOnQuit = true;
  let mainWindowLaunchTasks: ((window: BrowserWindow) => void)[] = [];
  let networkPrefix: string | undefined;

  const createWindow = async () => {
    if (manageDaemonLifetime(NET)) {
      chiaEnvironment.startChiaDaemon();
    }

    ipcMainHandle(AppAPI.GET_TEMP_DIR, () => app.getPath('temp'));

    ipcMainHandle(AppAPI.GET_VERSION, () => app.getVersion());

    ipcMainHandle(AppAPI.SET_PROMPT_ON_QUIT, (modeBool: boolean) => {
      promptOnQuit = !!modeBool;
    });

    ipcMainHandle(AppAPI.QUIT_GUI, () => {
      promptOnQuit = false;
      app.quit();
    });

    ipcMainHandle(AppAPI.FETCH_TEXT_RESPONSE, async (urlLocal: string, data: string) => {
      if (!isValidURL(urlLocal)) {
        throw new Error('Invalid URL');
      }

      const request = net.request({
        method: 'POST',
        url: urlLocal,
        headers: { 'Content-Type': 'application/json' },
      });

      let statusCode: number | undefined;
      let statusMessage: string | undefined;

      const responseBody = await new Promise((resolve, reject) => {
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

        request.write(data);
        request.end();
      });

      return { statusCode, statusMessage, responseBody };
    });

    ipcMainHandle(AppAPI.FETCH_POOL_INFO, async (poolUrl: string) => {
      const poolInfoUrl = `${poolUrl}/pool_info`;
      return fetchJSON(poolInfoUrl);
    });

    ipcMainHandle(AppAPI.SHOW_OPEN_DIRECTORY_DIALOG, async (options: { defaultPath?: string } = {}) => {
      const { defaultPath } = options;

      const result = await dialog.showOpenDialog({
        properties: ['openDirectory', 'showHiddenFiles'],
        defaultPath,
      });

      if (result.canceled || !result.filePaths[0]) {
        return undefined;
      }

      return result.filePaths[0];
    });

    ipcMainHandle(AppAPI.SHOW_OPEN_FILE_DIALOG_AND_READ, async (options: { extensions?: string[] } = {}) => {
      const { extensions } = options;

      const result = await dialog.showOpenDialog({
        properties: ['openFile'],
        filters: extensions ? [{ name: 'Files', extensions }] : undefined,
      });

      if (result.canceled || !result.filePaths[0]) {
        return undefined;
      }

      const filePath = result.filePaths[0];
      const fileContent = await fs.promises.readFile(filePath);

      return {
        content: fileContent,
        filename: path.basename(filePath),
      };
    });

    ipcMainHandle(AppAPI.SHOW_SAVE_DIALOG_AND_SAVE, async (options: { content: string; defaultPath?: string }) => {
      const { content, defaultPath } = options;

      const result = await dialog.showSaveDialog({
        defaultPath,
      });

      if (!result.canceled && result.filePath) {
        await fs.promises.writeFile(result.filePath, content);
      }

      return { success: true };
    });

    ipcMainHandle(AppAPI.DOWNLOAD, async (urlLocal: string) => {
      if (!isValidURL(urlLocal)) {
        return;
      }

      if (!mainWindow) {
        console.error('mainWindow was not initialized');
        return;
      }

      mainWindow.webContents.downloadURL(urlLocal);
    });

    ipcMainHandle(AppAPI.START_MULTIPLE_DOWNLOAD, async (tasks: { url: string; filename: string }[]) => {
      const result = await dialog.showOpenDialog({
        properties: ['openDirectory'],
        defaultPath: app.getPath('downloads'),
      });

      if (result.canceled || !result.filePaths[0]) {
        return undefined;
      }

      const folder = result.filePaths[0];

      /* eslint no-await-in-loop: off -- we want to handle each file separately! */
      let totalDownloadedSize = 0;
      let successFileCount = 0;
      let errorFileCount = 0;

      const handleDownloadProgress = (progress: any, downloadUrl: string, index: number, total: number) => {
        mainWindow?.webContents.send(AppAPI.ON_MULTIPLE_DOWNLOAD_PROGRESS, {
          progress,
          url: downloadUrl,
          index,
          total,
        });
      };

      for (let i = 0; i < tasks.length; i++) {
        const { url: downloadUrl, filename } = tasks[i];

        try {
          if (!isValidURL(downloadUrl)) {
            throw new Error('Invalid URL');
          }

          const sanitizedFilename = sanitizeFilename(filename);
          if (sanitizedFilename !== filename) {
            throw new Error(
              `Filename ${filename} contains invalid characters. Filename sanitized to ${sanitizedFilename}`,
            );
          }

          const filePath = path.join(folder, sanitizedFilename);

          await downloadFile(downloadUrl, filePath, {
            onProgress: (progress) => handleDownloadProgress(progress, downloadUrl, i, tasks.length),
          });

          const fileStats = await fs.promises.stat(filePath);

          totalDownloadedSize += fileStats.size;
          successFileCount++;
        } catch (e: any) {
          if (e.message === 'download aborted' && abortDownloadingFiles) {
            break;
          }
          mainWindow?.webContents.send(AppAPI.ON_ERROR_DOWNLOADING_URL, downloadUrl);
          errorFileCount++;
        }
      }
      abortDownloadingFiles = false;
      mainWindow?.webContents.send(AppAPI.ON_MULTIPLE_DOWNLOAD_DONE, {
        totalDownloadedSize,
        successFileCount,
        errorFileCount,
      });
      return folder;
    });

    ipcMainHandle(AppAPI.ABORT_DOWNLOADING_FILES, async () => {
      abortDownloadingFiles = true;
      if (currentDownloadRequest) {
        currentDownloadRequest.abort();
      }
    });

    ipcMainHandle(AppAPI.CHECK_NFT_OWNERSHIP, async (nftId: string) => checkNFTOwnership(nftId));

    ipcMainHandle(AppAPI.GET_BYPASS_COMMANDS, async () => privatePreferences.get('bypassCommands', [] as string[]));

    ipcMainHandle(AppAPI.SET_BYPASS_COMMANDS, async (commands: string[]) => {
      const allowedDestinations = ['chia_wallet', 'chia_full_node', 'chia_farmer', 'chia_harvester', 'daemon'];

      // validate all commands
      const validCommands = commands.map((nsCommand) => {
        const parts = nsCommand.split('.');
        if (parts.length !== 2) {
          throw new Error(`Invalid command: ${nsCommand}`);
        }

        const [destination, command] = parts;
        if (!allowedDestinations.includes(destination)) {
          throw new Error(`Invalid destination: ${destination}`);
        }

        if (command === 'get_private_key') {
          throw new Error('Private key is not allowed to be sent to the renderer process');
        }

        if (!command.length) {
          throw new Error(`Invalid command: ${nsCommand}`);
        }

        return `${destination.trim()}.${command.trim()}`.toLowerCase();
      });

      const formattedCommands = validCommands.map((command) => `• ${command}`).join('\n');

      const savePreference = await dialog.showMessageBox({
        type: 'question',
        buttons: [i18n._(/* i18n */ { id: 'No' }), i18n._(/* i18n */ { id: 'Yes' })],
        title: i18n._(/* i18n */ { id: 'Save Command Preferences' }),
        message: i18n._(
          /* i18n */ {
            id: 'Would you like to save preferences for the following commands?',
          },
        ),
        detail: i18n._('These commands will be executed without confirmation in the future:\n\n {commands}', {
          commands: formattedCommands,
        }),
      });

      if (savePreference.response === 1) {
        privatePreferences.set('bypassCommands', uniq(validCommands));
      }
    });

    ipcMainHandle(AppAPI.PROCESS_LAUNCH_TASKS, async () => {
      const tasks = [...mainWindowLaunchTasks];

      mainWindowLaunchTasks = [];

      tasks.forEach((task) => task(mainWindow!));
    });

    ipcMainHandle(AppAPI.FOCUS_WINDOW, () => {
      if (mainWindow) {
        if (mainWindow.isMinimized()) {
          mainWindow.restore();
        }
        mainWindow.show();
        mainWindow.focus();
        // On Windows, focus() alone may not bring window to foreground due to OS restrictions.
        // Using setAlwaysOnTop temporarily ensures the window comes to front.
        if (process.platform === 'win32') {
          mainWindow.setAlwaysOnTop(true);
          mainWindow.setAlwaysOnTop(false);
        }
      }
    });

    decidedToClose = false;
    const mainWindowState = windowStateKeeper({
      defaultWidth: 1200,
      defaultHeight: 1200,
    });

    await cacheManager.init();

    const isDarkMode = prefs.darkMode ?? nativeTheme.shouldUseDarkColors;

    const initialBgColor = isDarkMode ? '#0f252a' : '#ffffff';

    mainWindow = new BrowserWindow({
      x: mainWindowState.x,
      y: mainWindowState.y,
      width: mainWindowState.width,
      height: mainWindowState.height,
      minWidth: 500,
      minHeight: 500,
      backgroundColor: initialBgColor,
      show: isPlaywrightTesting,
      webPreferences: {
        preload: path.join(__dirname, 'preload.js'),
        nodeIntegration: false,
        nodeIntegrationInWorker: false,
        nodeIntegrationInSubFrames: false,
        contextIsolation: true,
        sandbox: true,
        webSecurity: true,
        experimentalFeatures: false,
        plugins: false,
        spellcheck: false,
        webviewTag: false,
      },
    });

    // allow the cache manager to handle the cache protocol
    cacheManager.prepareProtocol(mainWindow.webContents.session.protocol);

    function setNetworkPrefix(newNetworkPrefix: string) {
      networkPrefix = newNetworkPrefix;

      const isTestnet = networkPrefix === 'txch';
      const title = isTestnet ? 'Chia Blockchain (Testnet)' : 'Chia Blockchain';

      if (mainWindow && mainWindow.title !== title) {
        mainWindow.setTitle(title);
      }
    }

    webSocketBridgeBindEvents(mainWindow.webContents, {
      onReceive: async (_id: string, data: any) => {
        try {
          if (networkPrefix) {
            return;
          }

          const parsedData = JSON.parse(data.toString());

          if (
            parsedData.command === 'ping' &&
            parsedData.origin === 'chia_wallet' &&
            parsedData.destination === 'wallet_ui' &&
            parsedData.data?.success === true
          ) {
            const networkInfo = await getNetworkInfo();
            if (networkInfo.networkPrefix) {
              setNetworkPrefix(networkInfo.networkPrefix);
            }
          }
        } catch (error) {
          console.error(error);
        }
      },
      onSend: async (_id: string, data: string) => {
        if (!mainWindow) {
          throw new Error('`mainWindow` is empty');
        }

        const parsedData = JSON.parse(data);
        const command = parsedData.command.trim().toLowerCase();
        const destination = parsedData.destination.trim().toLowerCase();

        const nsCommand = `${destination}.${command}`;

        if (['chia_wallet.get_private_key'].includes(nsCommand)) {
          throw new Error('Private key is not allowed to be sent to the renderer process');
        }

        if (!AllowedCommands.includes(nsCommand)) {
          const bypassCommands = privatePreferences.get('bypassCommands', [] as string[]);
          if (bypassCommands.includes(nsCommand)) {
            return;
          }

          const result = await openReactDialog(
            mainWindow,
            Confirm,
            {
              networkPrefix,
              command: nsCommand,
              data: parsedData.data,
            },
            {
              title: getConfirmTitle(nsCommand),
              width: 600,
              height: 500,
            },
          );

          if (result !== true) {
            throw new Error('Operation cancelled by user');
          }
        }
      },
    });

    cacheManager.bindEvents(mainWindow);

    mainWindowState.manage(mainWindow);

    if (process.platform === 'linux') {
      mainWindow.setIcon(appIcon);
    }

    mainWindow.once('ready-to-show', () => {
      if (!mainWindow) {
        throw new Error('`mainWindow` is empty');
      }

      mainWindow.show();
    });

    // don't show remote daeomn detials in the title bar
    if (!manageDaemonLifetime(NET)) {
      mainWindow.webContents.on('did-finish-load', async () => {
        const { url: urlLocal } = await loadConfig();
        if (mainWindow) {
          mainWindow.setTitle(`${app.getName()} [${urlLocal}]`);
        }
      });
    }
    // Uncomment this to open devtools by default
    // if (!guessPackaged()) {
    //   mainWindow.webContents.openDevTools();
    // }
    mainWindow.on('close', async (e) => {
      // if the daemon isn't local we aren't going to try to start/stop it
      if (decidedToClose || !manageDaemonLifetime(NET)) {
        return;
      }
      if (!mainWindow) {
        throw new Error('`mainWindow` is empty');
      }
      e.preventDefault();

      if (!isClosing) {
        isClosing = true;
        let keepBackgroundRunning: boolean | undefined;
        const p = readPrefs();
        if (typeof p.keepBackgroundRunning === 'boolean') {
          keepBackgroundRunning = p.keepBackgroundRunning;
        }

        if (promptOnQuit) {
          const choice = await dialog.showMessageBox({
            type: 'question',
            buttons: [i18n._(/* i18n */ { id: 'No' }), i18n._(/* i18n */ { id: 'Yes' })],
            title: i18n._(/* i18n */ { id: 'Confirm' }),
            message: i18n._(
              /* i18n */ {
                id: 'Are you sure you want to quit?',
              },
            ),
            checkboxChecked: keepBackgroundRunning ?? false,
            checkboxLabel: i18n._(/* i18n */ { id: 'Keep service running in the background' }),
          });
          if (keepBackgroundRunning !== choice.checkboxChecked) {
            savePrefs({ ...p, keepBackgroundRunning: choice.checkboxChecked });
          }
          if (choice.response === 0) {
            isClosing = false;
            return;
          }
          keepBackgroundRunning = choice.checkboxChecked;
        }
        isClosing = false;
        decidedToClose = true;

        // save the window state and unmange so we don't restore the mini exiting state
        mainWindowState.saveState(mainWindow);
        mainWindowState.unmanage();

        if (keepBackgroundRunning) {
          mainWindow.close();
          openedWindows.forEach((win) => win.close());
          return;
        }

        mainWindow.webContents.send(AppAPI.ON_EXIT_DAEMON);
        mainWindow.setBounds({ height: 500, width: 500 });
        mainWindow.center();

        ipcMain.handle(AppAPI.DAEMON_EXITED, async () => {
          mainWindow?.close();

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
  };

  const appReady = async () => {
    createWindow();
    app.applicationMenu = createMenu();
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
      return;
    }

    mainWindow?.webContents.send('open-file', pathLocal);
  });

  app.on('open-url', (event, urlLocal) => {
    event.preventDefault();

    // App may have been launched with a URL to open. Make sure we have a
    // main window before trying to open a URL.
    if (!mainWindow) {
      mainWindowLaunchTasks.push((window: BrowserWindow) => {
        window.webContents.send('open-url', urlLocal);
      });
      return;
    }

    mainWindow?.webContents.send('open-url', urlLocal);
  });

  ipcMainHandle(AppAPI.SET_LOCALE, (locale: string) => {
    if (locale.length > 5) {
      throw new Error('Locale is not valid');
    }

    i18n.activate(locale);
    app.applicationMenu = createMenu();
  });

  ipcMainHandle(ChiaLogsAPI.SET_PATH, async () => {
    let logPath: string | undefined;

    try {
      const result = await dialog.showOpenDialog({
        properties: ['openFile'],
      });

      if (result.canceled || !result.filePaths[0]) {
        return { success: false };
      }

      const filePath = result.filePaths[0];

      logPath = filePath;

      // Check file exists
      await fs.promises.access(logPath, fs.constants.F_OK);
      // Check file is readable
      await fs.promises.access(logPath, fs.constants.R_OK);

      const currentPrefs = readPrefs();

      await savePrefs({
        ...currentPrefs,
        customLogPath: logPath,
      });

      return { success: true };
    } catch (error: any) {
      if (error.code === 'ENOENT') {
        throw new Error(`Log file not found at: ${logPath}\nPlease verify the path and try again.`);
      }
      if (error.code === 'EACCES') {
        throw new Error(`Cannot read log file at: ${logPath}\nPlease check file permissions and try again.`);
      }
      throw new Error(`Cannot access log file: ${error.message}`);
    }
  });

  ipcMainHandle(ChiaLogsAPI.GET_CONTENT, async () => {
    try {
      const currentPrefs = readPrefs();

      const logPath =
        currentPrefs.customLogPath ||
        path.join(process.env.CHIA_ROOT || path.join(app.getPath('home'), '.chia', 'mainnet'), 'log', 'debug.log');

      // Check if file exists and is readable
      try {
        await fs.promises.access(logPath, fs.constants.R_OK);
      } catch (e) {
        return { error: 'Log file not accessible' };
      }

      // Show confirmation dialog before reading logs
      const { response } = await dialog.showMessageBox({
        type: 'warning',
        buttons: [i18n._(/* i18n */ { id: 'Cancel' }), i18n._(/* i18n */ { id: 'Continue' })],
        defaultId: 0,
        title: i18n._(/* i18n */ { id: 'Warning' }),
        message: i18n._(/* i18n */ { id: 'Log files may contain sensitive information' }),
        detail: i18n._(/* i18n */ { id: 'Are you sure you want to view the log contents?' }),
      });

      if (response === 0) {
        return { error: 'Operation cancelled by user' };
      }

      const content = await fs.promises.readFile(logPath, 'utf8');
      const stats = await fs.promises.stat(logPath);

      return {
        content,
        path: logPath,
        size: stats.size,
      };
    } catch (error: any) {
      return { error: error.message };
    }
  });

  ipcMainHandle(ChiaLogsAPI.GET_INFO, async () => {
    try {
      const chiaRoot = process.env.CHIA_ROOT || path.join(app.getPath('home'), '.chia', 'mainnet');
      const defaultLogPath = path.join(chiaRoot, 'log', 'debug.log');
      const currentPrefs = readPrefs();
      const logPath = currentPrefs.customLogPath || defaultLogPath;

      const info = {
        path: logPath,
        exists: false,
        size: 0,
        readable: false,
        defaultPath: defaultLogPath,
        debugInfo: {
          chiaRoot,
          logDir: path.join(chiaRoot, 'log'),
          rootExists: false,
          logDirExists: false,
          fileReadable: false,
        },
      };

      try {
        const stats = await fs.promises.stat(logPath);
        info.exists = true;
        info.size = stats.size;
        await fs.promises.access(logPath, fs.constants.R_OK);
        info.readable = true;
        info.debugInfo.fileReadable = true;
      } catch (e) {
        // File doesn't exist or isn't readable
      }

      try {
        await fs.promises.access(chiaRoot);
        info.debugInfo.rootExists = true;
      } catch (e) {
        // Root directory doesn't exist
      }

      try {
        await fs.promises.access(info.debugInfo.logDir);
        info.debugInfo.logDirExists = true;
      } catch (e) {
        // Log directory doesn't exist
      }

      return info;
    } catch (error: any) {
      return { error: error.message };
    }
  });
}

async function openKeyDetail(fingerprint: string) {
  if (!mainWindow) {
    throw new Error('`mainWindow` is empty');
  }

  const keyData = await getKeyDetails(fingerprint);

  await openReactDialog(
    mainWindow,
    KeyDetail,
    { data: keyData },
    {
      title: 'Key Details',
      width: 500,
      height: 590,
    },
  );
}

async function openAbout() {
  if (!mainWindow) {
    throw new Error('`mainWindow` is empty');
  }

  await openReactDialog(
    mainWindow,
    About,
    {
      packageJson,
      versions: process.versions as Record<string, string>,
      version: app.getVersion(),
    },
    {
      title: 'About',
      width: 400,
      height: 460,
      hideOnBlur: true,
      hideMenu: true,
      titleBarStyle: 'hiddenInset',
    },
  );
}

function getMenuTemplate() {
  const template: MenuItemConstructorOptions[] = [
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
          role: 'selectAll',
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
          role: 'forceReload',
        },
        {
          label: i18n._(/* i18n */ { id: 'Developer' }),
          submenu: [
            {
              label: i18n._(/* i18n */ { id: 'Developer Tools' }),
              accelerator: process.platform === 'darwin' ? 'Alt+Command+I' : 'Ctrl+Shift+I',
              click: () => mainWindow?.webContents.toggleDevTools(),
            },
            {
              type: 'separator',
            },
            {
              label: i18n._(/* i18n */ { id: 'Trigger Desktop Notification' }),
              click: () => {
                mainWindow?.webContents.send('debug_triggerDesktopNotification', {});
              },
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
          role: 'resetZoom',
        },
        {
          role: 'zoomIn',
        },
        {
          role: 'zoomOut',
        },
        {
          type: 'separator',
        },
        {
          label: i18n._(/* i18n */ { id: 'Full Screen' }),
          accelerator: process.platform === 'darwin' ? 'Ctrl+Command+F' : 'F11',
          click: () => mainWindow?.setFullScreen(!mainWindow.isFullScreen()),
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
          label: i18n._(/* i18n */ { id: 'Chat on Discord' }),
          click: () => {
            openExternal('https://discord.gg/chia');
          },
        },
        {
          label: i18n._(/* i18n */ { id: 'Follow on X' }),
          click: () => {
            openExternal('https://x.com/chia_project');
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
          label: i18n._(/* i18n */ { id: 'Check for Updates...' }),
          click: () => {
            mainWindow?.webContents.send(AppAPI.ON_CHECK_FOR_UPDATES);
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
          role: 'hideOthers',
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
    if (template[2].submenu && Array.isArray(template[2].submenu)) {
      (template[2].submenu as MenuItemConstructorOptions[]).push(
        {
          type: 'separator',
        },
        {
          label: i18n._(/* i18n */ { id: 'Speech' }),
          submenu: [
            {
              role: 'startSpeaking',
            },
            {
              role: 'stopSpeaking',
            },
          ],
        },
      );
    }

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
    if (template[4].submenu && Array.isArray(template[4].submenu)) {
      (template[4].submenu as MenuItemConstructorOptions[]).push(
        {
          type: 'separator',
        },
        {
          label: i18n._(/* i18n */ { id: 'About Chia Blockchain' }),
          click() {
            openAbout();
          },
        },
        {
          label: i18n._(/* i18n */ { id: 'Check for updates...' }),
          click: () => {
            mainWindow?.webContents.send(AppAPI.ON_CHECK_FOR_UPDATES);
          },
        },
      );
    }
  }

  return template;
}

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
import JSONbig from 'json-bigint';
import { uniq } from 'lodash';
import sanitizeFilename from 'sanitize-filename';

// handle setupevents as quickly as possible
import '../config/env';

import packageJson from '../../package.json';
import type { PermissionsNotificationPayload } from '../@types/PermissionsService';
import { WcError, WcErrorCode, encodeWcErrorForIpc } from '../@types/WcError';
import AppIcon from '../assets/img/chia64x64.png';
import { i18n } from '../config/locales';

import CacheManager from './CacheManager';
import { checkNFTOwnership } from './api/checkNFTOwnership';
import { getKeyDetails } from './api/getKeyDetails';
import { getNetworkInfo } from './api/getNetworkInfo';
import { isMainnet } from './api/isMainnet';
import { sendCommand } from './api/sendCommand';
import { DappCommands } from './commands/DappCommands';
import { filterRequestedDappCommands } from './commands/filterRequestedDappCommands';
import { getDappCommandMetadata } from './commands/getDappCommandMetadata';
import { humanizeCommand } from './commands/humanizeCommand';
import { humanizeDappCommand } from './commands/humanizeDappCommand';
import { isAllowedCommand } from './commands/isAllowedCommand';
import { parseCommandDisplay } from './commands/parseCommandDisplay';
import { parseCommandId } from './commands/parseCommandId';
import { parseDappParams } from './commands/parseDappParams';
import AddressBookAPI from './constants/AddressBookAPI';
import AppAPI from './constants/AppAPI';
import ChiaLogsAPI from './constants/ChiaLogsAPI';
import LinkAPI from './constants/LinkAPI';
import PermissionsAPI from './constants/PermissionsAPI';
import PreferencesAPI from './constants/PreferencesAPI';
import About from './dialogs/About/About';
import Confirm, { type ConfirmProps } from './dialogs/Confirm/Confirm';
import KeyDetail from './dialogs/KeyDetail/KeyDetail';
import { migratePrefs, readPrefs, sanitizeRendererPrefs, savePrefs } from './prefs';
import { readAddressBook, saveAddressBook } from './utils/addressBook';
import chiaEnvironment, { chiaInit } from './utils/chiaEnvironment';
import { dispatchPairRequest } from './utils/dispatchPairRequest';
import downloadFile from './utils/downloadFile';
import fetchJSON from './utils/fetchJSON';
import ipcMainHandle from './utils/ipcMainHandle';
import isValidURL from './utils/isValidURL';
import { loadConfig, checkConfigFileExists } from './utils/loadConfig';
import { getDefaultLogPath, LogPathValidationError, resolveTrustedLogPath } from './utils/logPath';
import manageDaemonLifetime from './utils/manageDaemonLifetime';
import openExternal from './utils/openExternal';
import { openPairDialog } from './utils/openPairDialog';
import openReactDialog from './utils/openReactDialog';
import { toPairPublicRecord, type PairMetadata, type PairRecord } from './utils/pairSchemas';
import {
  findPair,
  getPairs,
  removePair,
  resetBypass,
  resetBypassAll,
  addPair,
  updatePair,
  addBypassCommand,
} from './utils/pairStore';
import * as privatePreferences from './utils/privatePreferences';
import toCamelCase from './utils/toCamelCase';
import { setUserDataDir } from './utils/userData';
import webSocketBridgeBindEvents from './utils/webSocketBridge';

const isPlaywrightTesting = process.env.PLAYWRIGHT_TESTS === 'true';
const NET = 'mainnet';

type ConfirmDialogResult = {
  isAllowed: boolean;
  rememberBypass: boolean;
};

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

// Hoisted so IPC handlers registered below can close over them; assigned in
// `createWindow` once Electron is ready.
let mainWindow: BrowserWindow | null = null;
let networkPrefix: string | undefined;
let currentDownloadRequest: any;
let abortDownloadingFiles: boolean = false;

function sendRendererNotification(notification: PermissionsNotificationPayload) {
  if (!mainWindow || mainWindow.isDestroyed() || mainWindow.webContents.isDestroyed()) {
    throw new Error('No renderer window available for notification');
  }

  mainWindow.webContents.send(PermissionsAPI.SUBSCRIBE_FOR_NOTIFICATIONS, notification);
}

// IPC listeners
ipcMainHandle(PreferencesAPI.READ, () => readPrefs());
ipcMainHandle(PreferencesAPI.SAVE, (prefsObj) => savePrefs(sanitizeRendererPrefs(prefsObj)));
ipcMainHandle(PreferencesAPI.MIGRATE, (prefsObj) => migratePrefs(sanitizeRendererPrefs(prefsObj)));

ipcMainHandle(AddressBookAPI.SAVE, (addressBook) => saveAddressBook(addressBook));
ipcMainHandle(AddressBookAPI.READ, () => readAddressBook());

ipcMainHandle(LinkAPI.OPEN_EXTERNAL, (openUrl: string) => openExternal(openUrl));

ipcMainHandle(AppAPI.OPEN_KEY_DETAIL, async (fingerprint: number) => {
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

ipcMainHandle(PermissionsAPI.FIND_PAIR, (topic: string) => {
  const pair = findPair(topic);
  return pair ? toPairPublicRecord(pair) : undefined;
});

ipcMainHandle(PermissionsAPI.GET_PAIRS, () => getPairs().map(toPairPublicRecord));

ipcMainHandle(
  PermissionsAPI.REGISTER_PAIR,
  async (payload: { topic: string; mainnet: boolean; metadata: PairMetadata; commands: string[] }) => {
    const { topic, mainnet, metadata, commands = [] } = payload;
    if (!mainWindow) {
      throw new Error('mainWindow is empty');
    }

    if (!topic) {
      throw new Error('topic is required');
    }

    if (typeof mainnet !== 'boolean') {
      throw new Error('mainnet flag is required');
    }

    if (!commands || commands.length === 0) {
      throw new Error('commands are required');
    }

    if (!metadata) {
      throw new Error('metadata are required');
    }

    const isMainnetValue = await isMainnet();

    // if renderer and daemon are not on the same network, throw an error
    if (isMainnetValue !== mainnet) {
      throw new Error('Mainnet flag does not match network prefix');
    }

    // filter out unsupported dapp commands (commands that are not in the commands list) from the list of requested commands
    const { allowed } = filterRequestedDappCommands(commands);
    if (!allowed.length) {
      throw new Error('No allowed commands');
    }

    const decision = await openPairDialog(mainWindow, metadata, commands);
    if (!decision) {
      return null;
    }

    const { bypass, fingerprint } = decision;
    if (!fingerprint) {
      throw new Error('fingerprint is required');
    }

    const pair = addPair({
      topic,
      mainnet,
      metadata,
      commands: allowed,
      fingerprint,
      bypass,
    });

    return toPairPublicRecord(pair);
  },
);

ipcMainHandle(PermissionsAPI.EDIT_PAIR, async (topic: string) => {
  if (!mainWindow) {
    throw new Error('mainWindow is empty');
  }

  const pair = findPair(topic);
  if (!pair) {
    return null;
  }

  const result = await openPairDialog(mainWindow, pair.metadata, pair.commands, pair);
  if (!result) {
    return toPairPublicRecord(pair);
  }

  const { bypass } = result;

  const updatedPair: Partial<PairRecord> = {
    bypass,
  };

  return toPairPublicRecord(updatePair(topic, updatedPair));
});

ipcMainHandle(PermissionsAPI.REVOKE_PAIR, (topic: string) => {
  removePair(topic);
});

ipcMainHandle(PermissionsAPI.RESET_PAIR_BYPASS, (topic: string) => {
  resetBypass(topic);
});

ipcMainHandle(PermissionsAPI.RESET_ALL_PAIR_BYPASSES, () => {
  resetBypassAll();
});

ipcMainHandle(PermissionsAPI.GET_COMMAND_METADATA, (command: string) => getDappCommandMetadata(command));

ipcMainHandle(
  PermissionsAPI.DISPATCH_AS_PAIR,
  async (payload: {
    topic: string;
    command: string;
    params: string; // serialized params because of bigints
  }) => {
    const { topic, command, params } = payload;

    try {
      if (!mainWindow) {
        throw new WcError('mainWindow is empty', WcErrorCode.INTERNAL_ERROR);
      }

      const dappCommandSchema = DappCommands.get(command);
      if (!dappCommandSchema) {
        throw new WcError(`Unknown wc command: ${command}`, WcErrorCode.METHOD_NOT_FOUND);
      }

      const { commandId } = dappCommandSchema;
      const parsedParams = parseDappParams(command, params);

      // verify all permissions and execute command after user confirmation
      const result = await dispatchPairRequest(
        topic,
        command,
        parsedParams,
        // process the command
        async (context) => {
          const { destination, command: chiaCommand } = parseCommandId(commandId);

          const response = dappCommandSchema.handler
            ? await dappCommandSchema.handler(parsedParams, {
                ...context,
                sendNotification: sendRendererNotification,
                canBypassCommand: (requestedCommand) =>
                  DappCommands.get(requestedCommand)?.allowConfirmationBypass === true,
              })
            : await sendCommand(chiaCommand, destination, parsedParams);

          const transformedResponse = dappCommandSchema.transform ? dappCommandSchema.transform(response) : response;

          // dapp is sending back camelCase response
          const camelCaseResponse = toCamelCase(transformedResponse as Record<string, unknown>, {
            deep: !dappCommandSchema.preserveNestedDataKeys,
          });

          return dappCommandSchema.handler ? camelCaseResponse : { data: camelCaseResponse };
        },
        // show the confirm dialog to the user
        async () => {
          // humanize all data from command
          const { title, message, confirmLabel, destructive, rows } = await humanizeDappCommand(
            command,
            parsedParams,
            networkPrefix,
          );

          const pair = findPair(topic);
          if (!pair) {
            throw new WcError(`Pair not found`, WcErrorCode.USER_REJECTED);
          }

          if (!mainWindow) {
            throw new WcError('mainWindow is empty', WcErrorCode.INTERNAL_ERROR);
          }

          const display = await parseCommandDisplay(commandId, parsedParams);

          const confirmResult = await openReactDialog<ConfirmDialogResult, ConfirmProps>(
            mainWindow,
            Confirm,
            {
              networkPrefix,
              command: commandId,
              data: parsedParams,
              title,
              message,
              confirmLabel,
              destructive,
              rows,
              pair,
              display,
              showBypassToggle: dappCommandSchema.allowConfirmationBypass === true,
            },
            {
              title,
              width: 640,
              height: 600,
            },
          );

          if (confirmResult && confirmResult.isAllowed === true) {
            if (confirmResult.rememberBypass && dappCommandSchema.allowConfirmationBypass === true) {
              addBypassCommand(topic, command);
            }

            return true;
          }

          throw new WcError('Operation cancelled by user', WcErrorCode.USER_REJECTED);
        },
      );

      return JSONbig.stringify(result);
    } catch (e) {
      // Electron IPC strips custom Error properties (`code`). Re-throw with
      // the code encoded into the message; renderer decodes via decodeWcErrorFromIpc.
      throw new Error(encodeWcErrorForIpc(e));
    }
  },
);

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

          response.on('error', (e: Error | string) => {
            reject(new Error(typeof e === 'string' ? e : e.message));
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
        // On macOS, app.focus() brings the entire application to the foreground
        if (process.platform === 'darwin') {
          app.focus({ steal: true });
        }
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

          const parsedData = JSONbig.parse(data.toString());

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

        const parsedData = JSONbig.parse(data);

        const command = parsedData.command.trim().toLowerCase();
        const destination = parsedData.destination.trim().toLowerCase();

        const commandId = `${destination}.${command}`;

        // if renderer is trying to get the private key
        if (['chia_wallet.get_private_key'].includes(commandId)) {
          throw new Error('Private key is not allowed to be sent to the renderer process');
        }

        // if commands is allowed to run without confirmation
        if (isAllowedCommand(commandId)) {
          return;
        }

        // if user put the command in the bypass commands
        const bypassCommands = privatePreferences.get<string[]>('bypassCommands', []);
        if (bypassCommands.includes(commandId)) {
          return;
        }

        const commandData = (parsedData.data ?? {}) as Record<string, unknown>;

        // humanize all data from command
        const { title, message, confirmLabel, destructive, rows } = await humanizeCommand(
          commandId,
          commandData,
          networkPrefix,
        );

        const display = await parseCommandDisplay(commandId, commandData);

        const confirmResult = await openReactDialog<ConfirmDialogResult, ConfirmProps>(
          mainWindow,
          Confirm,
          {
            networkPrefix,
            command: commandId,
            data: commandData,
            title,
            message,
            confirmLabel,
            destructive,
            rows,
            display,
          },
          {
            title,
            width: 640,
            height: 600,
          },
        );

        if (confirmResult && confirmResult.isAllowed === true) {
          return;
        }

        throw new Error('Operation cancelled by user');
      },
    });

    cacheManager.bindEvents(mainWindow);

    mainWindowState.manage(mainWindow);

    if (process.platform === 'linux') {
      mainWindow.setIcon(appIcon);
    }

    // Reveal the window. `ready-to-show` is the preferred fast path, but on some
    // compositors (notably Wayland/mutter) that event can fail to fire, which
    // would otherwise leave the window hidden forever even though the page has
    // loaded. Guard the show in a once-only helper and back it with
    // `did-finish-load` and a timeout fallback so the window is always revealed.
    let hasShownMainWindow = false;
    const showMainWindow = () => {
      // `mainWindow` is never reset to null on close, so a destroyed window is
      // still a truthy reference; guard with `isDestroyed()` to avoid throwing
      // if a trigger fires after the window is gone. Latch the flag only after a
      // successful `show()` so a failed attempt doesn't block the other triggers.
      if (hasShownMainWindow || !mainWindow || mainWindow.isDestroyed()) {
        return;
      }
      mainWindow.show();
      hasShownMainWindow = true;
    };

    mainWindow.once('ready-to-show', showMainWindow);
    mainWindow.webContents.once('did-finish-load', showMainWindow);
    setTimeout(showMainWindow, 5000);

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

      // Validate and canonicalize the user-selected file (rejects symlinks /
      // non-files) and store the resolved path so it matches the validation
      // performed later in GET_CONTENT / GET_INFO.
      const resolvedPath = await resolveTrustedLogPath(logPath);

      const currentPrefs = readPrefs();

      await savePrefs({
        ...currentPrefs,
        customLogPath: resolvedPath,
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
      const requestedPath = currentPrefs.customLogPath || getDefaultLogPath();

      // Resolve and validate the path (rejects symlinks / non-files) before it
      // is read. `resolvedPath` is the canonical absolute path that will be
      // shown to the user, so the file being read is never hidden.
      let resolvedPath: string;
      try {
        resolvedPath = await resolveTrustedLogPath(requestedPath);
      } catch (e) {
        if (e instanceof LogPathValidationError) {
          return { error: e.message };
        }
        return { error: 'Log file not accessible' };
      }

      // Show confirmation dialog before reading logs, including the exact path
      // so the user can see precisely which file will be read (anti-phishing).
      const { response } = await dialog.showMessageBox({
        type: 'warning',
        buttons: [i18n._(/* i18n */ { id: 'Cancel' }), i18n._(/* i18n */ { id: 'Continue' })],
        defaultId: 0,
        title: i18n._(/* i18n */ { id: 'Warning' }),
        message: i18n._(/* i18n */ { id: 'Log files may contain sensitive information' }),
        detail: `${i18n._(/* i18n */ { id: 'Are you sure you want to view the log contents?' })}\n\n${resolvedPath}`,
      });

      if (response === 0) {
        return { error: 'Operation cancelled by user' };
      }

      const content = await fs.promises.readFile(resolvedPath, 'utf8');
      const stats = await fs.promises.stat(resolvedPath);

      return {
        content,
        path: resolvedPath,
        size: stats.size,
      };
    } catch (error: any) {
      return { error: error.message };
    }
  });

  ipcMainHandle(ChiaLogsAPI.GET_INFO, async () => {
    try {
      const chiaRoot = process.env.CHIA_ROOT || path.join(app.getPath('home'), '.chia', 'mainnet');
      const defaultLogPath = getDefaultLogPath();
      const currentPrefs = readPrefs();
      const requestedPath = currentPrefs.customLogPath || defaultLogPath;

      const info = {
        path: requestedPath,
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

      // Only report metadata for a path that passes the same validation used by
      // GET_CONTENT (rejects symlinks / non-files), preventing stealthy
      // filesystem reconnaissance through a tampered or redirected path.
      try {
        const resolvedPath = await resolveTrustedLogPath(requestedPath);
        const stats = await fs.promises.stat(resolvedPath);
        info.path = resolvedPath;
        info.exists = true;
        info.size = stats.size;
        info.readable = true;
        info.debugInfo.fileReadable = true;
      } catch (e) {
        // File doesn't exist, isn't readable, or failed validation
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

async function openKeyDetail(fingerprint: number) {
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

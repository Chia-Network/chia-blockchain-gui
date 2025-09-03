import API from './API';

enum AppAPI {
  SET_LOCALE = `${API.APP}:setLocale`,
  GET_CONFIG = `${API.APP}:getConfig`,
  GET_TEMP_DIR = `${API.APP}:getTempDir`,
  GET_VERSION = `${API.APP}:getVersion`,
  SET_PROMPT_ON_QUIT = `${API.APP}:setPromptOnQuit`,
  QUIT_GUI = `${API.APP}:quitGUI`,
  SHOW_NOTIFICATION = `${API.APP}:showNotification`,

  OPEN_KEY_DETAIL = `${API.APP}:openKeyDetail`,

  DOWNLOAD = `${API.APP}:download`,
  SELECT_MULTIPLE_DOWNLOAD_FOLDER = `${API.APP}:selectMultipleDownloadFolder`,
  ABORT_DOWNLOADING_FILES = `${API.APP}:abortDownloadingFiles`,
  PROCESS_LAUNCH_TASKS = `${API.APP}:processLaunchTasks`,

  SET_BYPASS_COMMANDS = `${API.APP}:setBypassCommands`,
  GET_BYPASS_COMMANDS = `${API.APP}:getBypassCommands`,

  SHOW_OPEN_DIRECTORY_DIALOG = `${API.APP}:showOpenDirectoryDialog`,
  SHOW_OPEN_FILE_DIALOG_AND_READ = `${API.APP}:showOpenFileDialogAndRead`,
  SHOW_SAVE_DIALOG_AND_SAVE = `${API.APP}:showSaveDialogAndSave`,

  FETCH_TEXT_RESPONSE = `${API.APP}:fetchTextResponse`,
  FETCH_POOL_INFO = `${API.APP}:fetchPoolInfo`,
  START_MULTIPLE_DOWNLOAD = `${API.APP}:startMultipleDownload`,

  DAEMON_EXITED = `${API.APP}:daemonExited`,

  ON_CHECK_FOR_UPDATES = `${API.APP}:onCheckForUpdates`,
  ON_EXIT_DAEMON = `${API.APP}:onExitDaemon`,

  ON_MULTIPLE_DOWNLOAD_PROGRESS = `${API.APP}:onMultipleDownloadProgress`,
  ON_ERROR_DOWNLOADING_URL = `${API.APP}:onErrorDownloadingUrl`,
  ON_MULTIPLE_DOWNLOAD_DONE = `${API.APP}:onMultipleDownloadDone`,
}

export default AppAPI;

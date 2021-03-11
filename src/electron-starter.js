//handle setupevents as quickly as possible
const setupEvents = require("./setupEvents");

if (!setupEvents.handleSquirrelEvent()) {
  // squirrel event handled and app will exit in 1000ms, so don't do anything else
  const {
    app,
    dialog,
    shell,
    ipcMain,
    BrowserWindow,
    Menu
  } = require("electron");
  const openAboutWindow = require("about-window").default;
  const path = require("path");
  const dev_config = require("./dev_config");
  const chiaEnvironment = require("./util/chiaEnvironment");
  const chiaConfig = require("./util/config");
  const local_test =  require("./config/config").local_test;
  const url = require("url");
  const os = require("os");
  const i18n = require("./config/locales");

  const ensureSingleInstance = () => {
    const gotTheLock = app.requestSingleInstanceLock();

    if (!gotTheLock) {
      app.quit();
    } else {
      app.on('second-instance', (event, commandLine, workingDirectory) => {
        // Someone tried to run a second instance, we should focus our window.
        if (mainWindow) {
          if (mainWindow.isMinimized()) {
            mainWindow.restore();
          }
          mainWindow.focus();
        }
      });
    }
  };

  ensureSingleInstance();

  // this needs to happen early in startup so all processes share the same global config
  chiaConfig.loadConfig(chiaEnvironment.getChiaVersion());
  global.sharedObj = { local_test: local_test };

  const exitPyProc = e => {};

  app.on("will-quit", exitPyProc);

  /*************************************************************
   * window management
   *************************************************************/

  let mainWindow = null;
  let decidedToClose = false;
  let isClosing = false;

  const createWindow = () => {
    decidedToClose = false;
    mainWindow = new BrowserWindow({
      width: 1200,
      height: 1200,
      minWidth: 500,
      minHeight: 500,
      backgroundColor: "#ffffff",
      show: false,
      webPreferences: {
        preload: __dirname + "/preload.js",
        nodeIntegration: true,
        enableRemoteModule: true
      }
    });

    if (dev_config.redux_tool) {
      BrowserWindow.addDevToolsExtension(
        path.join(os.homedir(), dev_config.redux_tool)
      );
    }

    if (dev_config.react_tool) {
      BrowserWindow.addDevToolsExtension(
        path.join(os.homedir(), dev_config.react_tool)
      );
    }

    var startUrl =
      process.env.ELECTRON_START_URL ||
      url.format({
        pathname: path.join(__dirname, "/../build/index.html"),
        protocol: "file:",
        slashes: true
      });

    mainWindow.loadURL(startUrl);

    mainWindow.once("ready-to-show", function() {
      mainWindow.show();
    });

    // don't show remote daeomn detials in the title bar
    if (!chiaConfig.manageDaemonLifetime()) {
      mainWindow.webContents.on('did-finish-load', () => {
        mainWindow.setTitle(`${app.getName()} [${global.daemon_rpc_ws}]`);
      });
    }
    // Uncomment this to open devtools by default
    // if (!guessPackaged()) {
    //   mainWindow.webContents.openDevTools();
    // }
    mainWindow.on("close", e => {
      // if the daemon isn't local we aren't going to try to start/stop it
      if (decidedToClose || !chiaConfig.manageDaemonLifetime()) {
        return;
      }
      e.preventDefault();
      if (!isClosing) {
          isClosing = true
          var choice = dialog.showMessageBoxSync({
            type: "question",
            buttons: [i18n._(/*i18n*/{id: "No"}), i18n._(/*i18n*/{id: "Yes"})],
            title: i18n._(/*i18n*/{id: "Confirm"}),
            message:
              i18n._(/*i18n*/{id: "Are you sure you want to quit? GUI Plotting and farming will stop."})
          });
          if (choice == 0) {
            isClosing = false
            return;
          }
          isClosing = false
          decidedToClose = true;
          mainWindow.webContents.send("exit-daemon");
          mainWindow.setBounds({ height: 500, width: 500 });
          ipcMain.on("daemon-exited", (event, args) => {
            mainWindow.close();
          });
      }
    });
  };

  const createMenu = () => {
    const menu = Menu.buildFromTemplate(getMenuTemplate());
    return menu;
  };

  const appReady = async () => {
    app.applicationMenu = createMenu();
    // if the daemon isn't local we aren't going to try to start/stop it
    if (chiaConfig.manageDaemonLifetime()) {
      chiaEnvironment.startChiaDaemon();
    }
    createWindow();
  };

  app.on("ready", appReady);

  app.on("window-all-closed", () => {
    app.quit();
  });

  app.on("activate", () => {
    if (mainWindow === null) {
      createWindow();
    }
  });

  ipcMain.on("load-page", (event, arg) => {
    mainWindow.loadURL(
      require("url").format({
        pathname: path.join(__dirname, arg.file),
        protocol: "file:",
        slashes: true
      }) + arg.query
    );
  });

  ipcMain.on("set-locale", (event, locale) => {
    i18n.activate(locale || 'en');
    app.applicationMenu = createMenu();
  });

  const getMenuTemplate = () => {
    const template = [
      {
        label: i18n._(/*i18n*/{id: "File"}),
        submenu: [
          {
            role: "quit"
          }
        ]
      },
      {
        label: i18n._(/*i18n*/{id: "Edit"}),
        submenu: [
          {
            role: "undo"
          },
          {
            role: "redo"
          },
          {
            type: "separator"
          },
          {
            role: "cut"
          },
          {
            role: "copy"
          },
          {
            role: "paste"
          },
          {
            role: "delete"
          },
          {
            type: "separator"
          },
          {
            role: "selectall"
          }
        ]
      },
      {
        label: i18n._(/*i18n*/{id: "View"}),
        submenu: [
          {
            role: "reload"
          },
          {
            role: "forcereload"
          },
          {
            label: i18n._(/*i18n*/{id: "Developer"}),
            submenu: [
              {
                label: i18n._(/*i18n*/{id: "Developer Tools"}),
                accelerator:
                  process.platform === "darwin"
                    ? "Alt+Command+I"
                    : "Ctrl+Shift+I",
                click: () => mainWindow.toggleDevTools()
              }
            ]
          },
          {
            type: "separator"
          },
          {
            role: "resetzoom"
          },
          {
            role: "zoomin"
          },
          {
            role: "zoomout"
          },
          {
            type: "separator"
          },
          {
            label: i18n._(/*i18n*/{id: "Full Screen"}),
            type: "checkbox",
            accelerator: process.platform === "darwin" ? "Ctrl+Command+F" : "F11",
            click: () => windows.main.toggleFullScreen()
          }
        ]
      },
      {
        label: i18n._(/*i18n*/{id: "Window"}),
        submenu: [
          {
            role: "minimize"
          },
          {
            role: "zoom"
          },
          {
            role: "close"
          }
        ]
      },
      {
        label: i18n._(/*i18n*/{id: "Help"}),
        role: "help",
        submenu: [
          {
            label: i18n._(/*i18n*/{id: "Chia Blockchain Wiki"}),
            click: () => {
              openExternal(
                "https://github.com/Chia-Network/chia-blockchain/wiki"
              );
            }
          },
          {
            label: i18n._(/*i18n*/{id: "Frequently Asked Questions"}),
            click: () => {
              openExternal(
                "https://github.com/Chia-Network/chia-blockchain/wiki/FAQ"
              );
            }
          },
          {
            label: i18n._(/*i18n*/{id: "Release Notes"}),
            click: () => {
              openExternal(
                "https://github.com/Chia-Network/chia-blockchain/releases"
              );
            }
          },
          {
            label: i18n._(/*i18n*/{id: "Contribute on GitHub"}),
            click: () => {
              openExternal(
                "https://github.com/Chia-Network/chia-blockchain/blob/master/CONTRIBUTING.md"
              );
            }
          },
          {
            type: "separator"
          },
          {
            label: i18n._(/*i18n*/{id: "Report an Issue..."}),
            click: () => {
              openExternal(
                "https://github.com/Chia-Network/chia-blockchain/issues"
              );
            }
          },
          {
            label: i18n._(/*i18n*/{id: "Chat on KeyBase"}),
            click: () => {
              openExternal("https://keybase.io/team/chia_network.public");
            }
          },
          {
            label: i18n._(/*i18n*/{id: "Follow on Twitter"}),
            click: () => {
              openExternal("https://twitter.com/chia_project");
            }
          }
        ]
      }
    ];

    if (process.platform === "darwin") {
      // Chia Blockchain menu (Mac)
      template.unshift({
        label: i18n._(/*i18n*/{id: "Chia"}),
        submenu: [
          {
            label: i18n._(/*i18n*/{id: "About Chia Blockchain"}),
            click: () =>
              openAboutWindow({
                homepage: "https://www.chia.net/",
                bug_report_url:
                  "https://github.com/Chia-Network/chia-blockchain/issues",
                icon_path: path.join(__dirname, "assets/img/chia_circle.png"),
                copyright: "Copyright (c) 2021 Chia Network",
                license: "Apache 2.0"
              })
          },
          {
            type: "separator"
          },
          {
            role: "services"
          },
          {
            type: "separator"
          },
          {
            role: "hide"
          },
          {
            role: "hideothers"
          },
          {
            role: "unhide"
          },
          {
            type: "separator"
          },
          {
            role: "quit"
          }
        ]
      });

      // File menu (MacOS)
      template.splice(1, 1, {
        label: i18n._(/*i18n*/{id: "File"}),
        submenu: [
          {
            role: "close"
          }
        ]
      });

      // Edit menu (MacOS)
      template[2].submenu.push(
        {
          type: "separator"
        },
        {
          label: i18n._(/*i18n*/{id: "Speech"}),
          submenu: [
            {
              role: "startspeaking"
            },
            {
              role: "stopspeaking"
            }
          ]
        }
      );

      // Window menu (MacOS)
      template.splice(4, 1, {
        role: "window",
        submenu: [
          {
            role: "minimize"
          },
          {
            role: "zoom"
          },
          {
            type: "separator"
          },
          {
            role: "front"
          }
        ]
      });
    }

    if (process.platform === "linux" || process.platform === "win32") {
      // Help menu (Windows, Linux)
      template[4].submenu.push(
        {
          type: "separator"
        },
        {
          label: i18n._(/*i18n*/{id: "About Chia Blockchain"}),
          click: () =>
            openAboutWindow({
              homepage: "https://www.chia.net/",
              bug_report_url:
                "https://github.com/Chia-Network/chia-blockchain/issues",
              icon_path: path.join(__dirname, "assets/img/chia_circle.png"),
              copyright: "Copyright (c) 2021 Chia Network",
              license: "Apache 2.0"
            })
        }
      );
    }

    return template;
  };

  /**
   * Open the given external protocol URL in the desktop’s default manner.
   */
  const openExternal = (url) => {
    // console.log(`openExternal: ${url}`)
    shell.openExternal(url);
  };
}

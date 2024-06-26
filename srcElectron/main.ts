// Modules to control application life and create native browser window
import { app, BrowserWindow, dialog, ipcMain, Menu, MenuItem, protocol, net, shell } from 'electron';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import * as update from './Update';
import * as Globals from './Globals';
const windowStateKeeper = require('electron-window-state');

const PackageInfos = require('../package.json');

const resourcesPath = (process as any).resourcesPath;

// Workaround an issue of Linux wmclass not supporting the UTF-8 productName in package.json.
if (process.platform === 'linux') {
  app.setName(PackageInfos.name);
}

const cbetar2SettingsPath = `${os.homedir()}/.cbetar2`;
const backendAppSettingsFile = `${cbetar2SettingsPath}/BackendAppSettings.json`;

app.commandLine.appendSwitch('ignore-certificate-errors', 'true');
let mainWindow: BrowserWindow | null | undefined;

interface Settings {
  lastCheckedVersion: string;
  cbetaBookcaseDir: string | undefined;
  cbetaBookcaseDirSecurityScopedBookmark: string;
}

let settings: Settings = {
  lastCheckedVersion: '',
  cbetaBookcaseDir: undefined,
  cbetaBookcaseDirSecurityScopedBookmark: '',
};
let frontendIsReady = false;

function isDevMode() {
  return !app.isPackaged || (process as any).defaultApp;
}

if (!fs.existsSync(cbetar2SettingsPath)) {
  fs.mkdirSync(cbetar2SettingsPath);
}

function notifyFrontendCbetaOfflineDbMode() {
  if (!frontendIsReady) {
    setTimeout(() => {
      notifyFrontendCbetaOfflineDbMode();
    }, 10);
  } else {
    mainWindow?.webContents.send('fromMain', { event: 'cbetaOfflineDbMode', isOn: settings.cbetaBookcaseDir !== undefined, backendVersion: PackageInfos.version });
  }
}

async function setCbetaBookcase() {
  const res = await dialog.showOpenDialog({
    properties: ['openDirectory'],
    message: '設定 Bookcase 目錄',
    securityScopedBookmarks: true,
  });

  if (res.canceled) {
    dialog.showMessageBox({
      type: 'info',
      message: '設定取消'
    });
    return;
  }

  try {
    if (!fs.existsSync(`${res.filePaths[0]}/CBETA`)) {
      dialog.showErrorBox('目錄無效', '所選的目錄不是有效的 CBETA 經文資料檔目錄 (Bookcase 目錄)！');
      return;
    }

    settings.cbetaBookcaseDir = res.filePaths[0];
    if (res.bookmarks && res.bookmarks[0]) {
      settings.cbetaBookcaseDirSecurityScopedBookmark = res.bookmarks[0];
    }
    fs.writeFileSync(backendAppSettingsFile, JSON.stringify(settings));
    notifyFrontendCbetaOfflineDbMode();
    dialog.showMessageBox({
      message: '設定成功！',
    });
  } catch (error: any) {
    dialog.showErrorBox('錯誤', `${error.message}`);
  }
}

function loadSettings() {
  if (fs.existsSync(backendAppSettingsFile)) {
    const settingsStr = fs.readFileSync(backendAppSettingsFile).toString();
    settings = JSON.parse(settingsStr);
    if (settings.cbetaBookcaseDir === undefined) {
      // Do nothing.
    } else if (fs.existsSync(`${settings.cbetaBookcaseDir}/CBETA`)) {
      notifyFrontendCbetaOfflineDbMode();
    } else {
      // Remove invalid cbetaBookcaseDir.
      settings.cbetaBookcaseDir = undefined;
      fs.writeFileSync(backendAppSettingsFile, JSON.stringify(settings));
      dialog.showErrorBox('目錄無效', '儲存的 Bookcase 目錄設定無效！請重新選擇 Bookcase 目錄。');
    }
  }
}

async function checkUpdate() {
  const latestVersion = await update.lookupLatestVersion();
  settings.lastCheckedVersion = latestVersion;
  fs.writeFileSync(backendAppSettingsFile, JSON.stringify(settings));
  update.check(mainWindow!);
}

const template = [
  new MenuItem({
    label: '檔案',
    submenu: [
      {
        label: '設定 Bookcase 目錄',
        click: setCbetaBookcase,
      },
      {
        role: 'quit',
        label: '關閉',
      },
    ]
  }),
  new MenuItem({
    label: '編輯',
    submenu: [
      {
        role: 'undo',
        label: '還原',
      },
      {
        role: 'redo',
        label: '重作',
      },
      {
        role: 'selectAll',
        label: '全選',
      },
      {
        role: 'cut',
        label: '剪下',
      },
      {
        role: 'copy',
        label: '複製',
      },
      {
        role: 'paste',
        label: '貼上',
      },
    ]
  }),
  new MenuItem({
    label: '執行',
    submenu: [
      {
        role: 'forceReload',
        label: '強制重新載入',
      },
      Globals.hasUpdater() ? {
        label: '檢查後端 app 更新',
        click: checkUpdate,
      } : null,
      {
        role: 'toggleDevTools',
        label: '開發者工具',
        visible: false,
      },
    ].filter(v => v != null) as any
  }),
  new MenuItem({
    label: '視窗',
    submenu: [
      {
        role: 'togglefullscreen',
        label: '全螢幕',
      },
      {
        label: '離開全螢幕',
        accelerator: 'Esc',
        visible: false,
        click: (item: MenuItem, win: (BrowserWindow) | (undefined)) => {
          win?.setFullScreen(false);
        },
      },
      {
        label: '最小化',
        role: 'minimize'
      },
      process.platform === 'darwin' ?
        {
          label: '新視窗',
          click: () => {
            createWindow();
          }
        } : null,
      {
        label: '關閉視窗',
        role: 'close'
      }
    ].filter(v => v != null) as any
  }),
];
const menu = Menu.buildFromTemplate(template)
Menu.setApplicationMenu(menu)

async function createWindow() {
  frontendIsReady = false;

  let mainWindowState = windowStateKeeper({
    defaultWidth: 1280,
    defaultHeight: 800
  });

  // Create the browser window.
  mainWindow = new BrowserWindow({
    'x': mainWindowState.x,
    'y': mainWindowState.y,
    'width': mainWindowState.width,
    'height': mainWindowState.height,
    webPreferences: {
      contextIsolation: true, // protect against prototype pollution
      preload: path.join(__dirname, 'preload.js'),
    }
  });
  mainWindowState.manage(mainWindow);

  // Open the DevTools.
  //mainWindow.webContents.openDevTools()
  mainWindow.on('close', () => {
    ipcMain.removeAllListeners();
    ipcMain.removeHandler('toMainV3');
  });

  ipcMain.on('toMain', async (ev, args) => {
    switch (args.event) {
      case 'ready':
        frontendIsReady = true;
        loadSettings();
        const latestVersion = await update.lookupLatestVersion();
        // Ask for updating for each new version once.
        if (settings.lastCheckedVersion !== latestVersion && Globals.hasUpdater()) {
          checkUpdate();
        }
        mainWindow?.webContents.send('fromMain', { event: 'version', version: PackageInfos.version });
        break;
      case 'readResource':
        try {
          const str = fs.readFileSync(`${isDevMode() ? '.' : resourcesPath}/${args.path}`).toString();
          mainWindow?.webContents.send('fromMain', Object.assign({ event: args.event }, { data: str }));
        } catch (error) {
          mainWindow?.webContents.send('fromMain', Object.assign({ event: args.event }, { error: error }));
        }
        break;
      case 'readBookcase':
        try {
          const stopAccessingSecurityScopedResource = process.mas ? app.startAccessingSecurityScopedResource(settings.cbetaBookcaseDirSecurityScopedBookmark) : () => { };
          const str = fs.readFileSync(`${settings.cbetaBookcaseDir}/${args.path}`).toString();
          stopAccessingSecurityScopedResource();
          mainWindow?.webContents.send('fromMain', Object.assign({ event: args.event }, { data: str }));
        } catch (error) {
          mainWindow?.webContents.send('fromMain', Object.assign({ event: args.event }, { error: error }));
        }
        break;
    }
  });

  ipcMain.handle('toMainV3', async (ev, args) => {
    switch (args.event) {
      case 'disableBookcase':
        try {
          settings.cbetaBookcaseDir = undefined;
          fs.writeFileSync(backendAppSettingsFile, JSON.stringify(settings));
          return { event: args.event, data: {} };
        } catch (error) {
          return { event: args.event, data: { error } };
        }
      case 'readResource':
        try {
          const str = fs.readFileSync(`${isDevMode() ? '.' : resourcesPath}/${args.path}`).toString();
          return { event: args.event, data: str };
        } catch (error) {
          return { event: args.event, error: error };
        }
      case 'readBookcase':
        try {
          const stopAccessingSecurityScopedResource = process.mas ? app.startAccessingSecurityScopedResource(settings.cbetaBookcaseDirSecurityScopedBookmark) : () => { };
          const str = fs.readFileSync(`${settings.cbetaBookcaseDir}/${args.path}`).toString();
          stopAccessingSecurityScopedResource();
          return { event: args.event, data: str };
        } catch (error) {
          return { event: args.event, error: error };
        }
    }
  });

  const clearListeners = () => {
    mainWindow?.webContents.removeAllListeners('did-finish-load');
    mainWindow?.webContents.removeAllListeners('did-fail-load');
  }

  // and load the index.html of the app.
  //mainWindow.loadFile('index.html');
  let loadUrlSuccess = false;
  while (!loadUrlSuccess) {
    try {
      await new Promise<any>(async (ok, fail) => {
        mainWindow?.webContents.once('did-finish-load', (res: any) => {
          loadUrlSuccess = true;
          clearListeners();
          ok('');
        });
        mainWindow?.webContents.once('did-fail-load', (event, errorCode, errorDescription) => {
          clearListeners();
          fail(`Error ${errorCode}: ${errorDescription}`);
        });

        try {
          if (isDevMode()) {
            await mainWindow?.loadURL('http://localhost:5173');
          } else {
            await mainWindow?.loadURL('https://mrmyhuang.github.io');
          }
        } catch (error) {
          fail(error);
        }
      });
    } catch (error) {
      clearListeners();
      console.error(error);
      const buttonId = dialog.showMessageBoxSync(mainWindow!, {
        message: `網路連線異常，請重試！\n${error}`,
        buttons: ['重試', '取消'],
      })

      if (buttonId === 1) {
        loadUrlSuccess = true;
      }
    }
  }

  // Open web link by external browser.
  mainWindow?.webContents.setWindowOpenHandler((detail) => {
    shell.openExternal(detail.url);
    return { action: 'deny' };
  });
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  createWindow();

  protocol.handle(Globals.localFileProtocolName, (request) => {
    const url = request.url.replace(`${Globals.localFileProtocolName}://`, `file://${settings.cbetaBookcaseDir}/../`);
    return net.fetch(decodeURIComponent(url));
  });

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.

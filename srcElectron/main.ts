// Modules to control application life and create native browser window
import { app, BrowserWindow, ipcMain, Menu, MenuItem, dialog } from 'electron';
const windowStateKeeper = require('electron-window-state');
const path = require('path');
import * as fs from 'fs';
const PackageInfos = require('../package.json');
import * as cbetaOfflineDb from './CbetaOfflineDb';

const backendAppSettingsFile = 'BackendAppSettings.json';

app.commandLine.appendSwitch('ignore-certificate-errors', 'true');
let mainWindow: BrowserWindow | null | undefined;
let cbetaBookcaseDir: string | undefined;
let frontendIsReady = false;

function notifyFrontendCbetaOfflineDbMode() {
  if (!frontendIsReady) {
    setTimeout(() => {
      notifyFrontendCbetaOfflineDbMode();
    }, 10);
  } else {
    mainWindow?.webContents.send('fromMain', { event: 'cbetaOfflineDbMode', isOn: cbetaBookcaseDir !== undefined });
  }
}

async function setCbetaBookcase() {
  const res = await dialog.showOpenDialog({
    properties: ['openDirectory'],
    message: '設定Bookcase目錄',
  });

  if (!res.canceled) {
    if (fs.existsSync(`${res.filePaths[0]}/CBETA`)) {
      cbetaBookcaseDir = res.filePaths[0];
      cbetaOfflineDb.init(cbetaBookcaseDir!);
      fs.writeFileSync(backendAppSettingsFile, JSON.stringify({cbetaBookcaseDir}));
      notifyFrontendCbetaOfflineDbMode();
    } else {
      dialog.showErrorBox('目錄無效', '所選的目錄不是有效的CBETA經文資料檔目錄(Bookcase目錄)！');
    }
  } else {
    dialog.showMessageBox({
      message: '設定取消'
    });
  }
}

let settings: any;
if (fs.existsSync(backendAppSettingsFile)) {
  const settingsStr = fs.readFileSync(backendAppSettingsFile).toString();
  settings = JSON.parse(settingsStr);
  cbetaBookcaseDir = settings.cbetaBookcaseDir;
  cbetaOfflineDb.init(cbetaBookcaseDir!);
  notifyFrontendCbetaOfflineDbMode();
}

const template = [
  new MenuItem({
    label: '檔案',
    submenu: [
      {
        label: '設定Bookcase目錄',
        click: setCbetaBookcase,
      },
      {
        role: 'quit',
        label: '關閉',
      },
    ]
  }),
  new MenuItem({
    label: '顯示',
    submenu: [
      {
        role: 'togglefullscreen',
        label: '全螢幕',
      },
      {
        role: 'toggleDevTools',
        label: '開發者工具',
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
    ]
  }),
];
const menu = Menu.buildFromTemplate(template)
Menu.setApplicationMenu(menu)

function createWindow() {
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
      enableRemoteModule: false, // turn off remote
      preload: path.join(__dirname, 'preload.js'),
    }
  });
  mainWindowState.manage(mainWindow);

  // Open the DevTools.
  //mainWindow.webContents.openDevTools()

  ipcMain.on('toMain', (ev, args) => {
    switch (args.event) {
      case 'ready':
        frontendIsReady = true;
        mainWindow?.webContents.send('fromMain', { event: 'version', version: PackageInfos.version });
        break;
      case 'fetchCatalog':
        mainWindow?.webContents.send('fromMain', Object.assign({ event: args.event }, cbetaOfflineDb.fetchCatalogs(args.path)));
        break;
      case 'fetchWork':
        mainWindow?.webContents.send('fromMain', Object.assign({ event: args.event }, cbetaOfflineDb.fetchWork(args.path)));
        break;
      case 'fetchJuan':
        mainWindow?.webContents.send('fromMain', Object.assign({ event: args.event }, cbetaOfflineDb.fetchJuan(args.work, args.juan)));
        break;
    }
  });

  // and load the index.html of the app.
  //mainWindow.loadFile('index.html');
  if (!app.isPackaged || (process as any).defaultApp) {
    mainWindow.loadURL('http://localhost:3000');
  } else {
    mainWindow.loadURL('https://mrmyhuang.github.io');
  }
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  createWindow();

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
